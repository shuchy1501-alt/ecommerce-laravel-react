<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Unit;
use App\Models\User;
use App\Notifications\NotificationType;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InventoryAndAuthNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function makeVariant(int $stock, int $minimumStock): ProductVariant
    {
        $category = Category::create(['name' => 'T-Shirts', 'slug' => 'tshirts-'.uniqid(), 'status' => true]);
        $unit = Unit::create(['name' => 'Piece', 'short_name' => 'pc', 'status' => true]);

        $product = Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => 'Test Product',
            'slug' => 'test-product-'.uniqid(),
            'sku' => 'SKU-'.uniqid(),
            'purchase_price' => 300,
            'selling_price' => 500,
            'status' => true,
        ]);

        return ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'VAR-'.uniqid(),
            'stock' => $stock,
            'minimum_stock' => $minimumStock,
            'status' => true,
        ]);
    }

    private function makeAdmin(): User
    {
        Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Customer', 'guard_name' => 'web']);
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        return $admin;
    }

    public function test_admins_are_notified_when_stock_crosses_the_low_stock_threshold(): void
    {
        $admin = $this->makeAdmin();
        $variant = $this->makeVariant(stock: 10, minimumStock: 5);

        app(InventoryService::class)->decreaseStock($variant->id, 6, 'sale');

        $this->assertSame(1, $admin->notifications()->where('data->type', NotificationType::STOCK_LOW)->count());
    }

    public function test_admins_are_notified_once_stock_reaches_zero(): void
    {
        $admin = $this->makeAdmin();
        $variant = $this->makeVariant(stock: 3, minimumStock: 5);

        app(InventoryService::class)->decreaseStock($variant->id, 3, 'sale');

        $this->assertSame(1, $admin->notifications()->where('data->type', NotificationType::STOCK_OUT)->count());
    }

    public function test_admins_are_not_re_notified_for_a_sale_that_stays_below_threshold(): void
    {
        $admin = $this->makeAdmin();
        $variant = $this->makeVariant(stock: 4, minimumStock: 5); // already low

        app(InventoryService::class)->decreaseStock($variant->id, 1, 'sale');

        // Was already <= minimum_stock before this sale, so no new alert.
        $this->assertSame(0, $admin->notifications()->where('data->type', NotificationType::STOCK_LOW)->count());
    }

    public function test_admins_are_notified_of_new_customer_registration(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Customer',
            'email' => 'newcustomer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated();
        $this->assertSame(1, $admin->notifications()->where('data->type', NotificationType::CUSTOMER_NEW)->count());
    }
}
