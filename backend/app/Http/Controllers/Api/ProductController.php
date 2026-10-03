<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\AuditAction;
use App\Services\AuditLogService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    private const SORTABLE = [
        'latest' => ['created_at', 'desc'],
        'oldest' => ['created_at', 'asc'],
        'price_asc' => ['selling_price', 'asc'],
        'price_desc' => ['selling_price', 'desc'],
        'name_asc' => ['name', 'asc'],
        'name_desc' => ['name', 'desc'],
    ];

    public function __construct(
        private readonly ProductService $products,
        private readonly AuditLogService $auditLog,
    )
    {
    }

    /**
     * GET /api/products
     * Public listing — supports filtering, search, sorting, and pagination.
     * Only `status = active` is returned unless the caller is authenticated
     * and explicitly asks for another status (admin catalog table).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with(['category', 'subcategory', 'brand', 'unit', 'variants', 'images'])
            ->when($request->filled('category'), fn ($q) => $q->whereHas('category', fn ($c) => $c->where('slug', $request->string('category'))))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->filled('subcategory'), fn ($q) => $q->whereHas('subcategory', fn ($c) => $c->where('slug', $request->string('subcategory'))))
            ->when($request->filled('subcategory_id'), fn ($q) => $q->where('subcategory_id', $request->subcategory_id))
            ->when($request->filled('brand'), fn ($q) => $q->whereHas('brand', fn ($c) => $c->where('slug', $request->string('brand'))))
            ->when($request->filled('brand_id'), fn ($q) => $q->where('brand_id', $request->brand_id))
            ->when($request->filled('min_price'), fn ($q) => $q->where('selling_price', '>=', $request->min_price))
            ->when($request->filled('max_price'), fn ($q) => $q->where('selling_price', '<=', $request->max_price))
            ->when($request->filled('size'), fn ($q) => $q->whereHas('variants', fn ($v) => $v->where('size', $request->string('size'))))
            ->when($request->filled('color'), fn ($q) => $q->whereHas('variants', fn ($v) => $v->where('color', $request->string('color'))))
            ->when($request->boolean('featured'), fn ($q) => $q->where('featured', true))
            ->when($request->boolean('new_arrival'), fn ($q) => $q->where('new_arrival', true))
            ->when($request->boolean('best_seller'), fn ($q) => $q->where('best_seller', true))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhereHas('brand', fn ($b) => $b->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%{$search}%"));
                });
            });

        // Public storefront only ever sees active products.
        if (! $request->user() || ! $request->filled('status')) {
            $query->where('status', true);
        } elseif ($request->filled('status')) {
            $query->where('status', $request->boolean('status'));
        }

        [$column, $direction] = self::SORTABLE[$request->input('sort')] ?? self::SORTABLE['latest'];
        $query->orderBy($column, $direction);

        $perPage = min((int) $request->input('per_page', 12), 48);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Products fetched successfully',
            'data' => ProductResource::collection($products->items()),
            'meta' => $this->paginationMeta($products),
        ]);
    }

    /**
     * GET /api/products/{slug}
     * Looks up by slug (falls back to numeric id for admin/back-office use).
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $query = Product::query()->with(['category', 'subcategory', 'brand', 'unit', 'variants', 'images']);

        $product = is_numeric($slug)
            ? $query->find($slug)
            : $query->where('slug', $slug)->first();

        if (! $product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        if (! $product->status && ! $request->user()) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product fetched successfully',
            'data' => new ProductResource($product),
        ]);
    }

    /**
     * POST /api/products
     * Protected by permission:products.create
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['images'] = $request->file('images', []);

        $product = $this->products->create($data, $request->user()?->id);
        $product->load(['category', 'subcategory', 'brand', 'unit', 'variants', 'images']);

        $this->auditLog->log(
            $request->user(),
            AuditAction::PRODUCT_CREATED,
            'Product',
            $product->id,
            newData: $product->only(['name', 'sku', 'purchase_price', 'selling_price', 'status']),
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => new ProductResource($product),
        ], 201);
    }

    /**
     * PUT/PATCH /api/products/{product}
     * Protected by permission:products.update
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $before = $product->only(['name', 'sku', 'purchase_price', 'selling_price', 'status']);

        $data = $request->validated();
        $data['images'] = $request->file('images', []);

        $product = $this->products->update($product, $data, $request->user()?->id);
        $product->load(['category', 'subcategory', 'brand', 'unit', 'variants', 'images']);

        $this->auditLog->log(
            $request->user(),
            AuditAction::PRODUCT_UPDATED,
            'Product',
            $product->id,
            oldData: $before,
            newData: $product->only(['name', 'sku', 'purchase_price', 'selling_price', 'status']),
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => new ProductResource($product),
        ]);
    }

    /**
     * DELETE /api/products/{product}
     * Protected by permission:products.delete
     * Soft delete only — order/inventory history must remain intact.
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $before = $product->only(['name', 'sku', 'purchase_price', 'selling_price', 'status']);
        $productId = $product->id;

        $product->delete();

        $this->auditLog->log($request->user(), AuditAction::PRODUCT_DELETED, 'Product', $productId, oldData: $before, request: $request);

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }

    /**
     * POST /api/products/{product}/duplicate
     * Protected by permission:products.create
     */
    public function duplicate(Request $request, Product $product): JsonResponse
    {
        $copy = $this->products->duplicate($product, $request->user()?->id);
        $copy->load(['category', 'subcategory', 'brand', 'unit', 'variants', 'images']);

        return response()->json([
            'success' => true,
            'message' => 'Product duplicated successfully',
            'data' => new ProductResource($copy),
        ], 201);
    }

    /**
     * PATCH /api/products/{product}/status
     * Protected by permission:products.update
     */
    public function updateStatus(Request $request, Product $product): JsonResponse
    {
        $request->validate(['status' => ['required', 'boolean']]);

        $product->update(['status' => $request->boolean('status'), 'updated_by' => $request->user()?->id]);

        return response()->json([
            'success' => true,
            'message' => 'Product status updated successfully',
            'data' => new ProductResource($product->fresh()),
        ]);
    }

    /**
     * DELETE /api/products/{product}/images/{image}
     * Protected by permission:products.update
     */
    public function deleteImage(Product $product, int $image): JsonResponse
    {
        $this->products->deleteImage($product, $image);

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully',
        ]);
    }

    private function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
