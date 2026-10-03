<?php

namespace App\Services;

use App\Models\Refund;
use App\Models\Sale;

/**
 * Spec sections 4, 16, 49. All figures here are merchandise-only (exclude
 * shipping/tax, which are pass-through, not margin-bearing revenue) so
 * that Net Sales lines up with the Gross Sales - Discounts - Refunds
 * examples in the spec. Cancelled orders are always excluded even though
 * their historical `Sale` row is kept (spec section 4/51: never delete
 * historical sales, just don't count cancelled ones).
 */
class RevenueService
{
    public function getGrossSales(?string $from = null, ?string $to = null): float
    {
        return (float) $this->validSalesQuery($from, $to)->sum('subtotal');
    }

    public function getDiscounts(?string $from = null, ?string $to = null): float
    {
        return (float) $this->validSalesQuery($from, $to)->sum('discount');
    }

    /** Section 19: refunds recognized when actually completed, not when requested. */
    public function getRefunds(?string $from = null, ?string $to = null): float
    {
        $query = Refund::where('status', 'completed');

        if ($from) {
            $query->whereDate('refunded_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('refunded_at', '<=', $to);
        }

        return (float) $query->sum('amount');
    }

    public function getNetSales(?string $from = null, ?string $to = null): float
    {
        return round(
            $this->getGrossSales($from, $to) - $this->getDiscounts($from, $to) - $this->getRefunds($from, $to),
            2
        );
    }

    /** Full cash-value of orders (merchandise + shipping + tax) — the dashboard's "Total Revenue" card. */
    public function getTotalCollected(?string $from = null, ?string $to = null): float
    {
        return (float) $this->validSalesQuery($from, $to)->sum('total');
    }

    public function getShippingCollected(?string $from = null, ?string $to = null): float
    {
        return (float) $this->validSalesQuery($from, $to)->sum('shipping');
    }

    public function getTaxCollected(?string $from = null, ?string $to = null): float
    {
        return (float) $this->validSalesQuery($from, $to)->sum('tax');
    }

    /** Underlying query for the /admin/finance/revenue table (spec section 16). */
    public function revenueRows(?string $from = null, ?string $to = null)
    {
        return $this->validSalesQuery($from, $to)
            ->with(['order:id,order_number,order_status,payment_status', 'customer.user:id,name'])
            ->orderByDesc('sale_date');
    }

    private function validSalesQuery(?string $from, ?string $to)
    {
        $query = Sale::query()->whereHas('order', fn ($q) => $q->where('order_status', '!=', 'cancelled'));

        if ($from) {
            $query->whereDate('sale_date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('sale_date', '<=', $to);
        }

        return $query;
    }
}
