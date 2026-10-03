<?php

namespace App\Policies;

use App\Models\Inventory;
use App\Models\User;

class InventoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('inventory.view') || $user->can('stock.view');
    }

    public function view(User $user, Inventory $inventory): bool
    {
        return $user->can('inventory.view') || $user->can('stock.view');
    }

    public function update(User $user, Inventory $inventory): bool
    {
        return $user->can('inventory.manage') || $user->can('stock.update');
    }

    /** Custom ability for manual stock adjustments. */
    public function adjust(User $user, Inventory $inventory): bool
    {
        return $user->can('inventory.manage') || $user->can('stock.update');
    }
}
