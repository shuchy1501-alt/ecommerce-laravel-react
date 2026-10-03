<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('payment_method', ['cod', 'bkash', 'nagad', 'card', 'bank'])->default('cod')->after('order_status');
            $table->string('coupon_code')->nullable()->after('coupon_discount');
            $table->timestamp('placed_at')->nullable()->after('order_date');
            // Prevents a double-click / duplicate submit from creating two
            // orders for the same checkout attempt (spec section 36).
            $table->string('idempotency_key')->nullable()->unique()->after('order_number');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'coupon_code', 'placed_at', 'idempotency_key']);
        });
    }
};
