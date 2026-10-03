<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One-to-one with `returns` where type = 'exchange' (spec section 32).
 * Tracks the replacement variant, any price difference, and its own
 * fulfilment status separate from the parent ReturnRequest's status —
 * the return can be "received/inspected" while the exchange itself is
 * still "processing" the new shipment.
 */
class Exchange extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_id', 'order_id', 'original_order_item_id', 'original_variant_id',
        'replacement_variant_id', 'quantity', 'price_difference',
        'price_difference_action', 'status',
    ];

    protected $casts = [
        'price_difference' => 'decimal:2',
    ];

    public function returnRequest(): BelongsTo
    {
        return $this->belongsTo(ReturnRequest::class, 'return_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function originalOrderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class, 'original_order_item_id');
    }

    public function originalVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'original_variant_id');
    }

    public function replacementVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'replacement_variant_id');
    }
}
