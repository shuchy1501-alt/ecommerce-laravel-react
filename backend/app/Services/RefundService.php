<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Refund;
use App\Models\ReturnRequest;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Owns money movement for returns/exchanges/cancellations (spec sections
 * 21-30, 46). Never trusts a frontend-supplied amount — every Refund is
 * created from a server-computed figure (ReturnService::calculateRefund or
 * OrderCancellationService) and re-validated here against what was
 * actually paid before anything is persisted.
 */
class RefundService
{
    public function __construct(
        private readonly PaymentService $paymentService,
        private readonly FinancialReportService $financialReportService,
        private readonly AuditLogService $auditLog,
    ) {}

    /**
     * Section 29/67: a return request's own remaining refundable amount,
     * and section 30: refuses to create a second refund for a return that
     * already has one in flight (pending/processing/completed).
     */
    public function createRefund(ReturnRequest $return, float $amount, ?string $reason = null, ?string $notes = null): Refund
    {
        $existing = $return->refunds()->whereIn('status', ['pending', 'processing', 'completed'])->exists();

        if ($existing) {
            throw ValidationException::withMessages(['refund' => ['This return has already been refunded.']]);
        }

        $order = $return->order;
        $this->assertWithinOrderLimit($order, $amount);

        return DB::transaction(function () use ($return, $order, $amount, $reason, $notes) {
            $method = $this->resolveRefundMethod($order);

            return Refund::create([
                'refund_number' => $this->generateRefundNumber(),
                'order_id' => $order->id,
                'return_id' => $return->id,
                'payment_id' => $order->payments()->where('status', 'paid')->latest()->first()?->id,
                'refund_method' => $method,
                'amount' => $amount,
                'reason' => $reason,
                'status' => 'pending',
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Refund limit (section 67): remaining refundable amount for an order
     * is what was actually paid minus refunds already completed/processing.
     */
    public function assertWithinOrderLimit(Order $order, float $amount): void
    {
        $alreadyRefunded = (float) $order->refunds()->whereIn('status', ['pending', 'processing', 'completed'])->sum('amount');
        $remaining = (float) $order->paid_amount - $alreadyRefunded;

        if ($amount > $remaining + 0.01) {
            throw ValidationException::withMessages(['amount' => ['Refund amount exceeds the remaining refundable balance for this order.']]);
        }
    }

    /**
     * Section 23/28: prefer the order's original online payment method;
     * COD (nothing was paid through a gateway) falls back to the
     * configurable cod_refund_method setting rather than a hard-coded choice.
     */
    private function resolveRefundMethod(Order $order): string
    {
        if ($order->payment_method !== 'cod') {
            return $order->payment_method;
        }

        return Setting::get('cod_refund_method', 'bank');
    }

    /**
     * Section 27/30: idempotent — a refund can only ever leave "pending"
     * once. Delegates the actual money movement to PaymentService's
     * gateway abstraction; never assumes success without a gateway result.
     */
    public function processRefund(Refund $refund, User $admin): Refund
    {
        if ($refund->status !== 'pending') {
            throw ValidationException::withMessages(['status' => ['This refund has already been processed.']]);
        }

        $refund = DB::transaction(function () use ($refund, $admin) {
            $refund->update(['status' => 'processing']);

            $payment = $refund->payment ?? $refund->order->payments()->where('status', 'paid')->latest()->first();

            if ($payment) {
                $result = $this->paymentService->refundPayment($payment, (float) $refund->amount, $refund->notes);
                $success = $result['success'] ?? false;
                $transactionId = $result['raw']['transaction_id'] ?? $result['transaction_id'] ?? null;
            } else {
                // COD order whose cash was never collected — nothing to
                // refund through a gateway, but the request still needs a
                // recorded resolution for a manual (cash/bank/MFS) payout.
                $success = true;
                $transactionId = null;
            }

            $refund->update([
                'status' => $success ? 'completed' : 'failed',
                'transaction_id' => $transactionId ?? $refund->transaction_id,
                'processed_by' => $admin->id,
                'processed_at' => now(),
                'refunded_at' => $success ? now() : null,
            ]);

            if ($success) {
                $this->syncOrderPaymentStatus($refund->order);
                $this->financialReportService->recordRefundTransaction($refund->fresh('order'));

                // A cancellation-triggered refund (section 38) has no
                // parent return_request to advance through the return
                // state machine — only refunds born from ReturnService do.
                if ($refund->return_id) {
                    app(ReturnService::class)->markRefunded($refund->returnRequest, $admin->id);
                }
            }

            return $refund->fresh();
        });

        $this->auditLog->log(
            $admin,
            \App\Services\AuditAction::REFUND_PROCESSED,
            'Refund',
            $refund->id,
            newData: ['status' => $refund->status, 'amount' => (float) $refund->amount]
        );

        return $refund;
    }

    private function syncOrderPaymentStatus(Order $order): void
    {
        $order->refresh();
        $totalRefunded = (float) $order->refunds()->where('status', 'completed')->sum('amount');

        if ($totalRefunded <= 0) {
            return;
        }

        $order->update([
            'payment_status' => $totalRefunded >= (float) $order->paid_amount ? 'refunded' : 'partial',
        ]);
    }

    public function verifyRefund(Refund $refund): Refund
    {
        return $refund->fresh();
    }

    public function cancelRefund(Refund $refund, ?string $reason = null): Refund
    {
        if ($refund->status !== 'pending') {
            throw ValidationException::withMessages(['status' => ['Only a pending refund can be cancelled.']]);
        }

        $refund->update(['status' => 'cancelled', 'notes' => trim(($refund->notes ?? '') . ' ' . ($reason ?? ''))]);

        return $refund->fresh();
    }

    /**
     * Used directly by OrderCancellationService for a prepaid order that
     * never went through a return_request (section 38).
     */
    public function createRefundForOrder(Order $order, float $amount, string $reason): Refund
    {
        $this->assertWithinOrderLimit($order, $amount);

        return DB::transaction(function () use ($order, $amount, $reason) {
            return Refund::create([
                'refund_number' => $this->generateRefundNumber(),
                'order_id' => $order->id,
                'return_id' => null,
                'payment_id' => $order->payments()->where('status', 'paid')->latest()->first()?->id,
                'refund_method' => $this->resolveRefundMethod($order),
                'amount' => $amount,
                'reason' => $reason,
                'status' => 'pending',
            ]);
        });
    }

    private function generateRefundNumber(): string
    {
        do {
            $number = 'REF-FM-' . now()->format('Ymd') . '-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (Refund::where('refund_number', $number)->exists());

        return $number;
    }
}
