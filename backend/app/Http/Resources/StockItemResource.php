<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'variant_id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'category' => $this->product?->category?->name,
            'brand' => $this->product?->brand?->name,
            'sku' => $this->sku,
            'size' => $this->size,
            'color' => $this->color,
            'cost_price' => (float) $this->purchase_price,
            'selling_price' => (float) $this->selling_price,
            'stock' => (int) $this->stock,
            'minimum_stock' => (int) $this->minimum_stock,
            'stock_status' => $this->stock_status,
            'inventory_value' => round(((float) $this->purchase_price) * $this->stock, 2),
            'status' => (bool) $this->status,
            'updated_at' => $this->updated_at,
        ];
    }
}
