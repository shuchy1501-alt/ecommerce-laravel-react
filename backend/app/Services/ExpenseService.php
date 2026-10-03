<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Spec sections 8-15, 48, 54. Owns the expense lifecycle. Financial-ledger
 * recognition (spec section 54: "pending expense does not count as paid
 * cash flow") is handled by only writing a FinancialTransaction when an
 * expense becomes "paid" — see markAsPaid() and FinancialReportService.
 */
class ExpenseService
{
    public function __construct(
        private readonly FinancialReportService $financialReportService,
        private readonly AuditLogService $auditLog,
    ) {}

    public function createExpense(array $data, int $userId): Expense
    {
        $this->assertCategoryActive($data['expense_category_id']);

        $expense = DB::transaction(function () use ($data, $userId) {
            $expense = Expense::create([
                'expense_number' => $this->generateExpenseNumber(),
                'expense_category_id' => $data['expense_category_id'],
                'title' => $data['title'],
                'amount' => $data['amount'],
                'expense_date' => $data['expense_date'],
                'payment_method' => $data['payment_method'],
                'reference' => $data['reference'] ?? null,
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'created_by' => $userId,
            ]);

            if ($expense->status === 'paid') {
                $this->financialReportService->recordExpenseTransaction($expense);
            }

            return $expense->fresh('category');
        });

        $this->auditLog->log(
            \App\Models\User::find($userId),
            \App\Services\AuditAction::EXPENSE_CREATED,
            'Expense',
            $expense->id,
            newData: ['title' => $expense->title, 'amount' => (float) $expense->amount, 'status' => $expense->status]
        );

        return $expense;
    }

    public function updateExpense(Expense $expense, array $data): Expense
    {
        if ($expense->status === 'cancelled') {
            throw ValidationException::withMessages(['status' => ['A cancelled expense cannot be edited.']]);
        }

        if (isset($data['expense_category_id'])) {
            $this->assertCategoryActive($data['expense_category_id']);
        }

        $wasPaid = $expense->status === 'paid';

        $expense->update(collect($data)->only([
            'expense_category_id', 'title', 'amount', 'expense_date',
            'payment_method', 'reference', 'description',
        ])->toArray());

        // Editing amount/date after it was already paid would silently
        // desync the ledger row that markAsPaid() wrote — keep them
        // locked together rather than letting a transaction go stale.
        if ($wasPaid) {
            $this->financialReportService->syncExpenseTransaction($expense->fresh());
        }

        return $expense->fresh('category');
    }

    public function markAsPaid(Expense $expense): Expense
    {
        if ($expense->status !== 'pending') {
            throw ValidationException::withMessages(['status' => ['Only a pending expense can be marked as paid.']]);
        }

        return DB::transaction(function () use ($expense) {
            $expense->update(['status' => 'paid']);
            $this->financialReportService->recordExpenseTransaction($expense);

            return $expense->fresh('category');
        });
    }

    public function cancelExpense(Expense $expense): Expense
    {
        if ($expense->status === 'cancelled') {
            throw ValidationException::withMessages(['status' => ['This expense is already cancelled.']]);
        }

        return DB::transaction(function () use ($expense) {
            $wasPaid = $expense->status === 'paid';
            $expense->update(['status' => 'cancelled']);

            if ($wasPaid) {
                $this->financialReportService->removeExpenseTransaction($expense);
            }

            return $expense->fresh('category');
        });
    }

    /** Spec section 48: totals grouped by status, for the expenses list header. */
    public function calculateExpenseSummary(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = Expense::query()
            ->when($dateFrom, fn ($q) => $q->whereDate('expense_date', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('expense_date', '<=', $dateTo));

        return [
            'total' => (float) (clone $query)->where('status', '!=', 'cancelled')->sum('amount'),
            'paid' => (float) (clone $query)->where('status', 'paid')->sum('amount'),
            'pending' => (float) (clone $query)->where('status', 'pending')->sum('amount'),
            'cancelled' => (float) (clone $query)->where('status', 'cancelled')->sum('amount'),
        ];
    }

    private function assertCategoryActive(int $categoryId): void
    {
        $category = ExpenseCategory::find($categoryId);

        if (! $category || ! $category->status) {
            throw ValidationException::withMessages(['expense_category_id' => ['Please choose a valid, active expense category.']]);
        }
    }

    private function generateExpenseNumber(): string
    {
        do {
            $number = 'EXP-FM-' . now()->format('Ymd') . '-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (Expense::where('expense_number', $number)->exists());

        return $number;
    }
}
