<?php

namespace App\Policies;

use App\Models\Brand;
use App\Models\User;

class BrandPolicy
{
    /** Public storefront browsing — no permission required. */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Brand $brand): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->can('brands.create');
    }

    public function update(User $user, Brand $brand): bool
    {
        return $user->can('brands.edit');
    }

    public function delete(User $user, Brand $brand): bool
    {
        return $user->can('brands.delete');
    }
}
