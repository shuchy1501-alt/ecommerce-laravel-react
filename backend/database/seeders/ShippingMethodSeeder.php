<?php

namespace Database\Seeders;

use App\Models\ShippingMethod;
use Illuminate\Database\Seeder;

class ShippingMethodSeeder extends Seeder
{
    private const METHODS = [
        ['name' => 'Standard Delivery', 'zone' => 'Inside Dhaka', 'price' => 60, 'estimated_days' => '2-3 days', 'sort_order' => 1],
        ['name' => 'Standard Delivery', 'zone' => 'Outside Dhaka', 'price' => 120, 'estimated_days' => '4-6 days', 'sort_order' => 2],
        ['name' => 'Express Delivery', 'zone' => 'Nationwide', 'price' => 150, 'estimated_days' => '1-2 days', 'sort_order' => 3],
    ];

    public function run(): void
    {
        foreach (self::METHODS as $method) {
            ShippingMethod::firstOrCreate(
                ['name' => $method['name'], 'zone' => $method['zone']],
                [
                    'description' => "{$method['name']} — {$method['zone']}",
                    'price' => $method['price'],
                    'estimated_days' => $method['estimated_days'],
                    'status' => true,
                    'sort_order' => $method['sort_order'],
                ]
            );
        }
    }
}
