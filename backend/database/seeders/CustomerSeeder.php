<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    private const CUSTOMERS = [
        ['name' => 'Rafiul Islam', 'email' => 'rafiul@example.com', 'phone' => '01711000001', 'division' => 'Dhaka', 'district' => 'Dhaka', 'area' => 'Mirpur'],
        ['name' => 'Nusrat Jahan', 'email' => 'nusrat@example.com', 'phone' => '01711000002', 'division' => 'Chattogram', 'district' => 'Chattogram', 'area' => 'Agrabad'],
        ['name' => 'Tanvir Ahmed', 'email' => 'tanvir@example.com', 'phone' => '01711000003', 'division' => 'Dhaka', 'district' => 'Gazipur', 'area' => 'Tongi'],
        ['name' => 'Farhana Akter', 'email' => 'farhana@example.com', 'phone' => '01711000004', 'division' => 'Khulna', 'district' => 'Khulna', 'area' => 'Sonadanga'],
        ['name' => 'Shakib Hasan', 'email' => 'shakib@example.com', 'phone' => '01711000005', 'division' => 'Rajshahi', 'district' => 'Rajshahi', 'area' => 'Boalia'],
    ];

    public function run(): void
    {
        foreach (self::CUSTOMERS as $customer) {
            Customer::firstOrCreate(
                ['email' => $customer['email']],
                [
                    'name' => $customer['name'],
                    'phone' => $customer['phone'],
                    'address' => $customer['area'] . ', ' . $customer['district'],
                    'division' => $customer['division'],
                    'district' => $customer['district'],
                    'area' => $customer['area'],
                    'postal_code' => '1200',
                    'status' => true,
                ]
            );
        }
    }
}
