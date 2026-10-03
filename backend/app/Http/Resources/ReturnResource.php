<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ReturnRequest */
class ReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'return_number' => $this->return_number,
            'type' => $this->type,
            'order_id' => $this->order_id,
            'order_number' => $this->whenLoaded('order', fn () => $this->order?->order_number),
            'customer' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
            'reason' => $this->reason,
            'description' => $this->description,
            'customer_note' => $this->customer_note,
            'admin_note' => $this->admin_note,
            'status' => $this->status,
            'requested_at' => $this->requested_at,
            'approved_at' => $this->approved_at,
            'received_at' => $this->received_at,
            'inspected_at' => $this->inspected_at,
            'rejected_at' => $this->rejected_at,
            'completed_at' => $this->completed_at,
            'items' => ReturnItemResource::collection($this->whenLoaded('items')),
            'refunds' => RefundResource::collection($this->whenLoaded('refunds')),
            'exchange' => $this->whenLoaded('exchange', fn () => $this->exchange ? new ExchangeResource($this->exchange) : null),
            'refund_amount' => $this->whenLoaded('items', fn () => (float) $this->items->sum('refund_amount')),
            'status_history' => $this->whenLoaded('statusHistories', fn () => $this->statusHistories->map(fn ($h) => [
                'from_status' => $h->from_status,
                'to_status' => $h->to_status,
                'note' => $h->note,
                'changed_by' => $h->changedBy?->name,
                'created_at' => $h->created_at,
            ])),
            'created_at' => $this->created_at,
        ];
    }
}
