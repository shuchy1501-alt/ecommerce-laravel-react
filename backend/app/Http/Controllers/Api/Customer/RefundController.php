<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\RefundResource;
use App\Models\Refund;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Customer-facing refund history (spec sections 40, 43, 60). */
class RefundController extends Controller
{
    /** GET /api/refunds */
    public function index(Request $request): JsonResponse
    {
        $query = Refund::with(['order', 'returnRequest'])
            ->where('order_id', function ($q) use ($request) {
                $q->select('id')->from('orders')->where('user_id', $request->user()->id);
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
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

    /** GET /api/refunds/{refund} */
    public function show(Request $request, Refund $refund): JsonResponse
    {
        $refund->load(['order', 'returnRequest']);

        if ($refund->order->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to view this refund.', 403, null, 'FORBIDDEN');
        }

        return $this->success(new RefundResource($refund), 'Refund fetched successfully');
    }
}
