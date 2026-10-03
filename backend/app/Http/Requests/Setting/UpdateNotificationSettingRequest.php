<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'admin_enabled' => ['sometimes', 'boolean'],
            'customer_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
