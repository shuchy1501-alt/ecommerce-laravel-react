<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CartItem */
class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;
        $variant = $this->variant;
        $stock = $variant ? $variant->stock : 0;
        $available = $product && ! $product->trashed() && $product->status
            && (! $this->variant_id || ($variant && ! $variant->trashed() && $variant->status));

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_id' => $this->variant_id,
            'name' => $product?->name ?? 'Unavailable product',
            'sku' => $variant?->sku ?? $product?->sku,
            'slug' => $product?->slug,
            'brand' => $product?->relationLoaded('brand') && $product->brand ? $product->brand->name : null,
            'image' => $product?->relationLoaded('images') && $product->images->isNotEmpty()
                ? asset('storage/' . $product->images->sortBy('sort_order')->first()->image)
                : null,
            'size' => $variant?->size,
            'color' => $variant?->color,
            'unit_price' => (float) $this->unit_price,
            'quantity' => $this->quantity,
            'stock' => $stock,
            'subtotal' => (float) $this->subtotal,
            'available' => $available,
            'deleted' => ! $product || $product->trashed(),
        ];
    }
}
