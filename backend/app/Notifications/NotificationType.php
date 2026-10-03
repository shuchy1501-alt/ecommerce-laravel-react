<?php

namespace App\Notifications;

/**
 * Every notification "type" slug used by the app, grouped by audience.
 * Kept as plain string constants (not an enum) so they serialize directly
 * into the notifications.data JSON blob and are trivially matched on the
 * frontend without an extra mapping layer.
 */
final class NotificationType
{
    // Admin notifications
    public const ORDER_NEW = 'admin.order.new';
    public const PAYMENT_SUCCESSFUL = 'admin.payment.successful';
    public const PAYMENT_FAILED = 'admin.payment.failed';
    public const STOCK_LOW = 'admin.stock.low';
    public const STOCK_OUT = 'admin.stock.out';
    public const CUSTOMER_NEW = 'admin.customer.new';
    public const RETURN_REQUEST_NEW = 'admin.return.new';
    public const REFUND_REQUEST_NEW = 'admin.refund.new';
    public const EXCHANGE_REQUEST_NEW = 'admin.exchange.new';
    public const PURCHASE_RECEIVED = 'admin.purchase.received';

    // Customer notifications
    public const ORDER_CONFIRMED = 'customer.order.confirmed';
    public const CUSTOMER_PAYMENT_SUCCESSFUL = 'customer.payment.successful';
    public const ORDER_PROCESSING = 'customer.order.processing';
    public const ORDER_SHIPPED = 'customer.order.shipped';
    public const ORDER_DELIVERED = 'customer.order.delivered';
    public const ORDER_CANCELLED = 'customer.order.cancelled';
    public const RETURN_APPROVED = 'customer.return.approved';
    public const RETURN_REJECTED = 'customer.return.rejected';
    public const REFUND_COMPLETED = 'customer.refund.completed';
    public const EXCHANGE_APPROVED = 'customer.exchange.approved';
    public const EXCHANGE_COMPLETED = 'customer.exchange.completed';
}
