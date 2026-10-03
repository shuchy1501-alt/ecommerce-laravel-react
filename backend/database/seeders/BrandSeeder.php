<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    private const BRANDS = [
        'Urban Wear',
        'StyleHub',
        'TrendLine',
        'Elegance',
        'StreetMode',
    ];

    public function run(): void
    {
        foreach (self::BRANDS as $brandName) {
            Brand::firstOrCreate(
                ['slug' => Str::slug($brandName)],
                ['name' => $brandName, 'status' => true]
            );
        }
    }
}
