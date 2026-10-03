<?php

namespace App\Http\Resources;

use App\Http\Resources\Concerns\GuardsStaffOnlyFields;
use App\Models\ReturnItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    use GuardsStaffOnlyFields;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_id' => $this->variant_id,
            'product_name' => $this->product_name,
            'sku' => $this->sku,
            'size' => $this->size,
            'color' => $this->color,
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            // SECURITY (Phase 13D): cost_price is COGS. OrderResource is
            // shared between admin order management and a customer viewing
            // their own order (GET /api/orders/{id}) — it must never reach
            // the customer, regardless of order ownership.
            'cost_price' => $this->when($this->viewerIsStaff($request), (float) $this->cost_price),
            'discount' => (float) $this->discount,
            'subtotal' => (float) $this->subtotal,
            'is_returnable' => (bool) ($this->product?->is_returnable ?? true),
            // Section 10/65: how many more units of this line can still be
            // claimed by a return/exchange — same formula as
            // ReturnService::returnableQuantity, kept here so the "create
            // return" form can render without an extra round trip per item.
            'returnable_quantity' => $this->when($request->routeIs('orders.show', 'returns.*'), function () {
                $claimed = ReturnItem::where('order_item_id', $this->id)
                    ->whereHas('returnRequest', fn ($q) => $q->whereNotIn('status', ['rejected', 'cancelled']))
                    ->sum('quantity');

                return max(0, $this->quantity - (int) $claimed);
            }),
        ];
    }
}
