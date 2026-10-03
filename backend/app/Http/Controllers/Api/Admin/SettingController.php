<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setting\UpdateGeneralSettingRequest;
use App\Http\Requests\Setting\UpdateNotificationSettingRequest;
use App\Http\Requests\Setting\UpdateOrderSettingRequest;
use App\Http\Requests\Setting\UpdatePaymentSettingRequest;
use App\Http\Requests\Setting\UpdateReturnSettingRequest;
use App\Http\Requests\Setting\UpdateSeoSettingRequest;
use App\Http\Requests\Setting\UpdateShippingSettingRequest;
use App\Http\Requests\Setting\UpdateStoreSettingRequest;
use App\Http\Requests\Setting\UpdateTaxSettingRequest;
use App\Services\AuditAction;
use App\Services\AuditLogService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase 13C — Settings Module. Phase 13D adds audit logging: every
 * successful update is recorded via AuditLogService with the section name
 * as the entity and the validated payload as new_data. Secret fields
 * (payment.online_api_secret, etc.) are redacted by AuditLogService
 * itself before they ever reach the audit_logs table — this controller
 * doesn't need its own redaction logic.
 *
 * One centralized architecture (SettingService -> `settings` table) behind
 * a single controller with a route per section. Every route is gated by
 * Spatie permissions in routes/api.php:
 *   - GET routes  -> permission:settings.view
 *   - POST routes -> permission:settings.update
 * so unauthorized users get a 403 before any of these methods even run.
 */
class SettingController extends Controller
{
    public function __construct(
        private readonly SettingService $settings,
        private readonly AuditLogService $auditLog,
    ) {}

    public function index(): JsonResponse
    {
        return $this->success([
            'general' => $this->settings->group('general'),
            'store' => $this->settings->group('store'),
            'order' => $this->settings->group('order'),
            'payment' => $this->settings->group('payment'),
            'shipping' => $this->settings->group('shipping'),
            'return' => $this->settings->group('return'),
            'tax' => $this->settings->group('tax'),
            'notification' => $this->settings->group('notification'),
            'seo' => $this->settings->group('seo'),
        ], 'Settings fetched successfully');
    }

    public function general(): JsonResponse
    {
        return $this->success($this->settings->group('general'));
    }

    public function updateGeneral(UpdateGeneralSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'general');
    }

    public function store(): JsonResponse
    {
        return $this->success($this->settings->group('store'));
    }

    public function updateStore(UpdateStoreSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'store');
    }

    public function order(): JsonResponse
    {
        return $this->success($this->settings->group('order'));
    }

    public function updateOrder(UpdateOrderSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'order');
    }

    public function payment(): JsonResponse
    {
        return $this->success($this->settings->group('payment'));
    }

    public function updatePayment(UpdatePaymentSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'payment');
    }

    public function shipping(): JsonResponse
    {
        return $this->success($this->settings->group('shipping'));
    }

    public function updateShipping(UpdateShippingSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'shipping');
    }

    public function returnSettings(): JsonResponse
    {
        return $this->success($this->settings->group('return'));
    }

    public function updateReturn(UpdateReturnSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'return');
    }

    public function tax(): JsonResponse
    {
        return $this->success($this->settings->group('tax'));
    }

    public function updateTax(UpdateTaxSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'tax');
    }

    public function notification(): JsonResponse
    {
        return $this->success($this->settings->group('notification'));
    }

    public function updateNotification(UpdateNotificationSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'notification');
    }

    public function seo(): JsonResponse
    {
        return $this->success($this->settings->group('seo'));
    }

    public function updateSeo(UpdateSeoSettingRequest $request): JsonResponse
    {
        return $this->applyUpdate($request, 'seo');
    }

    /**
     * Shared update + audit-log path for every section. `$request->validated()`
     * is passed as new_data as-is — AuditLogService redacts anything that
     * looks like a secret before it's ever persisted.
     */
    private function applyUpdate(Request $request, string $group): JsonResponse
    {
        $result = $this->settings->updateGroup($group, $request->validated());

        $this->auditLog->log(
            $request->user(),
            AuditAction::SETTINGS_UPDATED,
            'Setting',
            null,
            newData: array_merge(['section' => $group], $request->validated())
        );

        return $this->success($result, ucfirst($group).' settings updated');
    }
}
