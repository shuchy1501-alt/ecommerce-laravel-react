<?php

namespace App\Services;

use App\Models\Supplier;
use Illuminate\Validation\ValidationException;

class SupplierService
{
    public function create(array $data): Supplier
    {
        return Supplier::create($data);
    }

    public function update(Supplier $supplier, array $data): Supplier
    {
        $supplier->update($data);

        return $supplier->fresh();
    }

    public function delete(Supplier $supplier): void
    {
        if ($supplier->purchases()->exists()) {
            throw ValidationException::withMessages([
                'supplier' => ['This supplier cannot be deleted because purchase history exists. Set it to Inactive instead.'],
            ]);
        }

        $supplier->delete();
    }

    public function getPurchaseSummary(Supplier $supplier): array
    {
        $purchases = $supplier->purchases();

        return [
            'total_purchases' => (clone $purchases)->count(),
            'total_purchase_amount' => (float) (clone $purchases)->sum('total'),
            'last_purchase_date' => (clone $purchases)->max('purchase_date'),
        ];
    }
}
