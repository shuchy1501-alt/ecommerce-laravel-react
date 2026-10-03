<?php

namespace App\Http\Resources\Concerns;

use Illuminate\Http\Request;

/**
 * Phase 13D security fix — several resources (products, order line items,
 * variants) are shared between public/customer-facing endpoints and
 * internal admin endpoints. Cost/COGS fields on those resources must only
 * be visible to staff. "Staff" is defined as: authenticated AND not the
 * Customer role — matches the exact ownership-check pattern already used
 * in OrderController::authorizeOwnership, so this doesn't invent a new
 * authorization concept, just reuses the existing one at the
 * serialization layer.
 */
trait GuardsStaffOnlyFields
{
    protected function viewerIsStaff(Request $request): bool
    {
        $user = $request->user();

        return $user !== null && ! $user->hasRole('Customer');
    }
}
