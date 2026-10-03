<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;

interface PaymentGatewayInterface
{
    /**
     * Start a payment attempt for an order. Returns an array describing what
     * the frontend should do next, e.g.:
     * ['status' => 'pending', 'redirect_url' => null, 'transaction_id' => '...']
     */
    public function initialize(Order $order, array $options = []): array;

    /**
     * Verify a transaction with the gateway (or, for COD, apply the fixed
     * business rule). Must never trust a bare "success" flag from the
     * frontend — real gateways verify server-to-server or via signed
     * callback payloads.
     */
    public function verify(string $transactionReference, array $payload = []): array;

    /**
     * Refund all or part of a payment. Returns gateway-reported result.
     */
    public function refund(Payment $payment, float $amount): array;
}
