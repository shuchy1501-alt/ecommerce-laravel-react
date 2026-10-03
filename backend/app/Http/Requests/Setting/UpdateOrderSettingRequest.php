<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number_prefix' => ['sometimes', 'string', 'max:10', 'alpha_num'],
            'minimum_amount' => ['sometimes', 'numeric', 'min:0'],
            'cancellation_window_hours' => ['sometimes', 'integer', 'min:0', 'max:720'],
            'auto_confirm' => ['sometimes', 'boolean'],
            'notify_on_new_order' => ['sometimes', 'boolean'],
        ];
    }
}
