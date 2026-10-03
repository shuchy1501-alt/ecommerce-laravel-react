<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReturnSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'return_window_days' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'exchange_window_days' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'refund_policy' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'conditions' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'non_returnable_rules' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
