<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exchange\UpdateExchangeStatusRequest;
use App\Http\Resources\ExchangeResource;
use App\Models\Exchange;
use App\Services\ExchangeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Admin exchange fulfillment (spec sections 31-34, 44). */
class ExchangeController extends Controller
{
    public function __construct(
        private readonly ExchangeService $exchangeService,
    ) {}

    /** GET /api/admin/exchanges */
    public function index(Request $request): JsonResponse
    {
        $query = Exchange::with(['returnRequest.order', 'returnRequest.user', 'originalVariant', 'replacementVariant'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
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

    /** GET /api/admin/exchanges/{exchange} */
    public function show(Exchange $exchange): JsonResponse
    {
        $exchange->load(['returnRequest.order', 'returnRequest.user', 'originalVariant', 'replacementVariant']);

        return $this->success(new ExchangeResource($exchange), 'Exchange fetched successfully');
    }

    /** PATCH /api/admin/exchanges/{exchange}/status */
    public function updateStatus(UpdateExchangeStatusRequest $request, Exchange $exchange): JsonResponse
    {
        $status = $request->validated('status');
        $admin = $request->user();

        $updated = match ($status) {
            'approved' => $this->exchangeService->approveExchange($exchange, $admin),
            'processing' => $this->exchangeService->processExchange($exchange, $admin),
            'shipped' => $this->exchangeService->markShipped($exchange, $admin),
            'completed' => $this->exchangeService->completeExchange($exchange, $admin),
            'cancelled' => $this->exchangeService->cancelExchange($exchange),
            default => throw ValidationException::withMessages(['status' => ['Unsupported exchange status.']]),
        };

        return $this->success(new ExchangeResource($updated), 'Exchange status updated');
    }
}
