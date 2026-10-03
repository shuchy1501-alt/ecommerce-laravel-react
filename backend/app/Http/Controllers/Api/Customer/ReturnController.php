<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Returns\CancelReturnRequest;
use App\Http\Requests\Returns\StoreReturnRequest;
use App\Http\Resources\ReturnResource;
use App\Models\Order;
use App\Models\ReturnRequest as ReturnRequestModel;
use App\Services\ReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer-facing return/exchange/refund requests (spec sections 8, 9, 42,
 * 44, 60). Every query is scoped to the authenticated user — a customer
 * can never view or act on another customer's return by guessing an id.
 */
class ReturnController extends Controller
{
    public function __construct(
        private readonly ReturnService $returnService,
    ) {}

    /** GET /api/returns */
    public function index(Request $request): JsonResponse
    {
        $query = ReturnRequestModel::with(['order', 'items.orderItem'])
            ->where('user_id', $request->user()->id)
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->latest();

        $perPage = min((int) $request->input('per_page', 20), 100);
        $returns = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Returns fetched successfully',
            'data' => ReturnResource::collection($returns->items()),
            'meta' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'per_page' => $returns->perPage(),
                'total' => $returns->total(),
            ],
        ]);
    }

    /** GET /api/returns/{return} */
    public function show(Request $request, ReturnRequestModel $return): JsonResponse
    {
        if ($return->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to view this return.', 403, null, 'FORBIDDEN');
        }

        $return->load(['order', 'items.orderItem', 'items.variant', 'items.exchangeVariant', 'refunds', 'exchange.replacementVariant', 'exchange.originalVariant', 'statusHistories.changedBy']);

        return $this->success(new ReturnResource($return), 'Return fetched successfully');
    }

    /** POST /api/orders/{order}/returns — type: return | refund */
    public function store(StoreReturnRequest $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to return items from this order.', 403, null, 'FORBIDDEN');
        }

        $data = $request->validated();

        $return = $this->returnService->createReturn(
            $order,
            $request->user(),
            $data['type'],
            $data['reason'],
            $data['description'] ?? null,
            $data['items']
        );

        return $this->success(
            new ReturnResource($return->load(['items.orderItem', 'items.exchangeVariant', 'exchange'])),
            'Return request submitted successfully',
            201
        );
    }

    /** POST /api/returns/{return}/cancel */
    public function cancel(CancelReturnRequest $request, ReturnRequestModel $return): JsonResponse
    {
        if ($return->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to cancel this return.', 403, null, 'FORBIDDEN');
        }

        $updated = $this->returnService->cancelReturn($return, $request->user(), $request->validated('reason'));

        return $this->success(new ReturnResource($updated), 'Return request cancelled');
    }
}
