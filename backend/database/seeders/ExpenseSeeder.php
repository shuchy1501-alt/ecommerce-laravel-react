<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    private const EXPENSES = [
        ['category' => 'Rent', 'amount' => 25000, 'method' => 'bank', 'description' => 'Shop rent for the month'],
        ['category' => 'Electricity', 'amount' => 4200, 'method' => 'cash', 'description' => 'Monthly electricity bill'],
        ['category' => 'Salary', 'amount' => 60000, 'method' => 'bank', 'description' => 'Staff salary payment'],
        ['category' => 'Marketing', 'amount' => 8000, 'method' => 'card', 'description' => 'Facebook ad campaign'],
        ['category' => 'Delivery', 'amount' => 3500, 'method' => 'cash', 'description' => 'Courier charges for the week'],
        ['category' => 'Packaging', 'amount' => 1800, 'method' => 'cash', 'description' => 'Poly bags and boxes'],
    ];

    public function run(): void
    {
        $admin = User::where('email', 'admin@fashionmart.test')->first();

        if (! $admin) {
            return;
        }

        foreach (self::EXPENSES as $index => $expense) {
            $category = ExpenseCategory::where('name', $expense['category'])->first();

            if (! $category) {
                continue;
            }

            Expense::firstOrCreate(
                [
                    'expense_category_id' => $category->id,
                    'expense_date' => now()->subDays(30 - $index * 3)->toDateString(),
                    'amount' => $expense['amount'],
                ],
                [
                    'expense_number' => 'EXP-FM-' . now()->format('Ymd') . '-' . str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT),
                    'title' => $expense['category'] . ' Expense',
                    'payment_method' => $expense['method'],
                    'description' => $expense['description'],
                    'attachment' => null,
                    'status' => 'paid',
                    'created_by' => $admin->id,
                ]
            );
        }
    }
}
