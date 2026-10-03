<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StockAdjustmentRequest;
use App\Http\Resources\PurchaseResource;
use App\Http\Resources\StockItemResource;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    public function __construct(private readonly InventoryService $inventoryService) {}

    /**
     * GET /api/admin/inventory — dashboard overview (spec sections 3-4, 62).
     */
    public function overview(): JsonResponse
    {
        $variants = ProductVariant::query();

        $totalStockUnits = (clone $variants)->sum('stock');
        $inventoryValue = (clone $variants)->selectRaw('COALESCE(SUM(stock * purchase_price), 0) as value')->value('value');
        $lowStockCount = (clone $variants)->lowStock()->count();
        $outOfStockCount = (clone $variants)->outOfStock()->count();

        return response()->json([
            'success' => true,
            'message' => 'Inventory overview fetched successfully',
            'data' => [
                'total_products' => Product::count(),
                'total_variants' => ProductVariant::count(),
                'total_stock_units' => (int) $totalStockUnits,
                'low_stock_items' => $lowStockCount,
                'out_of_stock_items' => $outOfStockCount,
                'total_inventory_value' => round((float) $inventoryValue, 2),
                'recent_purchases' => PurchaseResource::collection(
                    Purchase::with(['supplier', 'creator'])->withCount('items')->orderByDesc('created_at')->limit(5)->get()
                ),
                'recent_stock_movements' => StockMovementResource::collection(
                    StockMovement::with(['product', 'variant', 'creator'])->orderByDesc('created_at')->limit(10)->get()
                ),
            ],
        ]);
    }

    /**
     * GET /api/admin/inventory/stock — stock list (spec sections 6-8).
     */
    public function stock(Request $request): JsonResponse
    {
        $query = ProductVariant::query()
            ->with(['product.category', 'product.brand'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where(function ($q2) use ($search) {
                    $q2->where('sku', 'like', "%{$search}%")
                        ->orWhere('size', 'like', "%{$search}%")
                        ->orWhere('color', 'like', "%{$search}%")
                        ->orWhereHas('product', fn ($q3) => $q3->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('category_id'), fn ($q) => $q->whereHas('product', fn ($q2) => $q2->where('category_id', $request->input('category_id'))))
            ->when($request->filled('brand_id'), fn ($q) => $q->whereHas('product', fn ($q2) => $q2->where('brand_id', $request->input('brand_id'))))
            ->when($request->filled('size'), fn ($q) => $q->where('size', $request->input('size')))
            ->when($request->filled('color'), fn ($q) => $q->where('color', $request->input('color')))
            ->when($request->filled('stock_status'), function ($q) use ($request) {
                match ($request->input('stock_status')) {
                    'in_stock' => $q->whereColumn('stock', '>', 'minimum_stock'),
                    'low_stock' => $q->lowStock(),
                    'out_of_stock' => $q->outOfStock(),
                    default => null,
                };
            })
            ->orderBy($request->input('sort_by', 'updated_at'), $request->input('sort_dir', 'desc'));

        $perPage = min((int) $request->input('per_page', 20), 100);
        $variants = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Stock fetched successfully',
            'data' => StockItemResource::collection($variants->items()),
            'meta' => $this->paginationMeta($variants),
        ]);
    }

    /**
     * GET /api/admin/inventory/stock/{variant} — stock detail + history (spec section 9).
     */
    public function stockDetail(ProductVariant $variant, Request $request): JsonResponse
    {
        $variant->load(['product.category', 'product.brand']);

        $history = $this->inventoryService->getMovementHistory($variant->id, min((int) $request->input('per_page', 20), 100));

        return response()->json([
            'success' => true,
            'message' => 'Stock detail fetched successfully',
            'data' => [
                'item' => new StockItemResource($variant),
                'history' => StockMovementResource::collection($history->items()),
                'history_meta' => $this->paginationMeta($history),
            ],
        ]);
    }

    /**
     * GET /api/admin/inventory/movements — global stock movement log.
     */
    public function movements(Request $request): JsonResponse
    {
        $query = StockMovement::query()
            ->with(['product', 'variant', 'creator'])
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->input('product_id')))
            ->when($request->filled('variant_id'), fn ($q) => $q->where('variant_id', $request->input('variant_id')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->input('type')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('date_to')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->whereHas('variant', fn ($q2) => $q2->where('sku', 'like', "%{$search}%"))
                    ->orWhereHas('product', fn ($q2) => $q2->where('name', 'like', "%{$search}%"));
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $perPage = min((int) $request->input('per_page', 20), 100);
        $movements = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Stock movements fetched successfully',
            'data' => StockMovementResource::collection($movements->items()),
            'meta' => $this->paginationMeta($movements),
        ]);
    }

    /**
     * POST /api/admin/inventory/adjustments — manual stock adjustment (spec sections 28-31, 70).
     */
    public function adjust(StockAdjustmentRequest $request): JsonResponse
    {
        try {
            $movement = $this->inventoryService->adjustStock(
                $request->integer('variant_id'),
                $request->input('type'),
                $request->integer('quantity'),
                $request->input('reason'),
                $request->user()?->id,
                $request->input('notes')
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first() ?? 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock adjustment recorded successfully',
            'data' => new StockMovementResource($movement->load(['product', 'variant', 'creator'])),
        ], 201);
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
