<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Maps to the `returns` table. Named ReturnRequest instead of Return
 * because `return` is a reserved keyword in PHP and cannot be a class name.
 *
 * A single row drives three related but distinct customer intents,
 * distinguished by `type` (spec section 4/31):
 *   - return:   send item(s) back, get money back.
 *   - exchange: send item(s) back, get a different variant instead — see
 *               the paired `Exchange` model for the replacement details.
 *   - refund:   money-only adjustment (e.g. price complaint) that doesn't
 *               necessarily involve shipping product back.
 */
class ReturnRequest extends Model
{
    use HasFactory;

    protected $table = 'returns';

    protected $fillable = [
        'order_id', 'user_id', 'type', 'return_number', 'reason', 'description',
        'customer_note', 'admin_note', 'status',
        'requested_at', 'approved_at', 'received_at', 'inspected_at',
        'rejected_at', 'completed_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
        'inspected_at' => 'datetime',
        'rejected_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /** Terminal states — no further status transition is possible. */
    public const FINAL_STATUSES = ['completed', 'rejected', 'cancelled'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class, 'return_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class, 'return_id');
    }

    public function exchange(): HasOne
    {
        return $this->hasOne(Exchange::class, 'return_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ReturnStatusHistory::class, 'return_id')->orderBy('created_at');
    }

    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function isFinal(): bool
    {
        return in_array($this->status, self::FINAL_STATUSES, true);
    }
}
