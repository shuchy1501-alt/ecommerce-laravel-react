<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Refund;
use App\Models\Sale;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Orchestrates the finance dashboard, reports, cash flow, and the
 * financial_transactions ledger (spec sections 3, 30-47). This is the
 * only class that writes FinancialTransaction rows — every write goes
 * through firstOrCreate keyed on (type, reference_type, reference_id),
 * which is also a DB-level unique index, so a transaction can never be
 * duplicated no matter how many times the calling code path runs
 * (spec section 52).
 */
class FinancialReportService
{
    public function __construct(
        private readonly RevenueService $revenueService,
        private readonly ProfitService $profitService,
    ) {}

    // ------------------------------------------------------------------
    // Ledger writers
    // ------------------------------------------------------------------

    /** Section 33 — one "sale" transaction per order, written when SalesService::recordSale runs. */
    public function recordSaleTransaction(Sale $sale): FinancialTransaction
    {
        return $this->recordOnce(
            type: 'sale',
            referenceType: Order::class,
            referenceId: $sale->order_id,
            amount: (float) $sale->total,
            direction: 'income',
            paymentMethod: $sale->order?->payment_method,
            description: "Sale for order {$sale->order?->order_number}",
            date: $sale->sale_date,
        );
    }

    /** Section 34 — written once a refund actually completes, not when merely requested. */
    public function recordRefundTransaction(Refund $refund): FinancialTransaction
    {
        return $this->recordOnce(
            type: 'refund',
            referenceType: Refund::class,
            referenceId: $refund->id,
            amount: (float) $refund->amount,
            direction: 'expense',
            paymentMethod: $refund->refund_method,
            description: "Refund {$refund->refund_number} for order {$refund->order?->order_number}",
            date: ($refund->refunded_at ?? now())->toDateString(),
        );
    }

    /** Section 35 — written when an expense becomes "paid" (ExpenseService::markAsPaid or created pre-paid). */
    public function recordExpenseTransaction(Expense $expense): FinancialTransaction
    {
        return $this->recordOnce(
            type: 'expense',
            referenceType: Expense::class,
            referenceId: $expense->id,
            amount: (float) $expense->amount,
            direction: 'expense',
            paymentMethod: $expense->payment_method,
            description: $expense->title,
            date: $expense->expense_date->toDateString(),
        );
    }

    /** Keeps the ledger row in sync if a paid expense is edited (ExpenseService::updateExpense). */
    public function syncExpenseTransaction(Expense $expense): void
    {
        FinancialTransaction::where('type', 'expense')
            ->where('reference_type', Expense::class)
            ->where('reference_id', $expense->id)
            ->update([
                'amount' => $expense->amount,
                'payment_method' => $expense->payment_method,
                'description' => $expense->title,
                'transaction_date' => $expense->expense_date,
            ]);
    }

    /** Removes the ledger row if a previously-paid expense is cancelled (ExpenseService::cancelExpense). */
    public function removeExpenseTransaction(Expense $expense): void
    {
        FinancialTransaction::where('type', 'expense')
            ->where('reference_type', Expense::class)
            ->where('reference_id', $expense->id)
            ->delete();
    }

    /**
     * Section 36 — purchases are cash-out but never an operating expense
     * (spec sections 20, 55). Called from PurchaseService once a purchase
     * is fully received; uses the purchase total as a simplified
     * "paid on receipt" assumption since this project has no separate
     * accounts-payable/purchase-payment subsystem.
     */
    public function recordPurchaseTransaction(Purchase $purchase): FinancialTransaction
    {
        return $this->recordOnce(
            type: 'purchase',
            referenceType: Purchase::class,
            referenceId: $purchase->id,
            amount: (float) $purchase->total,
            direction: 'expense',
            paymentMethod: null,
            description: "Purchase {$purchase->purchase_number} from supplier",
            date: ($purchase->received_at ?? now())->toDateString(),
        );
    }

    private function recordOnce(string $type, string $referenceType, int $referenceId, float $amount, string $direction, ?string $paymentMethod, string $description, string $date): FinancialTransaction
    {
        return FinancialTransaction::firstOrCreate(
            ['type' => $type, 'reference_type' => $referenceType, 'reference_id' => $referenceId],
            [
                'transaction_number' => $this->generateTransactionNumber(),
                'amount' => $amount,
                'direction' => $direction,
                'payment_method' => $paymentMethod,
                'description' => $description,
                'transaction_date' => $date,
                'created_by' => auth()->id(),
            ]
        );
    }

    private function generateTransactionNumber(): string
    {
        do {
            $number = 'TXN-FM-' . now()->format('Ymd') . '-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (FinancialTransaction::where('transaction_number', $number)->exists());

        return $number;
    }

    // ------------------------------------------------------------------
    // Reports
    // ------------------------------------------------------------------

    /** Section 29 — every report endpoint accepts one of these presets, or 'custom' + explicit dates. */
    public function resolveDateRange(string $range, ?string $from = null, ?string $to = null): array
    {
        $today = Carbon::today();

        return match ($range) {
            'today' => [$today->toDateString(), $today->toDateString()],
            'yesterday' => [$today->copy()->subDay()->toDateString(), $today->copy()->subDay()->toDateString()],
            'last_7_days' => [$today->copy()->subDays(6)->toDateString(), $today->toDateString()],
            'last_30_days' => [$today->copy()->subDays(29)->toDateString(), $today->toDateString()],
            'this_month' => [$today->copy()->startOfMonth()->toDateString(), $today->copy()->endOfMonth()->toDateString()],
            'last_month' => [$today->copy()->subMonthNoOverflow()->startOfMonth()->toDateString(), $today->copy()->subMonthNoOverflow()->endOfMonth()->toDateString()],
            'this_year' => [$today->copy()->startOfYear()->toDateString(), $today->copy()->endOfYear()->toDateString()],
            'custom' => $this->resolveCustomRange($from, $to),
            default => throw ValidationException::withMessages(['range' => ["Unknown date range \"{$range}\"."]]),
        };
    }

    private function resolveCustomRange(?string $from, ?string $to): array
    {
        if (! $from || ! $to) {
            throw ValidationException::withMessages(['range' => ['A custom range needs both date_from and date_to.']]);
        }

        if (Carbon::parse($from)->greaterThan(Carbon::parse($to))) {
            throw ValidationException::withMessages(['range' => ['Invalid date range: date_from must be before date_to.']]);
        }

        return [$from, $to];
    }

    /** Section 3 — the /admin/finance dashboard payload. */
    public function getDashboard(string $range = 'this_month', ?string $from = null, ?string $to = null): array
    {
        [$rangeFrom, $rangeTo] = $this->resolveDateRange($range, $from, $to);
        $today = Carbon::today()->toDateString();
        $monthStart = Carbon::today()->startOfMonth()->toDateString();
        $monthEnd = Carbon::today()->endOfMonth()->toDateString();

        return [
            'range' => ['range' => $range, 'from' => $rangeFrom, 'to' => $rangeTo],
            'summary' => [
                'total_revenue' => $this->revenueService->getTotalCollected($rangeFrom, $rangeTo),
                'net_sales' => $this->revenueService->getNetSales($rangeFrom, $rangeTo),
                'total_expenses' => $this->profitService->calculateOperatingExpenses($rangeFrom, $rangeTo),
                'gross_profit' => $this->profitService->calculateGrossProfit($rangeFrom, $rangeTo),
                'net_profit' => $this->profitService->calculateNetProfit($rangeFrom, $rangeTo),
                'profit_margin' => $this->profitService->calculateProfitMargin($rangeFrom, $rangeTo),
                'total_refunds' => $this->revenueService->getRefunds($rangeFrom, $rangeTo),
                'total_purchase_cost' => (float) Purchase::where('status', 'received')
                    ->whereDate('received_at', '>=', $rangeFrom)->whereDate('received_at', '<=', $rangeTo)
                    ->sum('total'),
            ],
            'cards' => [
                'today_revenue' => $this->revenueService->getTotalCollected($today, $today),
                'this_month_revenue' => $this->revenueService->getTotalCollected($monthStart, $monthEnd),
                'this_month_expenses' => $this->profitService->calculateOperatingExpenses($monthStart, $monthEnd),
                'this_month_profit' => $this->profitService->calculateNetProfit($monthStart, $monthEnd),
            ],
            'revenue_trend' => $this->monthlyTrend($rangeFrom, $rangeTo, 'revenue'),
            'expense_trend' => $this->monthlyTrend($rangeFrom, $rangeTo, 'expense'),
            'profit_trend' => $this->monthlyTrend($rangeFrom, $rangeTo, 'profit'),
            'expense_breakdown' => $this->expenseBreakdown($rangeFrom, $rangeTo),
            'recent_transactions' => FinancialTransaction::latest('transaction_date')->latest('id')->limit(10)->get(),
        ];
    }

    /** Sections 26-28, 39 — one row per calendar month spanned by the range, for the trend charts. */
    private function monthlyTrend(string $from, string $to, string $metric): array
    {
        $start = Carbon::parse($from)->startOfMonth();
        $end = Carbon::parse($to)->startOfMonth();
        $months = [];

        while ($start->lessThanOrEqualTo($end) && count($months) < 24) {
            $monthFrom = $start->copy()->startOfMonth()->toDateString();
            $monthTo = $start->copy()->endOfMonth()->toDateString();

            $value = match ($metric) {
                'revenue' => $this->revenueService->getNetSales($monthFrom, $monthTo),
                'expense' => $this->profitService->calculateOperatingExpenses($monthFrom, $monthTo),
                'profit' => $this->profitService->calculateNetProfit($monthFrom, $monthTo),
                default => 0.0,
            };

            $months[] = ['month' => $start->format('Y-m'), 'label' => $start->format('M Y'), 'value' => $value];
            $start->addMonth();
        }

        return $months;
    }

    /** Sections 41-42 — expense breakdown by category with percentage share. */
    public function expenseBreakdown(?string $from = null, ?string $to = null): array
    {
        $query = Expense::where('expenses.status', 'paid')
            ->when($from, fn ($q) => $q->whereDate('expense_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('expense_date', '<=', $to));

        $rows = $query->join('expense_categories', 'expense_categories.id', '=', 'expenses.expense_category_id')
            ->selectRaw('expense_categories.name as category, SUM(expenses.amount) as amount')
            ->groupBy('expense_categories.name')
            ->orderByDesc('amount')
            ->get();

        $total = (float) $rows->sum('amount');

        return $rows->map(fn ($row) => [
            'category' => $row->category,
            'amount' => (float) $row->amount,
            'percentage' => $total > 0 ? round(((float) $row->amount / $total) * 100, 2) : 0.0,
        ])->toArray();
    }

    /** Section 16 passthrough. */
    public function getRevenue(?string $from = null, ?string $to = null, int $perPage = 20)
    {
        return $this->revenueService->revenueRows($from, $to)->paginate($perPage);
    }

    /** Section 17/18 — safe fields only, no card/CVV/gateway secrets. */
    public function getPayments(array $filters, int $perPage = 20)
    {
        $query = Payment::with('order:id,order_number,user_id')
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['payment_method'] ?? null, fn ($q, $v) => $q->where('payment_method', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->latest();

        return $query->paginate($perPage);
    }

    public function getRefunds(array $filters, int $perPage = 20)
    {
        $query = Refund::with(['order:id,order_number', 'returnRequest:id,return_number'])
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->latest();

        return $query->paginate($perPage);
    }

    public function getExpenses(array $filters, int $perPage = 20)
    {
        $query = Expense::with('category')
            ->when($filters['category_id'] ?? null, fn ($q, $v) => $q->where('expense_category_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['payment_method'] ?? null, fn ($q, $v) => $q->where('payment_method', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('expense_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('expense_date', '<=', $v))
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where(function ($sub) use ($v) {
                $sub->where('title', 'like', "%{$v}%")->orWhere('expense_number', 'like', "%{$v}%");
            }))
            ->latest('expense_date');

        return $query->paginate($perPage);
    }

    /** Section 22 — the full P&L statement. */
    public function getProfitLoss(string $range = 'this_month', ?string $from = null, ?string $to = null): array
    {
        [$rangeFrom, $rangeTo] = $this->resolveDateRange($range, $from, $to);

        return array_merge(
            ['range' => ['range' => $range, 'from' => $rangeFrom, 'to' => $rangeTo]],
            $this->profitService->profitAndLoss($rangeFrom, $rangeTo),
            ['expense_breakdown' => $this->expenseBreakdown($rangeFrom, $rangeTo)],
        );
    }

    /**
     * Section 37/38 — deliberately independent of the P&L above. Cash In
     * uses actual payment receipt dates (Payment.paid_at), not sale/order
     * dates, and inventory purchases show up as cash-out in full even
     * though profit only recognizes their cost gradually via COGS as
     * goods are sold.
     */
    public function getCashFlow(string $range = 'this_month', ?string $from = null, ?string $to = null): array
    {
        [$rangeFrom, $rangeTo] = $this->resolveDateRange($range, $from, $to);

        $salesPayments = (float) Payment::where('status', 'paid')
            ->whereDate('paid_at', '>=', $rangeFrom)->whereDate('paid_at', '<=', $rangeTo)
            ->sum('amount');

        $refundsOut = (float) Refund::where('status', 'completed')
            ->whereDate('refunded_at', '>=', $rangeFrom)->whereDate('refunded_at', '<=', $rangeTo)
            ->sum('amount');

        $expensesOut = $this->profitService->calculateOperatingExpenses($rangeFrom, $rangeTo);

        $purchasesOut = (float) Purchase::where('status', 'received')
            ->whereDate('received_at', '>=', $rangeFrom)->whereDate('received_at', '<=', $rangeTo)
            ->sum('total');

        $cashIn = $salesPayments;
        $cashOut = round($refundsOut + $expensesOut + $purchasesOut, 2);

        return [
            'range' => ['range' => $range, 'from' => $rangeFrom, 'to' => $rangeTo],
            'cash_in' => ['sales_payments' => $salesPayments, 'other_income' => 0.0, 'total' => $cashIn],
            'cash_out' => ['refunds' => $refundsOut, 'expenses' => $expensesOut, 'inventory_purchases' => $purchasesOut, 'total' => $cashOut],
            'net_cash_flow' => round($cashIn - $cashOut, 2),
        ];
    }

    public function getTransactions(array $filters, int $perPage = 20)
    {
        $query = FinancialTransaction::with('creator:id,name')
            ->when($filters['type'] ?? null, fn ($q, $v) => $q->where('type', $v))
            ->when($filters['direction'] ?? null, fn ($q, $v) => $q->where('direction', $v))
            ->when($filters['payment_method'] ?? null, fn ($q, $v) => $q->where('payment_method', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('transaction_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('transaction_date', '<=', $v))
            ->latest('transaction_date')->latest('id');

        return $query->paginate($perPage);
    }
}
