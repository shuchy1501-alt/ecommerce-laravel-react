<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Public self-registration only. The validated() data intentionally has no
 * "role" key — AuthService::register() always assigns "Customer" itself, so
 * even if a client sends a "role" field it is stripped here and never
 * reaches the service layer or the database.
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    /**
     * Defense in depth: explicitly drop any client-supplied "role" (or
     * "roles") field before validation even runs, so it can never leak into
     * validated() regardless of future rule changes. Role assignment for
     * public registration is always server-side (see AuthService::register()).
     */
    protected function prepareForValidation(): void
    {
        $this->request->remove('role');
        $this->request->remove('roles');
    }
}
