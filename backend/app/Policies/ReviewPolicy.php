<?php

namespace App\Policies;

use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    /** Approved reviews are shown publicly on the storefront. */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Review $review): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        // Eligibility (must have a delivered order for this product) is
        // enforced in the service/controller layer, per the Phase 3 spec.
        return $user->can('reviews.create') || $user->hasRole('Customer');
    }

    public function delete(User $user, Review $review): bool
    {
        return $user->can('reviews.delete') || $user->id === $review->user_id;
    }

    /** Custom ability: moderation. */
    public function approve(User $user, Review $review): bool
    {
        return $user->can('reviews.approve');
    }

    public function reject(User $user, Review $review): bool
    {
        return $user->can('reviews.reject');
    }
}
