<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService) {}

    /**
     * POST /api/payments/initialize
     * Returns the current (or a fresh) payment attempt's gateway data for an
     * order the customer owns.
     */
    public function initialize(Request $request): JsonResponse
    {
        $data = $request->validate(['order_id' => ['required', 'integer', 'exists:orders,id']]);
        $order = Order::findOrFail($data['order_id']);

        if ($order->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to pay for this order.', 403, null, 'FORBIDDEN');
        }

        $payment = $order->payments()->latest()->first();

        if (! $payment || $payment->status === 'failed') {
            $payment = $this->paymentService->retryPayment($order);
        }

        return $this->success(new PaymentResource($payment), 'Payment initialized.');
    }

    /**
     * POST /api/payments/verify
     * Customer-initiated verification (e.g. the sandbox "I've paid" step).
     */
    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'transaction_id' => ['required', 'string'],
            'signature' => ['nullable', 'string'],
        ]);

        $payment = Payment::where('transaction_id', $data['transaction_id'])->firstOrFail();

        if ($payment->order->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to verify this payment.', 403, null, 'FORBIDDEN');
        }

        $updated = $this->paymentService->verifyPayment($payment, [
            'order_id' => $payment->order_id,
            'signature' => $data['signature'] ?? null,
        ]);

        return $this->success(new PaymentResource($updated), $updated->status === 'paid' ? 'Payment verified.' : 'Payment could not be verified.');
    }

    /**
     * POST /api/payments/callback
     * Server-to-server style callback — deliberately not behind auth:sanctum
     * (a real gateway calling back has no customer session), authenticity
     * comes from the gateway's own signature check inside verify().
     */
    public function callback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'transaction_id' => ['required', 'string'],
            'signature' => ['nullable', 'string'],
            'order_id' => ['nullable', 'integer'],
        ]);

        $payment = $this->paymentService->handleCallback($data['transaction_id'], $data);

        return $this->success(new PaymentResource($payment), 'Callback processed.');
    }

    /**
     * POST /api/payments/{id}/retry
     * Starts a brand-new attempt; the failed payment record is left intact.
     */
    public function retry(Request $request, int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);
        $order = $payment->order;

        if ($order->user_id !== $request->user()->id) {
            return $this->error('You do not have permission to retry this payment.', 403, null, 'FORBIDDEN');
        }

        if ($order->payment_status === 'paid') {
            return $this->error('This order has already been paid.', 422, null, 'ALREADY_PAID');
        }

        $newPayment = $this->paymentService->retryPayment($order);

        return $this->success(new PaymentResource($newPayment), 'New payment attempt created.');
    }
}
