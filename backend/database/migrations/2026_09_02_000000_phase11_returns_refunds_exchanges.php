<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 11 — Return + Refund + Exchange + Cancellation.
 *
 * Builds on top of the `returns`/`return_items`/`refunds` scaffolding
 * already created in Phase 9 (2026_08_25_1000{11,12,13}) rather than
 * dropping/recreating those tables, since orders can already reference
 * them. This migration only ADDS the columns/tables the after-sales
 * workflow needs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->enum('type', ['return', 'exchange', 'refund'])->default('return')->after('user_id');
            $table->text('customer_note')->nullable()->after('description');
            $table->text('admin_note')->nullable()->after('customer_note');
            $table->timestamp('received_at')->nullable()->after('approved_at');
            $table->timestamp('inspected_at')->nullable()->after('received_at');
            $table->timestamp('rejected_at')->nullable()->after('inspected_at');
        });

        // Widen the status enum to the full after-sales lifecycle (spec section 13).
        // MODIFY is MySQL-only syntax — SQLite (used for the automated test
        // suite) has no native ENUM type, so the column is already
        // unconstrained TEXT there and this statement is simply a no-op to skip.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE returns MODIFY status ENUM(
                'requested','approved','rejected','pickup_scheduled','in_transit','received',
                'inspected','refund_pending','refunded','exchange_processing','exchange_completed',
                'completed','cancelled'
            ) NOT NULL DEFAULT 'requested'");
        }

        Schema::table('return_items', function (Blueprint $table) {
            $table->enum('condition', ['new', 'opened', 'damaged', 'defective', 'wrong_item'])->nullable()->after('reason');
            $table->decimal('refund_amount', 12, 2)->nullable()->after('condition');
            $table->foreignId('exchange_variant_id')->nullable()->after('refund_amount')
                ->constrained('product_variants')->nullOnDelete();
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->string('refund_number')->nullable()->unique()->after('id');
            $table->string('reason')->nullable()->after('amount');
            $table->foreignId('processed_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable()->after('processed_by');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE refunds MODIFY status ENUM('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending'");
        }

        // 'sales_return' already covers plain-return restocking; add
        // 'exchange' for the replacement-out / original-in pair that an
        // exchange fulfillment creates (spec section 34/49).
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE stock_movements MODIFY type ENUM(
                'opening','purchase','sale','sales_return','purchase_return','damage',
                'adjustment','adjustment_in','adjustment_out','cancellation','exchange'
            ) NOT NULL");
        }

        Schema::create('exchanges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('returns')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('original_order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->foreignId('original_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('replacement_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('price_difference', 12, 2)->default(0);
            $table->enum('price_difference_action', ['none', 'customer_pays', 'refund_difference', 'store_credit'])->default('none');
            $table->enum('status', ['pending', 'approved', 'processing', 'shipped', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();

            $table->index(['order_id', 'status']);
        });

        Schema::create('return_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('returns')->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('return_id');
        });

        Schema::table('products', function (Blueprint $table) {
            // Section 64: architecture support for "Final Sale" / non-returnable products.
            $table->boolean('is_returnable')->default(true)->after('status');
        });

        Schema::table('orders', function (Blueprint $table) {
            // Return-window math (section 2/3) needs the actual delivery
            // moment, not just the current 'delivered' order_status.
            $table->timestamp('delivered_at')->nullable()->after('placed_at');
        });

        $this->seedDefaultSettings();
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE stock_movements MODIFY type ENUM(
                'opening','purchase','sale','sales_return','purchase_return','damage',
                'adjustment','adjustment_in','adjustment_out','cancellation'
            ) NOT NULL");
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('delivered_at');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_returnable');
        });

        Schema::dropIfExists('return_status_histories');
        Schema::dropIfExists('exchanges');

        Schema::table('refunds', function (Blueprint $table) {
            $table->dropConstrainedForeignId('processed_by');
            $table->dropColumn(['refund_number', 'reason', 'processed_at']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE refunds MODIFY status ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('return_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('exchange_variant_id');
            $table->dropColumn(['condition', 'refund_amount']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE returns MODIFY status ENUM('requested','approved','rejected','received','completed','cancelled') NOT NULL DEFAULT 'requested'");
        }

        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn(['type', 'customer_note', 'admin_note', 'received_at', 'inspected_at', 'rejected_at']);
        });
    }

    /**
     * Configurable after-sales policy (spec sections 3, 25, 33, 63) — never
     * hard-coded into services or the frontend.
     */
    private function seedDefaultSettings(): void
    {
        $defaults = [
            ['key' => 'return_window_days', 'value' => '7', 'type' => 'integer', 'group' => 'returns'],
            // fault_based: shipping is only refunded when the reason is the
            // seller's fault (damaged/defective/wrong item) AND the whole
            // order is being returned. always/never override that logic.
            ['key' => 'refund_shipping_policy', 'value' => 'fault_based', 'type' => 'string', 'group' => 'returns'],
            // charge_or_refund: customer pays the difference if the
            // replacement is pricier, gets the difference refunded if
            // cheaper. store_credit issues the difference as store credit instead.
            ['key' => 'exchange_price_difference_policy', 'value' => 'charge_or_refund', 'type' => 'string', 'group' => 'returns'],
            ['key' => 'exchange_allowed', 'value' => '1', 'type' => 'boolean', 'group' => 'returns'],
            ['key' => 'max_return_quantity_per_item', 'value' => '0', 'type' => 'integer', 'group' => 'returns'], // 0 = no extra cap beyond delivered qty
            ['key' => 'cod_refund_method', 'value' => 'bank', 'type' => 'string', 'group' => 'returns'],
        ];

        foreach ($defaults as $row) {
            DB::table('settings')->updateOrInsert(
                ['key' => $row['key']],
                array_merge($row, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
};
