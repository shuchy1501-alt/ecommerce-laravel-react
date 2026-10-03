<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        // Staff with orders.view see the full list; customers only ever
        // query their own orders (enforced in the controller/query scope).
        return $user->can('orders.view') || $user->hasRole('Customer');
    }

    public function view(User $user, Order $order): bool
    {
        return $user->can('orders.view') || $user->id === $order->user_id;
    }

    public function create(User $user): bool
    {
        return $user->can('orders.create') || $user->hasRole('Customer');
    }

    public function update(User $user, Order $order): bool
    {
        return $user->can('orders.edit');
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->can('orders.delete');
    }

    /** Custom ability: PATCH /orders/{order}/status */
    public function updateStatus(User $user, Order $order): bool
    {
        return $user->can('orders.update_status');
    }

    /** Custom ability: POST /orders/{order}/cancel — staff, or the owning customer while still pending. */
    public function cancel(User $user, Order $order): bool
    {
        if ($user->can('orders.cancel')) {
            return true;
        }

        return $user->id === $order->user_id && $order->order_status === 'pending';
    }
}
