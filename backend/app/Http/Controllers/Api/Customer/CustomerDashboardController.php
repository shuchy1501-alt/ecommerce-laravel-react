<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Real (not fake) counts scoped to the authenticated customer. Order data
 * naturally reads as 0 until Phase 9 wires up order creation — we never
 * fabricate order history to make the dashboard look populated.
 */
class CustomerDashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $totalOrders = Order::where('user_id', $userId)->count();
        $pendingOrders = Order::where('user_id', $userId)
            ->whereIn('order_status', ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'])
            ->count();
        $completedOrders = Order::where('user_id', $userId)->where('order_status', 'delivered')->count();
        $wishlistCount = $request->user()->wishlist?->items()->count() ?? 0;

        $recentOrders = Order::where('user_id', $userId)
            ->latest('order_date')
            ->limit(5)
            ->get(['id', 'order_number', 'order_date', 'total', 'order_status']);

        return $this->success([
            'total_orders' => $totalOrders,
            'pending_orders' => $pendingOrders,
            'completed_orders' => $completedOrders,
            'wishlist_count' => $wishlistCount,
            'recent_orders' => $recentOrders,
        ], 'Dashboard stats retrieved.');
    }
}
