<?php

namespace App\Policies;

use App\Models\ReturnRequest;
use App\Models\User;

class ReturnRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('returns.view') || $user->hasRole('Customer');
    }

    public function view(User $user, ReturnRequest $return): bool
    {
        return $user->can('returns.view') || $user->id === $return->user_id;
    }

    public function create(User $user): bool
    {
        return $user->can('returns.create') || $user->hasRole('Customer');
    }

    /** Custom abilities: staff-only workflow transitions. */
    public function approve(User $user, ReturnRequest $return): bool
    {
        return $user->can('returns.approve');
    }

    public function reject(User $user, ReturnRequest $return): bool
    {
        return $user->can('returns.reject');
    }

    public function complete(User $user, ReturnRequest $return): bool
    {
        return $user->can('returns.complete');
    }
}
