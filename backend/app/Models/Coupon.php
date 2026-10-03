<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'name', 'discount_type', 'discount_value',
        'minimum_order_amount', 'maximum_discount',
        'usage_limit', 'usage_limit_per_customer', 'used_count', 'start_date', 'end_date', 'status',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'minimum_order_amount' => 'decimal:2',
        'maximum_discount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'status' => 'boolean',
    ];

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true)
            ->whereDate('start_date', '<=', now())
            ->whereDate('end_date', '>=', now());
    }

    public function isValidFor(float $orderAmount): bool
    {
        if (! $this->status) {
            return false;
        }

        if (now()->lt($this->start_date) || now()->gt($this->end_date)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return $orderAmount >= (float) $this->minimum_order_amount;
    }

    /**
     * How many times has this specific customer already redeemed this
     * coupon on a *completed* order? (coupon_usages is only ever written
     * during order creation in Phase 9, so this is always 0 for now — the
     * check exists so it starts working correctly the moment orders exist.)
     */
    public function timesUsedBy(int $userId): int
    {
        return $this->usages()->where('user_id', $userId)->count();
    }

    /**
     * Discount amount for a given subtotal, capped by maximum_discount.
     * Never trust a frontend-supplied discount — this is the only place
     * the amount should ever be computed.
     */
    public function calculateDiscount(float $subtotal): float
    {
        $discount = $this->discount_type === 'percentage'
            ? $subtotal * ((float) $this->discount_value / 100)
            : (float) $this->discount_value;

        if ($this->maximum_discount !== null) {
            $discount = min($discount, (float) $this->maximum_discount);
        }

        return round(min($discount, $subtotal), 2);
    }
}
