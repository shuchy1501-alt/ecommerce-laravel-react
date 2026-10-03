<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_id' => $this->variant_id,
            'product_name' => $this->product_name,
            'sku' => $this->sku,
            'size' => $this->whenLoaded('variant', fn () => $this->variant?->size),
            'color' => $this->whenLoaded('variant', fn () => $this->variant?->color),
            'quantity' => (int) $this->quantity,
            'received_quantity' => (int) $this->received_quantity,
            'unit_cost' => (float) $this->purchase_price,
            'discount' => (float) $this->discount,
            'tax' => (float) $this->tax,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}
