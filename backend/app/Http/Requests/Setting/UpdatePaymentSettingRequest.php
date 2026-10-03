<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cod_enabled' => ['sometimes', 'boolean'],
            'cod_instructions' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'online_enabled' => ['sometimes', 'boolean'],
            'online_gateway' => ['sometimes', 'nullable', 'string', 'max:100'],
            // Secret fields: write-only. Validated if present, but never
            // returned by the API (see SettingService::SECRET_KEYS).
            'online_api_key' => ['sometimes', 'nullable', 'string', 'max:500'],
            'online_api_secret' => ['sometimes', 'nullable', 'string', 'max:500'],
            'online_private_key' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'online_gateway_secret' => ['sometimes', 'nullable', 'string', 'max:500'],
            'online_merchant_secret' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
