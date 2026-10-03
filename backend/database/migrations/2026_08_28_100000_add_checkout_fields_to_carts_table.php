<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->after('session_id')->constrained()->nullOnDelete();
            $table->decimal('discount_amount', 12, 2)->default(0)->after('coupon_id');
            $table->foreignId('shipping_method_id')->nullable()->after('discount_amount')->constrained()->nullOnDelete();
            $table->foreignId('customer_address_id')->nullable()->after('shipping_method_id')->constrained('customer_addresses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn('discount_amount');
            $table->dropConstrainedForeignId('shipping_method_id');
            $table->dropConstrainedForeignId('customer_address_id');
        });
    }
};
