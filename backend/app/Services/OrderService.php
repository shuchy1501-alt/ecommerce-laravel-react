<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Every money figure here is re-derived from the cart/database — nothing is
 * ever taken from request input (spec section 72). Orders are always built
 * from the customer's persisted Cart (Phase 8), never from a raw items[]
 * payload, so price/stock/coupon/shipping have already been through
 * CartService's validation before an order can exist.
 */
class OrderService
{
    private const VALID_TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['packed', 'cancelled'],
        'packed' => ['shipped'],
        'shipped' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    public function __construct(
        private readonly CartService $cartService,
        private readonly PaymentService $paymentService,
        private readonly InventoryService $inventoryService,
        private readonly InvoiceService $invoiceService,
        private readonly SalesService $salesService,
        private readonly NotificationService $notificationService,
        private readonly AuditLogService $auditLog,
    ) {}

    /**
     * Create an order from the customer's current cart.
     *
     * @param  string  $paymentMethod  one of cod|bkash|nagad|card|bank
     * @param  string|null  $idempotencyKey  repeated identical submissions return the same order instead of creating a duplicate
     */
    public function createOrder(User $user, string $paymentMethod, ?string $idempotencyKey = null): Order
    {
        if ($idempotencyKey) {
            $existing = Order::where('idempotency_key', $idempotencyKey)->where('user_id', $user->id)->first();
            if ($existing) {
                return $existing->load(['items', 'payments', 'invoice']);
            }
        }

        $cart = $this->cartService->resolveCart(request());
        $result = $this->cartService->validateCheckout($cart, $user->id);

        if (! $result['valid']) {
            throw ValidationException::withMessages(['cart' => $result['errors']]);
        }

        $cart = $result['cart'];
        $totals = $this->cartService->computeTotals($cart);

        $order = DB::transaction(function () use ($user, $cart, $totals, $paymentMethod, $idempotencyKey) {
            $customer = $this->resolveCustomer($user, $cart->address);

            $order = Order::create([
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'order_number' => $this->generateOrderNumber(),
                'idempotency_key' => $idempotencyKey,
                'order_date' => now()->toDateString(),
                'placed_at' => now(),
                'subtotal' => $totals['subtotal'],
                'discount' => 0,
                'coupon_discount' => $totals['discount'],
                'coupon_code' => $cart->coupon?->code,
                'shipping_charge' => $totals['shipping'],
                'tax' => $totals['tax'],
                'total' => $totals['grandTotal'],
                'paid_amount' => 0,
                'due_amount' => $totals['grandTotal'],
                'payment_status' => 'pending',
                'payment_method' => $paymentMethod,
                'order_status' => 'pending',
                'shipping_name' => $cart->address->full_name,
                'shipping_phone' => $cart->address->phone,
                'shipping_email' => $user->email,
                'shipping_address' => trim($cart->address->address_line_1 . ' ' . ($cart->address->address_line_2 ?? '')),
                'shipping_division' => $cart->address->state ?: 'N/A',
                'shipping_district' => $cart->address->city ?: 'N/A',
                'shipping_area' => $cart->address->postal_code ?: 'N/A',
            ]);

            $this->recordStatusHistory($order, null, 'pending', $user->id, 'Order placed.');

            foreach ($cart->items as $cartItem) {
                $order->items()->create([
                    'product_id' => $cartItem->product_id,
                    'variant_id' => $cartItem->variant_id,
                    'product_name' => $cartItem->product->name,
                    'sku' => $cartItem->variant?->sku ?? $cartItem->product->sku,
                    'size' => $cartItem->variant?->size,
                    'color' => $cartItem->variant?->color,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->unit_price,
                    'cost_price' => $cartItem->variant?->purchase_price ?? 0,
                    'discount' => 0,
                    'subtotal' => $cartItem->subtotal,
                ]);
            }

            if ($cart->coupon) {
                $cart->coupon->increment('used_count');
                $order->couponUsages()->create([
                    'coupon_id' => $cart->coupon->id,
                    'user_id' => $user->id,
                    'discount_amount' => $totals['discount'],
                    'used_at' => now(),
                ]);
            }

            $payment = $this->paymentService->createPayment($order, $paymentMethod);

            if ($paymentMethod === 'cod') {
                // COD has no external verification step — the order is
                // confirmed and stock committed immediately.
                $this->fulfillOrderCreation($order);
            }

            $this->cartService->clearCart($cart);

            return $order->fresh(['items', 'payments', 'invoice']);
        });

        // DB::transaction() only returns after a successful commit, so by
        // this point the order is durably persisted — safe to notify.
        $this->notifyOrderPlaced($order, $user);

        return $order;
    }

    /**
     * Notify the customer (Order Confirmed) and admins (New Order) once an
     * order has been durably created (post-commit). A notification
     * failure is swallowed inside NotificationService and can never
     * affect order creation itself.
     */
    private function notifyOrderPlaced(Order $order, User $user): void
    {
        $this->notificationService->notifyUser(
            $user,
            \App\Notifications\NotificationType::ORDER_CONFIRMED,
            'Order Confirmed',
            "Your order #{$order->order_number} has been confirmed.",
            ['order_id' => $order->id, 'order_number' => $order->order_number]
        );

        $this->notificationService->notifyAdmins(
            \App\Notifications\NotificationType::ORDER_NEW,
            'New Order',
            "New order #{$order->order_number} placed by {$user->name}.",
            ['order_id' => $order->id, 'order_number' => $order->order_number]
        );
    }

    /**
     * Called once a payment is actually verified as paid (PaymentService).
     * Deducts stock, generates the invoice, and records the sale — all the
     * things COD already does at creation time, but deferred here until
     * money has genuinely moved for online payment methods.
     */
    public function markOrderPaid(Order $order): void
    {
        if ($order->payment_status === 'paid') {
            return; // already processed — never double-deduct stock
        }

        DB::transaction(function () use ($order) {
            $order->update([
                'payment_status' => 'paid',
                'paid_amount' => $order->total,
                'due_amount' => 0,
            ]);

            $this->fulfillOrderCreation($order);
        });
    }

    /**
     * Shared by both the COD-at-creation path and the online-at-payment
     * path: deduct stock, move the order to confirmed, generate the
     * invoice, and record the sale.
     */
    private function fulfillOrderCreation(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->variant_id) {
                $this->inventoryService->deductStock(
                    $item->variant_id,
                    $item->quantity,
                    Order::class,
                    $order->id,
                    $order->user_id,
                    "Sale via order {$order->order_number}"
                );
            }
        }

        $fromStatus = $order->order_status;
        $order->update(['order_status' => 'confirmed']);
        $this->recordStatusHistory($order, $fromStatus, 'confirmed', $order->user_id, 'Order confirmed.');

        $this->invoiceService->createInvoice($order);
        $this->salesService->recordSale($order);
    }

    public function updateStatus(Order $order, string $newStatus, ?int $changedBy, ?string $note = null): Order
    {
        $current = $order->order_status;
        $allowed = self::VALID_TRANSITIONS[$current] ?? [];

        if ($current === $newStatus) {
            return $order;
        }

        if (! in_array($newStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'order_status' => ["Cannot change order status from \"{$current}\" to \"{$newStatus}\"."],
            ]);
        }

        $order = DB::transaction(function () use ($order, $current, $newStatus, $changedBy, $note) {
            if ($newStatus === 'cancelled') {
                $this->restoreStockForOrder($order, $changedBy);
            }

            $order->update([
                'order_status' => $newStatus,
                'notes' => $note ?? $order->notes,
                'delivered_at' => $newStatus === 'delivered' ? now() : $order->delivered_at,
            ]);
            $this->recordStatusHistory($order, $current, $newStatus, $changedBy, $note);

            if ($newStatus === 'delivered' && $order->payment_method === 'cod' && $order->payment_status === 'pending') {
                // COD cash is collected on delivery.
                $order->update(['payment_status' => 'paid', 'paid_amount' => $order->total, 'due_amount' => 0]);
                $order->payments()->latest()->first()?->update(['status' => 'paid', 'paid_at' => now()]);
            }

            return $order->fresh();
        });

        $this->notifyStatusChange($order, $newStatus);

        $this->auditLog->log(
            \App\Models\User::find($changedBy),
            \App\Services\AuditAction::ORDER_STATUS_CHANGED,
            'Order',
            $order->id,
            oldData: ['order_status' => $current],
            newData: ['order_status' => $newStatus, 'note' => $note]
        );

        return $order;
    }

    /**
     * Customer-facing status notifications (spec section 2 — Order
     * Processing / Shipped / Delivered / Cancelled). Not every status in
     * VALID_TRANSITIONS has a customer-facing message (e.g. "packed" is
     * an internal warehouse step), so unmapped statuses are a no-op.
     */
    private function notifyStatusChange(Order $order, string $newStatus): void
    {
        $messages = [
            'processing' => [\App\Notifications\NotificationType::ORDER_PROCESSING, 'Order Processing', "Your order #{$order->order_number} is being processed."],
            'shipped' => [\App\Notifications\NotificationType::ORDER_SHIPPED, 'Order Shipped', "Your order #{$order->order_number} has been shipped."],
            'delivered' => [\App\Notifications\NotificationType::ORDER_DELIVERED, 'Order Delivered', "Your order #{$order->order_number} has been delivered."],
            'cancelled' => [\App\Notifications\NotificationType::ORDER_CANCELLED, 'Order Cancelled', "Your order #{$order->order_number} has been cancelled."],
        ];

        if (! isset($messages[$newStatus])) {
            return;
        }

        [$type, $title, $message] = $messages[$newStatus];

        $this->notificationService->notifyUser($order->user, $type, $title, $message, ['order_id' => $order->id, 'order_number' => $order->order_number]);
    }

    public function updatePaymentStatus(Order $order, string $paymentStatus, ?int $changedBy): Order
    {
        $order->update([
            'payment_status' => $paymentStatus,
            'paid_amount' => $paymentStatus === 'paid' ? $order->total : $order->paid_amount,
            'due_amount' => $paymentStatus === 'paid' ? 0 : $order->due_amount,
        ]);

        return $order->fresh();
    }

    public function cancelOrder(Order $order, ?int $cancelledBy, ?string $reason = null): Order
    {
        if (! in_array('cancelled', self::VALID_TRANSITIONS[$order->order_status] ?? [], true)) {
            throw ValidationException::withMessages([
                'order_status' => ['This order can no longer be cancelled.'],
            ]);
        }

        return $this->updateStatus($order, 'cancelled', $cancelledBy, $reason ?? 'Cancelled.');
    }

    /**
     * Restores stock only for orders where it was actually deducted
     * (confirmed or later) — a still-pending online-payment order never had
     * stock taken, so nothing needs restoring.
     */
    private function restoreStockForOrder(Order $order, ?int $userId): void
    {
        if (! in_array($order->order_status, ['confirmed', 'processing', 'packed'], true)) {
            return;
        }

        foreach ($order->items as $item) {
            if ($item->variant_id) {
                $this->inventoryService->restoreStock(
                    $item->variant_id,
                    $item->quantity,
                    Order::class,
                    $order->id,
                    $userId,
                    "Cancelled order {$order->order_number}"
                );
            }
        }
    }

    private function resolveCustomer(User $user, $address): Customer
    {
        $customer = Customer::where('user_id', $user->id)->first();

        $attributes = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $address->phone,
            'address' => trim($address->address_line_1 . ' ' . ($address->address_line_2 ?? '')),
            'division' => $address->state,
            'district' => $address->city,
            'area' => $address->postal_code,
        ];

        if ($customer) {
            $customer->update($attributes);

            return $customer;
        }

        return Customer::create(array_merge(['user_id' => $user->id, 'status' => true], $attributes));
    }

    private function recordStatusHistory(Order $order, ?string $from, string $to, ?int $changedBy, ?string $note): void
    {
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => $from,
            'to_status' => $to,
            'changed_by' => $changedBy,
            'note' => $note,
            'created_at' => now(),
        ]);
    }

    private function generateOrderNumber(): string
    {
        do {
            $number = 'FM-' . now()->format('Ymd') . '-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }
}
