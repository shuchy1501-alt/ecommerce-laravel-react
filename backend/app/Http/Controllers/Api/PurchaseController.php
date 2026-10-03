<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\ReceivePurchaseRequest;
use App\Http\Requests\Purchase\StorePurchaseRequest;
use App\Http\Requests\Purchase\UpdatePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Purchase;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PurchaseController extends Controller
{
    public function __construct(private readonly PurchaseService $purchaseService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Purchase::query()
            ->with(['supplier', 'creator'])
            ->withCount('items')
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where(function ($q2) use ($search) {
                    $q2->where('purchase_number', 'like', "%{$search}%")
                        ->orWhereHas('supplier', fn ($q3) => $q3->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('supplier_id'), fn ($q) => $q->where('supplier_id', $request->input('supplier_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('purchase_date', '>=', $request->input('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('purchase_date', '<=', $request->input('date_to')))
            ->orderBy($request->input('sort_by', 'purchase_date'), $request->input('sort_dir', 'desc'));

        $perPage = min((int) $request->input('per_page', 20), 100);
        $purchases = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Purchases fetched successfully',
            'data' => PurchaseResource::collection($purchases->items()),
            'meta' => $this->paginationMeta($purchases),
        ]);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $purchase->load(['supplier', 'items.variant', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Purchase fetched successfully',
            'data' => new PurchaseResource($purchase),
        ]);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        try {
            $purchase = $this->purchaseService->createPurchase($request->validated(), $request->user()?->id);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase created successfully',
            'data' => new PurchaseResource($purchase),
        ], 201);
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        try {
            $purchase = $this->purchaseService->updatePurchase($purchase, $request->validated());
        } catch (ValidationException $e) {
            return $this->validationError($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase updated successfully',
            'data' => new PurchaseResource($purchase),
        ]);
    }

    public function receive(ReceivePurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        try {
            $purchase = $this->purchaseService->receivePurchase($purchase, $request->user()?->id, $request->input('items'));
        } catch (ValidationException $e) {
            return $this->validationError($e);
        }

        return response()->json([
            'success' => true,
            'message' => $purchase->status === 'received' ? 'Purchase fully received. Stock has been updated.' : 'Purchase partially received. Stock has been updated.',
            'data' => new PurchaseResource($purchase),
        ]);
    }

    public function cancel(Purchase $purchase): JsonResponse
    {
        try {
            $purchase = $this->purchaseService->cancelPurchase($purchase);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase cancelled successfully',
            'data' => new PurchaseResource($purchase),
        ]);
    }

    private function validationError(ValidationException $e): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => collect($e->errors())->flatten()->first() ?? 'Validation failed.',
            'errors' => $e->errors(),
        ], 422);
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
