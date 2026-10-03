<?php

namespace App\Http\Requests\Expense;

use App\Models\Expense;
use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expense_category_id' => ['required', 'integer', 'exists:expense_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            // Section 13: "Amount > 0" is a hard validation rule, not just a UI hint.
            'amount' => ['required', 'numeric', 'gt:0'],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['required', 'in:' . implode(',', Expense::PAYMENT_METHODS)],
            'reference' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:pending,paid'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.gt' => 'Expense amount must be greater than zero.',
        ];
    }
}
