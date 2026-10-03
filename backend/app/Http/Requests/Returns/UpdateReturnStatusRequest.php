<?php

namespace App\Http\Requests\Returns;

use Illuminate\Foundation\Http\FormRequest;

/** Generic logistics-only transitions: pickup_scheduled, in_transit (section 14/68). */
class UpdateReturnStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:pickup_scheduled,in_transit'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
