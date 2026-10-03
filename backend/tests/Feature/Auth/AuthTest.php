<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['Super Admin', 'Admin', 'Sales Manager', 'Inventory Manager', 'Customer'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    // 1 & 2 — registration succeeds and grants the Customer role
    public function test_customer_registration_succeeds_and_assigns_customer_role(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()->assertJsonPath('data.email', 'jane@example.com');

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);

        $user = User::where('email', 'jane@example.com')->first();
        $this->assertTrue($user->hasRole('Customer'));
        $this->assertFalse($user->hasRole('staff'), 'obsolete "staff" role must never be assigned');
    }

    public function test_registration_requires_valid_data(): void
    {
        $response = $this->postJson('/api/auth/register', ['email' => 'not-an-email']);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    // 3-6 — a role field sent by the client is always ignored; the account is always Customer
    public function test_public_registration_cannot_create_privileged_roles(): void
    {
        foreach (['Admin', 'Super Admin', 'Sales Manager', 'Inventory Manager'] as $requestedRole) {
            $email = strtolower(str_replace(' ', '.', $requestedRole)).'@example.com';

            $response = $this->postJson('/api/auth/register', [
                'name' => 'Test User',
                'email' => $email,
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
                'role' => $requestedRole,
            ]);

            $response->assertCreated();

            $user = User::where('email', $email)->first();
            $this->assertTrue($user->hasRole('Customer'));
            $this->assertFalse($user->hasRole($requestedRole), "registration must not honor a requested '{$requestedRole}' role");
        }
    }

    // 7 — login returns a Sanctum Bearer token
    public function test_login_returns_bearer_token(): void
    {
        $user = User::factory()->create(['password' => bcrypt('secret123')]);
        $user->assignRole('Customer');

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonStructure(['data' => ['user', 'token', 'token_type']]);
    }

    public function test_login_fails_with_incorrect_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('secret123')]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)->assertJsonPath('code', 'VALIDATION_ERROR');
    }

    // 8 — /me works with a valid Bearer token
    public function test_me_works_with_valid_bearer_token(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Customer');
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/auth/me');

        $response->assertOk()->assertJsonPath('data.user.email', $user->email);
    }

    // 9 — /me fails without a token
    public function test_me_fails_without_token(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401)->assertJsonPath('code', 'UNAUTHENTICATED');
    }

    // 10 — /me fails with an invalid token
    public function test_me_fails_with_invalid_token(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer not-a-real-token')->getJson('/api/auth/me');

        $response->assertStatus(401)->assertJsonPath('code', 'UNAUTHENTICATED');
    }

    // 11 & 12 — logout revokes only the current token, which then stops working
    public function test_logout_revokes_current_token_and_it_stops_working(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Customer');
        $token = $user->createToken('test')->plainTextToken;

        $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/auth/logout');
        $logoutResponse->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Sanctum's guard is a RequestGuard, which caches the resolved user
        // on the guard *instance* (see Illuminate\Auth\RequestGuard::user()).
        // In real traffic this is a non-issue — every incoming HTTP request
        // boots a brand-new application container, so the guard is never
        // reused across requests. But within a single PHPUnit test method,
        // Laravel's test harness reuses the same container across multiple
        // simulated calls, so without this the previous request's cached
        // guard would still hand back the pre-logout user even though the
        // token row is already gone. Forgetting the cached guards here
        // makes the second call re-resolve auth from scratch, exactly as a
        // fresh real request would.
        $this->app['auth']->forgetGuards();

        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/auth/me');
        $meResponse->assertStatus(401);
    }

    public function test_logout_does_not_revoke_other_tokens(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Customer');
        $tokenA = $user->createToken('device-a')->plainTextToken;
        $tokenB = $user->createToken('device-b')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$tokenA}")->postJson('/api/auth/logout')->assertOk();

        $this->withHeader('Authorization', "Bearer {$tokenB}")->getJson('/api/auth/me')->assertOk();
    }

    // 13 — inactive user cannot log in
    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('secret123'),
            'is_active' => false,
        ]);
        $user->assignRole('Customer');

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertStatus(422)->assertJsonPath('code', 'VALIDATION_ERROR');
        $this->assertGuest();
    }

    // 14 — password is never returned
    public function test_password_is_never_returned_in_responses(): void
    {
        $user = User::factory()->create(['password' => bcrypt('secret123')]);
        $user->assignRole('Customer');

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);
        $login->assertOk()->assertJsonMissingPath('data.user.password');

        $me = $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken)
            ->getJson('/api/auth/me');
        $me->assertOk()->assertJsonMissingPath('data.user.password');
    }

    // 15 — no obsolete "staff" role is ever assigned during registration
    public function test_no_obsolete_staff_role_is_assigned_during_registration(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'No Staff Here',
            'email' => 'nostaff@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $user = User::where('email', 'nostaff@example.com')->first();
        $this->assertFalse($user->hasRole('staff'));
        $this->assertTrue($user->hasRole('Customer'));
    }
}