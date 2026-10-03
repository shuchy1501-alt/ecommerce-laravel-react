<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Phase 13D security review regression tests. These lock in the two
 * critical data-leak fixes found during the review: internal cost/COGS
 * data must never reach the public storefront or a customer, even though
 * the underlying Product/OrderItem resources are shared with staff-only
 * admin screens.
 */
class SecurityReviewRegressionTest extends TestCase
{
    use RefreshDatabase;

    private function makeProduct(): Product
    {
        $category = Category::create(['name' => 'Cat', 'slug' => 'cat-'.uniqid(), 'status' => true]);
        $unit = Unit::create(['name' => 'Piece', 'short_name' => 'pc', 'status' => true]);

        return Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => 'Public Product',
            'slug' => 'public-product-'.uniqid(),
            'sku' => 'PUB-001',
            'purchase_price' => 199.99,
            'selling_price' => 399.99,
            'status' => true,
        ]);
    }

    public function test_anonymous_visitor_never_sees_purchase_price_on_public_product_listing(): void
    {
        $this->makeProduct();

        $response = $this->getJson('/api/products');

        $response->assertOk();
        $this->assertStringNotContainsString('199.99', $response->getContent());
        $this->assertArrayNotHasKey('purchase_price', $response->json('data.0') ?? []);
    }

    public function test_staff_user_does_see_purchase_price_on_the_same_endpoint(): void
    {
        Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin = User::factory()->create();
        $admin->assignRole('Admin');
        Sanctum::actingAs($admin);

        $this->makeProduct();

        $response = $this->getJson('/api/products');

        $response->assertOk();
        $this->assertSame(199.99, (float) $response->json('data.0.purchase_price'));
    }

    public function test_customer_never_sees_cost_price_on_their_own_order(): void
    {
        Role::firstOrCreate(['name' => 'Customer', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole('Customer');
        $customer = Customer::create(['user_id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'status' => true]);

        $order = Order::create([
            'user_id' => $user->id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD-COST-001',
            'order_date' => now()->toDateString(),
            'subtotal' => 500,
            'total' => 500,
            'payment_status' => 'paid',
            'payment_method' => 'cod',
            'order_status' => 'delivered',
            'shipping_name' => 'Test',
            'shipping_phone' => '01700000000',
            'shipping_address' => 'Addr',
            'shipping_division' => 'Dhaka',
            'shipping_district' => 'Dhaka',
            'shipping_area' => 'Gulshan',
        ]);

        $product = $this->makeProduct();

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => 'Some Shirt',
            'sku' => 'SHI-001',
            'quantity' => 1,
            'unit_price' => 500,
            'cost_price' => 150,
            'subtotal' => 500,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/orders/{$order->id}");

        $response->assertOk();
        $this->assertStringNotContainsString('cost_price', $response->getContent());
        $this->assertStringNotContainsString('"150"', $response->getContent());
    }

    public function test_staff_user_does_see_cost_price_on_the_same_order(): void
    {
        Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $customerUser = User::factory()->create();
        $customer = Customer::create(['user_id' => $customerUser->id, 'name' => $customerUser->name, 'email' => $customerUser->email, 'status' => true]);

        $order = Order::create([
            'user_id' => $customerUser->id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD-COST-002',
            'order_date' => now()->toDateString(),
            'subtotal' => 500,
            'total' => 500,
            'payment_status' => 'paid',
            'payment_method' => 'cod',
            'order_status' => 'delivered',
            'shipping_name' => 'Test',
            'shipping_phone' => '01700000000',
            'shipping_address' => 'Addr',
            'shipping_division' => 'Dhaka',
            'shipping_district' => 'Dhaka',
            'shipping_area' => 'Gulshan',
        ]);

        $product = $this->makeProduct();

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => 'Some Shirt',
            'sku' => 'SHI-001',
            'quantity' => 1,
            'unit_price' => 500,
            'cost_price' => 150,
            'subtotal' => 500,
        ]);

        $admin = User::factory()->create();
        $admin->assignRole('Admin');
        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/orders/{$order->id}");

        $response->assertOk();
        $this->assertSame(150.0, (float) $response->json('data.items.0.cost_price'));
    }
}
