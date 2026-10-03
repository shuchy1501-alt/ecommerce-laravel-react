<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoCustomerAccountSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'customer@fashionmart.test'],
            ['name' => 'Rafiul Islam', 'password' => Hash::make('password')]
        );

        if (! $user->hasRole('Customer')) {
            $user->assignRole('Customer');
        }

        // Link this login to the first seeded customer profile (Rafiul Islam)
        // so demo orders, reviews, and returns can reference a real user_id.
        Customer::where('email', 'rafiul@example.com')
            ->whereNull('user_id')
            ->update(['user_id' => $user->id]);
    }
}
