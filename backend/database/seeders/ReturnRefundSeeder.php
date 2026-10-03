<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Refund;
use App\Models\ReturnItem;
use App\Models\ReturnRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReturnRefundSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'customer@fashionmart.test')->first();

        if (! $user) {
            return;
        }

        $order = Order::where('order_status', 'delivered')
            ->whereHas('customer', fn ($q) => $q->where('user_id', $user->id))
            ->with('items', 'payments')
            ->first();

        if (! $order || $order->items->isEmpty()) {
            return;
        }

        if (ReturnRequest::where('order_id', $order->id)->exists()) {
            return;
        }

        DB::transaction(function () use ($order, $user) {
            $item = $order->items->first();

            $return = ReturnRequest::create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'return_number' => 'RET-' . str_pad((string) $order->id, 5, '0', STR_PAD_LEFT),
                'reason' => 'Wrong size received',
                'description' => 'The size does not match what was ordered.',
                'status' => 'completed',
                'requested_at' => now()->subDays(3),
                'approved_at' => now()->subDays(2),
                'completed_at' => now()->subDay(),
            ]);

            ReturnItem::create([
                'return_id' => $return->id,
                'order_item_id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'quantity' => 1,
                'reason' => 'Size mismatch',
            ]);

            $payment = $order->payments->first();
            $refundAmount = (float) $item->unit_price;

            Refund::create([
                'order_id' => $order->id,
                'return_id' => $return->id,
                'payment_id' => $payment?->id,
                'refund_method' => $payment?->payment_method ?? 'bkash',
                'amount' => $refundAmount,
                'transaction_id' => 'RFD-' . $return->return_number,
                'status' => 'completed',
                'refunded_at' => now()->subDay(),
                'notes' => 'Refunded to original payment method after item received back.',
            ]);
        });
    }
}
