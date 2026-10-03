<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Http\Resources\PurchaseResource;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Services\SupplierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function __construct(private readonly SupplierService $supplierService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query()
            ->withCount('purchases')
            ->search($request->string('search')->toString() ?: null)
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->orderBy($request->input('sort_by', 'name'), $request->input('sort_dir', 'asc'));

        $perPage = min((int) $request->input('per_page', 15), 100);
        $suppliers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Suppliers fetched successfully',
            'data' => SupplierResource::collection($suppliers->items()),
            'meta' => $this->paginationMeta($suppliers),
        ]);
    }

    public function active(): JsonResponse
    {
        $suppliers = Supplier::active()->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Active suppliers fetched successfully',
            'data' => SupplierResource::collection($suppliers),
        ]);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        $supplier->loadCount('purchases');
        $supplier->purchase_summary = $this->supplierService->getPurchaseSummary($supplier);

        $recentPurchases = $supplier->purchases()
            ->withCount('items')
            ->orderByDesc('purchase_date')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Supplier fetched successfully',
            'data' => [
                'supplier' => new SupplierResource($supplier),
                'purchase_history' => PurchaseResource::collection($recentPurchases),
            ],
        ]);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = $this->supplierService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Supplier created successfully',
            'data' => new SupplierResource($supplier),
        ], 201);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $supplier = $this->supplierService->update($supplier, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Supplier updated successfully',
            'data' => new SupplierResource($supplier),
        ]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        try {
            $this->supplierService->delete($supplier);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first() ?? $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Supplier deleted successfully',
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
