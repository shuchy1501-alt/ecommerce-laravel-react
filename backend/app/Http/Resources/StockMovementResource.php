<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_id' => $this->variant_id,
            'product_name' => $this->whenLoaded('product', fn () => $this->product?->name),
            'sku' => $this->whenLoaded('variant', fn () => $this->variant?->sku),
            'type' => $this->type,
            'quantity' => (int) $this->quantity,
            'stock_in' => $this->quantity > 0 ? (int) $this->quantity : null,
            'stock_out' => $this->quantity < 0 ? (int) abs($this->quantity) : null,
            'previous_stock' => (int) $this->previous_stock,
            'new_stock' => (int) $this->new_stock,
            'reference_type' => $this->reference_type ? class_basename($this->reference_type) : null,
            'reference_id' => $this->reference_id,
            'note' => $this->note,
            'created_by' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'created_at' => $this->created_at,
        ];
    }
}
