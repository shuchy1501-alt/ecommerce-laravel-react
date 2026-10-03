<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Refund */
class RefundResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'refund_number' => $this->refund_number,
            'order_id' => $this->order_id,
            'order_number' => $this->whenLoaded('order', fn () => $this->order?->order_number),
            'return_id' => $this->return_id,
            'return_number' => $this->whenLoaded('returnRequest', fn () => $this->returnRequest?->return_number),
            'refund_method' => $this->refund_method,
            'amount' => (float) $this->amount,
            'reason' => $this->reason,
            'transaction_id' => $this->transaction_id,
            'status' => $this->status,
            'processed_by' => $this->whenLoaded('processedBy', fn () => $this->processedBy?->name),
            'processed_at' => $this->processed_at,
            'refunded_at' => $this->refunded_at,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
