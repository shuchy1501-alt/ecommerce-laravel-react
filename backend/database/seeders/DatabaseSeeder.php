<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,

            // Catalog foundation
            UnitSeeder::class,
            BrandSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,

            // Inventory backfill (must run after ProductSeeder)
            InventorySeeder::class,

            // Customers & Suppliers
            CustomerSeeder::class,
            SupplierSeeder::class,

            // Purchases (must run after SupplierSeeder + InventorySeeder)
            PurchaseSeeder::class,

            // Links one seeded customer to a real login so orders/reviews/
            // returns below can reference a genuine user_id.
            DemoCustomerAccountSeeder::class,

            // Storefront / commerce data (Phase 2 remaining modules)
            CouponSeeder::class,
            ShippingMethodSeeder::class,
            SettingSeeder::class,
            ExpenseCategorySeeder::class,
            ExpenseSeeder::class,

            // Orders must run after CustomerSeeder, ProductSeeder and CouponSeeder
            OrderSeeder::class,

            // Reviews and returns must run after OrderSeeder
            ReviewSeeder::class,
            ReturnRefundSeeder::class,
        ]);
    }
}
