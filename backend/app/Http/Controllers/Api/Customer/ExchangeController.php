<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Returns\StoreReturnRequest;
use App\Http\Resources\ExchangeResource;
use App\Http\Resources\ReturnResource;
use App\Models\Exchange;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\ReturnService;

/**
 * Customer-facing exchange requests (spec sections 31, 44). An exchange is
 * always a ReturnRequest with type=exchange under the hood — see
 * ReturnService::createReturn — this controller is a thin, explicitly
 * exchange-flavoured entry point (POST /api/orders/{order}/exchange) plus
 * read endpoints scoped to the Exchange rows themselves.
 */
class ExchangeController extends Controller
{
    public function __construct(
        private readonly ReturnService $returnService,
    ) {}

    /** GET /api/exchanges */
    public function index(Request $request): JsonResponse
    {
        $query = Exchange::with(['returnRequest', 'originalVariant', 'replacementVariant'])
            ->whereHas('returnRequest', fn ($q) => $q->where('user_id', $request->user()->id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->latest();

        $perPage = min((int) $request->input('per_page', 20), 100);
        $exchanges = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Exchanges fetched successfully',
            'data' => ExchangeResource::collection($exchanges->items()),
            'meta' => [
                'current_page' => $exchanges->currentPage(),
                'last_page' => $exchanges->lastPage(),
                'per_page' => $exchanges->perPage(),
                'total' => $exchanges->total(),
            ],
        ]);
    }

    /** GET /api/exchanges/{exchange} */
    public function show(Request $request, Exchange $exchange): JsonResponse
    {
        $exchange->load(['returnRequest', 'originalVariant', 'replacementVariant']);

        if ($exchange->returnRequest->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to view this exchange.', 403, null, 'FORBIDDEN');
        }

        return $this->success(new ExchangeResource($exchange), 'Exchange fetched successfully');
    }

    /** POST /api/orders/{order}/exchange */
    public function store(StoreReturnRequest $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to exchange items from this order.', 403, null, 'FORBIDDEN');
        }

        $data = $request->validated();

        $return = $this->returnService->createReturn(
            $order,
            $request->user(),
            'exchange',
            $data['reason'],
            $data['description'] ?? null,
            $data['items']
        );

        return $this->success(
            new ReturnResource($return->load(['items.orderItem', 'items.exchangeVariant', 'exchange.replacementVariant'])),
            'Exchange request submitted successfully',
            201
        );
    }
}
