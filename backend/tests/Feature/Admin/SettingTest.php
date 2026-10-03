<?php

namespace Tests\Feature\Admin;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(array $permissions = []): User
    {
        $role = Role::firstOrCreate(['name' => 'Setting Tester', 'guard_name' => 'web']);

        foreach ($permissions as $permission) {
            $perm = Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
            $role->givePermissionTo($perm);
        }

        $user = User::factory()->create();
        $user->assignRole($role);

        Sanctum::actingAs($user);

        return $user;
    }

    public function test_general_settings_default_to_bdt_and_asia_dhaka(): void
    {
        $this->actingAdmin(['settings.view']);

        $response = $this->getJson('/api/admin/settings/general');

        $response->assertOk()
            ->assertJsonPath('data.currency', 'BDT')
            ->assertJsonPath('data.timezone', 'Asia/Dhaka');
    }

    public function test_admin_with_permission_can_update_store_settings(): void
    {
        $this->actingAdmin(['settings.view', 'settings.update']);

        $response = $this->postJson('/api/admin/settings/store', [
            'store_name' => 'FashionMart BD',
            'contact_email' => 'hello@fashionmart.test',
            'facebook' => 'https://facebook.com/fashionmart',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.store_name', 'FashionMart BD')
            ->assertJsonPath('data.contact_email', 'hello@fashionmart.test');

        $this->assertDatabaseHas('settings', ['key' => 'store.store_name', 'value' => 'FashionMart BD']);
    }

    public function test_user_without_permission_cannot_view_settings(): void
    {
        $this->actingAdmin([]);

        $this->getJson('/api/admin/settings/general')->assertStatus(403);
    }

    public function test_user_without_update_permission_cannot_update_settings(): void
    {
        $this->actingAdmin(['settings.view']);

        $response = $this->postJson('/api/admin/settings/general', ['store_name' => 'Hacked']);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('settings', ['key' => 'general.store_name', 'value' => 'Hacked']);
    }

    public function test_guest_cannot_access_settings(): void
    {
        $this->getJson('/api/admin/settings/general')->assertStatus(401);
    }

    public function test_payment_secret_fields_are_never_exposed_in_plain_text(): void
    {
        $this->actingAdmin(['settings.view', 'settings.update']);

        $this->postJson('/api/admin/settings/payment', [
            'online_enabled' => true,
            'online_gateway' => 'stripe',
            'online_api_secret' => 'sk_live_super_secret_value',
            'online_merchant_secret' => 'merchant_secret_value',
        ])->assertOk();

        // Secret is persisted server-side...
        $this->assertDatabaseHas('settings', ['key' => 'payment.online_api_secret', 'value' => 'sk_live_super_secret_value']);

        // ...but never comes back out through the API in plain text.
        $response = $this->getJson('/api/admin/settings/payment');

        $response->assertOk();
        $body = $response->getContent();
        $this->assertStringNotContainsString('sk_live_super_secret_value', $body);
        $this->assertStringNotContainsString('merchant_secret_value', $body);
        $this->assertSame('stripe', $response->json('data.online_gateway'));
    }

    public function test_submitting_an_empty_secret_does_not_clear_an_existing_one(): void
    {
        $this->actingAdmin(['settings.view', 'settings.update']);

        $this->postJson('/api/admin/settings/payment', [
            'online_api_secret' => 'sk_live_original',
        ])->assertOk();

        // Frontend never has the real secret to resend, so it submits null/empty.
        $this->postJson('/api/admin/settings/payment', [
            'online_gateway' => 'stripe',
            'online_api_secret' => null,
        ])->assertOk();

        $this->assertDatabaseHas('settings', ['key' => 'payment.online_api_secret', 'value' => 'sk_live_original']);
    }

    public function test_tax_settings_round_trip(): void
    {
        $this->actingAdmin(['settings.view', 'settings.update']);

        $this->postJson('/api/admin/settings/tax', [
            'enabled' => true,
            'percentage' => 7.5,
            'display' => 'inclusive',
        ])->assertOk();

        $response = $this->getJson('/api/admin/settings/tax');

        $response->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.percentage', 7.5)
            ->assertJsonPath('data.display', 'inclusive');
    }

    public function test_shipping_settings_accept_area_charge_map(): void
    {
        $this->actingAdmin(['settings.view', 'settings.update']);

        $response = $this->postJson('/api/admin/settings/shipping', [
            'default_charge' => 60,
            'free_shipping_threshold' => 2000,
            'areas' => ['Dhaka', 'Chattogram'],
            'charge_by_area' => ['Dhaka' => 60, 'Chattogram' => 120],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.areas', ['Dhaka', 'Chattogram']);
    }

    public function test_index_returns_all_sections(): void
    {
        $this->actingAdmin(['settings.view']);

        $response = $this->getJson('/api/admin/settings');

        $response->assertOk();
        foreach (['general', 'store', 'order', 'payment', 'shipping', 'return', 'tax', 'notification', 'seo'] as $section) {
            $this->assertArrayHasKey($section, $response->json('data'));
        }
    }
}
