<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Sale;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SalesService
{
    public function __construct(
        private readonly FinancialReportService $financialReportService,
    ) {}

    public function recordSale(Order $order): Sale
    {
        if ($order->sale) {
            return $order->sale;
        }

        $sale = Sale::create([
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'subtotal' => $order->subtotal,
            'discount' => $order->coupon_discount,
            'shipping' => $order->shipping_charge,
            'tax' => $order->tax,
            'total' => $order->total,
            'payment_status' => $order->payment_status,
            'sale_date' => $order->order_date,
        ]);

        $this->financialReportService->recordSaleTransaction($sale->fresh('order'));

        return $sale;
    }

    /**
     * Revenue = subtotal - discount + shipping + tax (spec section 17) —
     * kept separate from profit, which needs COGS/expenses from later phases.
     */
    public function getSalesSummary(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = Sale::query();

        if ($dateFrom) {
            $query->whereDate('sale_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('sale_date', '<=', $dateTo);
        }

        $base = (clone $query)->selectRaw('
            COUNT(*) as total_sales,
            COALESCE(SUM(subtotal), 0) as total_subtotal,
            COALESCE(SUM(discount), 0) as total_discount,
            COALESCE(SUM(shipping), 0) as total_shipping,
            COALESCE(SUM(tax), 0) as total_tax,
            COALESCE(SUM(total), 0) as total_revenue
        ')->first();

        $today = Sale::whereDate('sale_date', Carbon::today())->sum('total');
        $thisWeek = Sale::whereBetween('sale_date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->sum('total');
        $thisMonth = Sale::whereMonth('sale_date', Carbon::now()->month)->whereYear('sale_date', Carbon::now()->year)->sum('total');

        $totalOrders = Order::count();
        $paidOrders = Order::where('payment_status', 'paid')->count();
        $pendingOrders = Order::where('payment_status', 'pending')->count();
        $cancelledOrders = Order::where('order_status', 'cancelled')->count();

        return [
            'total_sales' => (int) $base->total_sales,
            'total_orders' => $totalOrders,
            'total_revenue' => (float) $base->total_revenue,
            'total_discount' => (float) $base->total_discount,
            'total_shipping' => (float) $base->total_shipping,
            'total_tax' => (float) $base->total_tax,
            'today_sales' => (float) $today,
            'this_week_sales' => (float) $thisWeek,
            'this_month_sales' => (float) $thisMonth,
            'paid_orders' => $paidOrders,
            'pending_orders' => $pendingOrders,
            'cancelled_orders' => $cancelledOrders,
        ];
    }

    public function getSalesByDate(string $dateFrom, string $dateTo): array
    {
        return Sale::whereBetween('sale_date', [$dateFrom, $dateTo])
            ->selectRaw('sale_date, COUNT(*) as orders, SUM(total) as revenue')
            ->groupBy('sale_date')
            ->orderBy('sale_date')
            ->get()
            ->toArray();
    }

    public function getSalesByProduct(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('sales', 'sales.order_id', '=', 'orders.id')
            ->selectRaw('order_items.product_name, SUM(order_items.quantity) as units_sold, SUM(order_items.subtotal) as revenue')
            ->groupBy('order_items.product_name')
            ->orderByDesc('revenue');

        if ($dateFrom) {
            $query->whereDate('sales.sale_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('sales.sale_date', '<=', $dateTo);
        }

        return $query->limit(20)->get()->toArray();
    }
}
