<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WishlistItem */
class WishlistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_id' => $this->variant_id,
            'added_at' => $this->created_at?->toIso8601String(),
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'selling_price' => $product->selling_price,
                'final_price' => $product->final_price,
                'discount_type' => $product->discount_type,
                'discount_value' => $product->discount_value,
                'status' => (bool) $product->status,
                'stock_status' => $product->stock_status,
                'brand' => $product->relationLoaded('brand') && $product->brand
                    ? ['id' => $product->brand->id, 'name' => $product->brand->name]
                    : null,
                'image' => $product->relationLoaded('images') && $product->images->isNotEmpty()
                    ? asset('storage/' . $product->images->sortBy('sort_order')->first()->image)
                    : null,
                'deleted' => (bool) $product->trashed(),
            ] : null,
        ];
    }
}
