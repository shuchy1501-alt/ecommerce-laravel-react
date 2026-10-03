<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

/**
 * SANDBOX PROVIDER. No real payment gateway (bKash/Nagad/card processor) is
 * configured for this project yet. This class exists so OrderService and
 * PaymentService are already written against PaymentGatewayInterface and
 * never need to change when a real gateway is wired in — only this class
 * gets swapped out.
 *
 * It deliberately does NOT auto-approve payments. `initialize()` issues a
 * signed reference; `verify()` only succeeds if that exact signature comes
 * back, which mimics how a real gateway's server-to-server callback would
 * be authenticated. A bare `{success: true}` from the frontend is never
 * sufficient on its own.
 */
class OnlinePaymentGateway implements PaymentGatewayInterface
{
    public function initialize(Order $order, array $options = []): array
    {
        $transactionId = 'SANDBOX-' . strtoupper(Str::random(10));
        $signature = $this->sign($transactionId, (string) $order->id);

        return [
            'status' => 'pending',
            // No real hosted checkout page exists — the frontend renders its
            // own sandbox confirmation screen using these values.
            'redirect_url' => null,
            'transaction_id' => $transactionId,
            'signature' => $signature,
            'gateway' => 'sandbox',
        ];
    }

    public function verify(string $transactionReference, array $payload = []): array
    {
        $expected = $this->sign($transactionReference, (string) ($payload['order_id'] ?? ''));

        if (($payload['signature'] ?? null) !== $expected) {
            return ['success' => false, 'status' => 'failed', 'raw' => ['reason' => 'Signature mismatch.']];
        }

        return ['success' => true, 'status' => 'paid', 'raw' => ['sandbox' => true]];
    }

    public function refund(Payment $payment, float $amount): array
    {
        return ['success' => true, 'status' => 'completed', 'raw' => ['sandbox' => true]];
    }

    private function sign(string $transactionId, string $orderId): string
    {
        return hash_hmac('sha256', $transactionId . '|' . $orderId, config('app.key'));
    }
}
