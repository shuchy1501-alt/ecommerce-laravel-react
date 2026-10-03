<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ReturnItem */
class ReturnItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_item_id' => $this->order_item_id,
            'product_id' => $this->product_id,
            'product_name' => $this->whenLoaded('orderItem', fn () => $this->orderItem?->product_name),
            'variant_id' => $this->variant_id,
            'size' => $this->whenLoaded('variant', fn () => $this->variant?->size),
            'color' => $this->whenLoaded('variant', fn () => $this->variant?->color),
            'quantity' => $this->quantity,
            'reason' => $this->reason,
            'condition' => $this->condition,
            'refund_amount' => $this->refund_amount !== null ? (float) $this->refund_amount : null,
            'exchange_variant_id' => $this->exchange_variant_id,
            'exchange_variant' => $this->whenLoaded('exchangeVariant', fn () => $this->exchangeVariant ? [
                'id' => $this->exchangeVariant->id,
                'sku' => $this->exchangeVariant->sku,
                'size' => $this->exchangeVariant->size,
                'color' => $this->exchangeVariant->color,
            ] : null),
        ];
    }
}
