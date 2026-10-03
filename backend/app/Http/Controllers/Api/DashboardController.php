<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/stats
     * Cheap aggregate queries (counts/sums) — never loads full collections
     * into memory, so this stays fast as the catalog/order volume grows.
     */
    public function stats(): JsonResponse
    {
        $totalProducts = Product::count();
        $totalOrders = Order::count();

        $totalRevenue = Order::whereNotIn('order_status', ['cancelled'])->sum('total');

        $todayOrders = Order::whereDate('order_date', today())->count();
        $todayRevenue = Order::whereDate('order_date', today())
            ->whereNotIn('order_status', ['cancelled'])
            ->sum('total');

        $pendingOrders = Order::where('order_status', 'pending')->count();
        $processingOrders = Order::whereIn('order_status', ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'])->count();

        $lowStockCount = ProductVariant::whereColumn('stock', '<=', 'minimum_stock')->count();

        $recentOrders = Order::with('customer')
            ->latest('order_date')
            ->limit(5)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer?->name,
                'total' => $order->total,
                'order_status' => $order->order_status,
                'payment_status' => $order->payment_status,
                'order_date' => $order->order_date,
            ]);

        $lowStockVariants = ProductVariant::with('product:id,name')
            ->whereColumn('stock', '<=', 'minimum_stock')
            ->orderBy('stock')
            ->limit(5)
            ->get()
            ->map(fn ($variant) => [
                'id' => $variant->id,
                'product_name' => $variant->product?->name,
                'sku' => $variant->sku,
                'size' => $variant->size,
                'color' => $variant->color,
                'stock' => $variant->stock,
                'minimum_stock' => $variant->minimum_stock,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard stats fetched successfully',
            'data' => [
                'total_products' => $totalProducts,
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
                'today_orders' => $todayOrders,
                'today_revenue' => $todayRevenue,
                'pending_orders' => $pendingOrders,
                'processing_orders' => $processingOrders,
                'low_stock_count' => $lowStockCount,
                'recent_orders' => $recentOrders,
                'low_stock_variants' => $lowStockVariants,
            ],
        ]);
    }
}
