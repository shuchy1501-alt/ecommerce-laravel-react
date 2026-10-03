<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductVariant\StoreProductVariantRequest;
use App\Http\Requests\ProductVariant\UpdateProductVariantRequest;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    public function __construct(private readonly ProductService $products)
    {
    }

    /**
     * GET /api/products/{product}/variants
     */
    public function index(Product $product): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Variants fetched successfully',
            'data' => ProductVariantResource::collection($product->variants),
        ]);
    }

    /**
     * POST /api/products/{product}/variants
     * Protected by permission:products.update
     */
    public function store(StoreProductVariantRequest $request, Product $product): JsonResponse
    {
        $variant = $this->products->createVariant($product, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Variant created successfully',
            'data' => new ProductVariantResource($variant),
        ], 201);
    }

    /**
     * PUT/PATCH /api/products/{product}/variants/{variant}
     * Protected by permission:products.update
     */
    public function update(UpdateProductVariantRequest $request, Product $product, ProductVariant $variant): JsonResponse
    {
        $variant->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Variant updated successfully',
            'data' => new ProductVariantResource($variant->fresh()),
        ]);
    }

    /**
     * DELETE /api/products/{product}/variants/{variant}
     * Protected by permission:products.update
     */
    public function destroy(Product $product, ProductVariant $variant): JsonResponse
    {
        $variant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Variant deleted successfully',
        ]);
    }

    /**
     * POST /api/products/{product}/variants/generate
     * Given sizes[] and colors[], returns every combination pre-filled with
     * suggested SKUs, skipping combinations that already exist. Does not
     * persist anything — the admin reviews/edits, then saves via store/sync.
     * Protected by permission:products.update
     */
    public function generate(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'sizes' => ['required', 'array', 'min:1'],
            'sizes.*' => ['string', 'max:50'],
            'colors' => ['required', 'array', 'min:1'],
            'colors.*' => ['string', 'max:50'],
        ]);

        $existing = $product->variants()
            ->get(['size', 'color'])
            ->map(fn ($v) => "{$v->size}|{$v->color}")
            ->flip();

        $combinations = [];

        foreach ($request->input('colors') as $color) {
            foreach ($request->input('sizes') as $size) {
                if (isset($existing["{$size}|{$color}"])) {
                    continue;
                }

                $combinations[] = [
                    'size' => $size,
                    'color' => $color,
                    'sku' => $this->products->generateVariantSku($product, $color, $size),
                    'purchase_price' => (float) $product->purchase_price,
                    'selling_price' => (float) $product->selling_price,
                    'stock' => 0,
                    'minimum_stock' => 0,
                    'status' => true,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Variant combinations generated successfully',
            'data' => $combinations,
        ]);
    }
}
