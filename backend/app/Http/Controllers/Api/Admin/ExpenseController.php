<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\ExpenseService;
use App\Services\FinancialReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Spec sections 9-15, 45. */
class ExpenseController extends Controller
{
    public function __construct(
        private readonly ExpenseService $expenseService,
        private readonly FinancialReportService $financialReportService,
    ) {}

    /** GET /api/admin/expenses */
    public function index(Request $request): JsonResponse
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

        return $this->success([
            'data' => ExpenseResource::collection($expenses->items()),
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
            ],
            'summary' => $this->expenseService->calculateExpenseSummary($data['date_from'] ?? null, $data['date_to'] ?? null),
        ], 'Expenses fetched successfully');
    }

    /** GET /api/admin/expenses/{expense} */
    public function show(Expense $expense): JsonResponse
    {
        return $this->success(new ExpenseResource($expense->load(['category', 'creator'])), 'Expense fetched successfully');
    }

    /** POST /api/admin/expenses */
    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = $this->expenseService->createExpense($request->validated(), $request->user()->id);

        return $this->success(new ExpenseResource($expense), 'Expense created successfully', 201);
    }

    /** PUT /api/admin/expenses/{expense} */
    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $updated = $this->expenseService->updateExpense($expense, $request->validated());

        return $this->success(new ExpenseResource($updated), 'Expense updated successfully');
    }

    /** POST /api/admin/expenses/{expense}/mark-paid */
    public function markPaid(Expense $expense): JsonResponse
    {
        $updated = $this->expenseService->markAsPaid($expense);

        return $this->success(new ExpenseResource($updated), 'Expense marked as paid');
    }

    /** DELETE /api/admin/expenses/{expense} — soft "delete" via cancellation (spec keeps a paper trail, section 9 status enum). */
    public function destroy(Expense $expense): JsonResponse
    {
        $this->expenseService->cancelExpense($expense);

        return $this->success(null, 'Expense cancelled successfully');
    }
}
