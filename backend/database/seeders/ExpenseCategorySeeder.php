<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    private const CATEGORIES = [
        'Salary', 'Rent', 'Electricity', 'Delivery',
        'Packaging', 'Marketing', 'Internet', 'Maintenance', 'Other',
    ];

    public function run(): void
    {
        foreach (self::CATEGORIES as $name) {
            ExpenseCategory::firstOrCreate(
                ['name' => $name],
                ['status' => true]
            );
        }
    }
}
