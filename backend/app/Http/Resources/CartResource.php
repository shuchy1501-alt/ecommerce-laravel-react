<?php

namespace App\Http\Resources;

use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Cart */
class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totals = app(CartService::class)->computeTotals($this->resource);

        return [
            'id' => $this->id,
            'items' => CartItemResource::collection($this->items),
            'item_count' => $this->items->count(),
            'total_quantity' => (int) $this->items->sum('quantity'),
            'subtotal' => $totals['subtotal'],
            'discount' => $totals['discount'],
            'shipping' => $totals['shipping'],
            'tax' => $totals['tax'],
            'total' => $totals['grandTotal'],
            'coupon' => $this->coupon ? [
                'code' => $this->coupon->code,
                'name' => $this->coupon->name,
                'discount_type' => $this->coupon->discount_type,
                'discount_value' => (float) $this->coupon->discount_value,
            ] : null,
            'shipping_method' => $this->shippingMethod ? [
                'id' => $this->shippingMethod->id,
                'name' => $this->shippingMethod->name,
                'price' => (float) $this->shippingMethod->price,
                'estimated_days' => $this->shippingMethod->estimated_days,
            ] : null,
            'address_id' => $this->customer_address_id,
        ];
    }
}
