<?php

namespace App\Services;

use App\Models\Exchange;
use App\Models\Expense;
use App\Models\OrderItem;
use App\Models\ReturnItem;
use Illuminate\Support\Facades\DB;

/**
 * Spec sections 5-7, 22-25, 50, 56-58. COGS always uses the historical
 * `order_items.cost_price` snapshot (captured at checkout from the
 * variant's purchase price at that moment — see OrderService), never the
 * product's current purchase price, so profit on old orders can't drift
 * when supplier costs change later.
 */
class ProfitService
{
    public function __construct(
        private readonly RevenueService $revenueService,
    ) {}

    /**
     * Net COGS = cost of everything sold, minus the cost of anything since
     * returned/refunded, plus/minus the exchange adjustment (section 58):
     * the original item's cost comes back out, the replacement item's
     * cost goes back in. Replacement cost uses the variant's *current*
     * purchase price since a brand-new shipment has no historical
     * snapshot of its own — a documented simplification, not full
     * double-entry inventory accounting (out of scope per spec section 75).
     */
    public function calculateCOGS(?string $from = null, ?string $to = null): float
    {
        $gross = $this->soldItemsQuery($from, $to)->sum(DB::raw('order_items.cost_price * order_items.quantity'));

        $returnReversal = $this->returnedItemsQuery($from, $to, ['return', 'refund'])
            ->sum(DB::raw('return_items.quantity * order_items.cost_price'));

        $exchangeReversal = $this->returnedItemsQuery($from, $to, ['exchange'])
            ->sum(DB::raw('return_items.quantity * order_items.cost_price'));

        $exchangeReplacementCost = $this->completedExchangesQuery($from, $to)
            ->sum(DB::raw('exchanges.quantity * product_variants.purchase_price'));

        return round((float) $gross - (float) $returnReversal - (float) $exchangeReversal + (float) $exchangeReplacementCost, 2);
    }

    public function calculateGrossProfit(?string $from = null, ?string $to = null): float
    {
        return round($this->revenueService->getNetSales($from, $to) - $this->calculateCOGS($from, $to), 2);
    }

    /** Section 54: only paid expenses count toward profit — pending ones are just a plan. */
    public function calculateOperatingExpenses(?string $from = null, ?string $to = null): float
    {
        $query = Expense::where('status', 'paid');

        if ($from) {
            $query->whereDate('expense_date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('expense_date', '<=', $to);
        }

        return (float) $query->sum('amount');
    }

    public function calculateNetProfit(?string $from = null, ?string $to = null): float
    {
        return round($this->calculateGrossProfit($from, $to) - $this->calculateOperatingExpenses($from, $to), 2);
    }

    public function calculateProfitMargin(?string $from = null, ?string $to = null): float
    {
        $netSales = $this->revenueService->getNetSales($from, $to);

        if ($netSales <= 0) {
            return 0.0;
        }

        return round(($this->calculateNetProfit($from, $to) / $netSales) * 100, 2);
    }

    /** Full P&L breakdown (spec section 22) in one pass, sharing the same figures as the individual getters above. */
    public function profitAndLoss(?string $from = null, ?string $to = null): array
    {
        $grossSales = $this->revenueService->getGrossSales($from, $to);
        $discounts = $this->revenueService->getDiscounts($from, $to);
        $refunds = $this->revenueService->getRefunds($from, $to);
        $netSales = round($grossSales - $discounts - $refunds, 2);
        $cogs = $this->calculateCOGS($from, $to);
        $grossProfit = round($netSales - $cogs, 2);
        $expenses = $this->calculateOperatingExpenses($from, $to);
        $netProfit = round($grossProfit - $expenses, 2);
        $margin = $netSales > 0 ? round(($netProfit / $netSales) * 100, 2) : 0.0;

        return compact('grossSales', 'discounts', 'refunds', 'netSales', 'cogs', 'grossProfit', 'expenses', 'netProfit', 'margin');
    }

    private function soldItemsQuery(?string $from, ?string $to)
    {
        $query = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.order_status', '!=', 'cancelled');

        if ($from) {
            $query->whereDate('orders.order_date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('orders.order_date', '<=', $to);
        }

        return $query;
    }

    private function returnedItemsQuery(?string $from, ?string $to, array $types)
    {
        $query = ReturnItem::query()
            ->join('order_items', 'order_items.id', '=', 'return_items.order_item_id')
            ->join('returns', 'returns.id', '=', 'return_items.return_id')
            ->where('returns.status', 'completed')
            ->whereIn('returns.type', $types);

        if ($from) {
            $query->whereDate('returns.completed_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('returns.completed_at', '<=', $to);
        }

        return $query;
    }

    private function completedExchangesQuery(?string $from, ?string $to)
    {
        $query = Exchange::query()
            ->join('product_variants', 'product_variants.id', '=', 'exchanges.replacement_variant_id')
            ->where('exchanges.status', 'completed');

        if ($from) {
            $query->whereDate('exchanges.updated_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('exchanges.updated_at', '<=', $to);
        }

        return $query;
    }
}
