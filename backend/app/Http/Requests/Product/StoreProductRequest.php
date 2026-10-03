<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'subcategory_id' => ['nullable', 'exists:subcategories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'unit_id' => ['required', 'exists:units,id'],

            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:500'],

            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'discount_type' => ['nullable', 'in:flat,percentage'],
            'discount_value' => [
                'nullable', 'numeric', 'min:0',
                function ($attribute, $value, $fail) {
                    if ($this->input('discount_type') === 'flat' && $value > $this->input('selling_price')) {
                        $fail('The discount cannot exceed the selling price.');
                    }
                    if ($this->input('discount_type') === 'percentage' && $value > 100) {
                        $fail('The percentage discount cannot exceed 100.');
                    }
                },
            ],

            'status' => ['nullable', 'boolean'],
            'featured' => ['nullable', 'boolean'],
            'new_arrival' => ['nullable', 'boolean'],
            'best_seller' => ['nullable', 'boolean'],

            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],

            'images' => ['nullable', 'array', 'max:6'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            'variants' => ['nullable', 'array'],
            'variants.*.sku' => ['nullable', 'string', 'distinct', 'unique:product_variants,sku'],
            'variants.*.size' => ['nullable', 'string', 'max:50'],
            'variants.*.color' => ['nullable', 'string', 'max:50'],
            'variants.*.purchase_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.selling_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
            'variants.*.minimum_stock' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $variants = $this->input('variants', []);
            $combos = [];

            foreach ($variants as $index => $variant) {
                $key = ($variant['size'] ?? '') . '|' . ($variant['color'] ?? '');
                if (isset($combos[$key])) {
                    $validator->errors()->add("variants.{$index}.size", 'Duplicate size/color combination.');
                }
                $combos[$key] = true;
            }
        });
    }
}
