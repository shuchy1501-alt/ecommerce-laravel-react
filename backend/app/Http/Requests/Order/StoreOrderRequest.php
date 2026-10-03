<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // The order itself is built entirely from the customer's Cart
            // (Phase 8) — address, shipping method, coupon, items, and every
            // price were already selected/validated there. The frontend only
            // ever tells us HOW they're paying and (optionally) a client-
            // generated idempotency key to guard against a double submit.
            'payment_method' => ['required', 'in:cod,bkash,nagad,card,bank'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ];
    }
}
