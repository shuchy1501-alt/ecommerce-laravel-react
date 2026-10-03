<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Concerns\GuardsStaffOnlyFields;

class ProductResource extends JsonResource
{
    use GuardsStaffOnlyFields;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'description' => $this->description,
            'short_description' => $this->short_description,
            // SECURITY (Phase 13D): purchase_price is the store's internal
            // cost/COGS. This resource is shared by the PUBLIC product
            // listing (GET /api/products, no auth) and the admin catalog
            // table — so the cost must only ever appear for staff, never
            // for anonymous visitors or the Customer role.
            'purchase_price' => $this->when($this->viewerIsStaff($request), $this->purchase_price),
            'selling_price' => $this->selling_price,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'final_price' => $this->final_price,
            'stock_status' => $this->stock_status,
            'status' => (bool) $this->status,
            'featured' => (bool) $this->featured,
            'new_arrival' => (bool) $this->new_arrival,
            'best_seller' => (bool) $this->best_seller,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'subcategory' => $this->whenLoaded('subcategory', fn () => [
                'id' => $this->subcategory->id,
                'name' => $this->subcategory->name,
                'slug' => $this->subcategory->slug,
            ]),
            'brand' => $this->whenLoaded('brand', fn () => [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
            ]),
            'unit' => $this->whenLoaded('unit', fn () => [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
                'short_name' => $this->unit->short_name,
            ]),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'images' => $this->whenLoaded('images', fn () => $this->images
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($img) => [
                    'id' => $img->id,
                    'variant_id' => $img->variant_id,
                    'image' => $img->image,
                    'image_url' => asset('storage/' . $img->image),
                    'is_primary' => (bool) $img->is_primary,
                    'sort_order' => $img->sort_order,
                ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
