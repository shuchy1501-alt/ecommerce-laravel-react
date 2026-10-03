<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CancelOrderRequest;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Http\Requests\Order\UpdatePaymentStatusRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\InvoiceService;
use App\Services\OrderCancellationService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly InvoiceService $invoiceService,
        private readonly OrderCancellationService $cancellationService,
    ) {}

    private function authorizeOwnership(Request $request, Order $order): ?JsonResponse
    {
        if ($request->user()->hasRole('Customer') && $order->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to view this order.', 403, null, 'FORBIDDEN');
        }

        return null;
    }

    /**
     * GET /api/orders
     * Staff see all orders (optionally filtered); customers see only their own.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->with(['customer']);

        // Customers can only ever see their own orders — enforced server-side.
        if ($request->user()->hasRole('Customer')) {
            $query->where('user_id', $request->user()->id);
        }

        $query
            ->when($request->filled('order_status'), fn ($q) => $q->where('order_status', $request->order_status))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', $request->payment_status))
            ->when($request->filled('payment_method'), fn ($q) => $q->where('payment_method', $request->payment_method))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('order_date', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('order_date', '<=', $request->date('date_to')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where(function ($sub) use ($search) {
                    $sub->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"))
                        ->orWhereHas('payments', fn ($p) => $p->where('transaction_id', 'like', "%{$search}%"));
                });
            })
            ->latest();

        $perPage = min((int) $request->input('per_page', 20), 100);
        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Orders fetched successfully',
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * GET /api/orders/{order}
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        if ($response = $this->authorizeOwnership($request, $order)) {
            return $response;
        }

        $order->load(['customer', 'items.product', 'payments', 'refunds', 'invoice', 'statusHistories.changedBy']);

        return $this->success(new OrderResource($order), 'Order fetched successfully');
    }

    /**
     * POST /api/orders
     * Built entirely from the customer's cart — see OrderService::createOrder.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createOrder(
                $request->user(),
                $request->validated('payment_method'),
                $request->validated('idempotency_key')
            );
        } catch (ValidationException $e) {
            throw $e;
        }

        $order->load(['customer', 'items', 'payments', 'invoice']);

        return $this->success(new OrderResource($order), 'Order placed successfully', 201);
    }

    /**
     * PATCH /api/orders/{order}/status — staff only (permission:orders.update_status)
     */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $updated = $this->orderService->updateStatus(
            $order,
            $request->validated('order_status'),
            $request->user()->id,
            $request->validated('notes')
        );

        return $this->success(new OrderResource($updated->load(['items', 'payments'])), 'Order status updated successfully');
    }

    /**
     * PATCH /api/orders/{order}/payment-status — staff only (permission:payments.manage)
     */
    public function updatePaymentStatus(UpdatePaymentStatusRequest $request, Order $order): JsonResponse
    {
        $updated = $this->orderService->updatePaymentStatus(
            $order,
            $request->validated('payment_status'),
            $request->user()->id
        );

        return $this->success(new OrderResource($updated), 'Payment status updated successfully');
    }

    /**
     * POST /api/orders/{order}/cancel
     */
    public function cancel(CancelOrderRequest $request, Order $order): JsonResponse
    {
        if ($response = $this->authorizeOwnership($request, $order)) {
            return $response;
        }

        $updated = $this->cancellationService->cancelOrder($order, $request->user(), $request->validated('reason'));

        return $this->success(new OrderResource($updated->load(['items', 'payments', 'refunds'])), 'Order cancelled successfully');
    }

    /**
     * GET /api/orders/{order}/invoice
     */
    public function invoice(Request $request, Order $order): JsonResponse
    {
        if ($response = $this->authorizeOwnership($request, $order)) {
            return $response;
        }

        $invoice = $this->invoiceService->getInvoice($order);

        if (! $invoice) {
            return $this->error('Invoice not available for this order yet.', 404, null, 'NOT_FOUND');
        }

        // Accessing $order->invoice above cached an 'invoice' relation on
        // $order itself. Left in place, embedding this same $order inside
        // InvoiceResource would make OrderResource re-embed that cached
        // invoice, which re-embeds this same order, forever — an infinite
        // resource cycle that blows the JSON encoder's stack depth.
        $order->unsetRelation('invoice');
        $order->load(['customer', 'items']);

        return $this->success(new InvoiceResource($invoice->setRelation('order', $order)), 'Invoice retrieved.');
    }
}
