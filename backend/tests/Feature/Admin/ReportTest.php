<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Phase 13B report endpoints. No model factories exist yet for
 * Product/ProductVariant/Order/OrderItem/Customer/Sale in this project,
 * so fixtures here are built with plain Model::create() calls against the
 * real schema instead of Model::factory().
 */
class ReportTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(array $permissions = []): User
    {
        $role = Role::firstOrCreate(['name' => 'Report Tester', 'guard_name' => 'web']);

        foreach ($permissions as $permission) {
            $perm = Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
            $role->givePermissionTo($perm);
        }

        $user = User::factory()->create();
        $user->assignRole($role);

        Sanctum::actingAs($user);

        return $user;
    }

    private function makeProduct(array $overrides = []): Product
    {
        $category = Category::create(['name' => 'T-Shirts', 'slug' => 'tshirts-'.uniqid(), 'status' => true]);
        $unit = Unit::create(['name' => 'Piece', 'short_name' => 'pc', 'status' => true]);

        return Product::create(array_merge([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => 'Test Product',
            'slug' => 'test-product-'.uniqid(),
            'sku' => 'SKU-'.uniqid(),
            'purchase_price' => 300,
            'selling_price' => 500,
            'status' => true,
        ], $overrides));
    }

    private function makeCustomer(array $overrides = []): Customer
    {
        return Customer::create(array_merge([
            'name' => 'Jane Customer',
            'email' => 'jane+'.uniqid().'@example.com',
            'status' => true,
        ], $overrides));
    }

    private function makeOrder(Customer $customer, array $overrides = []): Order
    {
        return Order::create(array_merge([
            'customer_id' => $customer->id,
            'order_number' => 'ORD-'.uniqid(),
            'order_date' => now()->toDateString(),
            'subtotal' => 1000,
            'discount' => 100,
            'tax' => 50,
            'shipping_charge' => 60,
            'total' => 1010,
            'payment_status' => 'paid',
            'order_status' => 'delivered',
            'shipping_name' => 'Jane Customer',
            'shipping_phone' => '01700000000',
            'shipping_address' => 'Test address',
            'shipping_division' => 'Dhaka',
            'shipping_district' => 'Dhaka',
            'shipping_area' => 'Gulshan',
        ], $overrides));
    }

    // ------------------------------------------------------------------
    // Authorization
    // ------------------------------------------------------------------

    public function test_reports_index_requires_permission(): void
    {
        $this->actingAdmin([]);

        $this->getJson('/api/admin/reports')->assertStatus(403);
    }

    public function test_reports_index_lists_catalog_for_authorized_user(): void
    {
        $this->actingAdmin(['reports.view']);

        $this->getJson('/api/admin/reports')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(12, 'data');
    }

    public function test_sales_report_requires_specific_permission_not_just_reports_view(): void
    {
        $this->actingAdmin(['reports.view']);

        $this->getJson('/api/admin/reports/sales')->assertStatus(403);
    }

    public function test_export_rejects_unknown_report_type(): void
    {
        $this->actingAdmin(['reports.view']);

        $this->getJson('/api/admin/reports/not-a-report/export')->assertStatus(403);
    }

    // ------------------------------------------------------------------
    // Sales report
    // ------------------------------------------------------------------

    public function test_sales_report_returns_summary_and_paginated_rows(): void
    {
        $this->actingAdmin(['reports.sales']);

        $customer = $this->makeCustomer();
        $order = $this->makeOrder($customer);
        Sale::create([
            'order_id' => $order->id,
            'customer_id' => $customer->id,
            'subtotal' => 1000,
            'discount' => 100,
            'shipping' => 60,
            'tax' => 50,
            'total' => 1010,
            'payment_status' => 'paid',
            'sale_date' => now()->toDateString(),
        ]);

        $response = $this->getJson('/api/admin/reports/sales')->assertOk();

        $response->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data',
                'meta' => ['summary', 'current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertEquals(1000.0, (float) $response->json('meta.summary.grossSales'));
    }

    public function test_csv_export_streams_with_correct_content_type(): void
    {
        $this->actingAdmin(['reports.sales']);

        $response = $this->get('/api/admin/reports/sales/export?format=csv');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
    }

    public function test_pdf_export_returns_graceful_error_when_dompdf_not_installed(): void
    {
        $this->actingAdmin(['reports.sales']);

        $response = $this->getJson('/api/admin/reports/sales/export?format=pdf');

        // Either succeeds (if barryvdh/laravel-dompdf is installed) or fails
        // gracefully with a 501 + clear message — never a raw crash.
        $this->assertTrue(in_array($response->getStatusCode(), [200, 501], true));
    }

    // ------------------------------------------------------------------
    // Inventory report — must read the same product_variants.stock column
    // InventoryService already treats as the single source of truth.
    // ------------------------------------------------------------------

    public function test_inventory_report_reads_the_same_stock_source_as_inventory_service(): void
    {
        $this->actingAdmin(['reports.inventory']);

        $product = $this->makeProduct();
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'VAR-'.uniqid(),
            'stock' => 5,
            'minimum_stock' => 10,
            'purchase_price' => 100,
            'selling_price' => 200,
            'status' => true,
        ]);

        $response = $this->getJson('/api/admin/reports/inventory')->assertOk();

        $row = collect($response->json('data'))->firstWhere('id', $variant->id);
        $this->assertNotNull($row);
        $this->assertEquals(5, $row['stock']);
        $this->assertGreaterThanOrEqual(1, $response->json('meta.summary.low_stock_items'));
    }

    // ------------------------------------------------------------------
    // Product report — sold quantity/revenue must come from order_items,
    // not be recomputed independently.
    // ------------------------------------------------------------------

    public function test_product_report_aggregates_sold_quantity_and_revenue_from_order_items(): void
    {
        $this->actingAdmin(['reports.products']);

        $product = $this->makeProduct();
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'VAR-'.uniqid(),
            'stock' => 20,
            'purchase_price' => 300,
            'selling_price' => 500,
            'status' => true,
        ]);
        $customer = $this->makeCustomer();
        $order = $this->makeOrder($customer);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'product_name' => $product->name,
            'sku' => $variant->sku,
            'quantity' => 2,
            'unit_price' => 500,
            'cost_price' => 250, // historical snapshot, deliberately different from the variant's current purchase_price (300)
            'subtotal' => 1000,
        ]);

        $response = $this->getJson('/api/admin/reports/products')->assertOk();

        $row = collect($response->json('data'))->firstWhere('id', $product->id);
        $this->assertNotNull($row);
        $this->assertEquals(2, (int) $row['sold_quantity']);
        $this->assertEquals(1000.0, (float) $row['revenue']);
    }

    // ------------------------------------------------------------------
    // Customer report — private data isolation.
    // ------------------------------------------------------------------

    public function test_customer_report_aggregates_totals_per_customer(): void
    {
        $this->actingAdmin(['reports.customer']);

        $customerA = $this->makeCustomer(['name' => 'Customer A']);
        $customerB = $this->makeCustomer(['name' => 'Customer B']);
        $this->makeOrder($customerA, ['total' => 500]);
        $this->makeOrder($customerA, ['total' => 700]);
        $this->makeOrder($customerB, ['total' => 200]);

        $response = $this->getJson('/api/admin/reports/customers')->assertOk();

        $rowA = collect($response->json('data'))->firstWhere('id', $customerA->id);
        $rowB = collect($response->json('data'))->firstWhere('id', $customerB->id);

        $this->assertEquals(2, (int) $rowA['total_orders']);
        $this->assertEquals(1200.0, (float) $rowA['total_spent']);
        $this->assertEquals(1, (int) $rowB['total_orders']);
    }
}
