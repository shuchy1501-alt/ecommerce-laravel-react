<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'new_password' => [
                'required',
                'string',
                'confirmed',
                Password::defaults(),
                'different:current_password',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'new_password.different' => 'New password must not be the same as your current password.',
        ];
    }
}
