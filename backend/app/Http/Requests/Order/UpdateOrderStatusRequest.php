<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_status' => ['required', 'in:pending,confirmed,processing,packed,shipped,delivered,cancelled'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
