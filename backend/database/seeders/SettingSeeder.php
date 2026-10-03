<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    private const SETTINGS = [
        ['key' => 'store_name', 'value' => 'FashionMart', 'type' => 'string', 'group' => 'general'],
        ['key' => 'store_email', 'value' => 'support@fashionmart.test', 'type' => 'string', 'group' => 'general'],
        ['key' => 'store_phone', 'value' => '01700000000', 'type' => 'string', 'group' => 'general'],
        ['key' => 'store_address', 'value' => 'House 12, Road 5, Dhanmondi, Dhaka', 'type' => 'string', 'group' => 'general'],
        ['key' => 'currency', 'value' => 'BDT', 'type' => 'string', 'group' => 'general'],
        ['key' => 'shipping_charge', 'value' => '60', 'type' => 'float', 'group' => 'checkout'],
        ['key' => 'tax_rate', 'value' => '0', 'type' => 'float', 'group' => 'checkout'],
        ['key' => 'return_days', 'value' => '7', 'type' => 'integer', 'group' => 'policy'],
    ];

    public function run(): void
    {
        foreach (self::SETTINGS as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                    'group' => $setting['group'],
                ]
            );
        }
    }
}
