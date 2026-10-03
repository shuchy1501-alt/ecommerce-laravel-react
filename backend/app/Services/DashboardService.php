<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Phase 13A. Single entry point for /admin/dashboard. Deliberately thin —
 * every financial figure is delegated to the existing FinancialReportService
 * / RevenueService / ProfitService (Phase 12) so COGS/profit/margin logic
 * is never duplicated here. Stock figures are read straight off
 * product_variants (the same table InventoryService treats as the single
 * source of truth) rather than re-deriving stock through a second path.
 */
class DashboardService
{
    public function __construct(
        private readonly FinancialReportService $financialReportService,
        private readonly RevenueService $revenueService,
        private readonly ProfitService $profitService,
    ) {}

    public function getOverview(string $range = 'this_month', ?string $from = null, ?string $to = null): array
    {
        [$rangeFrom, $rangeTo] = $this->financialReportService->resolveDateRange($range, $from, $to);

        // Reuses Phase 12's dashboard payload for revenue/expense/profit trends
        // and the recent-transactions rail — no duplicate trend logic here.
        $finance = $this->financialReportService->getDashboard($range, $from, $to);

        return [
            'range' => ['range' => $range, 'from' => $rangeFrom, 'to' => $rangeTo],
            'sales' => $this->salesSection(),
            'orders' => $this->ordersSection(),
            'customers' => $this->customersSection($rangeFrom, $rangeTo),
            'products' => $this->productsSection(),
            'inventory' => $this->inventorySection(),
            'finance' => [
                'gross_sales' => $this->revenueService->getGrossSales($rangeFrom, $rangeTo),
                'discounts' => $this->revenueService->getDiscounts($rangeFrom, $rangeTo),
                'refunds' => $this->revenueService->getRefunds($rangeFrom, $rangeTo),
                'net_sales' => $this->revenueService->getNetSales($rangeFrom, $rangeTo),
                'cogs' => $this->profitService->calculateCOGS($rangeFrom, $rangeTo),
                'gross_profit' => $this->profitService->calculateGrossProfit($rangeFrom, $rangeTo),
                'operating_expenses' => $this->profitService->calculateOperatingExpenses($rangeFrom, $rangeTo),
                'net_profit' => $this->profitService->calculateNetProfit($rangeFrom, $rangeTo),
                'profit_margin' => $this->profitService->calculateProfitMargin($rangeFrom, $rangeTo),
            ],
            'charts' => [
                'sales_trend' => $this->salesTrend($rangeFrom, $rangeTo),
                'revenue_vs_expense' => $finance['revenue_trend'] && $finance['expense_trend']
                    ? $this->zipTrends($finance['revenue_trend'], $finance['expense_trend'])
                    : [],
                'profit_trend' => $finance['profit_trend'],
                'order_status' => $this->orderStatusChart(),
                'top_products' => $this->topProducts($rangeFrom, $rangeTo),
                'top_categories' => $this->topCategories($rangeFrom, $rangeTo),
                'inventory_status' => $this->inventoryStatusChart(),
            ],
            'recent_transactions' => $finance['recent_transactions'],
        ];
    }

    // ------------------------------------------------------------------
    // Section 1 — Sales (fixed presets, independent of the selected range)
    // ------------------------------------------------------------------
    private function salesSection(): array
    {
        $today = Carbon::today();

        return [
            'today' => $this->revenueService->getTotalCollected($today->toDateString(), $today->toDateString()),
            'yesterday' => $this->revenueService->getTotalCollected(
                $today->copy()->subDay()->toDateString(),
                $today->copy()->subDay()->toDateString()
            ),
            'last_7_days' => $this->revenueService->getTotalCollected(
                $today->copy()->subDays(6)->toDateString(),
                $today->toDateString()
            ),
            'last_30_days' => $this->revenueService->getTotalCollected(
                $today->copy()->subDays(29)->toDateString(),
                $today->toDateString()
            ),
            'this_month' => $this->revenueService->getTotalCollected(
                $today->copy()->startOfMonth()->toDateString(),
                $today->copy()->endOfMonth()->toDateString()
            ),
            'this_year' => $this->revenueService->getTotalCollected(
                $today->copy()->startOfYear()->toDateString(),
                $today->copy()->endOfYear()->toDateString()
            ),
        ];
    }

    // ------------------------------------------------------------------
    // Section 1 — Orders (all-time pipeline snapshot)
    // ------------------------------------------------------------------
    private function ordersSection(): array
    {
        $counts = Order::select('order_status', DB::raw('count(*) as total'))
            ->groupBy('order_status')
            ->pluck('total', 'order_status');

        $statuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];
        $byStatus = [];
        foreach ($statuses as $status) {
            $byStatus[$status] = (int) ($counts[$status] ?? 0);
        }

        return [
            'total' => (int) $counts->sum(),
            'pending' => $byStatus['pending'],
            'confirmed' => $byStatus['confirmed'],
            'processing' => $byStatus['processing'],
            'shipped' => $byStatus['shipped'],
            'delivered' => $byStatus['delivered'],
            'cancelled' => $byStatus['cancelled'],
        ];
    }

    // ------------------------------------------------------------------
    // Section 1 — Customers
    // ------------------------------------------------------------------
    private function customersSection(string $from, string $to): array
    {
        $total = Customer::count();

        $new = Customer::whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->count();

        $active = Order::where('order_status', '!=', 'cancelled')
            ->whereDate('order_date', '>=', $from)
            ->whereDate('order_date', '<=', $to)
            ->whereNotNull('customer_id')
            ->distinct('customer_id')
            ->count('customer_id');

        return [
            'total' => $total,
            'new' => $new,
            'active' => $active,
        ];
    }

    // ------------------------------------------------------------------
    // Section 1 — Products
    // ------------------------------------------------------------------
    private function productsSection(): array
    {
        return [
            'total' => Product::count(),
            'active' => Product::where('status', true)->count(),
            'featured' => Product::where('featured', true)->count(),
            'best_selling' => Product::where('best_seller', true)->count(),
        ];
    }

    // ------------------------------------------------------------------
    // Section 1 — Inventory (reads product_variants, InventoryService's
    // own source of truth — no second stock calculation).
    // ------------------------------------------------------------------
    private function inventorySection(): array
    {
        $totalStock = (int) ProductVariant::sum('stock');

        $lowStock = ProductVariant::where('stock', '>', 0)
            ->whereColumn('stock', '<=', 'minimum_stock')
            ->count();

        $outOfStock = ProductVariant::where('stock', '<=', 0)->count();

        $inventoryValue = (float) ProductVariant::selectRaw('COALESCE(SUM(stock * purchase_price), 0) as value')
            ->value('value');

        return [
            'total_stock' => $totalStock,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'inventory_value' => round($inventoryValue, 2),
        ];
    }

    // ------------------------------------------------------------------
    // Charts
    // ------------------------------------------------------------------

    /** Daily sales total for the selected range (capped at 60 points for readability). */
    private function salesTrend(string $from, string $to): array
    {
        $rows = Sale::query()
            ->whereHas('order', fn ($q) => $q->where('order_status', '!=', 'cancelled'))
            ->whereDate('sale_date', '>=', $from)
            ->whereDate('sale_date', '<=', $to)
            ->select('sale_date', DB::raw('SUM(total) as total'))
            ->groupBy('sale_date')
            ->orderBy('sale_date')
            ->limit(60)
            ->get();

        return $rows->map(fn ($row) => [
            'date' => $row->sale_date->toDateString(),
            'value' => (float) $row->total,
        ])->toArray();
    }

    /** Merges the revenue and expense monthly trends into one series for the "Revenue vs Expense" chart. */
    private function zipTrends(array $revenueTrend, array $expenseTrend): array
    {
        $expenseByMonth = collect($expenseTrend)->keyBy('month');

        return collect($revenueTrend)->map(fn ($row) => [
            'month' => $row['month'],
            'label' => $row['label'],
            'revenue' => $row['value'],
            'expense' => $expenseByMonth[$row['month']]['value'] ?? 0.0,
        ])->toArray();
    }

    private function orderStatusChart(): array
    {
        $orders = $this->ordersSection();
        unset($orders['total']);

        return collect($orders)->map(fn ($count, $status) => [
            'status' => $status,
            'count' => $count,
        ])->values()->toArray();
    }

    /** Top 5 products by units sold within the range. */
    private function topProducts(string $from, string $to, int $limit = 5): array
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.order_status', '!=', 'cancelled')
            ->whereDate('orders.order_date', '>=', $from)
            ->whereDate('orders.order_date', '<=', $to)
            ->select(
                'order_items.product_id',
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as units_sold'),
                DB::raw('SUM(order_items.subtotal) as revenue')
            )
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('units_sold')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'name' => $row->product_name,
                'units_sold' => (int) $row->units_sold,
                'revenue' => (float) $row->revenue,
            ])
            ->toArray();
    }

    /** Top 5 categories by revenue within the range. */
    private function topCategories(string $from, string $to, int $limit = 5): array
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->where('orders.order_status', '!=', 'cancelled')
            ->whereDate('orders.order_date', '>=', $from)
            ->whereDate('orders.order_date', '<=', $to)
            ->select(
                'categories.id as category_id',
                'categories.name as category_name',
                DB::raw('SUM(order_items.quantity) as units_sold'),
                DB::raw('SUM(order_items.subtotal) as revenue')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'category_id' => $row->category_id,
                'name' => $row->category_name,
                'units_sold' => (int) $row->units_sold,
                'revenue' => (float) $row->revenue,
            ])
            ->toArray();
    }

    private function inventoryStatusChart(): array
    {
        $inventory = $this->inventorySection();
        $inStock = ProductVariant::whereColumn('stock', '>', 'minimum_stock')->count();

        return [
            ['status' => 'in_stock', 'count' => $inStock],
            ['status' => 'low_stock', 'count' => $inventory['low_stock']],
            ['status' => 'out_of_stock', 'count' => $inventory['out_of_stock']],
        ];
    }
}
