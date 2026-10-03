<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_id', 'order_item_id', 'product_id', 'variant_id', 'quantity',
        'reason', 'condition', 'refund_amount', 'exchange_variant_id',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
    ];

    public function returnRequest(): BelongsTo
    {
        return $this->belongsTo(ReturnRequest::class, 'return_id');
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    /** The replacement variant selected when this line is part of an exchange. */
    public function exchangeVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'exchange_variant_id');
    }

    /** Section 18: only "new"/unopened condition is restocked automatically. */
    public function isSellableCondition(): bool
    {
        return $this->condition === 'new';
    }
}
