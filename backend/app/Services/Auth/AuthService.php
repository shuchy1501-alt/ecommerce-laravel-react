<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Notifications\NotificationType;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Keeps auth business logic out of the controller so it stays testable
 * and reusable (e.g. by an eventual CLI seeder/admin-invite flow).
 *
 * Authentication strategy (Phase 1 correction): Sanctum personal access
 * tokens only, returned as a Bearer token. No cookie/stateful SPA session
 * is used — see bootstrap/app.php and config/sanctum.php.
 */
class AuthService
{
    public function __construct(private readonly NotificationService $notificationService) {}

    /**
     * Public self-registration always creates a "Customer" account.
     * The role is never accepted from the request — it is hard-coded here
     * so a caller can never elevate themselves by sending a "role" field.
     */
    public function register(array $data): User
    {
        $user = DB::transaction(function () use ($data) {
            /** @var User $user */
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            $user->assignRole('Customer');

            return $user;
        });

        $this->notificationService->notifyAdmins(
            NotificationType::CUSTOMER_NEW,
            'New Customer',
            "{$user->name} just created an account.",
            ['user_id' => $user->id]
        );

        return $user;
    }

    /**
     * @return array{0: User, 1: string} the authenticated user and a plain-text Bearer token
     */
    public function attemptLogin(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated. Contact an administrator.'],
            ]);
        }

        $token = $user->createToken('fashionmart-api')->plainTextToken;

        return [$user, $token];
    }

    /** Revokes only the token used to authenticate the current request — not all of the user's tokens. */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}
