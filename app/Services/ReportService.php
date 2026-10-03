<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\Refund;
use App\Models\ReturnRequest;
use App\Models\Sale;
use App\Models\Supplier;
use Illuminate\Contracts\Auth\Access\Gate;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Phase 13B — Report Management.
 *
 * This service is a thin, read-only orchestration layer over the reports
 * spec (12 report types). It deliberately does NOT recompute inventory or
 * financial figures on its own:
 *   - Sales/P&L/Cash-Flow/Expense figures delegate to RevenueService,
 *     ProfitService and FinancialReportService (Phase 12), which already
 *     implement the exact Gross Sales / COGS / Net Profit formulas and the
 *     historical `order_items.cost_price` snapshot rule.
 *   - Stock figures read `product_variants.stock` — the single source of
 *     truth already maintained by InventoryService (Phase 10) — never a
 *     second, parallel stock calculation.
 *
 * Every "table" report exposes two halves:
 *   - a `query()` builder (filtered + sorted, NOT paginated) so the
 *     controller can either ->paginate() it for the UI or ->cursor() it
 *     for CSV/PDF export without loading the whole table into memory.
 *   - a `Summary(...)` method for the report's summary cards.
 */
class ReportService
{
    public function __construct(
        private readonly RevenueService $revenueService,
        private readonly ProfitService $profitService,
        private readonly FinancialReportService $financialReportService,
    ) {}

    // ------------------------------------------------------------------
    // 1. Sales Report
    // ------------------------------------------------------------------

    public function salesQuery(array $filters): Builder
    {
        return Sale::query()
            ->with(['order:id,order_number,order_status,payment_status,payment_method', 'customer:id,name,email'])
            ->when($filters['search'] ?? null, function (Builder $q, string $v) {
                $q->whereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$v}%"))
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$v}%"));
            })
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('sale_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('sale_date', '<=', $v))
            ->when($filters['payment_status'] ?? null, fn ($q, $v) => $q->where('payment_status', $v))
            ->when($filters['customer_id'] ?? null, fn ($q, $v) => $q->where('customer_id', $v))
            ->orderBy($filters['sort_by'] ?? 'sale_date', $filters['sort_dir'] ?? 'desc');
    }

    public function salesSummary(array $filters): array
    {
        [$from, $to] = [$filters['date_from'] ?? null, $filters['date_to'] ?? null];

        $grossSales = $this->revenueService->getGrossSales($from, $to);
        $discounts = $this->revenueService->getDiscounts($from, $to);
        $refunds = $this->revenueService->getRefunds($from, $to);
        $netSales = $this->revenueService->getNetSales($from, $to);
        $cogs = $this->profitService->calculateCOGS($from, $to);
        $grossProfit = $this->profitService->calculateGrossProfit($from, $to);
        $margin = $netSales > 0 ? round(($grossProfit / $netSales) * 100, 2) : 0.0;

        return compact('grossSales', 'discounts', 'refunds', 'netSales', 'cogs', 'grossProfit', 'margin');
    }

    // ------------------------------------------------------------------
    // 2. Order Report
    // ------------------------------------------------------------------

    public function orderQuery(array $filters): Builder
    {
        return Order::query()
            ->with(['customer:id,name,email'])
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where('order_number', 'like', "%{$v}%"))
            ->when($filters['customer_id'] ?? null, fn ($q, $v) => $q->where('customer_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('order_status', $v))
            ->when($filters['payment_status'] ?? null, fn ($q, $v) => $q->where('payment_status', $v))
            ->when($filters['payment_method'] ?? null, fn ($q, $v) => $q->where('payment_method', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('order_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('order_date', '<=', $v))
            ->orderBy($filters['sort_by'] ?? 'order_date', $filters['sort_dir'] ?? 'desc');
    }

    public function orderSummary(array $filters): array
    {
        $q = $this->orderQuery($filters);

        return [
            'total_orders' => (clone $q)->count(),
            'total_value' => (float) (clone $q)->sum('total'),
            'cancelled_orders' => (clone $q)->where('order_status', 'cancelled')->count(),
            'delivered_orders' => (clone $q)->where('order_status', 'delivered')->count(),
        ];
    }

    // ------------------------------------------------------------------
    // 3. Product Report
    // ------------------------------------------------------------------

    public function productQuery(array $filters): Builder
    {        $soldSub = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.order_status', '!=', 'cancelled')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('orders.order_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('orders.order_date', '<=', $v))
            ->selectRaw('order_items.product_id, SUM(order_items.quantity) as sold_quantity, SUM(order_items.subtotal) as revenue')
            ->groupBy('order_items.product_id');

        return Product::query()
            ->with(['category:id,name', 'brand:id,name'])
            ->withSum('variants as stock', 'stock')
            ->leftJoinSub($soldSub, 'sold', fn ($join) => $join->on('sold.product_id', '=', 'products.id'))
            ->addSelect('products.*', DB::raw('COALESCE(sold.sold_quantity, 0) as sold_quantity'), DB::raw('COALESCE(sold.revenue, 0) as revenue'))
            ->when($filters['search'] ?? null, function (Builder $q, string $v) {
                $q->where(fn ($sub) => $sub->where('products.name', 'like', "%{$v}%")->orWhere('products.sku', 'like', "%{$v}%"));
            })
            ->when($filters['category_id'] ?? null, fn ($q, $v) => $q->where('products.category_id', $v))
            ->when($filters['brand_id'] ?? null, fn ($q, $v) => $q->where('products.brand_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('products.status', $v === 'active'))
            ->when(
                $filters['sort_by'] ?? null,
                fn ($q, $v) => $q->orderBy(match ($v) {
                    'sales' => 'sold_quantity',
                    'revenue' => 'revenue',
                    'stock' => 'stock',
                    'price' => 'products.selling_price',
                    default => 'products.name',
                }, $filters['sort_dir'] ?? 'desc'),
                fn ($q) => $q->orderBy('products.name')
            );
    }

    /**
     * Independent query for the product report's "total stock" summary
     * card. Deliberately a fresh query (not derived from productQuery()'s
     * result) because that query's stock column comes from a withSum
     * subquery alias, not a real join — summing it post-hoc against the
     * underlying product_variants table would reference a table that was
     * never actually joined into the FROM clause.
     */
    public function totalStockForFilters(array $filters): int
    {
        return (int) ProductVariant::query()
            ->whereHas('product', function (Builder $q) use ($filters) {
                $q->when($filters['search'] ?? null, function ($qq, $v) {
                    $qq->where(fn ($s) => $s->where('name', 'like', "%{$v}%")->orWhere('sku', 'like', "%{$v}%"));
                })
                    ->when($filters['category_id'] ?? null, fn ($qq, $v) => $qq->where('category_id', $v))
                    ->when($filters['brand_id'] ?? null, fn ($qq, $v) => $qq->where('brand_id', $v))
                    ->when($filters['status'] ?? null, fn ($qq, $v) => $qq->where('status', $v === 'active'));
            })
            ->sum('stock');
    }

    // ------------------------------------------------------------------
    // 4. Customer Report
    // ------------------------------------------------------------------

    public function customerQuery(array $filters): Builder
    {
        $ordersSub = Order::query()
            ->where('order_status', '!=', 'cancelled')
            ->selectRaw('customer_id, COUNT(*) as total_orders, SUM(total) as total_spent, MAX(order_date) as last_order')
            ->groupBy('customer_id');

        return Customer::query()
            ->leftJoinSub($ordersSub, 'o', fn ($join) => $join->on('o.customer_id', '=', 'customers.id'))
            ->select('customers.*', DB::raw('COALESCE(o.total_orders, 0) as total_orders'), DB::raw('COALESCE(o.total_spent, 0) as total_spent'), 'o.last_order')
            ->when($filters['search'] ?? null, function (Builder $q, string $v) {
                $q->where(fn ($sub) => $sub->where('customers.name', 'like', "%{$v}%")
                    ->orWhere('customers.email', 'like', "%{$v}%")
                    ->orWhere('customers.phone', 'like', "%{$v}%"));
            })
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('customers.created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('customers.created_at', '<=', $v))
            ->when($filters['min_spent'] ?? null, fn ($q, $v) => $q->havingRaw('COALESCE(o.total_spent, 0) >= ?', [$v]))
            ->when($filters['max_spent'] ?? null, fn ($q, $v) => $q->havingRaw('COALESCE(o.total_spent, 0) <= ?', [$v]))
            ->orderBy($filters['sort_by'] ?? 'customers.created_at', $filters['sort_dir'] ?? 'desc');
    }

    // ------------------------------------------------------------------
    // 5. Inventory Report — reads product_variants.stock, the ONE source
    //    of truth already maintained by InventoryService. No parallel
    //    stock calculation is introduced here.
    // ------------------------------------------------------------------

    public function inventoryQuery(array $filters): Builder
    {
        return ProductVariant::query()
            ->with(['product:id,name,category_id,brand_id', 'product.category:id,name', 'product.brand:id,name'])
            ->select('product_variants.*', DB::raw('(stock * purchase_price) as stock_value'))
            ->when($filters['search'] ?? null, function (Builder $q, string $v) {
                $q->where('sku', 'like', "%{$v}%")
                    ->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$v}%"));
            })
            ->when($filters['category_id'] ?? null, fn ($q, $v) => $q->whereHas('product', fn ($p) => $p->where('category_id', $v)))
            ->when($filters['brand_id'] ?? null, fn ($q, $v) => $q->whereHas('product', fn ($p) => $p->where('brand_id', $v)))
            ->when($filters['stock_status'] ?? null, function (Builder $q, string $v) {
                match ($v) {
                    'in_stock' => $q->whereColumn('stock', '>', 'minimum_stock'),
                    'low_stock' => $q->lowStock(),
                    'out_of_stock' => $q->outOfStock(),
                    default => null,
                };
            })
            ->orderBy($filters['sort_by'] ?? 'updated_at', $filters['sort_dir'] ?? 'desc');
    }

    public function inventorySummary(array $filters): array
    {
        $q = $this->inventoryQuery($filters);

        return [
            'total_items' => (clone $q)->count(),
            'total_stock_units' => (int) (clone $q)->sum('stock'),
            'total_stock_value' => round((float) (clone $q)->selectRaw('COALESCE(SUM(stock * purchase_price), 0) as v')->value('v'), 2),
            'low_stock_items' => (clone $q)->lowStock()->count(),
            'out_of_stock_items' => (clone $q)->outOfStock()->count(),
        ];
    }

    /** "Reserved stock" isn't tracked by any live reservation system yet, so it's always 0 — not invented. */
    public static function stockStatusFor(ProductVariant $variant): string
    {
        if ($variant->stock <= 0) {
            return 'Out of Stock';
        }

        return $variant->stock <= $variant->minimum_stock ? 'Low Stock' : 'In Stock';
    }

    // ------------------------------------------------------------------
    // 6. Purchase Report
    // ------------------------------------------------------------------

    public function purchaseQuery(array $filters): Builder
    {
        return Purchase::query()
            ->with(['supplier:id,name', 'creator:id,name'])
            ->withCount('items')
            ->when($filters['search'] ?? null, function (Builder $q, string $v) {
                $q->where('purchase_number', 'like', "%{$v}%")
                    ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$v}%"));
            })
            ->when($filters['supplier_id'] ?? null, fn ($q, $v) => $q->where('supplier_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('purchase_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('purchase_date', '<=', $v))
            ->orderBy($filters['sort_by'] ?? 'purchase_date', $filters['sort_dir'] ?? 'desc');
    }

    public function purchaseSummary(array $filters): array
    {
        $q = $this->purchaseQuery($filters);

        return [
            'total_purchases' => (clone $q)->count(),
            'total_purchase_value' => (float) (clone $q)->sum('total'),
            'pending_purchases' => (clone $q)->whereIn('status', ['draft', 'ordered', 'partially_received'])->count(),
            'received_purchases' => (clone $q)->where('status', 'received')->count(),
        ];
    }

    // ------------------------------------------------------------------
    // 7. Supplier Report — contact info is masked unless the caller can
    //    view supplier PII (spec: "Contact information according to
    //    permissions").
    // ------------------------------------------------------------------

    public function supplierQuery(array $filters): Builder
    {
        $purchasesSub = Purchase::query()
            ->selectRaw('supplier_id, COUNT(*) as total_purchases, SUM(total) as total_purchase_value, '
                .'SUM(CASE WHEN status IN (\'draft\',\'ordered\',\'partially_received\') THEN 1 ELSE 0 END) as pending_purchases, '
                .'SUM(CASE WHEN status = \'received\' THEN 1 ELSE 0 END) as received_purchases')
            ->groupBy('supplier_id');

        return Supplier::query()
            ->leftJoinSub($purchasesSub, 'p', fn ($join) => $join->on('p.supplier_id', '=', 'suppliers.id'))
            ->select(
                'suppliers.*',
                DB::raw('COALESCE(p.total_purchases, 0) as total_purchases'),
                DB::raw('COALESCE(p.total_purchase_value, 0) as total_purchase_value'),
                DB::raw('COALESCE(p.pending_purchases, 0) as pending_purchases'),
                DB::raw('COALESCE(p.received_purchases, 0) as received_purchases'),
            )
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where('suppliers.name', 'like', "%{$v}%"))
            ->when(isset($filters['status']), fn ($q) => $q->where('suppliers.status', (bool) $filters['status']))
            ->orderBy($filters['sort_by'] ?? 'suppliers.name', $filters['sort_dir'] ?? 'asc');
    }

    public function maskSupplierContact(array $row, bool $canViewContact): array
    {
        if (! $canViewContact) {
            $row['email'] = null;
            $row['phone'] = null;
            $row['address'] = null;
        }

        return $row;
    }

    // ------------------------------------------------------------------
    // 8. Expense Report — delegates entirely to FinancialReportService,
    //    which already owns the paid-expense/category logic.
    // ------------------------------------------------------------------

    public function expenseReport(array $filters, int $perPage = 20): array
    {
        $rows = $this->financialReportService->getExpenses($filters, $perPage);

        $from = $filters['date_from'] ?? null;
        $to = $filters['date_to'] ?? null;
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $summary = [
            'total_expenses' => (float) Expense::where('status', 'paid')
                ->when($from, fn ($q, $v) => $q->whereDate('expense_date', '>=', $v))
                ->when($to, fn ($q, $v) => $q->whereDate('expense_date', '<=', $v))
                ->sum('amount'),
            'monthly_expenses' => $this->profitService->calculateOperatingExpenses($monthStart, $monthEnd),
            'category_breakdown' => $this->financialReportService->expenseBreakdown($from, $to),
        ];

        return ['rows' => $rows, 'summary' => $summary];
    }

    // ------------------------------------------------------------------
    // 9. Profit & Loss — pure passthrough, exact formula owned by
    //    ProfitService (spec section 22).
    // ------------------------------------------------------------------

    public function profitLossReport(string $range, ?string $from, ?string $to): array
    {
        return $this->financialReportService->getProfitLoss($range, $from, $to);
    }

    // ------------------------------------------------------------------
    // 10. Refund Report
    // ------------------------------------------------------------------

    public function refundReport(array $filters, int $perPage = 20): array
    {
        $rows = $this->financialReportService->getRefunds($filters, $perPage);

        $base = Refund::query()
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v));

        $summary = [
            'total_refunds' => (clone $base)->count(),
            'total_refund_amount' => (float) (clone $base)->where('status', 'completed')->sum('amount'),
            'pending_refunds' => (clone $base)->where('status', 'pending')->count(),
            'completed_refunds' => (clone $base)->where('status', 'completed')->count(),
        ];

        return ['rows' => $rows, 'summary' => $summary];
    }

    // ------------------------------------------------------------------
    // 11. Return Report
    // ------------------------------------------------------------------

    public function returnQuery(array $filters): Builder
    {
        return ReturnRequest::query()
            ->with(['order:id,order_number', 'user:id,name'])
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where('return_number', 'like', "%{$v}%"))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['type'] ?? null, fn ($q, $v) => $q->where('type', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('requested_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('requested_at', '<=', $v))
            ->orderBy($filters['sort_by'] ?? 'requested_at', $filters['sort_dir'] ?? 'desc');
    }

    public function returnSummary(array $filters): array
    {
        $q = $this->returnQuery($filters);

        return [
            'total_returns' => (clone $q)->count(),
            'completed_returns' => (clone $q)->where('status', 'completed')->count(),
            'pending_returns' => (clone $q)->whereNotIn('status', ['completed', 'rejected'])->count(),
            'rejected_returns' => (clone $q)->where('status', 'rejected')->count(),
        ];
    }

    // ------------------------------------------------------------------
    // 12. Cash Flow — pure passthrough, owned by FinancialReportService.
    //     Deliberately NOT the same thing as profit (spec section 39).
    // ------------------------------------------------------------------

    public function cashFlowReport(string $range, ?string $from, ?string $to): array
    {
        return $this->financialReportService->getCashFlow($range, $from, $to);
    }
}
