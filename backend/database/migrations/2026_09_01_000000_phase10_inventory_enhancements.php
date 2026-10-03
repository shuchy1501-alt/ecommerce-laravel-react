<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('city')->nullable()->after('address');
            $table->string('country')->nullable()->after('city');
            $table->string('tax_id')->nullable()->after('country');
            $table->string('contact_person')->nullable()->after('tax_id');
            $table->text('notes')->nullable()->after('status');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('shipping_cost', 12, 2)->default(0)->after('discount');
            $table->foreignId('created_by')->nullable()->after('notes')->constrained('users')->nullOnDelete();
            $table->timestamp('received_at')->nullable()->after('created_by');
        });

        // Widen the status enum: draft, ordered, received, partially_received, cancelled.
        // MODIFY is MySQL-only syntax — SQLite (used for the automated test suite)
        // has no native ENUM type, so the column is already unconstrained TEXT there
        // and this statement is simply a no-op to skip.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE purchases MODIFY status ENUM('draft','ordered','received','partially_received','cancelled') NOT NULL DEFAULT 'draft'");
        }
        DB::statement("UPDATE purchases SET status = 'ordered' WHERE status = 'pending'");

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->string('product_name')->nullable()->after('variant_id');
            $table->string('sku')->nullable()->after('product_name');
            $table->integer('received_quantity')->default(0)->after('quantity');
        });

        // Widen movement types to distinguish adjustment direction (spec section 26/29).
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE stock_movements MODIFY type ENUM('opening','purchase','sale','sales_return','purchase_return','damage','adjustment','adjustment_in','adjustment_out','cancellation') NOT NULL");
        }

        // Backfill snapshot fields for any pre-existing rows (seeder data).
        DB::table('purchase_items')->orderBy('id')->get()->each(function ($row) {
            $product = DB::table('products')->where('id', $row->product_id)->first();
            $variant = $row->variant_id ? DB::table('product_variants')->where('id', $row->variant_id)->first() : null;

            DB::table('purchase_items')->where('id', $row->id)->update([
                'product_name' => $product->name ?? 'Product',
                'sku' => $variant->sku ?? null,
                'received_quantity' => $row->quantity,
            ]);
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE stock_movements MODIFY type ENUM('opening','purchase','sale','sales_return','purchase_return','damage','adjustment','cancellation') NOT NULL");
        }

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn(['product_name', 'sku', 'received_quantity']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE purchases MODIFY status ENUM('pending','received','cancelled') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['shipping_cost', 'received_at']);
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['city', 'country', 'tax_id', 'contact_person', 'notes']);
        });
    }
};
