<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $supplier = Supplier::first();

        if (! $supplier) {
            return;
        }

        $products = Product::with('variants')->take(5)->get();

        if ($products->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($supplier, $products) {
            $purchase = Purchase::firstOrCreate(
                ['purchase_number' => 'PO-FM-20260818-00001'],
                [
                    'supplier_id' => $supplier->id,
                    'purchase_date' => now()->subDays(10)->toDateString(),
                    'subtotal' => 0,
                    'discount' => 0,
                    'shipping_cost' => 0,
                    'tax' => 0,
                    'total' => 0,
                    'paid_amount' => 0,
                    'due_amount' => 0,
                    'payment_status' => 'paid',
                    'status' => 'received',
                    'notes' => 'Initial demo purchase',
                    'received_at' => now()->subDays(9),
                ]
            );

            if ($purchase->items()->exists()) {
                return;
            }

            $subtotal = 0;

            foreach ($products as $product) {
                $variant = $product->variants->first();

                if (! $variant) {
                    continue;
                }

                $quantity = 20;
                $lineSubtotal = $variant->purchase_price * $quantity;
                $subtotal += $lineSubtotal;

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'sku' => $variant->sku,
                    'quantity' => $quantity,
                    'received_quantity' => $quantity,
                    'purchase_price' => $variant->purchase_price,
                    'discount' => 0,
                    'tax' => 0,
                    'subtotal' => $lineSubtotal,
                ]);

                // product_variants.stock is the single source of truth for
                // "available now" (see InventoryService doc-block). The
                // opening stock set by InventorySeeder already accounts for
                // this demo purchase's units, so we record the purchase and
                // its items for history without a second, duplicate stock
                // movement (InventorySeeder already logged the 'opening' one).
            }

            $purchase->update([
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'paid_amount' => $subtotal,
                'due_amount' => 0,
            ]);
        });
    }
}
