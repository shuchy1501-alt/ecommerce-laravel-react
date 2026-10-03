<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Section 35-38, 48. Thin orchestration layer over OrderService (which
 * already owns the order_status state machine + stock restoration — see
 * OrderService::updateStatus/restoreStockForOrder) that adds the
 * after-sales-specific piece: automatically opening a refund request when
 * a prepaid order is cancelled.
 */
class OrderCancellationService
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly RefundService $refundService,
    ) {}

    /** Section 35: customer cancellation is only allowed before shipping. */
    public function canCancel(Order $order, ?User $user = null): bool
    {
        if ($user && $user->id === $order->user_id && ! $user->can('orders.cancel')) {
            return in_array($order->order_status, ['pending', 'confirmed'], true);
        }

        return in_array($order->order_status, ['pending', 'confirmed', 'processing'], true);
    }

    public function cancelOrder(Order $order, User $actor, ?string $reason = null): Order
    {
        if (! $this->canCancel($order, $actor)) {
            throw ValidationException::withMessages(['order_status' => ['This order can no longer be cancelled.']]);
        }

        $wasPrepaid = $order->payment_status === 'paid';
        $refundableAmount = (float) $order->paid_amount;

        $order = $this->orderService->cancelOrder($order, $actor->id, $reason);

        $this->createRefundIfRequired($order, $wasPrepaid, $refundableAmount, $reason);

        return $order->fresh(['items', 'payments', 'refunds']);
    }

    /**
     * Section 38: a prepaid order gets an automatic refund request opened
     * (an admin still has to process it — see RefundController::process).
     * COD orders where cash was never collected need no monetary refund.
     */
    private function createRefundIfRequired(Order $order, bool $wasPrepaid, float $amount, ?string $reason): void
    {
        if (! $wasPrepaid || $amount <= 0) {
            return;
        }

        $this->refundService->createRefundForOrder($order, $amount, $reason ?? 'Order cancelled.');
    }
}
