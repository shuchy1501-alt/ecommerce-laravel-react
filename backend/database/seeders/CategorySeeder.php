<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    private const DATA = [
        'Men' => ['T-Shirts', 'Shirts', 'Jeans', 'Pants', 'Jackets', 'Hoodies', 'Panjabi'],
        'Women' => ['Dresses', 'Tops', 'Sarees', 'Salwar Kameez', 'Abaya', 'Jeans'],
        'Kids' => ['Boys', 'Girls', 'Baby Clothing'],
        'Shoes' => ['Sneakers', 'Formal Shoes', 'Sandals', 'Heels', 'Boots'],
        'Bags' => ['Backpacks', 'Handbags', 'Travel Bags'],
        'Accessories' => ['Watches', 'Bags', 'Belts', 'Sunglasses', 'Caps', 'Jewelry'],
    ];

    public function run(): void
    {
        $sortOrder = 0;

        foreach (self::DATA as $categoryName => $subcategories) {
            $category = Category::firstOrCreate(
                ['slug' => Str::slug($categoryName)],
                [
                    'name' => $categoryName,
                    'status' => true,
                    'sort_order' => $sortOrder++,
                ]
            );

            $subOrder = 0;

            foreach ($subcategories as $subcategoryName) {
                Subcategory::firstOrCreate(
                    [
                        'category_id' => $category->id,
                        'slug' => Str::slug($categoryName . '-' . $subcategoryName),
                    ],
                    [
                        'name' => $subcategoryName,
                        'status' => true,
                        'sort_order' => $subOrder++,
                    ]
                );
            }
        }
    }
}
