<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    private const COUPONS = [
        [
            'code' => 'WELCOME10',
            'name' => 'Welcome Discount',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'minimum_order_amount' => 1000,
            'maximum_discount' => 500,
            'usage_limit' => 500,
            'days_valid' => 90,
        ],
        [
            'code' => 'EID500',
            'name' => 'Eid Special Flat Discount',
            'discount_type' => 'flat',
            'discount_value' => 500,
            'minimum_order_amount' => 3000,
            'maximum_discount' => null,
            'usage_limit' => 200,
            'days_valid' => 30,
        ],
        [
            'code' => 'FASHION20',
            'name' => 'Seasonal Sale',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'minimum_order_amount' => 2000,
            'maximum_discount' => 1000,
            'usage_limit' => null,
            'days_valid' => 15,
        ],
    ];

    public function run(): void
    {
        foreach (self::COUPONS as $coupon) {
            Coupon::firstOrCreate(
                ['code' => $coupon['code']],
                [
                    'name' => $coupon['name'],
                    'discount_type' => $coupon['discount_type'],
                    'discount_value' => $coupon['discount_value'],
                    'minimum_order_amount' => $coupon['minimum_order_amount'],
                    'maximum_discount' => $coupon['maximum_discount'],
                    'usage_limit' => $coupon['usage_limit'],
                    'used_count' => 0,
                    'start_date' => now()->subDays(5)->toDateString(),
                    'end_date' => now()->addDays($coupon['days_valid'])->toDateString(),
                    'status' => true,
                ]
            );
        }
    }
}
