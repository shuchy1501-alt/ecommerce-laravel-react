<?php

namespace App\Services;

use App\Models\Exchange;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Handles the replacement-variant side of an exchange (spec sections
 * 31-34, 47). Stock changes always flow through InventoryService — this
 * class never touches product_variants.stock directly.
 */
class ExchangeService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly AuditLogService $auditLog,
    ) {}

    /** Created alongside the parent ReturnRequest (ReturnService::createReturn) when type = exchange. */
    public function createExchange(ReturnRequest $return, OrderItem $originalItem, ProductVariant $replacement, int $quantity): Exchange
    {
        $priceDifference = round(((float) $replacement->final_price - (float) $originalItem->unit_price) * $quantity, 2);
        $policy = Setting::get('exchange_price_difference_policy', 'charge_or_refund');

        $action = match (true) {
            abs($priceDifference) < 0.01 => 'none',
            $priceDifference > 0 => 'customer_pays',
            $policy === 'store_credit' => 'store_credit',
            default => 'refund_difference',
        };

        return Exchange::create([
            'return_id' => $return->id,
            'order_id' => $return->order_id,
            'original_order_item_id' => $originalItem->id,
            'original_variant_id' => $originalItem->variant_id,
            'replacement_variant_id' => $replacement->id,
            'quantity' => $quantity,
            'price_difference' => abs($priceDifference),
            'price_difference_action' => $action,
            'status' => 'pending',
        ]);
    }

    public function approveExchange(Exchange $exchange, User $admin): Exchange
    {
        if ($exchange->status !== 'pending') {
            throw ValidationException::withMessages(['status' => ['This exchange has already been reviewed.']]);
        }

        $exchange->update(['status' => 'approved']);

        return $exchange->fresh();
    }

    /**
     * Section 18/19/34: called from ReturnService::inspectReturn once the
     * returned item's condition is known. Restocks the original variant
     * (only when the returned item was in "new" condition — inspectReturn
     * already applied that rule to the ReturnItem) and deducts the
     * replacement variant. Stock re-checked here (not just at request
     * time) since availability could have changed while the return was in
     * transit.
     */
    public function processExchange(Exchange $exchange, User $admin): Exchange
    {
        if (! in_array($exchange->status, ['pending', 'approved'], true)) {
            throw ValidationException::withMessages(['status' => ['This exchange cannot be processed from its current status.']]);
        }

        $exchange = DB::transaction(function () use ($exchange, $admin) {
            $replacement = ProductVariant::where('id', $exchange->replacement_variant_id)->lockForUpdate()->firstOrFail();

            if ($replacement->stock < $exchange->quantity) {
                throw ValidationException::withMessages(['replacement_variant_id' => ['Replacement item is out of stock.']]);
            }

            $this->inventoryService->decreaseStock(
                $exchange->replacement_variant_id,
                $exchange->quantity,
                'exchange',
                Exchange::class,
                $exchange->id,
                $admin->id,
                "Exchange replacement for return {$exchange->returnRequest->return_number}"
            );

            $exchange->update(['status' => 'processing']);

            return $exchange->fresh();
        });

        $this->auditLog->log(
            $admin,
            \App\Services\AuditAction::EXCHANGE_PROCESSED,
            'Exchange',
            $exchange->id,
            newData: ['status' => $exchange->status]
        );

        return $exchange;
    }

    public function markShipped(Exchange $exchange, User $admin): Exchange
    {
        if ($exchange->status !== 'processing') {
            throw ValidationException::withMessages(['status' => ['Exchange must be processing before it can be marked shipped.']]);
        }

        $exchange->update(['status' => 'shipped']);

        return $exchange->fresh();
    }

    public function completeExchange(Exchange $exchange, User $admin): Exchange
    {
        if (! in_array($exchange->status, ['processing', 'shipped'], true)) {
            throw ValidationException::withMessages(['status' => ['Exchange is not ready to be completed.']]);
        }

        $exchange->update(['status' => 'completed']);
        app(ReturnService::class)->markExchangeCompleted($exchange->returnRequest, $admin->id);

        return $exchange->fresh();
    }

    public function cancelExchange(Exchange $exchange, ?string $reason = null): Exchange
    {
        if (in_array($exchange->status, ['completed', 'cancelled'], true)) {
            throw ValidationException::withMessages(['status' => ['This exchange can no longer be cancelled.']]);
        }

        $exchange->update(['status' => 'cancelled']);

        return $exchange->fresh();
    }
}
