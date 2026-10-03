<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;

class CodPaymentGateway implements PaymentGatewayInterface
{
    public function initialize(Order $order, array $options = []): array
    {
        return [
            'status' => 'pending',
            'redirect_url' => null,
            'transaction_id' => 'COD-' . $order->order_number,
            'gateway' => 'cod',
        ];
    }

    /**
     * COD has nothing to "verify" remotely — it's marked paid only when
     * cash is actually collected on delivery (a manual admin action), never
     * automatically here.
     */
    public function verify(string $transactionReference, array $payload = []): array
    {
        return ['success' => false, 'status' => 'pending', 'raw' => ['reason' => 'COD is confirmed on delivery, not verified online.']];
    }

    public function refund(Payment $payment, float $amount): array
    {
        return ['success' => true, 'status' => 'completed', 'raw' => ['method' => 'cod_manual_refund']];
    }
}
