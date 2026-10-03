<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payments\CodPaymentGateway;
use App\Services\Payments\OnlinePaymentGateway;
use App\Services\Payments\PaymentGatewayInterface;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function gatewayFor(string $paymentMethod): PaymentGatewayInterface
    {
        return $paymentMethod === 'cod'
            ? new CodPaymentGateway()
            : new OnlinePaymentGateway();
    }

    /**
     * Create the payment record for a freshly placed order. COD is created
     * pending (collected on delivery); online payment is created pending
     * and only ever moves to paid via verify()/handleCallback() below.
     */
    public function createPayment(Order $order, string $paymentMethod): Payment
    {
        $gateway = $this->gatewayFor($paymentMethod);
        $result = $gateway->initialize($order);

        return Payment::create([
            'order_id' => $order->id,
            'payment_method' => $paymentMethod,
            'transaction_id' => $result['transaction_id'],
            'gateway' => $result['gateway'],
            'gateway_response' => $result,
            'amount' => $order->total,
            'currency' => 'BDT',
            'status' => 'pending',
        ]);
    }

    /**
     * Verify a payment attempt and, on success, mark it paid + confirm the
     * order. Returns the refreshed Payment. Never marks paid without a
     * gateway-verified result.
     */
    public function verifyPayment(Payment $payment, array $payload = []): Payment
    {
        $gateway = $this->gatewayFor($payment->payment_method);
        $result = $gateway->verify($payment->transaction_id, $payload);

        $payment = DB::transaction(function () use ($payment, $result) {
            $payment->update([
                'status' => $result['success'] ? 'paid' : 'failed',
                'paid_at' => $result['success'] ? now() : null,
                'gateway_response' => array_merge($payment->gateway_response ?? [], ['verification' => $result]),
            ]);

            if ($result['success']) {
                app(OrderService::class)->markOrderPaid($payment->order);
            }

            return $payment->fresh();
        });

        $this->notifyVerificationResult($payment, $result['success']);

        return $payment;
    }

    /**
     * Payment Successful / Payment Failed — sent to admins always, and to
     * the customer only on success (a failed attempt is usually followed
     * by a retry, so we don't alarm the customer on every bounce).
     */
    private function notifyVerificationResult(Payment $payment, bool $success): void
    {
        $order = $payment->order;
        $meta = ['order_id' => $order->id, 'order_number' => $order->order_number, 'payment_id' => $payment->id];

        if ($success) {
            $this->notificationService->notifyAdmins(
                \App\Notifications\NotificationType::PAYMENT_SUCCESSFUL,
                'Payment Successful',
                "Payment received for order #{$order->order_number}.",
                $meta
            );

            $this->notificationService->notifyUser(
                $order->user,
                \App\Notifications\NotificationType::CUSTOMER_PAYMENT_SUCCESSFUL,
                'Payment Successful',
                "Your payment for order #{$order->order_number} was successful.",
                $meta
            );
        } else {
            $this->notificationService->notifyAdmins(
                \App\Notifications\NotificationType::PAYMENT_FAILED,
                'Payment Failed',
                "Payment failed for order #{$order->order_number}.",
                $meta
            );
        }
    }

    /**
     * Entry point for an inbound gateway callback (Phase 9 sandbox — a real
     * gateway would POST here with its own signed payload shape).
     */
    public function handleCallback(string $transactionId, array $payload): Payment
    {
        $payment = Payment::where('transaction_id', $transactionId)->firstOrFail();

        return $this->verifyPayment($payment, $payload);
    }

    /**
     * Start a brand-new payment attempt for an order whose previous attempt
     * failed. The old payment record is left untouched (spec section 34/65:
     * never overwrite payment history).
     */
    public function retryPayment(Order $order): Payment
    {
        return $this->createPayment($order, $order->payment_method);
    }

    public function refundPayment(Payment $payment, float $amount, ?string $note = null): array
    {
        $gateway = $this->gatewayFor($payment->payment_method);
        $result = $gateway->refund($payment, $amount);

        if ($result['success']) {
            $payment->update([
                'status' => $amount >= (float) $payment->amount ? 'refunded' : 'partial',
                'gateway_response' => array_merge($payment->gateway_response ?? [], ['refund' => $result]),
            ]);
        }

        return $result;
    }
}
