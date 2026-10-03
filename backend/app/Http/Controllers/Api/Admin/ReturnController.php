<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Returns\ApproveReturnRequest;
use App\Http\Requests\Returns\InspectReturnRequest;
use App\Http\Requests\Returns\ReceiveReturnRequest;
use App\Http\Requests\Returns\RejectReturnRequest;
use App\Http\Requests\Returns\UpdateReturnStatusRequest;
use App\Http\Resources\ReturnResource;
use App\Models\ReturnRequest as ReturnRequestModel;
use App\Services\ReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Admin after-sales management (spec sections 14-20, 57-59). */
class ReturnController extends Controller
{
    public function __construct(
        private readonly ReturnService $returnService,
    ) {}

    /** GET /api/admin/returns */
    public function index(Request $request): JsonResponse
    {
        $query = ReturnRequestModel::with(['order', 'user', 'items'])
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('requested_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('requested_at', '<=', $request->date_to))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                $q->where(function ($sub) use ($search) {
                    $sub->where('return_number', 'like', "%{$search}%")
                        ->orWhereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$search}%"))
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
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

    /** GET /api/admin/returns/{return} */
    public function show(ReturnRequestModel $return): JsonResponse
    {
        $return->load([
            'order.items', 'user', 'items.orderItem', 'items.variant', 'items.exchangeVariant',
            'refunds.processedBy', 'exchange.replacementVariant', 'exchange.originalVariant',
            'statusHistories.changedBy',
        ]);

        return $this->success(new ReturnResource($return), 'Return fetched successfully');
    }

    /** PATCH /api/admin/returns/{return}/approve */
    public function approve(ApproveReturnRequest $request, ReturnRequestModel $return): JsonResponse
    {
        $updated = $this->returnService->approveReturn($return, $request->user(), $request->validated('note'));

        return $this->success(new ReturnResource($updated), 'Return approved');
    }

    /** PATCH /api/admin/returns/{return}/reject */
    public function reject(RejectReturnRequest $request, ReturnRequestModel $return): JsonResponse
    {
        $updated = $this->returnService->rejectReturn($return, $request->user(), $request->validated('reason'));

        return $this->success(new ReturnResource($updated), 'Return rejected');
    }

    /** PATCH /api/admin/returns/{return}/status — logistics-only transitions. */
    public function updateStatus(UpdateReturnStatusRequest $request, ReturnRequestModel $return): JsonResponse
    {
        $updated = $this->returnService->updateLogisticsStatus($return, $request->validated('status'), $request->user(), $request->validated('note'));

        return $this->success(new ReturnResource($updated), 'Return status updated');
    }

    /** POST /api/admin/returns/{return}/receive */
    public function receive(ReceiveReturnRequest $request, ReturnRequestModel $return): JsonResponse
    {
        $updated = $this->returnService->receiveReturn($return, $request->user(), $request->validated('note'));

        return $this->success(new ReturnResource($updated), 'Return marked as received');
    }

    /** POST /api/admin/returns/{return}/inspect */
    public function inspect(InspectReturnRequest $request, ReturnRequestModel $return): JsonResponse
    {
        $data = $request->validated();

        $updated = $this->returnService->inspectReturn($return, $request->user(), $data['inspections'], $data['note'] ?? null);

        return $this->success(
            new ReturnResource($updated->load(['items', 'refunds', 'exchange'])),
            'Return inspected'
        );
    }
}
