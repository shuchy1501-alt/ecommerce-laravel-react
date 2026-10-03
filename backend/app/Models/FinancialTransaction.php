<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * The financial ledger (spec sections 30-36). Every income/expense event
 * elsewhere in the app (a sale, a completed refund, a paid expense, a
 * received purchase) writes exactly one row here — see
 * FinancialReportService::recordTransaction, which is the only place
 * that's allowed to create these, guarded by the (type, reference_type,
 * reference_id) unique index so nothing is ever double-recorded.
 */
class FinancialTransaction extends Model
{
    protected $fillable = [
        'transaction_number', 'type', 'reference_type', 'reference_id',
        'amount', 'direction', 'payment_method', 'description', 'transaction_date', 'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    public const TYPES = ['sale', 'refund', 'expense', 'purchase', 'adjustment'];
    public const DIRECTIONS = ['income', 'expense'];

    public function reference(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeDirection($query, string $direction)
    {
        return $query->where('direction', $direction);
    }

    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('transaction_date', [$from, $to]);
    }
}
