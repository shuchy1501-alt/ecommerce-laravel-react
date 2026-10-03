<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Owns the purchase lifecycle: draft/ordered -> (partially) received or
 * cancelled. Stock is only ever touched via InventoryService (spec
 * section 77) — this class never writes to product_variants.stock itself.
 */
class PurchaseService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly FinancialReportService $financialReportService,
        private readonly NotificationService $notificationService,
        private readonly AuditLogService $auditLog,
    ) {}

    public function generatePurchaseNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = "PO-FM-{$date}-";

        $last = Purchase::where('purchase_number', 'like', "{$prefix}%")
            ->orderByDesc('purchase_number')
            ->value('purchase_number');

        $sequence = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }

    /**
     * @param  array{supplier_id:int,purchase_date:string,discount?:float,shipping_cost?:float,tax?:float,notes?:?string,status?:string,items:array}  $data
     */
    public function createPurchase(array $data, ?int $userId): Purchase
    {
        $supplier = Supplier::findOrFail($data['supplier_id']);

        if (! $supplier->status) {
            throw ValidationException::withMessages(['supplier_id' => ['Inactive suppliers cannot be selected for new purchases.']]);
        }

        return DB::transaction(function () use ($data, $userId) {
            [$items, $subtotal] = $this->buildItems($data['items']);

            $total = $this->calculateTotal($subtotal, $data['discount'] ?? 0, $data['shipping_cost'] ?? 0, $data['tax'] ?? 0);

            $purchase = Purchase::create([
                'supplier_id' => $data['supplier_id'],
                'purchase_number' => $this->generatePurchaseNumber(),
                'purchase_date' => $data['purchase_date'],
                'subtotal' => $subtotal,
                'discount' => $data['discount'] ?? 0,
                'shipping_cost' => $data['shipping_cost'] ?? 0,
                'tax' => $data['tax'] ?? 0,
                'total' => $total,
                'paid_amount' => 0,
                'due_amount' => $total,
                'payment_status' => 'unpaid',
                'status' => $data['status'] ?? 'draft',
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            foreach ($items as $item) {
                $purchase->items()->create($item);
            }

            return $purchase->load('items', 'supplier');
        });
    }

    public function updatePurchase(Purchase $purchase, array $data): Purchase
    {
        if (in_array($purchase->status, ['received', 'cancelled'], true)) {
            throw ValidationException::withMessages(['status' => ['This purchase can no longer be edited.']]);
        }

        return DB::transaction(function () use ($purchase, $data) {
            $updates = collect($data)->only(['supplier_id', 'purchase_date', 'discount', 'shipping_cost', 'tax', 'notes', 'status'])->toArray();

            if (isset($data['items'])) {
                [$items, $subtotal] = $this->buildItems($data['items']);
                $purchase->items()->delete();
                foreach ($items as $item) {
                    $purchase->items()->create($item);
                }
                $updates['subtotal'] = $subtotal;
            }

            $subtotal = $updates['subtotal'] ?? $purchase->subtotal;
            $discount = $updates['discount'] ?? $purchase->discount;
            $shipping = $updates['shipping_cost'] ?? $purchase->shipping_cost;
            $tax = $updates['tax'] ?? $purchase->tax;
            $updates['total'] = $this->calculateTotal($subtotal, $discount, $shipping, $tax);
            $updates['due_amount'] = $updates['total'] - $purchase->paid_amount;

            $purchase->update($updates);

            return $purchase->fresh(['items', 'supplier']);
        });
    }

    public function calculateTotal(float $subtotal, float $discount, float $shipping, float $tax): float
    {
        return round($subtotal - $discount + $shipping + $tax, 2);
    }

    /**
     * Receives a purchase, in full or in part (spec sections 24-25, 48).
     *
     * @param  array<int,array{item_id:int,quantity:int}>|null  $lines  Explicit received quantities per item; null/omitted means "receive everything still outstanding".
     */
    public function receivePurchase(Purchase $purchase, ?int $userId, ?array $lines = null): Purchase
    {
        if (! in_array($purchase->status, ['draft', 'ordered', 'partially_received'], true)) {
            throw ValidationException::withMessages(['status' => ['This purchase has already been fully received or was cancelled.']]);
        }

        $purchase = DB::transaction(function () use ($purchase, $userId, $lines) {
            $items = $purchase->items()->with('variant')->get();
            $requested = collect($lines)->keyBy('item_id');

            foreach ($items as $item) {
                $outstanding = $item->quantity - $item->received_quantity;

                if ($outstanding <= 0) {
                    continue;
                }

                $qtyToReceive = $requested->has($item->id)
                    ? min((int) $requested[$item->id]['quantity'], $outstanding)
                    : $outstanding;

                if ($qtyToReceive <= 0) {
                    continue;
                }

                if (! $item->variant_id) {
                    // No variant to track stock against (shouldn't normally happen); just mark received.
                    $item->increment('received_quantity', $qtyToReceive);
                    continue;
                }

                $this->inventoryService->increaseStock(
                    $item->variant_id,
                    $qtyToReceive,
                    'purchase',
                    Purchase::class,
                    $purchase->id,
                    $userId,
                    "Stock in from purchase {$purchase->purchase_number}"
                );

                $item->increment('received_quantity', $qtyToReceive);
            }

            $purchase->refresh();
            $fullyReceived = $purchase->items->every(fn (PurchaseItem $i) => $i->received_quantity >= $i->quantity);
            $anyReceived = $purchase->items->sum('received_quantity') > 0;

            $purchase->update([
                'status' => $fullyReceived ? 'received' : ($anyReceived ? 'partially_received' : $purchase->status),
                'received_at' => $fullyReceived ? now() : $purchase->received_at,
            ]);

            if ($fullyReceived) {
                // Section 36/55: cash-out, not an operating expense —
                // recognized once, guarded by the ledger's unique index.
                $this->financialReportService->recordPurchaseTransaction($purchase->fresh());
            }

            return $purchase->fresh(['items', 'supplier']);
        });

        $this->notifyReceived($purchase);

        $this->auditLog->log(
            \App\Models\User::find($userId),
            \App\Services\AuditAction::PURCHASE_RECEIVED,
            'Purchase',
            $purchase->id,
            newData: ['status' => $purchase->status, 'purchase_number' => $purchase->purchase_number]
        );

        return $purchase;
    }

    /**
     * Purchase Received — admin notification. Fired for every receive
     * call (partial or full) since each one represents stock physically
     * arriving at the warehouse; the message distinguishes partial vs
     * complete receipt.
     */
    private function notifyReceived(Purchase $purchase): void
    {
        $status = $purchase->status === 'received' ? 'fully received' : 'partially received';

        $this->notificationService->notifyAdmins(
            \App\Notifications\NotificationType::PURCHASE_RECEIVED,
            'Purchase Received',
            "Purchase {$purchase->purchase_number} was {$status}.",
            ['purchase_id' => $purchase->id, 'purchase_number' => $purchase->purchase_number]
        );
    }

    public function cancelPurchase(Purchase $purchase): Purchase
    {
        if (! in_array($purchase->status, ['draft', 'ordered'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Only draft or ordered purchases can be cancelled. Received purchases require a stock adjustment instead.'],
            ]);
        }

        $purchase->update(['status' => 'cancelled']);

        return $purchase->fresh(['items', 'supplier']);
    }

    /**
     * @return array{0: array<int, array>, 1: float}
     */
    private function buildItems(array $rawItems): array
    {
        if (empty($rawItems)) {
            throw ValidationException::withMessages(['items' => ['At least one purchase item is required.']]);
        }

        $items = [];
        $subtotal = 0;

        foreach ($rawItems as $raw) {
            $variant = ! empty($raw['variant_id']) ? ProductVariant::find($raw['variant_id']) : null;
            $product = Product::findOrFail($raw['product_id']);

            $quantity = (int) $raw['quantity'];
            $unitCost = (float) $raw['unit_cost'];
            $discount = (float) ($raw['discount'] ?? 0);
            $tax = (float) ($raw['tax'] ?? 0);
            $lineSubtotal = round(($unitCost * $quantity) - $discount + $tax, 2);
            $subtotal += $lineSubtotal;

            $items[] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_name' => $product->name,
                'sku' => $variant?->sku,
                'quantity' => $quantity,
                'received_quantity' => 0,
                'purchase_price' => $unitCost,
                'discount' => $discount,
                'tax' => $tax,
                'subtotal' => $lineSubtotal,
            ];
        }

        return [$items, round($subtotal, 2)];
    }
}
