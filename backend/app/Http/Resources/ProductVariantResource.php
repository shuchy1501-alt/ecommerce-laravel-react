<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Concerns\GuardsStaffOnlyFields;

class ProductVariantResource extends JsonResource
{
    use GuardsStaffOnlyFields;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'sku' => $this->sku,
            'size' => $this->size,
            'color' => $this->color,
            // SECURITY (Phase 13D): see ProductResource — same resource is
            // used on the public product page, so cost must stay staff-only.
            'purchase_price' => $this->when($this->viewerIsStaff($request), $this->purchase_price),
            'selling_price' => $this->selling_price,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'stock' => $this->stock,
            'minimum_stock' => $this->minimum_stock,
            'status' => (bool) $this->status,
            'final_price' => $this->final_price,
            'stock_status' => $this->stock_status,
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
        ];
    }
}
