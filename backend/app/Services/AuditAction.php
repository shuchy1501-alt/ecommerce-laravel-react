<?php

namespace App\Services;

/**
 * Every audit action slug used by the app. Kept as plain string constants
 * (not an enum) so they serialize directly into audit_logs.action and are
 * trivially filterable from the admin audit log UI.
 */
final class AuditAction
{
    public const LOGIN = 'auth.login';
    public const LOGOUT = 'auth.logout';

    public const PRODUCT_CREATED = 'product.created';
    public const PRODUCT_UPDATED = 'product.updated';
    public const PRODUCT_DELETED = 'product.deleted';

    public const ORDER_STATUS_CHANGED = 'order.status_changed';

    public const PURCHASE_RECEIVED = 'purchase.received';
    public const STOCK_ADJUSTED = 'stock.adjusted';

    public const RETURN_APPROVED = 'return.approved';
    public const REFUND_PROCESSED = 'refund.processed';
    public const EXCHANGE_PROCESSED = 'exchange.processed';

    public const EXPENSE_CREATED = 'expense.created';
    public const SETTINGS_UPDATED = 'settings.updated';

    /**
     * Reserved for when a role-management endpoint exists — see
     * SECURITY_REVIEW.md. Nothing currently calls this; there is no
     * existing "change a user's role" feature in the app to hook into.
     */
    public const USER_ROLE_CHANGED = 'user.role_changed';
}
