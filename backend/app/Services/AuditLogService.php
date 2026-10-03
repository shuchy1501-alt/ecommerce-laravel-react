<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Phase 13D — single entry point for writing audit log rows. Mirrors
 * NotificationService's role from Phase 13C: business/HTTP layers call
 * this instead of touching the AuditLog model directly, so redaction and
 * "never let logging break the real action" live in one place.
 *
 * CRITICAL: log()/redact() must never let a password, token, or secret
 * reach the audit_logs table — see REDACTED_KEY_PATTERNS. This is
 * enforced by redacting recursively through nested arrays, keyed by
 * partial (case-insensitive) key-name match rather than an exact list,
 * so a differently-cased or nested secret field (e.g. inside a settings
 * payload) is still caught.
 */
class AuditLogService
{
    /**
     * Case-insensitive substrings — any array key containing one of these
     * has its value replaced with '[REDACTED]' before storage. Substring
     * matching (not exact) deliberately over-redacts rather than risking
     * a secret slipping through under a slightly different key name
     * (e.g. 'online_api_secret', 'gateway_secret', 'api_key').
     */
    private const REDACTED_KEY_PATTERNS = [
        'password', 'token', 'secret', 'private_key', 'api_key',
        'access_key', 'client_secret', 'authorization',
    ];

    /**
     * @param  string  $action  A short dot-namespaced action slug — see
     *                          AuditAction constants.
     * @param  mixed  $oldData  Pre-change state (array or Arrayable). Redacted before storage.
     * @param  mixed  $newData  Post-change state (array or Arrayable). Redacted before storage.
     */
    public function log(
        ?User $user,
        string $action,
        ?string $entityType = null,
        int|string|null $entityId = null,
        mixed $oldData = null,
        mixed $newData = null,
        ?Request $request = null,
    ): void {
        try {
            // Service-layer callers (OrderService, PurchaseService, ...)
            // don't have a $request instance to thread through — fall back
            // to the current HTTP request, which exists for every code
            // path that currently calls this (all synchronous, request-
            // driven actions; nothing here runs from a queued job).
            $request ??= app()->bound('request') ? request() : null;

            AuditLog::create([
                'user_id' => $user?->id,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'old_data' => $oldData !== null ? $this->redact($this->toArray($oldData)) : null,
                'new_data' => $newData !== null ? $this->redact($this->toArray($newData)) : null,
                'ip_address' => $request?->ip(),
                'user_agent' => $request ? substr((string) $request->userAgent(), 0, 255) : null,
            ]);
        } catch (\Throwable $e) {
            // Audit logging is a side effect, same rule as
            // NotificationService: it must never break the real action
            // (login, order update, settings save, ...) that triggered it.
            report($e);
        }
    }

    private function toArray(mixed $data): array
    {
        if (is_array($data)) {
            return $data;
        }

        if (method_exists($data, 'toArray')) {
            return $data->toArray();
        }

        return (array) $data;
    }

    /** Recursively strip anything that looks like a credential. */
    private function redact(array $data): array
    {
        $result = [];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $result[$key] = $this->redact($value);

                continue;
            }

            $result[$key] = $this->isSensitiveKey((string) $key) ? '[REDACTED]' : $value;
        }

        return $result;
    }

    private function isSensitiveKey(string $key): bool
    {
        $key = strtolower($key);

        foreach (self::REDACTED_KEY_PATTERNS as $pattern) {
            if (str_contains($key, $pattern)) {
                return true;
            }
        }

        return false;
    }
}
