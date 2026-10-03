<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    private function actingUser(array $permissions = []): User
    {
        $role = Role::firstOrCreate(['name' => 'Search Tester', 'guard_name' => 'web']);

        foreach ($permissions as $permission) {
            $perm = Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
            $role->givePermissionTo($perm);
        }

        $user = User::factory()->create();
        $user->assignRole($role);

        Sanctum::actingAs($user);

        return $user;
    }

    private function makeProduct(string $name, string $sku): Product
    {
        $category = Category::create(['name' => 'Cat-'.uniqid(), 'slug' => 'cat-'.uniqid(), 'status' => true]);
        $unit = Unit::create(['name' => 'Piece', 'short_name' => 'pc', 'status' => true]);

        return Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => $name,
            'slug' => 'slug-'.uniqid(),
            'sku' => $sku,
            'purchase_price' => 300,
            'selling_price' => 500,
            'status' => true,
        ]);
    }

    public function test_search_requires_authentication(): void
    {
        $this->getJson('/api/admin/search?q=denim')->assertStatus(401);
    }

    public function test_search_requires_a_minimum_query_length(): void
    {
        $this->actingUser(['products.view']);

        $this->getJson('/api/admin/search?q=a')->assertStatus(422);
    }

    public function test_search_finds_products_by_name_and_sku(): void
    {
        $this->actingUser(['products.view']);
        $this->makeProduct('Denim Jacket', 'DEN-001');
        $this->makeProduct('Cotton Shirt', 'COT-002');

        $response = $this->getJson('/api/admin/search?q=denim');

        $response->assertOk()
            ->assertJsonPath('data.products.results.0.title', 'Denim Jacket')
            ->assertJsonPath('data.products.results.0.path', function ($path) {
                return str_contains($path, '/admin/products/');
            });

        $this->assertArrayNotHasKey('customers', $response->json('data'));
    }

    public function test_search_is_permission_aware_and_omits_categories_without_permission(): void
    {
        // Only products.view — no customers/orders/sales/suppliers/purchases permission.
        $this->actingUser(['products.view']);
        $this->makeProduct('Denim Jacket', 'DEN-001');
        Customer::create(['name' => 'Denim Customer', 'email' => 'denim@example.com', 'status' => true]);

        $response = $this->getJson('/api/admin/search?q=denim');

        $response->assertOk();
        $this->assertArrayHasKey('products', $response->json('data'));
        $this->assertArrayNotHasKey('customers', $response->json('data'));
    }

    public function test_search_with_no_permissions_returns_empty_result_set_not_an_error(): void
    {
        $this->actingUser([]);
        $this->makeProduct('Denim Jacket', 'DEN-001');

        $response = $this->getJson('/api/admin/search?q=denim');

        $response->assertOk()->assertJsonPath('data', []);
    }

    public function test_search_finds_customers_by_name_email_phone(): void
    {
        $this->actingUser(['customers.view']);
        Customer::create(['name' => 'Rahim Uddin', 'email' => 'rahim@example.com', 'phone' => '01711112222', 'status' => true]);
        Customer::create(['name' => 'Karim Ahmed', 'email' => 'karim@example.com', 'status' => true]);

        $response = $this->getJson('/api/admin/search?q=Rahim');

        $response->assertOk()->assertJsonPath('data.customers.results.0.title', 'Rahim Uddin');
    }

    public function test_search_finds_orders_by_order_number(): void
    {
        $this->actingUser(['orders.view']);
        $customer = Customer::create(['name' => 'Jane', 'email' => 'jane@example.com', 'status' => true]);
        Order::create([
            'customer_id' => $customer->id,
            'order_number' => 'ORD-SEARCHME-1',
            'order_date' => now()->toDateString(),
            'subtotal' => 500,
            'total' => 500,
            'payment_status' => 'paid',
            'order_status' => 'delivered',
            'shipping_name' => 'Jane',
            'shipping_phone' => '01700000000',
            'shipping_address' => 'Addr',
            'shipping_division' => 'Dhaka',
            'shipping_district' => 'Dhaka',
            'shipping_area' => 'Gulshan',
        ]);

        $response = $this->getJson('/api/admin/search?q=SEARCHME');

        $response->assertOk()->assertJsonPath('data.orders.results.0.title', 'ORD-SEARCHME-1');
    }

    public function test_search_finds_suppliers_by_name(): void
    {
        $this->actingUser(['suppliers.view']);
        Supplier::create(['name' => 'Acme Textiles', 'status' => true]);

        $response = $this->getJson('/api/admin/search?q=Acme');

        $response->assertOk()->assertJsonPath('data.suppliers.results.0.title', 'Acme Textiles');
    }

    public function test_single_type_search_is_paginated(): void
    {
        $this->actingUser(['products.view']);
        for ($i = 1; $i <= 8; $i++) {
            $this->makeProduct("Denim Jacket {$i}", "DEN-{$i}");
        }

        $response = $this->getJson('/api/admin/search/products?q=denim&per_page=5');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 8);
    }

    public function test_single_type_search_rejects_unauthorized_category(): void
    {
        $this->actingUser(['products.view']); // no suppliers.view

        $this->getJson('/api/admin/search/suppliers?q=acme')->assertStatus(403);
    }

    public function test_single_type_search_rejects_unknown_type(): void
    {
        $this->actingUser(['products.view']);

        $this->getJson('/api/admin/search/not-a-real-type?q=acme')->assertStatus(403);
    }
}
