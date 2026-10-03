<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReportExportService;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Phase 13B — /admin/reports/*.
 *
 * Every "table" report follows the same shape:
 *   GET /admin/reports/{type}          -> { summary, data: [...], meta: {pagination} }
 *   GET /admin/reports/{type}/export   -> CSV or PDF, same filters, ?format=csv|pdf
 *
 * All financial/inventory math is delegated to ReportService, which in
 * turn delegates to the existing Phase 10/12 services — this controller
 * only handles HTTP concerns (validation, pagination, export streaming).
 */
class ReportController extends Controller
{
    private const PER_PAGE_MAX = 100;

    public function __construct(
        private readonly ReportService $reports,
        private readonly ReportExportService $exporter,
    ) {}

    /** GET /admin/reports — catalog of available reports, for the /admin/reports landing page. */
    public function index(): JsonResponse
    {
        $catalog = [
            ['key' => 'sales', 'label' => 'Sales Report', 'permission' => 'reports.sales'],
            ['key' => 'orders', 'label' => 'Order Report', 'permission' => 'reports.orders'],
            ['key' => 'products', 'label' => 'Product Report', 'permission' => 'reports.products'],
            ['key' => 'customers', 'label' => 'Customer Report', 'permission' => 'reports.customer'],
            ['key' => 'inventory', 'label' => 'Inventory Report', 'permission' => 'reports.inventory'],
            ['key' => 'purchases', 'label' => 'Purchase Report', 'permission' => 'reports.purchase'],
            ['key' => 'suppliers', 'label' => 'Supplier Report', 'permission' => 'reports.suppliers'],
            ['key' => 'expenses', 'label' => 'Expense Report', 'permission' => 'reports.expenses'],
            ['key' => 'profit-loss', 'label' => 'Profit & Loss Report', 'permission' => 'reports.profit_loss'],
            ['key' => 'refunds', 'label' => 'Refund Report', 'permission' => 'reports.refunds'],
            ['key' => 'returns', 'label' => 'Return Report', 'permission' => 'reports.returns'],
            ['key' => 'cash-flow', 'label' => 'Cash Flow Report', 'permission' => 'reports.cash_flow'],
        ];

        $user = request()->user();

        return $this->success(
            collect($catalog)->map(fn ($r) => $r + ['available' => $user?->can($r['permission']) ?? false])->values(),
            'Reports catalog retrieved.'
        );
    }

    // ------------------------------------------------------------------
    // 1. Sales
    // ------------------------------------------------------------------

    public function sales(Request $request): JsonResponse
    {
        $filters = $this->filters($request);
        $paginator = $this->reports->salesQuery($filters)->paginate($this->perPage($request));

        return $this->tableResponse($paginator, $this->reports->salesSummary($filters));
    }

    // ------------------------------------------------------------------
    // 2. Orders
    // ------------------------------------------------------------------

    public function orders(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['customer_id', 'status', 'payment_status', 'payment_method']);
        $paginator = $this->reports->orderQuery($filters)->paginate($this->perPage($request));

        return $this->tableResponse($paginator, $this->reports->orderSummary($filters));
    }

    // ------------------------------------------------------------------
    // 3. Products
    // ------------------------------------------------------------------

    public function products(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['category_id', 'brand_id', 'status', 'sort_by']);
        $paginator = $this->reports->productQuery($filters)->paginate($this->perPage($request));

        return $this->tableResponse($paginator, [
            'total_products' => $paginator->total(),
            'total_stock' => $this->reports->totalStockForFilters($filters),
        ]);
    }

    // ------------------------------------------------------------------
    // 4. Customers
    // ------------------------------------------------------------------

    public function customers(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['min_spent', 'max_spent']);
        $paginator = $this->reports->customerQuery($filters)->paginate($this->perPage($request));

        return $this->tableResponse($paginator, [
            'total_customers' => $paginator->total(),
        ]);
    }

    // ------------------------------------------------------------------
    // 5. Inventory
    // ------------------------------------------------------------------

    public function inventory(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['category_id', 'brand_id', 'stock_status']);
        $paginator = $this->reports->inventoryQuery($filters)->paginate($this->perPage($request));

        return $this->tableResponse($paginator, $this->reports->inventorySummary($filters));
    }

    // ------------------------------------------------------------------
    // 6. Purchases
    // ------------------------------------------------------------------

    public function purchases(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['supplier_id', 'status']);
        $paginator = $this->reports->purchaseQuery($filters)->paginate($this->perPage($request));

        return $this->tableResponse($paginator, $this->reports->purchaseSummary($filters));
    }

    // ------------------------------------------------------------------
    // 7. Suppliers
    // ------------------------------------------------------------------

    public function suppliers(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['status']);
        $paginator = $this->reports->supplierQuery($filters)->paginate($this->perPage($request));

        $canViewContact = (bool) $request->user()?->can('suppliers.view');
        $items = collect($paginator->items())
            ->map(fn ($row) => $this->reports->maskSupplierContact($row->toArray(), $canViewContact));

        return $this->success($items->values(), 'Supplier report retrieved.', 200, $this->paginationMeta($paginator));
    }

    // ------------------------------------------------------------------
    // 8. Expenses
    // ------------------------------------------------------------------

    public function expenses(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['category_id', 'status', 'payment_method']);
        $result = $this->reports->expenseReport($filters, $this->perPage($request));

        return $this->tableResponse($result['rows'], $result['summary']);
    }

    // ------------------------------------------------------------------
    // 9. Profit & Loss (summary only, no row table)
    // ------------------------------------------------------------------

    public function profitLoss(Request $request): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        try {
            $result = $this->reports->profitLossReport($data['range'] ?? 'this_month', $data['date_from'] ?? null, $data['date_to'] ?? null);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        }

        return $this->success($result, 'Profit & Loss report retrieved.');
    }

    // ------------------------------------------------------------------
    // 10. Refunds
    // ------------------------------------------------------------------

    public function refunds(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['status']);
        $result = $this->reports->refundReport($filters, $this->perPage($request));

        return $this->tableResponse($result['rows'], $result['summary']);
    }

    // ------------------------------------------------------------------
    // 11. Returns
    // ------------------------------------------------------------------

    public function returns(Request $request): JsonResponse
    {
        $filters = $this->filters($request, ['status', 'type']);
        $paginator = $this->reports->returnQuery($filters)->paginate($this->perPage($request));

        return $this->tableResponse($paginator, $this->reports->returnSummary($filters));
    }

    // ------------------------------------------------------------------
    // 12. Cash Flow (summary only, no row table)
    // ------------------------------------------------------------------

    public function cashFlow(Request $request): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        try {
            $result = $this->reports->cashFlowReport($data['range'] ?? 'this_month', $data['date_from'] ?? null, $data['date_to'] ?? null);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        }

        return $this->success($result, 'Cash flow report retrieved.');
    }

    // ------------------------------------------------------------------
    // Export — CSV or PDF, same filters as the JSON endpoint, streamed
    // via cursor() so large exports never load the whole table.
    // ------------------------------------------------------------------

    private const EXPORT_PERMISSIONS = [
        'sales' => 'reports.sales',
        'orders' => 'reports.orders',
        'products' => 'reports.products',
        'customers' => 'reports.customer',
        'inventory' => 'reports.inventory',
        'purchases' => 'reports.purchase',
        'suppliers' => 'reports.suppliers',
        'expenses' => 'reports.expenses',
        'refunds' => 'reports.refunds',
        'returns' => 'reports.returns',
    ];

    public function export(Request $request, string $type)
    {
        $format = $request->input('format', 'csv');
        if (! in_array($format, ['csv', 'pdf'], true)) {
            return $this->error('format must be csv or pdf.', 422);
        }

        $permission = self::EXPORT_PERMISSIONS[$type] ?? null;
        if ($permission === null || ! $request->user()?->can($permission)) {
            return $this->error('You are not authorized to export this report.', 403);
        }

        [$title, $headers, $rows, $summary] = match ($type) {
            'sales' => $this->exportSales($request),
            'orders' => $this->exportOrders($request),
            'products' => $this->exportProducts($request),
            'customers' => $this->exportCustomers($request),
            'inventory' => $this->exportInventory($request),
            'purchases' => $this->exportPurchases($request),
            'suppliers' => $this->exportSuppliers($request),
            'expenses' => $this->exportExpenses($request),
            'refunds' => $this->exportRefunds($request),
            'returns' => $this->exportReturns($request),
            default => [null, null, null, null],
        };

        if ($title === null) {
            return $this->error("Unknown or non-exportable report type \"{$type}\". Profit & Loss and Cash Flow are summary-only.", 422);
        }

        if ($format === 'csv') {
            return $this->exporter->toCsv($type.'-report', $headers, $rows);
        }

        // PDF export is bounded (unlike the streamed CSV) since it's meant to be printed/skimmed.
        $boundedRows = [];
        $count = 0;
        foreach ($rows as $row) {
            $boundedRows[] = $row;
            if (++$count >= 2000) {
                break;
            }
        }

        return $this->exporter->toPdf($type.'-report', [
            'title' => $title,
            'headers' => $headers,
            'rows' => $boundedRows,
            'summary' => $summary,
            'meta' => ['from' => $request->input('date_from'), 'to' => $request->input('date_to')],
        ]);
    }

    private function exportSales(Request $request): array
    {
        $filters = $this->filters($request);
        $headers = ['Sale Number', 'Order Number', 'Customer', 'Date', 'Subtotal', 'Discount', 'Tax', 'Shipping', 'Total', 'Payment Status'];
        $rows = $this->reports->salesQuery($filters)->cursor()->map(fn ($s) => [
            'SALE-'.$s->id, $s->order?->order_number, $s->customer?->name, optional($s->sale_date)->toDateString(),
            $s->subtotal, $s->discount, $s->tax, $s->shipping, $s->total, $s->payment_status,
        ]);

        return ['Sales Report', $headers, $rows, $this->reports->salesSummary($filters)];
    }

    private function exportOrders(Request $request): array
    {
        $filters = $this->filters($request, ['customer_id', 'status', 'payment_status', 'payment_method']);
        $headers = ['Order Number', 'Customer', 'Order Date', 'Status', 'Payment Status', 'Subtotal', 'Discount', 'Shipping', 'Tax', 'Total'];
        $rows = $this->reports->orderQuery($filters)->cursor()->map(fn ($o) => [
            $o->order_number, $o->customer?->name, optional($o->order_date)->toDateString(), $o->order_status, $o->payment_status,
            $o->subtotal, $o->discount, $o->shipping_charge, $o->tax, $o->total,
        ]);

        return ['Order Report', $headers, $rows, $this->reports->orderSummary($filters)];
    }

    private function exportProducts(Request $request): array
    {
        $filters = $this->filters($request, ['category_id', 'brand_id', 'status', 'sort_by']);
        $headers = ['Product', 'SKU', 'Category', 'Brand', 'Selling Price', 'Cost Price', 'Stock', 'Sold Quantity', 'Revenue', 'Status'];
        $rows = $this->reports->productQuery($filters)->cursor()->map(fn ($p) => [
            $p->name, $p->sku, $p->category?->name, $p->brand?->name, $p->selling_price, $p->purchase_price,
            (int) $p->stock, (int) $p->sold_quantity, $p->revenue, $p->status ? 'Active' : 'Inactive',
        ]);

        return ['Product Report', $headers, $rows, null];
    }

    private function exportCustomers(Request $request): array
    {
        $filters = $this->filters($request, ['min_spent', 'max_spent']);
        $headers = ['Customer', 'Email', 'Phone', 'Registration Date', 'Total Orders', 'Total Spent', 'Last Order', 'Status'];
        $rows = $this->reports->customerQuery($filters)->cursor()->map(fn ($c) => [
            $c->name, $c->email, $c->phone, optional($c->created_at)->toDateString(),
            (int) $c->total_orders, $c->total_spent, $c->last_order, $c->status ? 'Active' : 'Inactive',
        ]);

        return ['Customer Report', $headers, $rows, null];
    }

    private function exportInventory(Request $request): array
    {
        $filters = $this->filters($request, ['category_id', 'brand_id', 'stock_status']);
        $headers = ['Product', 'Variant', 'SKU', 'Current Stock', 'Reserved Stock', 'Available Stock', 'Minimum Stock', 'Stock Value', 'Status'];
        $rows = $this->reports->inventoryQuery($filters)->cursor()->map(fn ($v) => [
            $v->product?->name, trim(($v->size ?? '').' '.($v->color ?? '')), $v->sku,
            (int) $v->stock, 0, (int) $v->stock, (int) $v->minimum_stock, $v->stock_value,
            \App\Services\ReportService::stockStatusFor($v),
        ]);

        return ['Inventory Report', $headers, $rows, $this->reports->inventorySummary($filters)];
    }

    private function exportPurchases(Request $request): array
    {
        $filters = $this->filters($request, ['supplier_id', 'status']);
        $headers = ['Purchase Number', 'Supplier', 'Date', 'Status', 'Total', 'Received Status'];
        $rows = $this->reports->purchaseQuery($filters)->cursor()->map(fn ($p) => [
            $p->purchase_number, $p->supplier?->name, optional($p->purchase_date)->toDateString(), $p->status, $p->total,
            $p->status === 'received' ? 'Received' : ($p->status === 'partially_received' ? 'Partial' : 'Pending'),
        ]);

        return ['Purchase Report', $headers, $rows, $this->reports->purchaseSummary($filters)];
    }

    private function exportSuppliers(Request $request): array
    {
        $filters = $this->filters($request, ['status']);
        $canViewContact = (bool) $request->user()?->can('suppliers.view');
        $headers = ['Supplier', 'Email', 'Phone', 'Total Purchases', 'Total Purchase Value', 'Pending Purchases', 'Received Purchases'];
        $rows = $this->reports->supplierQuery($filters)->cursor()->map(function ($s) use ($canViewContact) {
            $row = $this->reports->maskSupplierContact($s->toArray(), $canViewContact);

            return [$row['name'], $row['email'], $row['phone'], (int) $row['total_purchases'], $row['total_purchase_value'], (int) $row['pending_purchases'], (int) $row['received_purchases']];
        });

        return ['Supplier Report', $headers, $rows, null];
    }

    private function exportExpenses(Request $request): array
    {
        $filters = $this->filters($request, ['category_id', 'status', 'payment_method']);
        $headers = ['Expense Number', 'Category', 'Description', 'Amount', 'Payment Method', 'Date', 'Status'];
        // Export uses the same filtered query, unpaginated, via cursor for memory safety.
        $rows = (clone \App\Models\Expense::with('category')
            ->when($filters['category_id'] ?? null, fn ($q, $v) => $q->where('expense_category_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['payment_method'] ?? null, fn ($q, $v) => $q->where('payment_method', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('expense_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('expense_date', '<=', $v))
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where('title', 'like', "%{$v}%")))
            ->cursor()->map(fn ($e) => [
                $e->expense_number, $e->category?->name, $e->title, $e->amount, $e->payment_method,
                optional($e->expense_date)->toDateString(), $e->status,
            ]);

        return ['Expense Report', $headers, $rows, $this->reports->expenseReport($filters, 1)['summary']];
    }

    private function exportRefunds(Request $request): array
    {
        $filters = $this->filters($request, ['status']);
        $headers = ['Refund Number', 'Order Number', 'Amount', 'Method', 'Status', 'Refunded At'];
        $rows = (clone \App\Models\Refund::with('order:id,order_number')
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v)))
            ->cursor()->map(fn ($r) => [
                $r->refund_number, $r->order?->order_number, $r->amount, $r->refund_method, $r->status,
                optional($r->refunded_at)?->toDateString(),
            ]);

        return ['Refund Report', $headers, $rows, $this->reports->refundReport($filters, 1)['summary']];
    }

    private function exportReturns(Request $request): array
    {
        $filters = $this->filters($request, ['status', 'type']);
        $headers = ['Return Number', 'Order Number', 'Type', 'Status', 'Requested At', 'Completed At'];
        $rows = $this->reports->returnQuery($filters)->cursor()->map(fn ($r) => [
            $r->return_number, $r->order?->order_number, $r->type, $r->status,
            optional($r->requested_at)?->toDateString(), optional($r->completed_at)?->toDateString(),
        ]);

        return ['Return Report', $headers, $rows, $this->reports->returnSummary($filters)];
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function filters(Request $request, array $extra = []): array
    {
        $base = ['search', 'date_from', 'date_to', 'sort_by', 'sort_dir'];

        return $request->only(array_merge($base, $extra));
    }

    private function perPage(Request $request): int
    {
        return min((int) $request->input('per_page', 20), self::PER_PAGE_MAX);
    }

    private function tableResponse($paginator, array $summary): JsonResponse
    {
        return $this->success($paginator->items(), 'Report retrieved.', 200, array_merge(
            ['summary' => $summary],
            $this->paginationMeta($paginator)
        ));
    }

    private function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }

    private function validationError(ValidationException $e): JsonResponse
    {
        return $this->error(collect($e->errors())->flatten()->first() ?? 'Validation failed.', 422, $e->errors());
    }
}
