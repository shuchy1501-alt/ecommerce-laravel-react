<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    private const SAMPLE_TEXT = [
        5 => "Great quality and fits perfectly. Will order again!",
        4 => "Good product overall, delivery was a bit slow though.",
    ];

    public function run(): void
    {
        $user = User::where('email', 'customer@fashionmart.test')->first();

        if (! $user) {
            return;
        }

        $deliveredOrders = Order::where('user_id', $user->id)
            ->orWhereHas('customer', fn ($q) => $q->where('user_id', $user->id))
            ->where('order_status', 'delivered')
            ->with('items')
            ->get();

        $ratings = [5, 4];
        $i = 0;

        foreach ($deliveredOrders as $order) {
            foreach ($order->items as $item) {
                $rating = $ratings[$i % count($ratings)];

                Review::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'product_id' => $item->product_id,
                        'order_id' => $order->id,
                    ],
                    [
                        'rating' => $rating,
                        'review' => self::SAMPLE_TEXT[$rating] ?? 'Nice product, satisfied with the purchase.',
                        'image' => null,
                        'status' => 'approved',
                    ]
                );

                $i++;
            }
        }
    }
}
