<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Phase 13C — Notification System.
 *
 * A single, parameterized database notification used for every admin and
 * customer notification type listed in the spec, instead of one class per
 * type (New Order, Payment Successful, Low Stock, Order Shipped, ...).
 *
 * Rationale: all ~20 notification types share exactly the same shape
 * (title, message, type slug, optional structured data) and are all
 * delivered through the same "database" channel. Modeling each as its own
 * class would mean 20+ near-identical files with no behavioural
 * difference; a single class keyed by `type` keeps the data model in
 * `NotificationType` as the single source of truth and is far easier to
 * extend (e.g. adding a "mail" channel later touches one class, not 20).
 *
 * Stored `data` shape (see NotificationResource for how it's read back):
 *   [
 *     'title'   => string,
 *     'message' => string,
 *     'type'    => string,   // one of NotificationType::* constants
 *     'meta'    => array,    // optional structured payload (order_id, etc.)
 *   ]
 */
class GenericNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $type,
        public readonly string $title,
        public readonly string $message,
        public readonly array $meta = [],
    ) {}

    /**
     * Database-only for now. Adding 'mail' here later (e.g. for Payment
     * Failed) would not require touching any of the call sites in
     * NotificationService.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'meta' => $this->meta,
        ];
    }
}
