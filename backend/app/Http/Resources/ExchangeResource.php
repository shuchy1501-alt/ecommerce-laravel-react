<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Exchange */
class ExchangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'return_id' => $this->return_id,
            'order_id' => $this->order_id,
            'quantity' => $this->quantity,
            'original_variant' => $this->whenLoaded('originalVariant', fn () => $this->originalVariant ? [
                'id' => $this->originalVariant->id,
                'sku' => $this->originalVariant->sku,
                'size' => $this->originalVariant->size,
                'color' => $this->originalVariant->color,
            ] : null),
            'replacement_variant' => $this->whenLoaded('replacementVariant', fn () => $this->replacementVariant ? [
                'id' => $this->replacementVariant->id,
                'sku' => $this->replacementVariant->sku,
                'size' => $this->replacementVariant->size,
                'color' => $this->replacementVariant->color,
                'stock' => $this->replacementVariant->stock,
            ] : null),
            'price_difference' => (float) $this->price_difference,
            'price_difference_action' => $this->price_difference_action,
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
