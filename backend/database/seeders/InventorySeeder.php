<?php

namespace Database\Seeders;

use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        ProductVariant::withTrashed()->get()->each(function (ProductVariant $variant) {
            $inventory = Inventory::firstOrCreate(
                [
                    'product_id' => $variant->product_id,
                    'variant_id' => $variant->id,
                ],
                [
                    'opening_stock' => $variant->stock,
                    'current_stock' => $variant->stock,
                    'minimum_stock' => $variant->minimum_stock,
                    'reserved_stock' => 0,
                ]
            );

            $alreadyLogged = StockMovement::where('variant_id', $variant->id)
                ->where('type', 'opening')
                ->exists();

            if (! $alreadyLogged) {
                StockMovement::create([
                    'product_id' => $variant->product_id,
                    'variant_id' => $variant->id,
                    'type' => 'opening',
                    'quantity' => $variant->stock,
                    'previous_stock' => 0,
                    'new_stock' => $variant->stock,
                    'reference_type' => null,
                    'reference_id' => null,
                    'note' => 'Initial stock from seeder',
                    'created_by' => null,
                ]);
            }
        });
    }
}
