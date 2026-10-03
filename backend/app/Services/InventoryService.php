<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Single choke point for every stock mutation in the system (Phase 10,
 * spec section 32/77). Sales (Phase 9's OrderService) and purchases/
 * adjustments (Phase 10) all funnel through here so that:
 *   - product_variants.stock is always the one source of truth for
 *     "how many units are available right now", and
 *   - every change is paired with a stock_movements row for audit history.
 *
 * Callers are expected to already be inside a DB::transaction when chaining
 * multiple operations (OrderService, PurchaseService do this); the
 * lockForUpdate() calls below make concurrent mutations of the same variant
 * safe either way.
 */
class InventoryService
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly AuditLogService $auditLog,
    ) {}

    /**
     * Row-locks the variant so two simultaneous checkouts for the last unit
     * can never both succeed (spec section 14/33). Must be called inside an
     * outer DB::transaction (OrderService::createOrder already opens one).
     */
    public function deductStock(int $variantId, int $quantity, string $referenceType, int $referenceId, ?int $userId, ?string $note = null): void
    {
        $this->decreaseStock($variantId, $quantity, 'sale', $referenceType, $referenceId, $userId, $note);
    }

    /**
     * Restores stock for a cancelled/returned order line. Idempotency is the
     * caller's responsibility (OrderService checks a "stock_deducted" flag
     * per order before calling this) so stock is never restored twice.
     */
    public function restoreStock(int $variantId, int $quantity, string $referenceType, int $referenceId, ?int $userId, ?string $note = null): void
    {
        $this->increaseStock($variantId, $quantity, 'cancellation', $referenceType, $referenceId, $userId, $note);
    }

    /**
     * Generic stock decrease used by sales, purchase cancellations/returns,
     * and the "decrease" side of manual adjustments. Never allows stock to
     * go negative (spec section 34) — throws instead so callers can roll
     * back their outer transaction.
     */
    public function decreaseStock(
        int $variantId,
        int $quantity,
        string $type,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?int $userId = null,
        ?string $note = null
    ): StockMovement {
        if ($quantity <= 0) {
            throw ValidationException::withMessages(['quantity' => ['Quantity must be greater than zero.']]);
        }

        $variant = ProductVariant::where('id', $variantId)->lockForUpdate()->firstOrFail();

        if ($variant->stock < $quantity) {
            throw ValidationException::withMessages([
                'stock' => ["Insufficient stock. Only {$variant->stock} unit(s) of {$variant->sku} are available."],
            ]);
        }

        $previous = $variant->stock;
        $new = $previous - $quantity;
        $variant->update(['stock' => $new]);

        $this->notifyStockThreshold($variant, $previous, $new);

        return $this->createMovement($variant, $type, -$quantity, $previous, $new, $referenceType, $referenceId, $userId, $note);
    }

    /**
     * Low Stock / Out of Stock admin notifications, fired only on the
     * transition into that state (not on every subsequent sale while
     * already low/out) so admins get one alert per threshold crossing
     * instead of one per order line.
     *
     * NOTE: called from inside the same DB transaction as the stock
     * mutation itself (this service has no transaction boundary of its
     * own — callers like OrderService already opened one). In the rare
     * case that outer transaction rolls back, a stale alert may already
     * have been queued; this is an accepted trade-off since
     * NotificationService is best-effort and the alternative (deferring
     * every stock notification until the caller's commit) would require
     * every caller to know about inventory notifications too.
     */
    private function notifyStockThreshold(ProductVariant $variant, int $previousStock, int $newStock): void
    {
        $wasOutOfStock = $previousStock <= 0;
        $wasLowStock = $previousStock > 0 && $previousStock <= $variant->minimum_stock;

        if ($newStock <= 0 && ! $wasOutOfStock) {
            $this->notificationService->notifyAdmins(
                \App\Notifications\NotificationType::STOCK_OUT,
                'Out of Stock',
                "{$variant->sku} is now out of stock.",
                ['variant_id' => $variant->id, 'sku' => $variant->sku]
            );
        } elseif ($newStock > 0 && $newStock <= $variant->minimum_stock && ! $wasLowStock) {
            $this->notificationService->notifyAdmins(
                \App\Notifications\NotificationType::STOCK_LOW,
                'Low Stock',
                "{$variant->sku} stock is low ({$newStock} left).",
                ['variant_id' => $variant->id, 'sku' => $variant->sku, 'stock' => $newStock]
            );
        }
    }

    /**
     * Generic stock increase used by purchase receiving, returns, and the
     * "increase" side of manual adjustments.
     */
    public function increaseStock(
        int $variantId,
        int $quantity,
        string $type,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?int $userId = null,
        ?string $note = null
    ): StockMovement {
        if ($quantity <= 0) {
            throw ValidationException::withMessages(['quantity' => ['Quantity must be greater than zero.']]);
        }

        $variant = ProductVariant::where('id', $variantId)->lockForUpdate()->firstOrFail();

        $previous = $variant->stock;
        $new = $previous + $quantity;
        $variant->update(['stock' => $new]);

        return $this->createMovement($variant, $type, $quantity, $previous, $new, $referenceType, $referenceId, $userId, $note);
    }

    /**
     * Manual stock adjustment (spec sections 28-31): admin-initiated
     * increase/decrease for damage, loss, found stock, or counting errors.
     * $direction is 'increase' or 'decrease'.
     */
    public function adjustStock(int $variantId, string $direction, int $quantity, string $reason, ?int $userId, ?string $note = null): StockMovement
    {
        if (! in_array($direction, ['increase', 'decrease'], true)) {
            throw ValidationException::withMessages(['type' => ['Adjustment type must be increase or decrease.']]);
        }

        $fullNote = trim($reason.($note ? " — {$note}" : ''));

        $movement = DB::transaction(function () use ($variantId, $direction, $quantity, $fullNote, $userId) {
            if ($direction === 'increase') {
                return $this->increaseStock($variantId, $quantity, 'adjustment_in', 'adjustment', null, $userId, $fullNote);
            }

            return $this->decreaseStock($variantId, $quantity, 'adjustment_out', 'adjustment', null, $userId, $fullNote);
        });

        $this->auditLog->log(
            \App\Models\User::find($userId),
            \App\Services\AuditAction::STOCK_ADJUSTED,
            'ProductVariant',
            $variantId,
            oldData: ['stock' => $movement->previous_stock],
            newData: ['stock' => $movement->new_stock, 'direction' => $direction, 'quantity' => $quantity, 'reason' => $reason]
        );

        return $movement;
    }

    public function getStock(int $variantId): ?ProductVariant
    {
        return ProductVariant::with('product')->find($variantId);
    }

    public function checkStock(int $variantId): int
    {
        return (int) (ProductVariant::find($variantId)?->stock ?? 0);
    }

    public function getMovementHistory(int $variantId, int $perPage = 20)
    {
        return StockMovement::with('creator')
            ->where('variant_id', $variantId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function createMovement(
        ProductVariant $variant,
        string $type,
        int $signedQuantity,
        int $previousStock,
        int $newStock,
        ?string $referenceType,
        ?int $referenceId,
        ?int $userId,
        ?string $note
    ): StockMovement {
        return StockMovement::create([
            'product_id' => $variant->product_id,
            'variant_id' => $variant->id,
            'type' => $type,
            'quantity' => $signedQuantity,
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'note' => $note,
            'created_by' => $userId,
        ]);
    }
}
