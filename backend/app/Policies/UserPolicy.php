<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    public function view(User $user, User $model): bool
    {
        return $user->can('users.view') || $user->id === $model->id;
    }

    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    public function update(User $user, User $model): bool
    {
        return $user->can('users.edit') || $user->id === $model->id;
    }

    public function delete(User $user, User $model): bool
    {
        // A user may never delete their own account through this ability.
        return $user->can('users.delete') && $user->id !== $model->id;
    }
}
