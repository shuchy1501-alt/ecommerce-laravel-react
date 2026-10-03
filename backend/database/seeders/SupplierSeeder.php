<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    private const SUPPLIERS = [
        ['name' => 'Md. Kamal Hossain', 'company_name' => 'Dhaka Textile Suppliers', 'phone' => '01911000001', 'email' => 'contact@dhakatextile.example'],
        ['name' => 'Abdul Karim', 'company_name' => 'Karim Garments Trading', 'phone' => '01911000002', 'email' => 'contact@karimgarments.example'],
        ['name' => 'Salma Begum', 'company_name' => 'Salma Fashion Imports', 'phone' => '01911000003', 'email' => 'contact@salmafashion.example'],
    ];

    public function run(): void
    {
        foreach (self::SUPPLIERS as $supplier) {
            Supplier::firstOrCreate(
                ['email' => $supplier['email']],
                [
                    'name' => $supplier['name'],
                    'company_name' => $supplier['company_name'],
                    'phone' => $supplier['phone'],
                    'address' => 'Dhaka, Bangladesh',
                    'opening_balance' => 0,
                    'status' => true,
                ]
            );
        }
    }
}
