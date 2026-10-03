<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\ReturnItem;
use App\Models\ReturnRequest;
use App\Models\ReturnStatusHistory;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Orchestrates the return/exchange/refund request lifecycle (spec sections
 * 1-20, 39, 45). Money math (calculateRefund) and the actual refund payout
 * are delegated to RefundService; replacement-variant handling is
 * delegated to ExchangeService. This class owns:
 *   - eligibility checks (order ownership, delivered, return window,
 *     product exclusions, quantity limits)
 *   - the return_number sequence and status_history trail
 *   - the approve/reject/receive/inspect state machine
 *   - handing off to RefundService/ExchangeService at the right step
 */
class ReturnService
{
    /** Reasons considered the seller's fault — used for the shipping-refund policy (section 25). */
    private const SELLER_FAULT_REASONS = [
        'Wrong size', 'Wrong color', 'Wrong product', 'Damaged product',
        'Defective product', 'Product not as expected',
    ];

    private const VALID_TRANSITIONS = [
        'requested' => ['approved', 'rejected', 'cancelled'],
        'approved' => ['pickup_scheduled', 'in_transit', 'received', 'cancelled'],
        'pickup_scheduled' => ['in_transit', 'received', 'cancelled'],
        'in_transit' => ['received'],
        'received' => ['inspected'],
        'inspected' => ['refund_pending', 'exchange_processing', 'completed'],
        'refund_pending' => ['refunded'],
        'refunded' => ['completed'],
        'exchange_processing' => ['exchange_completed'],
        'exchange_completed' => ['completed'],
        'completed' => [],
        'rejected' => [],
        'cancelled' => [],
    ];

    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly RefundService $refundService,
        private readonly ExchangeService $exchangeService,
        private readonly NotificationService $notificationService,
        private readonly AuditLogService $auditLog,
    ) {}

    /**
     * Section 2/3/12/64: an order is only eligible for a new return/
     * exchange/refund request while it's delivered, still inside the
     * configurable return window, and belongs to the requesting customer.
     */
    public function assertOrderEligible(Order $order, User $user): void
    {
        if ($order->user_id !== $user->id) {
            throw ValidationException::withMessages(['order' => ['You do not have permission to return items from this order.']]);
        }

        if ($order->order_status !== 'delivered') {
            throw ValidationException::withMessages(['order' => ['Only delivered orders are eligible for return, exchange, or refund.']]);
        }

        $windowDays = (int) Setting::get('return_window_days', 7);
        $deliveredAt = $order->delivered_at ?? $order->updated_at;

        if ($deliveredAt && now()->greaterThan($deliveredAt->copy()->addDays($windowDays))) {
            throw ValidationException::withMessages(['order' => ['Return period has expired.']]);
        }
    }

    /**
     * How many more units of this order line can still be returned/
     * exchanged (delivered qty minus whatever is already tied up in a
     * non-rejected/non-cancelled return) — spec section 10/11/65.
     */
    public function returnableQuantity(OrderItem $orderItem): int
    {
        $alreadyClaimed = ReturnItem::where('order_item_id', $orderItem->id)
            ->whereHas('returnRequest', fn ($q) => $q->whereNotIn('status', ['rejected', 'cancelled']))
            ->sum('quantity');

        return max(0, $orderItem->quantity - (int) $alreadyClaimed);
    }

    /**
     * Create a return/exchange/refund request with one or more line items.
     *
     * @param  string  $type  return|exchange|refund
     * @param  array<int, array{order_item_id:int, quantity:int, reason?:string, exchange_variant_id?:int}>  $itemsInput
     */
    public function createReturn(
        Order $order,
        User $user,
        string $type,
        string $reason,
        ?string $description,
        array $itemsInput
    ): ReturnRequest {
        $this->assertOrderEligible($order, $user);

        if (empty($itemsInput)) {
            throw ValidationException::withMessages(['items' => ['Select at least one item to return.']]);
        }

        $return = DB::transaction(function () use ($order, $user, $type, $reason, $description, $itemsInput) {
            $return = ReturnRequest::create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'type' => $type,
                'return_number' => $this->generateReturnNumber(),
                'reason' => $reason,
                'description' => $description,
                'status' => 'requested',
                'requested_at' => now(),
            ]);

            $this->recordHistory($return, null, 'requested', $user->id, 'Return requested by customer.');

            foreach ($itemsInput as $line) {
                $this->createReturnItem($order, $return, $type, $line);
            }

            return $return->fresh(['items.product', 'items.variant', 'items.exchangeVariant']);
        });

        $this->notifyRequestCreated($return);

        return $return;
    }

    /** New Return / Refund / Exchange Request — admin notification, keyed off the request's type. */
    private function notifyRequestCreated(ReturnRequest $return): void
    {
        $map = [
            'return' => [\App\Notifications\NotificationType::RETURN_REQUEST_NEW, 'New Return Request'],
            'refund' => [\App\Notifications\NotificationType::REFUND_REQUEST_NEW, 'New Refund Request'],
            'exchange' => [\App\Notifications\NotificationType::EXCHANGE_REQUEST_NEW, 'New Exchange Request'],
        ];

        [$type, $title] = $map[$return->type] ?? $map['return'];

        $this->notificationService->notifyAdmins(
            $type,
            $title,
            "Request {$return->return_number} submitted for order #{$return->order->order_number}.",
            ['return_id' => $return->id, 'return_number' => $return->return_number]
        );
    }

    private function createReturnItem(Order $order, ReturnRequest $return, string $type, array $line): ReturnItem
    {
        $orderItem = OrderItem::where('order_id', $order->id)->find($line['order_item_id'] ?? null);

        if (! $orderItem) {
            throw ValidationException::withMessages(['items' => ['One of the selected items does not belong to this order.']]);
        }

        $product = $orderItem->product;

        if ($product && ! $product->is_returnable) {
            throw ValidationException::withMessages(['items' => ["\"{$orderItem->product_name}\" is a final-sale item and cannot be returned."]]);
        }

        $quantity = (int) ($line['quantity'] ?? 0);
        $available = $this->returnableQuantity($orderItem);

        if ($quantity < 1 || $quantity > $available) {
            throw ValidationException::withMessages([
                'items' => ["Requested quantity exceeds returnable quantity for \"{$orderItem->product_name}\" (max {$available})."],
            ]);
        }

        $exchangeVariantId = null;

        if ($type === 'exchange') {
            if (! Setting::get('exchange_allowed', true)) {
                throw ValidationException::withMessages(['type' => ['Exchanges are not currently available.']]);
            }

            $exchangeVariantId = $line['exchange_variant_id'] ?? null;
            $replacement = $exchangeVariantId ? ProductVariant::find($exchangeVariantId) : null;

            if (! $replacement || ! $replacement->status) {
                throw ValidationException::withMessages(['exchange_variant_id' => ['Please choose a valid, active replacement variant.']]);
            }

            if ($replacement->product_id !== $orderItem->product_id) {
                throw ValidationException::withMessages(['exchange_variant_id' => ['Replacement must be a variant of the same product.']]);
            }

            if ($replacement->stock < $quantity) {
                throw ValidationException::withMessages(['exchange_variant_id' => ['Replacement item is out of stock.']]);
            }
        }

        $refundAmount = $this->calculateItemRefund($order, $orderItem, $quantity);

        $returnItem = ReturnItem::create([
            'return_id' => $return->id,
            'order_item_id' => $orderItem->id,
            'product_id' => $orderItem->product_id,
            'variant_id' => $orderItem->variant_id,
            'quantity' => $quantity,
            'reason' => $line['reason'] ?? $return->reason,
            'refund_amount' => $refundAmount,
            'exchange_variant_id' => $exchangeVariantId,
        ]);

        if ($type === 'exchange') {
            $this->exchangeService->createExchange($return, $orderItem, ProductVariant::find($exchangeVariantId), $quantity);
        }

        return $returnItem;
    }

    /**
     * Section 24: server-side only, proportionally allocating any
     * order-level coupon discount across the returned quantity so a
     * customer is never refunded more than they actually paid.
     */
    public function calculateItemRefund(Order $order, OrderItem $orderItem, int $quantity): float
    {
        $unitNet = $orderItem->quantity > 0
            ? ((float) $orderItem->subtotal) / $orderItem->quantity
            : 0.0;

        $discountRatio = $order->subtotal > 0
            ? min(1, ((float) $order->coupon_discount) / (float) $order->subtotal)
            : 0.0;

        $refund = $unitNet * $quantity * (1 - $discountRatio);

        return round(max(0, $refund), 2);
    }

    /**
     * Section 25: shipping is only ever refunded when the reason is the
     * seller's fault AND the customer is returning every delivered unit of
     * the order (a partial return of one item out of three never triggers
     * a shipping refund). Configurable via the refund_shipping_policy setting.
     */
    public function calculateShippingRefund(ReturnRequest $return): float
    {
        $policy = Setting::get('refund_shipping_policy', 'fault_based');

        if ($policy === 'never') {
            return 0.0;
        }

        if ($policy === 'always') {
            return (float) $return->order->shipping_charge;
        }

        $isSellerFault = in_array($return->reason, self::SELLER_FAULT_REASONS, true);
        $isFullOrderReturn = $this->isFullOrderReturn($return);

        return ($isSellerFault && $isFullOrderReturn) ? (float) $return->order->shipping_charge : 0.0;
    }

    private function isFullOrderReturn(ReturnRequest $return): bool
    {
        $order = $return->order()->with('items')->first();

        foreach ($order->items as $orderItem) {
            $claimed = ReturnItem::where('order_item_id', $orderItem->id)
                ->whereHas('returnRequest', fn ($q) => $q->whereNotIn('status', ['rejected', 'cancelled']))
                ->sum('quantity');

            if ((int) $claimed < $orderItem->quantity) {
                return false;
            }
        }

        return true;
    }

    public function calculateRefund(ReturnRequest $return): float
    {
        $itemsTotal = (float) $return->items()->sum('refund_amount');

        return round($itemsTotal + $this->calculateShippingRefund($return), 2);
    }

    public function approveReturn(ReturnRequest $return, User $admin, ?string $note = null): ReturnRequest
    {
        $return = $this->transition($return, 'approved', $admin, $note ?? 'Return approved.', function () use ($return) {
            $return->update(['approved_at' => now()]);
        });

        if ($return->type === 'exchange') {
            $this->notificationService->notifyUser(
                $return->user,
                \App\Notifications\NotificationType::EXCHANGE_APPROVED,
                'Exchange Approved',
                "Your exchange request {$return->return_number} has been approved.",
                ['return_id' => $return->id]
            );
        } else {
            $this->notificationService->notifyUser(
                $return->user,
                \App\Notifications\NotificationType::RETURN_APPROVED,
                'Return Approved',
                "Your return request {$return->return_number} has been approved.",
                ['return_id' => $return->id]
            );
        }

        $this->auditLog->log(
            $admin,
            \App\Services\AuditAction::RETURN_APPROVED,
            'ReturnRequest',
            $return->id,
            oldData: ['status' => 'requested'],
            newData: ['status' => 'approved', 'type' => $return->type]
        );

        return $return;
    }

    public function rejectReturn(ReturnRequest $return, User $admin, string $reason): ReturnRequest
    {
        $return = $this->transition($return, 'rejected', $admin, $reason, function () use ($return, $reason) {
            $return->update(['rejected_at' => now(), 'admin_note' => $reason]);
        });

        $this->notificationService->notifyUser(
            $return->user,
            \App\Notifications\NotificationType::RETURN_REJECTED,
            'Return Rejected',
            "Your request {$return->return_number} was rejected: {$reason}",
            ['return_id' => $return->id]
        );

        return $return;
    }

    /** Customer- or admin-initiated cancellation while still just requested. */
    public function cancelReturn(ReturnRequest $return, User $user, ?string $reason = null): ReturnRequest
    {
        if ($return->status !== 'requested') {
            throw ValidationException::withMessages(['status' => ['This request can no longer be cancelled.']]);
        }

        return $this->transition($return, 'cancelled', $user, $reason ?? 'Cancelled by customer.');
    }

    /** Section 17: admin marks the physical item as received at the warehouse. */
    public function receiveReturn(ReturnRequest $return, User $admin, ?string $note = null): ReturnRequest
    {
        $allowed = in_array($return->status, ['approved', 'pickup_scheduled', 'in_transit'], true);

        if (! $allowed) {
            throw ValidationException::withMessages(['status' => ['This return must be approved before it can be marked as received.']]);
        }

        return $this->transition($return, 'received', $admin, $note ?? 'Item received at warehouse.', function () use ($return) {
            $return->update(['received_at' => now()]);
        });
    }

    /**
     * Section 18/19/20: admin records per-item condition. Only "new"
     * condition items are automatically restocked; damaged/defective/
     * wrong_item items never touch sellable stock. After inspection the
     * return moves to refund_pending (return/refund type) or
     * exchange_processing (exchange type) and the corresponding
     * downstream service is invoked.
     *
     * @param  array<int, array{return_item_id:int, condition:string}>  $inspections
     */
    public function inspectReturn(ReturnRequest $return, User $admin, array $inspections, ?string $note = null): ReturnRequest
    {
        if ($return->status !== 'received') {
            throw ValidationException::withMessages(['status' => ['This return must be received before it can be inspected.']]);
        }

        return DB::transaction(function () use ($return, $admin, $inspections, $note) {
            $byId = collect($inspections)->keyBy('return_item_id');

            foreach ($return->items as $item) {
                $entry = $byId->get($item->id);
                $condition = $entry['condition'] ?? 'new';

                $item->update(['condition' => $condition]);

                if ($condition === 'new' && $item->variant_id) {
                    $this->inventoryService->increaseStock(
                        $item->variant_id,
                        $item->quantity,
                        'sales_return',
                        ReturnRequest::class,
                        $return->id,
                        $admin->id,
                        "Restocked from return {$return->return_number}"
                    );
                }
                // Damaged/defective/wrong_item: intentionally left out of
                // sellable stock. The condition value on the return_item
                // itself is the audit trail (section 20).
            }

            $return->update(['inspected_at' => now()]);
            $this->recordHistory($return, $return->status, 'inspected', $admin->id, $note ?? 'Items inspected.');
            $return->update(['status' => 'inspected']);

            if ($return->type === 'exchange') {
                $this->exchangeService->processExchange($return->exchange, $admin);
                $this->transitionRaw($return, 'exchange_processing', $admin->id, 'Exchange fulfillment started.');
            } else {
                $amount = $this->calculateRefund($return);
                $this->refundService->createRefund($return, $amount, $return->reason, $note);
                $this->transitionRaw($return, 'refund_pending', $admin->id, 'Refund created, awaiting processing.');
            }

            return $return->fresh(['items', 'refunds', 'exchange']);
        });
    }

    /** Called by RefundService once a refund is successfully processed. */
    public function markRefunded(ReturnRequest $return, ?int $changedBy = null): void
    {
        $this->transitionRaw($return, 'refunded', $changedBy, 'Refund completed.');
        $this->transitionRaw($return, 'completed', $changedBy, 'Return completed.');
        $return->update(['completed_at' => now()]);

        $this->notificationService->notifyUser(
            $return->user,
            \App\Notifications\NotificationType::REFUND_COMPLETED,
            'Refund Completed',
            "Your refund for request {$return->return_number} has been completed.",
            ['return_id' => $return->id]
        );
    }

    /** Called by ExchangeService once the replacement has shipped/completed. */
    public function markExchangeCompleted(ReturnRequest $return, ?int $changedBy = null): void
    {
        $this->transitionRaw($return, 'exchange_completed', $changedBy, 'Exchange fulfilled.');
        $this->transitionRaw($return, 'completed', $changedBy, 'Return completed.');
        $return->update(['completed_at' => now()]);

        $this->notificationService->notifyUser(
            $return->user,
            \App\Notifications\NotificationType::EXCHANGE_COMPLETED,
            'Exchange Completed',
            "Your exchange for request {$return->return_number} has been completed.",
            ['return_id' => $return->id]
        );
    }

    /** Generic logistics status update for pickup_scheduled/in_transit (no side effects). */
    public function updateLogisticsStatus(ReturnRequest $return, string $status, User $admin, ?string $note = null): ReturnRequest
    {
        if (! in_array($status, ['pickup_scheduled', 'in_transit'], true)) {
            throw ValidationException::withMessages(['status' => ['Invalid logistics status.']]);
        }

        return $this->transition($return, $status, $admin, $note);
    }

    private function transition(ReturnRequest $return, string $to, User $actor, ?string $note = null, ?\Closure $sideEffect = null): ReturnRequest
    {
        $allowed = self::VALID_TRANSITIONS[$return->status] ?? [];

        if (! in_array($to, $allowed, true)) {
            throw ValidationException::withMessages(['status' => ["Cannot change return status from \"{$return->status}\" to \"{$to}\"."]]);
        }

        return DB::transaction(function () use ($return, $to, $actor, $note, $sideEffect) {
            $from = $return->status;
            $return->update(['status' => $to]);
            $this->recordHistory($return, $from, $to, $actor->id, $note);

            if ($sideEffect) {
                $sideEffect();
            }

            return $return->fresh();
        });
    }

    /** Internal transition used by service-to-service handoffs where the target status is already known-valid. */
    private function transitionRaw(ReturnRequest $return, string $to, ?int $changedBy, ?string $note): void
    {
        $from = $return->status;
        $return->update(['status' => $to]);
        $this->recordHistory($return, $from, $to, $changedBy, $note);
    }

    private function recordHistory(ReturnRequest $return, ?string $from, string $to, ?int $changedBy, ?string $note): void
    {
        ReturnStatusHistory::create([
            'return_id' => $return->id,
            'from_status' => $from,
            'to_status' => $to,
            'changed_by' => $changedBy,
            'note' => $note,
            'created_at' => now(),
        ]);
    }

    private function generateReturnNumber(): string
    {
        do {
            $number = 'RET-FM-' . now()->format('Ymd') . '-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (ReturnRequest::where('return_number', $number)->exists());

        return $number;
    }
}
