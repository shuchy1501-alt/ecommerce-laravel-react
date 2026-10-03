<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseResource;
use App\Http\Resources\FinancePaymentResource;
use App\Http\Resources\FinancialTransactionResource;
use App\Http\Resources\RefundResource;
use App\Services\ExpenseService;
use App\Services\FinancialReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Spec sections 3, 16-19, 22, 26-32, 37, 44. Read-only reporting surface —
 * every figure here is computed server-side by FinancialReportService /
 * RevenueService / ProfitService; the frontend never calculates totals itself.
 */
class FinanceController extends Controller
{
    public function __construct(
        private readonly FinancialReportService $financialReportService,
    ) {}

    /** GET /api/admin/finance/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,last_7_days,last_30_days,this_month,last_month,this_year,custom'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $dashboard = $this->financialReportService->getDashboard(
            $data['range'] ?? 'this_month',
            $data['date_from'] ?? null,
            $data['date_to'] ?? null
        );

        return $this->success($dashboard, 'Financial dashboard fetched successfully');
    }

    /** GET /api/admin/finance/revenue */
    public function revenue(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $sales = $this->financialReportService->getRevenue($data['date_from'] ?? null, $data['date_to'] ?? null, $data['per_page'] ?? 20);

        return $this->paginatedSuccess($sales, fn ($sale) => [
            'id' => $sale->id,
            'order_id' => $sale->order_id,
            'order_number' => $sale->order?->order_number,
            'customer' => $sale->customer?->user?->name,
            'date' => $sale->sale_date?->toDateString(),
            'subtotal' => (float) $sale->subtotal,
            'discount' => (float) $sale->discount,
            'shipping' => (float) $sale->shipping,
            'tax' => (float) $sale->tax,
            'total' => (float) $sale->total,
            'order_status' => $sale->order?->order_status,
            'payment_status' => $sale->order?->payment_status,
        ], 'Revenue fetched successfully');
    }

    /** GET /api/admin/finance/expenses — thin passthrough; ExpenseController owns CRUD. */
    public function expenses(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:pending,paid,cancelled'],
            'payment_method' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'search' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $expenses = $this->financialReportService->getExpenses($data, $data['per_page'] ?? 20);
        $summary = app(ExpenseService::class)->calculateExpenseSummary($data['date_from'] ?? null, $data['date_to'] ?? null);

        return $this->success([
            'data' => ExpenseResource::collection($expenses->items()),
            'meta' => $this->meta($expenses),
            'summary' => $summary,
        ], 'Expenses fetched successfully');
    }

    /** GET /api/admin/finance/payments */
    public function payments(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', 'in:pending,paid,failed,refunded,partially_refunded'],
            'payment_method' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $payments = $this->financialReportService->getPayments($data, $data['per_page'] ?? 20);

        return $this->success([
            'data' => FinancePaymentResource::collection($payments->items()),
            'meta' => $this->meta($payments),
        ], 'Payments fetched successfully');
    }

    /** GET /api/admin/finance/refunds */
    public function refunds(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', 'in:pending,processing,completed,failed,cancelled'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $refunds = $this->financialReportService->getRefunds($data, $data['per_page'] ?? 20);

        return $this->success([
            'data' => RefundResource::collection($refunds->items()),
            'meta' => $this->meta($refunds),
        ], 'Refunds fetched successfully');
    }

    /** GET /api/admin/finance/profit-loss */
    public function profitLoss(Request $request): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,last_7_days,last_30_days,this_month,last_month,this_year,custom'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $report = $this->financialReportService->getProfitLoss($data['range'] ?? 'this_month', $data['date_from'] ?? null, $data['date_to'] ?? null);

        return $this->success($report, 'Profit & Loss report fetched successfully');
    }

    /** GET /api/admin/finance/cash-flow */
    public function cashFlow(Request $request): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,last_7_days,last_30_days,this_month,last_month,this_year,custom'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $report = $this->financialReportService->getCashFlow($data['range'] ?? 'this_month', $data['date_from'] ?? null, $data['date_to'] ?? null);

        return $this->success($report, 'Cash flow summary fetched successfully');
    }

    /** GET /api/admin/finance/transactions */
    public function transactions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['nullable', 'in:sale,refund,expense,purchase,adjustment'],
            'direction' => ['nullable', 'in:income,expense'],
            'payment_method' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $transactions = $this->financialReportService->getTransactions($data, $data['per_page'] ?? 20);

        return $this->success([
            'data' => FinancialTransactionResource::collection($transactions->items()),
            'meta' => $this->meta($transactions),
        ], 'Financial transactions fetched successfully');
    }

    private function meta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /** Shared "map each paginator item through a resolver, keep pagination meta" helper for the ad-hoc Sale rows revenue() needs. */
    private function paginatedSuccess($paginator, \Closure $mapper, string $message): JsonResponse
    {
        return $this->success([
            'data' => collect($paginator->items())->map($mapper)->values(),
            'meta' => $this->meta($paginator),
        ], $message);
    }
}
