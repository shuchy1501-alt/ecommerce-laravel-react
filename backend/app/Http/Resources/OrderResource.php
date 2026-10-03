<?php

namespace App\Http\Resources;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'order_date' => $this->order_date,
            'placed_at' => $this->placed_at,
            'delivered_at' => $this->delivered_at,

            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'coupon_discount' => (float) $this->coupon_discount,
            'coupon_code' => $this->coupon_code,
            'shipping_charge' => (float) $this->shipping_charge,
            'tax' => (float) $this->tax,
            'total' => (float) $this->total,
            'paid_amount' => (float) $this->paid_amount,
            'due_amount' => (float) $this->due_amount,

            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'order_status' => $this->order_status,

            'shipping' => [
                'name' => $this->shipping_name,
                'phone' => $this->shipping_phone,
                'email' => $this->shipping_email,
                'address' => $this->shipping_address,
                'division' => $this->shipping_division,
                'district' => $this->shipping_district,
                'area' => $this->shipping_area,
            ],

            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
                'email' => $this->customer->email,
            ] : null),

            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'refunds' => RefundResource::collection($this->whenLoaded('refunds')),
            'invoice' => $this->whenLoaded('invoice', fn () => $this->invoice ? new InvoiceResource($this->invoice) : null),
            'status_history' => $this->whenLoaded('statusHistories', fn () => $this->statusHistories->map(fn ($h) => [
                'from_status' => $h->from_status,
                'to_status' => $h->to_status,
                'note' => $h->note,
                'created_at' => $h->created_at,
            ])),

            'can_cancel' => in_array($this->order_status, ['pending', 'confirmed'], true),
            'can_return' => $this->computeCanReturn(),

            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Mirrors ReturnService::assertOrderEligible's rules so the frontend
     * can show/hide the "Return / Exchange" action without a round trip —
     * the backend still re-validates everything when the request is submitted.
     */
    private function computeCanReturn(): bool
    {
        if ($this->order_status !== 'delivered') {
            return false;
        }

        $deliveredAt = $this->delivered_at ?? $this->updated_at;

        if (! $deliveredAt) {
            return false;
        }

        $windowDays = (int) Setting::get('return_window_days', 7);

        return now()->lessThanOrEqualTo($deliveredAt->copy()->addDays($windowDays));
    }
}
