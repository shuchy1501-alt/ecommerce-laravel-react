<?php

namespace Database\Seeders;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    /**
     * Each demo order: customer index, order status, payment status/method,
     * how many line items to add, and (optionally) a coupon code to apply.
     */
    private const ORDERS = [
        ['customer' => 0, 'status' => 'delivered', 'payment_status' => 'paid', 'method' => 'bkash', 'items' => 2, 'coupon' => 'WELCOME10'],
        ['customer' => 1, 'status' => 'delivered', 'payment_status' => 'paid', 'method' => 'cod', 'items' => 1, 'coupon' => null],
        ['customer' => 2, 'status' => 'shipped', 'payment_status' => 'paid', 'method' => 'card', 'items' => 3, 'coupon' => 'EID500'],
        ['customer' => 3, 'status' => 'processing', 'payment_status' => 'pending', 'method' => 'cod', 'items' => 2, 'coupon' => null],
        ['customer' => 4, 'status' => 'pending', 'payment_status' => 'pending', 'method' => 'nagad', 'items' => 1, 'coupon' => null],
    ];

    public function run(): void
    {
        $customers = Customer::orderBy('id')->get();
        $products = Product::with('variants')->where('status', true)->get();

        if ($customers->isEmpty() || $products->isEmpty()) {
            return;
        }

        foreach (self::ORDERS as $index => $config) {
            $customer = $customers->get($config['customer']);

            if (! $customer) {
                continue;
            }

            $orderNumber = 'ORD-' . str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT);

            if (Order::where('order_number', $orderNumber)->exists()) {
                continue;
            }

            DB::transaction(function () use ($customer, $config, $orderNumber, $products, $index) {
                $lineItems = $products->random(min($config['items'], $products->count()));

                $subtotal = 0;
                $preparedItems = [];

                foreach ($lineItems as $product) {
                    $variant = $product->variants->first();
                    $quantity = random_int(1, 2);
                    $unitPrice = (float) $product->selling_price;
                    $itemDiscount = 0;
                    $itemSubtotal = ($unitPrice * $quantity) - $itemDiscount;
                    $subtotal += $itemSubtotal;

                    $preparedItems[] = [
                        'product' => $product,
                        'variant' => $variant,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'discount' => $itemDiscount,
                        'subtotal' => $itemSubtotal,
                    ];
                }

                $shippingCharge = 60;
                $tax = 0;
                $couponDiscount = 0;
                $coupon = $config['coupon'] ? Coupon::where('code', $config['coupon'])->first() : null;

                if ($coupon && $coupon->isValidFor($subtotal)) {
                    $couponDiscount = $coupon->discount_type === 'percentage'
                        ? round($subtotal * (float) $coupon->discount_value / 100, 2)
                        : (float) $coupon->discount_value;

                    if ($coupon->maximum_discount !== null) {
                        $couponDiscount = min($couponDiscount, (float) $coupon->maximum_discount);
                    }
                }

                $total = $subtotal - $couponDiscount + $shippingCharge + $tax;
                $paidAmount = $config['payment_status'] === 'paid' ? $total : 0;
                $dueAmount = $total - $paidAmount;

                $order = Order::create([
                    'user_id' => null,
                    'customer_id' => $customer->id,
                    'order_number' => $orderNumber,
                    'order_date' => now()->subDays(20 - $index * 3)->toDateString(),
                    'subtotal' => $subtotal,
                    'discount' => 0,
                    'coupon_discount' => $couponDiscount,
                    'shipping_charge' => $shippingCharge,
                    'tax' => $tax,
                    'total' => $total,
                    'paid_amount' => $paidAmount,
                    'due_amount' => $dueAmount,
                    'payment_status' => $config['payment_status'],
                    'payment_method' => $config['method'],
                    'order_status' => $config['status'],
                    'shipping_name' => $customer->name,
                    'shipping_phone' => $customer->phone,
                    'shipping_email' => $customer->email,
                    'shipping_address' => $customer->address,
                    'shipping_division' => $customer->division,
                    'shipping_district' => $customer->district,
                    'shipping_area' => $customer->area,
                    'notes' => null,
                ]);

                foreach ($preparedItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product']->id,
                        'variant_id' => $item['variant']?->id,
                        'product_name' => $item['product']->name,
                        'sku' => $item['variant']?->sku ?? $item['product']->sku,
                        'size' => $item['variant']?->size,
                        'color' => $item['variant']?->color,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        // Phase 12 COGS relies on this historical snapshot —
                        // demo data mirrors the real checkout flow
                        // (OrderService), which copies the variant's
                        // purchase price at the moment of sale.
                        'cost_price' => $item['variant']?->purchase_price ?? $item['product']->purchase_price ?? 0,
                        'discount' => $item['discount'],
                        'subtotal' => $item['subtotal'],
                    ]);
                }

                if ($config['payment_status'] === 'paid') {
                    Payment::create([
                        'order_id' => $order->id,
                        'payment_method' => $config['method'],
                        'transaction_id' => strtoupper($config['method']) . '-' . $order->order_number,
                        'amount' => $paidAmount,
                        'status' => 'paid',
                        'paid_at' => $order->order_date,
                        'notes' => null,
                    ]);
                }

                Invoice::create([
                    'order_id' => $order->id,
                    'invoice_number' => 'INV-' . str_pad((string) $order->id, 5, '0', STR_PAD_LEFT),
                    'invoice_date' => $order->order_date,
                    'subtotal' => $subtotal,
                    'discount' => $couponDiscount,
                    'shipping' => $shippingCharge,
                    'tax' => $tax,
                    'total' => $total,
                    'paid_amount' => $paidAmount,
                    'due_amount' => $dueAmount,
                    'status' => $dueAmount > 0 ? 'partial' : ($paidAmount > 0 ? 'paid' : 'unpaid'),
                ]);

                $sale = Sale::create([
                    'order_id' => $order->id,
                    'customer_id' => $customer->id,
                    'subtotal' => $subtotal,
                    'discount' => $couponDiscount,
                    'shipping' => $shippingCharge,
                    'tax' => $tax,
                    'total' => $total,
                    'payment_status' => $config['payment_status'],
                    'sale_date' => $order->order_date,
                ]);

                // Demo orders are inserted directly rather than through
                // OrderService (which is what normally triggers this), so
                // record the matching ledger entry here for Phase 12's
                // finance dashboard/transactions to have realistic data.
                if ($config['status'] !== 'cancelled') {
                    app(\App\Services\FinancialReportService::class)->recordSaleTransaction($sale->fresh('order'));
                }

                if ($coupon && $couponDiscount > 0 && $customer->user_id) {
                    CouponUsage::firstOrCreate(
                        ['coupon_id' => $coupon->id, 'order_id' => $order->id],
                        [
                            'user_id' => $customer->user_id,
                            'discount_amount' => $couponDiscount,
                            'used_at' => $order->created_at,
                        ]
                    );
                    $coupon->increment('used_count');
                }
            });
        }
    }
}
