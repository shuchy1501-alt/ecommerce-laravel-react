<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use App\Notifications\GenericNotification;
use Illuminate\Notifications\Notification as LaravelNotification;
use Illuminate\Support\Facades\Notification;

/**
 * Phase 13C — single entry point for every notification the app sends.
 * All business services (OrderService, PaymentService, ReturnService, ...)
 * call this instead of constructing notifications themselves, so the
 * "who gets notified" and "is this channel enabled" logic lives in one
 * place. Delivery is via Laravel's database notification channel — see
 * GenericNotification.
 */
class NotificationService
{
    /**
     * Roles treated as "admin side" recipients for admin notifications.
     * Kept here (not hardcoded per call site) so adding a role like
     * 'Manager' to the notified set is a one-line change.
     */
    private const ADMIN_ROLES = ['Super Admin', 'Admin', 'Manager'];

    /**
     * Notify every admin-side user of a business event (New Order, Low
     * Stock, New Return Request, ...). Silently does nothing if admin
     * notifications are disabled in Settings or there are no admin users
     * yet — never throws, since a notification failure must never break
     * the underlying business action (order placement, payment, etc.).
     */
    public function notifyAdmins(string $type, string $title, string $message, array $meta = []): void
    {
        if (! Setting::get('notification.admin_enabled', true)) {
            return;
        }

        // Spatie's role() scope throws RoleDoesNotExist if ANY name in the
        // list isn't a seeded role — which would take down order/payment/
        // registration/inventory flows in environments where not every
        // admin-side role has been seeded yet. Filter to roles that
        // actually exist first so a missing role is simply skipped.
        $existingRoles = \Spatie\Permission\Models\Role::query()
            ->whereIn('name', self::ADMIN_ROLES)
            ->pluck('name');

        if ($existingRoles->isEmpty()) {
            return;
        }

        $admins = User::role($existingRoles->all())->get();

        if ($admins->isEmpty()) {
            return;
        }

        $this->send($admins, $type, $title, $message, $meta);
    }

    /**
     * Notify a single customer/user (Order Confirmed, Order Shipped,
     * Return Approved, ...).
     */
    public function notifyUser(User $user, string $type, string $title, string $message, array $meta = []): void
    {
        if (! Setting::get('notification.customer_enabled', true)) {
            return;
        }

        $this->send(collect([$user]), $type, $title, $message, $meta);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $recipients
     */
    private function send($recipients, string $type, string $title, string $message, array $meta): void
    {
        try {
            Notification::send($recipients, new GenericNotification($type, $title, $message, $meta));
        } catch (\Throwable $e) {
            // Notifications are best-effort side effects. A DB hiccup here
            // must never roll back or fail the order/payment/return
            // transaction that triggered it.
            report($e);
        }
    }
}
