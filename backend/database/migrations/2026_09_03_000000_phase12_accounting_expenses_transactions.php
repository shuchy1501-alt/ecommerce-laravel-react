<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 12 — Accounting + Expense + Revenue + Profit Management.
 *
 * Builds on the Phase 9/10 scaffolding that already exists: `sales`
 * (recorded per confirmed order — see SalesService::recordSale),
 * `expenses`/`expense_categories`, and `order_items.cost_price` (the
 * historical unit-cost snapshot spec section 6 asks for — already
 * captured at checkout by OrderService). This migration only adds what
 * Phase 12 needs on top: richer expense tracking (number/title/status)
 * and the financial_transactions ledger.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('expense_number')->nullable()->unique()->after('id');
            $table->string('title')->nullable()->after('expense_category_id');
            $table->string('reference')->nullable()->after('payment_method');
            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending')->after('reference');
        });

        $this->backfillLegacyExpenses();

        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number')->unique();
            $table->enum('type', ['sale', 'refund', 'expense', 'purchase', 'adjustment']);
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->enum('direction', ['income', 'expense']);
            $table->string('payment_method')->nullable();
            $table->text('description')->nullable();
            $table->date('transaction_date');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Section 52: one transaction per (type, reference) — stops a
            // sale/refund/expense from ever being double-recorded.
            $table->unique(['type', 'reference_type', 'reference_id'], 'fin_txn_reference_unique');
            $table->index(['transaction_date', 'type']);
            $table->index('direction');
        });

        $this->seedExpenseCategories();
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['expense_number', 'title', 'reference', 'status']);
        });
    }

    /**
     * Rows created before Phase 12 (ExpenseSeeder) predate `title`/
     * `expense_number`/`status` — give them sane values so nothing in the
     * UI renders blank, and mark them "paid" since they were seeded as
     * already-settled historical expenses.
     */
    private function backfillLegacyExpenses(): void
    {
        $legacy = DB::table('expenses')->whereNull('title')->get();

        foreach ($legacy as $row) {
            $category = DB::table('expense_categories')->where('id', $row->expense_category_id)->value('name');

            DB::table('expenses')->where('id', $row->id)->update([
                'title' => $row->description ?: ($category ?: 'Expense'),
                'status' => 'paid',
                'expense_number' => $this->generateExpenseNumber($row->id),
            ]);
        }
    }

    private function generateExpenseNumber(int $seed): string
    {
        return 'EXP-FM-' . now()->format('Ymd') . '-' . str_pad((string) $seed, 5, '0', STR_PAD_LEFT) . '-LEGACY';
    }

    /** Spec section 11 example categories — seeded idempotently. */
    private function seedExpenseCategories(): void
    {
        $categories = [
            'Rent', 'Utilities', 'Marketing', 'Salary', 'Courier',
            'Packaging', 'Software', 'Maintenance', 'Office Supplies', 'Other',
        ];

        foreach ($categories as $name) {
            DB::table('expense_categories')->updateOrInsert(
                ['name' => $name],
                ['description' => null, 'status' => true, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }
};
