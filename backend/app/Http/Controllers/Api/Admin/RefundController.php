<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Refund\ProcessRefundRequest;
use App\Http\Resources\RefundResource;
use App\Models\Refund;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Admin refund management (spec sections 21-30, 41). */
class RefundController extends Controller
{
    public function __construct(
        private readonly RefundService $refundService,
    ) {}

    /** GET /api/admin/refunds */
    public function index(Request $request): JsonResponse
    {
        $query = Refund::with(['order', 'returnRequest'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('refund_method'), fn ($q) => $q->where('refund_method', $request->refund_method))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                $q->where('refund_number', 'like', "%{$search}%")
                    ->orWhereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$search}%"));
            })
            ->latest();

        $perPage = min((int) $request->input('per_page', 20), 100);
        $refunds = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Refunds fetched successfully',
            'data' => RefundResource::collection($refunds->items()),
            'meta' => [
                'current_page' => $refunds->currentPage(),
                'last_page' => $refunds->lastPage(),
                'per_page' => $refunds->perPage(),
                'total' => $refunds->total(),
            ],
        ]);
    }

    /** GET /api/admin/refunds/{refund} */
    public function show(Refund $refund): JsonResponse
    {
        $refund->load(['order', 'returnRequest', 'processedBy']);

        return $this->success(new RefundResource($refund), 'Refund fetched successfully');
    }

    /** POST /api/admin/refunds/{refund}/process */
    public function process(ProcessRefundRequest $request, Refund $refund): JsonResponse
    {
        if ($request->filled('notes')) {
            $refund->update(['notes' => $request->validated('notes')]);
        }

        $updated = $this->refundService->processRefund($refund, $request->user());

        return $this->success(new RefundResource($updated->load(['order', 'returnRequest'])), 'Refund processed');
    }

    /** POST /api/admin/refunds/{refund}/verify */
    public function verify(Refund $refund): JsonResponse
    {
        $verified = $this->refundService->verifyRefund($refund);

        return $this->success(new RefundResource($verified), 'Refund status verified');
    }
}
