<?php

namespace App\Http\Requests\Returns;

use Illuminate\Foundation\Http\FormRequest;

class RejectReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Section 16: rejection always requires a stated reason.
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
