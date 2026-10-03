<?php

namespace App\Http\Requests\Returns;

use Illuminate\Foundation\Http\FormRequest;

class InspectReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inspections' => ['required', 'array', 'min:1'],
            'inspections.*.return_item_id' => ['required', 'integer'],
            'inspections.*.condition' => ['required', 'in:new,opened,damaged,defective,wrong_item'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
