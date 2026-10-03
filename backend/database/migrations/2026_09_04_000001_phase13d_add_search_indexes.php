<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 13D — Global Search performance. `sku`, `order_number`, and
 * `purchase_number` already have unique indexes from their original
 * migrations. This adds indexes for the free-text name/contact columns
 * that global search filters on but weren't previously indexed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index('name');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->index('name');
            $table->index('phone');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['phone']);
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });
    }
};
