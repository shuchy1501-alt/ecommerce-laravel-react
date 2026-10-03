<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id', 'subcategory_id', 'brand_id', 'unit_id',
        'name', 'slug', 'sku', 'description', 'short_description',
        'purchase_price', 'selling_price', 'discount_type', 'discount_value',
        'status', 'featured', 'new_arrival', 'best_seller', 'is_returnable',
        'meta_title', 'meta_description', 'meta_keywords',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'status' => 'boolean',
        'featured' => 'boolean',
        'new_arrival' => 'boolean',
        'best_seller' => 'boolean',
        'is_returnable' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function getFinalPriceAttribute(): float
    {
        $price = (float) $this->selling_price;

        if ($this->discount_type === 'flat') {
            return max(0, $price - (float) $this->discount_value);
        }

        if ($this->discount_type === 'percentage') {
            return max(0, $price - ($price * (float) $this->discount_value / 100));
        }

        return $price;
    }

    /**
     * Aggregate stock status across variants when they exist, otherwise
     * falls back to a plain "in_stock"/"out_of_stock" based on status.
     */
    public function getStockStatusAttribute(): string
    {
        if ($this->relationLoaded('variants') && $this->variants->count() > 0) {
            $totalStock = $this->variants->sum('stock');
            $anyLow = $this->variants->contains(fn ($v) => $v->stock > 0 && $v->stock <= $v->minimum_stock);

            if ($totalStock <= 0) {
                return 'out_of_stock';
            }

            return $anyLow ? 'low_stock' : 'in_stock';
        }

        return $this->status ? 'in_stock' : 'out_of_stock';
    }
}
