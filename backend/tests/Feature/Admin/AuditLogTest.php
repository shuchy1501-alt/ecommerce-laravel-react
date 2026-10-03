<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Unit;
use App\Models\User;
use App\Services\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    private function actingUser(array $permissions = []): User
    {
        $role = Role::firstOrCreate(['name' => 'Audit Tester', 'guard_name' => 'web']);

        foreach ($permissions as $permission) {
            $perm = Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
            $role->givePermissionTo($perm);
        }

        $user = User::factory()->create();
        $user->assignRole($role);

        Sanctum::actingAs($user);

        return $user;
    }

    public function test_audit_log_index_requires_permission(): void
    {
        $this->actingUser([]);

        $this->getJson('/api/admin/audit-logs')->assertStatus(403);
    }

    public function test_audit_log_index_requires_authentication(): void
    {
        $this->getJson('/api/admin/audit-logs')->assertStatus(401);
    }

    public function test_login_creates_an_audit_log_entry(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => AuditAction::LOGIN,
        ]);
    }

    public function test_creating_a_product_writes_an_audit_log_with_old_and_new_data(): void
    {
        $admin = $this->actingUser(['products.create', 'products.view', 'audit_logs.view']);
        $category = Category::create(['name' => 'Cat', 'slug' => 'cat-'.uniqid(), 'status' => true]);
        $unit = Unit::create(['name' => 'Piece', 'short_name' => 'pc', 'status' => true]);

        $response = $this->postJson('/api/products', [
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => 'Audit Test Shirt',
            'sku' => 'AUD-001',
            'purchase_price' => 200,
            'selling_price' => 400,
            'status' => true,
        ]);

        $response->assertCreated();

        $log = AuditLog::where('action', AuditAction::PRODUCT_CREATED)->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, $log->user_id);
        $this->assertSame('Audit Test Shirt', $log->new_data['name']);
    }

    public function test_settings_update_writes_an_audit_log_and_redacts_secrets(): void
    {
        $this->actingUser(['settings.view', 'settings.update']);

        $this->postJson('/api/admin/settings/payment', [
            'online_enabled' => true,
            'online_api_secret' => 'sk_live_super_secret_value',
        ])->assertOk();

        $log = AuditLog::where('action', AuditAction::SETTINGS_UPDATED)->latest('id')->first();

        $this->assertNotNull($log);
        $this->assertSame('payment', $log->new_data['section']);
        // The real secret must never land in the audit trail...
        $this->assertSame('[REDACTED]', $log->new_data['online_api_secret']);
        $body = $this->getJson('/api/admin/audit-logs')->getContent();
        $this->assertStringNotContainsString('sk_live_super_secret_value', $body);
    }

    public function test_audit_logs_are_read_only_no_update_or_delete_route_exists(): void
    {
        $this->actingUser(['audit_logs.view']);
        $log = AuditLog::create(['action' => 'test.action']);

        // No PUT/PATCH/DELETE route is registered for audit logs at all —
        // Laravel correctly reports 405 (method not allowed on this URI)
        // rather than silently accepting a mutation.
        $this->putJson("/api/admin/audit-logs/{$log->id}", ['action' => 'tampered'])->assertStatus(405);
        $this->deleteJson("/api/admin/audit-logs/{$log->id}")->assertStatus(405);
    }
}
