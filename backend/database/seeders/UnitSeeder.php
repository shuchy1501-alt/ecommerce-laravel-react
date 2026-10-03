<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    private const UNITS = [
        ['name' => 'Piece', 'short_name' => 'pc'],
        ['name' => 'Pair', 'short_name' => 'pr'],
        ['name' => 'Set', 'short_name' => 'set'],
    ];

    public function run(): void
    {
        foreach (self::UNITS as $unit) {
            Unit::firstOrCreate(
                ['name' => $unit['name']],
                ['short_name' => $unit['short_name'], 'status' => true]
            );
        }
    }
}
