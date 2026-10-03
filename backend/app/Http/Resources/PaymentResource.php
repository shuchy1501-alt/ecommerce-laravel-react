<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Payment */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_method' => $this->payment_method,
            'transaction_id' => $this->transaction_id,
            'gateway' => $this->gateway,
            // Only the fields a frontend legitimately needs to drive the
            // sandbox confirmation UI — never raw gateway secrets.
            'signature' => $this->gateway_response['signature'] ?? null,
            'redirect_url' => $this->gateway_response['redirect_url'] ?? null,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'created_at' => $this->created_at,
        ];
    }
}
