<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShippingSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'default_charge' => ['sometimes', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'areas' => ['sometimes', 'array'],
            'areas.*' => ['string', 'max:255'],
            'charge_by_area' => ['sometimes', 'array'],
            'charge_by_area.*' => ['numeric', 'min:0'],
        ];
    }
}
