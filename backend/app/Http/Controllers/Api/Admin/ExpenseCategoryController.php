<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseCategory\StoreExpenseCategoryRequest;
use App\Http\Requests\ExpenseCategory\UpdateExpenseCategoryRequest;
use App\Http\Resources\ExpenseCategoryResource;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

/** Spec sections 11, 46. */
class ExpenseCategoryController extends Controller
{
    /** GET /api/admin/expense-categories */
    public function index(): JsonResponse
    {
        $categories = ExpenseCategory::withCount('expenses')->orderBy('name')->get();

        return $this->success(ExpenseCategoryResource::collection($categories), 'Expense categories fetched successfully');
    }

    /** POST /api/admin/expense-categories */
    public function store(StoreExpenseCategoryRequest $request): JsonResponse
    {
        $category = ExpenseCategory::create($request->validated());

        return $this->success(new ExpenseCategoryResource($category), 'Expense category created successfully', 201);
    }

    /** PUT /api/admin/expense-categories/{expense_category} */
    public function update(UpdateExpenseCategoryRequest $request, ExpenseCategory $expense_category): JsonResponse
    {
        $expense_category->update($request->validated());

        return $this->success(new ExpenseCategoryResource($expense_category), 'Expense category updated successfully');
    }

    /** DELETE /api/admin/expense-categories/{expense_category} */
    public function destroy(ExpenseCategory $expense_category): JsonResponse
    {
        if ($expense_category->expenses()->exists()) {
            throw ValidationException::withMessages(['category' => ['This category has expenses recorded against it and cannot be deleted. Deactivate it instead.']]);
        }

        $expense_category->delete();

        return $this->success(null, 'Expense category deleted successfully');
    }
}
