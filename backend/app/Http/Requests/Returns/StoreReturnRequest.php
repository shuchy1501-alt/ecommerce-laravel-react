<?php

namespace App\Http\Requests\Returns;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Handles both POST /api/orders/{order}/returns (type=return|refund) and
 * POST /api/orders/{order}/exchange (type=exchange) — the payload shape is
 * identical; only `type` and whether `exchange_variant_id` is required differs.
 */
class StoreReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isExchange = $this->input('type') === 'exchange';

        return [
            'type' => ['required', 'in:return,exchange,refund'],
            'reason' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.reason' => ['nullable', 'string', 'max:255'],
            'items.*.exchange_variant_id' => [$isExchange ? 'required' : 'nullable', 'integer'],
        ];
    }
}
