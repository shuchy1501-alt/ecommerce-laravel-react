<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    private const GUARD = 'web';

    private const ROLES = [
        'Super Admin',
        'Admin',
        'Manager',
        'Sales Staff',
        'Inventory Staff',
        'Customer',
    ];

    private const PERMISSIONS = [
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'permissions.view', 'permissions.manage',
        'products.view', 'products.create', 'products.edit', 'products.update', 'products.delete',
        'categories.view', 'categories.create', 'categories.edit', 'categories.update', 'categories.delete',
        'subcategories.view', 'subcategories.create', 'subcategories.edit', 'subcategories.update', 'subcategories.delete',
        'brands.view', 'brands.create', 'brands.edit', 'brands.update', 'brands.delete',
        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
        'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
        'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
        'orders.cancel', 'orders.update_status',
        'inventory.view', 'inventory.manage', 'inventory.adjust',
        'stock.view', 'stock.update',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
        'purchases.receive', 'purchases.cancel',
        'payments.view', 'payments.manage',
        'reports.view', 'reports.sales', 'reports.inventory',
        'reports.purchase', 'reports.customer', 'reports.orders', 'reports.products',
        'reports.suppliers', 'reports.expenses', 'reports.profit_loss', 'reports.refunds',
        'reports.returns', 'reports.cash_flow',
        // Coupons
        'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
        // Reviews
        'reviews.view', 'reviews.create', 'reviews.approve', 'reviews.reject', 'reviews.delete',
        // Returns / Refunds / Exchanges (Phase 11)
        'returns.view', 'returns.create', 'returns.approve', 'returns.reject', 'returns.complete',
        'returns.receive', 'returns.inspect',
        'refunds.view', 'refunds.process', 'refunds.verify',
        'exchanges.view', 'exchanges.approve', 'exchanges.process',
        // Expenses
        'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
        // Accounting / Finance (Phase 12)
        'finance.view', 'finance.reports', 'transactions.view',
        // Dashboard (Phase 13A)
        'dashboard.view',
        // Settings
        'settings.view', 'settings.update',
        // Audit Log (Phase 13D)
        'audit_logs.view',
        // Invoices & Sales (Phase 9)
        'invoices.view', 'invoices.download', 'sales.view',
        // Customer-facing: wishlist & cart
        'wishlist.view', 'wishlist.create',
        'cart.view', 'cart.create',
    ];

    private const ROLE_PERMISSIONS = [
        'Admin' => [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'permissions.view', 'permissions.manage',
            'products.view', 'products.create', 'products.edit', 'products.update', 'products.delete',
            'categories.view', 'categories.create', 'categories.edit', 'categories.update', 'categories.delete',
            'subcategories.view', 'subcategories.create', 'subcategories.edit', 'subcategories.update', 'subcategories.delete',
            'brands.view', 'brands.create', 'brands.edit', 'brands.update', 'brands.delete',
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
            'orders.cancel', 'orders.update_status',
            'inventory.view', 'inventory.manage', 'inventory.adjust', 'stock.view', 'stock.update',
            'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
            'purchases.receive', 'purchases.cancel',
            'payments.view', 'payments.manage',
            'reports.view', 'reports.sales', 'reports.inventory',
            'reports.purchase', 'reports.customer', 'reports.orders', 'reports.products',
            'reports.suppliers', 'reports.expenses', 'reports.profit_loss', 'reports.refunds',
            'reports.returns', 'reports.cash_flow',
            'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
            'reviews.view', 'reviews.approve', 'reviews.reject', 'reviews.delete',
            'returns.view', 'returns.approve', 'returns.reject', 'returns.complete',
            'returns.receive', 'returns.inspect',
            'refunds.view', 'refunds.process', 'refunds.verify',
            'exchanges.view', 'exchanges.approve', 'exchanges.process',
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
            'finance.view', 'finance.reports', 'transactions.view',
            'dashboard.view',
            'settings.view', 'settings.update',
            'audit_logs.view',
            'invoices.view', 'invoices.download', 'sales.view',
        ],
        'Manager' => [
            'products.view', 'categories.view', 'brands.view',
            'customers.view', 'suppliers.view',
            'orders.view', 'orders.update_status',
            'inventory.view', 'stock.view',
            'purchases.view', 'payments.view',
            'reports.view', 'reports.sales', 'reports.inventory',
            'reports.purchase', 'reports.customer', 'reports.orders', 'reports.products',
            'reports.suppliers', 'reports.expenses', 'reports.profit_loss', 'reports.refunds',
            'reports.returns', 'reports.cash_flow',
            'invoices.view', 'sales.view',
            'returns.view', 'refunds.view', 'exchanges.view',
            'finance.view', 'dashboard.view',
        ],
        'Sales Staff' => [
            'products.view', 'categories.view', 'brands.view',
            'customers.view', 'customers.create', 'customers.edit',
            'orders.view', 'orders.create', 'orders.edit', 'orders.update_status',
            'payments.view', 'invoices.view',
        ],
        'Inventory Staff' => [
            'products.view', 'products.create', 'products.edit', 'products.update',
            'categories.view', 'categories.create', 'categories.edit', 'categories.update',
            'subcategories.view', 'subcategories.create', 'subcategories.edit', 'subcategories.update',
            'brands.view', 'brands.create', 'brands.edit', 'brands.update',
            'suppliers.view', 'suppliers.create', 'suppliers.edit',
            'inventory.view', 'inventory.manage', 'inventory.adjust', 'stock.view', 'stock.update',
            'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.receive',
        ],
        'Customer' => [
            'products.view', 'categories.view', 'brands.view',
            'orders.create', 'orders.view', 'orders.cancel',
            'payments.view',
            'invoices.view', 'invoices.download',
            'wishlist.view', 'wishlist.create',
            'cart.view', 'cart.create',
            'reviews.create',
            'returns.create',
        ],
    ];

    private const OBSOLETE_ROLE_MAP = [
        'staff' => 'Customer',
        'admin' => 'Admin',
        'manager' => 'Manager',
        'Sales Manager' => 'Sales Staff',
        'Inventory Manager' => 'Inventory Staff',
    ];

    public function run(): void
    {
        DB::transaction(function () {
            foreach (self::ROLES as $roleName) {
                Role::firstOrCreate(['name' => $roleName, 'guard_name' => self::GUARD]);
            }

            $this->migrateObsoleteRoles();

            foreach (self::PERMISSIONS as $permissionName) {
                Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => self::GUARD]);
            }

            $this->pruneObsoletePermissions();

            Role::findByName('Super Admin', self::GUARD)
                ->syncPermissions(Permission::where('guard_name', self::GUARD)->get());

            foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
                Role::findByName($roleName, self::GUARD)->syncPermissions($permissions);
            }

            $superAdmin = User::firstOrCreate(
                ['email' => 'admin@fashionmart.test'],
                ['name' => 'FashionMart Admin', 'password' => Hash::make('password')]
            );

            if (! $superAdmin->hasRole('Super Admin')) {
                $superAdmin->syncRoles(['Super Admin']);
            }
        });
    }

    private function migrateObsoleteRoles(): void
    {
        foreach (self::OBSOLETE_ROLE_MAP as $obsoleteName => $replacementName) {
            $obsoleteRole = Role::where('guard_name', self::GUARD)
                ->get()
                ->first(fn ($r) => $r->name === $obsoleteName);

            if (! $obsoleteRole) {
                continue;
            }

            $affectedUsers = User::role($obsoleteRole)->get();

            foreach ($affectedUsers as $user) {
                $user->removeRole($obsoleteRole);
                $user->assignRole($replacementName);
            }

            $stillAssigned = DB::table(config('permission.table_names.model_has_roles'))
                ->where('role_id', $obsoleteRole->id)
                ->exists();

            if (! $stillAssigned) {
                $obsoleteRole->delete();
            }
        }
    }

    private function pruneObsoletePermissions(): void
    {
        Permission::where('guard_name', self::GUARD)
            ->whereNotIn('name', self::PERMISSIONS)
            ->get()
            ->each(fn (Permission $permission) => $permission->delete());
    }
}