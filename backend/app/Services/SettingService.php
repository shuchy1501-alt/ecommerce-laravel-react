<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * Phase 13C — Settings Module.
 *
 * Single centralized settings architecture: every section (General, Store,
 * Order, Payment, Shipping, Return, Tax, Notification, SEO) is stored as
 * rows in the existing `settings` key/value table (group = section name),
 * read/written only through this service. Nothing here introduces a
 * second settings system — controllers never touch the Setting model
 * directly.
 *
 * SECURITY: keys listed in SECRET_KEYS (payment gateway credentials) are
 * never returned in plain text by get()/all() — callers get a masked
 * placeholder plus a `configured` boolean instead. The raw value is only
 * ever written (via set()/update()), never read back out through the API.
 */
class SettingService
{
    /**
     * Settings keys whose raw values must never be serialized back to the
     * frontend. Only these exact keys are redacted — everything else in
     * the `payment` group (e.g. cod_enabled, cod_instructions) is plain
     * configuration and safe to expose.
     */
    private const SECRET_KEYS = [
        'payment.online_api_key',
        'payment.online_api_secret',
        'payment.online_private_key',
        'payment.online_gateway_secret',
        'payment.online_merchant_secret',
    ];

    private const DEFAULTS = [
        'general' => [
            'general.store_name' => 'FashionMart',
            'general.logo' => null,
            'general.favicon' => null,
            'general.email' => null,
            'general.phone' => null,
            'general.address' => null,
            'general.currency' => 'BDT',
            'general.timezone' => 'Asia/Dhaka',
        ],
        'store' => [
            'store.store_name' => 'FashionMart',
            'store.description' => null,
            'store.logo' => null,
            'store.contact_email' => null,
            'store.contact_phone' => null,
            'store.address' => null,
            'store.facebook' => null,
            'store.instagram' => null,
            'store.youtube' => null,
            'store.website' => null,
        ],
        'order' => [
            'order.number_prefix' => 'ORD',
            'order.minimum_amount' => 0,
            'order.cancellation_window_hours' => 24,
            'order.auto_confirm' => false,
            'order.notify_on_new_order' => true,
        ],
        'payment' => [
            'payment.cod_enabled' => true,
            'payment.cod_instructions' => null,
            'payment.online_enabled' => false,
            'payment.online_gateway' => null,
            'payment.online_api_key' => null,
            'payment.online_api_secret' => null,
            'payment.online_private_key' => null,
            'payment.online_gateway_secret' => null,
            'payment.online_merchant_secret' => null,
        ],
        'shipping' => [
            'shipping.default_charge' => 60,
            'shipping.free_shipping_threshold' => 2000,
            'shipping.areas' => [],
            'shipping.charge_by_area' => [],
        ],
        'return' => [
            'return.return_window_days' => 7,
            'return.exchange_window_days' => 7,
            'return.refund_policy' => null,
            'return.conditions' => null,
            'return.non_returnable_rules' => null,
        ],
        'tax' => [
            'tax.enabled' => false,
            'tax.percentage' => 0,
            'tax.display' => 'exclusive',
        ],
        'notification' => [
            'notification.admin_enabled' => true,
            'notification.customer_enabled' => true,
        ],
        'seo' => [
            'seo.site_title' => 'FashionMart',
            'seo.meta_description' => null,
            'seo.meta_keywords' => null,
            'seo.og_title' => null,
            'seo.og_description' => null,
            'seo.og_image' => null,
            'seo.default_image' => null,
        ],
    ];

    /**
     * All settings for a section, with secret keys masked. Missing keys
     * fall back to the section's documented default so the frontend
     * always receives a complete, predictable shape even before the admin
     * has saved anything.
     */
    public function group(string $group): array
    {
        $defaults = self::DEFAULTS[$group] ?? [];
        $stored = Setting::query()->where('group', $group)->get()->keyBy('key');

        $result = [];
        foreach ($defaults as $key => $default) {
            $result[$this->shortKey($key)] = $stored->has($key)
                ? $this->present($key, $stored->get($key)->castValue())
                : $this->present($key, $default);
        }

        return $result;
    }

    /**
     * Persist a section's fields. `$fields` are short keys (e.g.
     * 'store_name', not 'general.store_name') as submitted by the
     * validated form request. Keys not present in `$fields` are left
     * untouched — this is a partial update, never a wholesale replace.
     *
     * A secret field submitted as null/empty is treated as "leave
     * unchanged" (the frontend never has the real value to resend), so
     * clearing a secret requires an explicit non-empty overwrite.
     */
    public function updateGroup(string $group, array $fields): array
    {
        foreach ($fields as $shortKey => $value) {
            $key = "{$group}.{$shortKey}";

            if (in_array($key, self::SECRET_KEYS, true) && ($value === null || $value === '')) {
                continue;
            }

            $this->set($key, $value, $group);
        }

        return $this->group($group);
    }

    public function set(string $key, mixed $value, string $group): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            [
                'value' => $this->serialize($value),
                'type' => $this->typeOf($value),
                'group' => $group,
            ]
        );
    }

    /** Thin passthrough to Setting::get() for server-side consumers (tax/shipping calculators, etc). */
    public function value(string $key, mixed $default = null): mixed
    {
        return Setting::get($key, $default);
    }

    private function present(string $key, mixed $value): mixed
    {
        if (! in_array($key, self::SECRET_KEYS, true)) {
            return $value;
        }

        // Never expose the secret itself — only whether one is configured.
        return $value ? '••••••••' : null;
    }

    private function serialize(mixed $value): ?string
    {
        if (is_array($value)) {
            return json_encode($value);
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return $value === null ? null : (string) $value;
    }

    private function typeOf(mixed $value): string
    {
        return match (true) {
            is_bool($value) => 'boolean',
            is_int($value) => 'integer',
            is_float($value) => 'float',
            is_array($value) => 'json',
            default => 'string',
        };
    }

    private function shortKey(string $key): string
    {
        return str_contains($key, '.') ? substr($key, strpos($key, '.') + 1) : $key;
    }

    /** Cache bust helper — Setting model already forgets on save/delete, kept here for symmetry/tests. */
    public function flushCache(): void
    {
        Cache::forget('settings');
    }
}
