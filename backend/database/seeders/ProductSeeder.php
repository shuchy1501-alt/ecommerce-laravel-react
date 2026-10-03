<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Subcategory;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    // name, category, subcategory, brand, purchase_price, selling_price, sizes[], colors[]
    private const PRODUCTS = [
        ['Classic Crew Neck T-Shirt', 'Men', 'T-Shirts', 'Urban Wear', 350, 650, ['S', 'M', 'L', 'XL'], ['Black', 'White']],
        ['Slim Fit Formal Shirt', 'Men', 'Shirts', 'Elegance', 700, 1400, ['S', 'M', 'L', 'XL'], ['Sky Blue', 'White']],
        ['Straight Fit Denim Jeans', 'Men', 'Jeans', 'TrendLine', 900, 1800, ['30', '32', '34', '36'], ['Blue', 'Black']],
        ['Chino Cargo Pants', 'Men', 'Pants', 'StreetMode', 800, 1600, ['30', '32', '34'], ['Khaki', 'Olive']],
        ['Winter Bomber Jacket', 'Men', 'Jackets', 'Urban Wear', 1500, 2800, ['M', 'L', 'XL'], ['Black', 'Navy']],
        ['Fleece Pullover Hoodie', 'Men', 'Hoodies', 'StreetMode', 750, 1450, ['S', 'M', 'L', 'XL'], ['Grey', 'Black']],
        ['Embroidered Cotton Panjabi', 'Men', 'Panjabi', 'Elegance', 1000, 2100, ['M', 'L', 'XL'], ['White', 'Cream']],
        ['Floral Maxi Dress', 'Women', 'Dresses', 'StyleHub', 900, 1900, ['S', 'M', 'L'], ['Red', 'Blue']],
        ['Casual Cotton Top', 'Women', 'Tops', 'TrendLine', 400, 850, ['S', 'M', 'L'], ['Pink', 'White']],
        ['Handwoven Cotton Saree', 'Women', 'Sarees', 'Elegance', 1500, 3200, ['Free Size'], ['Maroon', 'Green']],
        ['Embroidered Salwar Kameez', 'Women', 'Salwar Kameez', 'Elegance', 1300, 2600, ['S', 'M', 'L'], ['Purple', 'Black']],
        ['Printed Abaya', 'Women', 'Abaya', 'StyleHub', 1200, 2400, ['M', 'L', 'XL'], ['Black']],
        ['Skinny Fit Jeans', 'Women', 'Jeans', 'TrendLine', 850, 1700, ['28', '30', '32'], ['Blue', 'Black']],
        ['Boys Graphic T-Shirt', 'Kids', 'Boys', 'StreetMode', 250, 500, ['4-5Y', '6-7Y', '8-9Y'], ['Blue', 'Red']],
        ['Girls Party Frock', 'Kids', 'Girls', 'StyleHub', 500, 1100, ['2-3Y', '4-5Y', '6-7Y'], ['Pink', 'Yellow']],
        ['Baby Cotton Romper', 'Kids', 'Baby Clothing', 'Urban Wear', 300, 650, ['0-6M', '6-12M'], ['White', 'Green']],
        ['Running Sneakers', 'Shoes', 'Sneakers', 'TrendLine', 1200, 2400, ['40', '41', '42', '43'], ['White', 'Black']],
        ['Leather Formal Shoes', 'Shoes', 'Formal Shoes', 'Elegance', 1500, 3000, ['40', '41', '42', '43'], ['Black', 'Brown']],
        ['Comfort Sandals', 'Shoes', 'Sandals', 'Urban Wear', 500, 1000, ['40', '41', '42'], ['Brown', 'Black']],
        ['Ankle Boots', 'Shoes', 'Boots', 'StreetMode', 1600, 3200, ['40', '41', '42'], ['Black', 'Tan']],
        ['Analog Wrist Watch', 'Accessories', 'Watches', 'Elegance', 1200, 2500, ['Free Size'], ['Silver', 'Gold']],
        ['Leather Belt', 'Accessories', 'Belts', 'Urban Wear', 350, 700, ['Free Size'], ['Black', 'Brown']],
        ['Classic Sunglasses', 'Accessories', 'Sunglasses', 'TrendLine', 400, 900, ['Free Size'], ['Black']],
    ];

    public function run(): void
    {
        $unit = Unit::where('name', 'Piece')->firstOrFail();

        foreach (self::PRODUCTS as $index => $data) {
            [$name, $categoryName, $subcategoryName, $brandName, $purchasePrice, $sellingPrice, $sizes, $colors] = $data;

            $category = Category::where('name', $categoryName)->first();
            $subcategory = Subcategory::where('category_id', $category?->id)
                ->where('name', $subcategoryName)
                ->first();
            $brand = Brand::where('name', $brandName)->first();

            $sku = 'FM-' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT);

            $product = Product::firstOrCreate(
                ['sku' => $sku],
                [
                    'category_id' => $category?->id,
                    'subcategory_id' => $subcategory?->id,
                    'brand_id' => $brand?->id,
                    'unit_id' => $unit->id,
                    'name' => $name,
                    'slug' => Str::slug($name) . '-' . strtolower($sku),
                    'description' => "{$name} from {$brandName} — premium quality fabric, comfortable fit, perfect for everyday wear.",
                    'purchase_price' => $purchasePrice,
                    'selling_price' => $sellingPrice,
                    'discount_type' => null,
                    'discount_value' => 0,
                    'status' => true,
                    'featured' => $index % 5 === 0,
                    'new_arrival' => $index % 3 === 0,
                    'best_seller' => $index % 4 === 0,
                ]
            );

            $variantIndex = 1;

            foreach ($colors as $color) {
                foreach ($sizes as $size) {
                    $variantSku = $sku . '-V' . str_pad((string) $variantIndex, 2, '0', STR_PAD_LEFT);

                    ProductVariant::firstOrCreate(
                        [
                            'product_id' => $product->id,
                            'size' => $size,
                            'color' => $color,
                        ],
                        [
                            'sku' => $variantSku,
                            'purchase_price' => $purchasePrice,
                            'selling_price' => $sellingPrice,
                            'stock' => rand(10, 60),
                            'minimum_stock' => 5,
                            'status' => true,
                        ]
                    );

                    $variantIndex++;
                }
            }
        }
    }
}
