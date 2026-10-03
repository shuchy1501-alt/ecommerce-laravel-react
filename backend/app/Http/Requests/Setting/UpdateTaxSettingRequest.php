<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaxSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enabled' => ['sometimes', 'boolean'],
            'percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'display' => ['sometimes', 'string', 'in:inclusive,exclusive'],
        ];
    }
}
