<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('payments.view');
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->can('payments.view') || $user->id === $payment->order?->user_id;
    }

    public function create(User $user): bool
    {
        return $user->can('payments.manage');
    }

    /** Custom ability: refunding a payment. */
    public function refund(User $user, Payment $payment): bool
    {
        return $user->can('payments.manage');
    }
}
