<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Phase 13D — audit trail row. Deliberately has no `updated_at` and no
 * update/delete affordance anywhere in the app: audit logs are
 * write-once, append-only records. `old_data`/`new_data` are pre-redacted
 * by AuditLogService before they ever reach this model — see
 * AuditLogService::redact().
 */
class AuditLog extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'action', 'entity_type', 'entity_id',
        'old_data', 'new_data', 'ip_address', 'user_agent',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
