<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * Create a product with optional variants and images in one transaction.
     */
    public function create(array $data, ?int $userId = null): Product
    {
        return DB::transaction(function () use ($data, $userId) {
            $variants = $data['variants'] ?? [];
            $images = $data['images'] ?? [];
            unset($data['variants'], $data['images']);

            $data['slug'] = $data['slug'] ?? $this->uniqueSlug($data['name']);
            $data['created_by'] = $userId;
            $data['updated_by'] = $userId;

            $product = Product::create($data);

            foreach ($variants as $variantData) {
                $this->createVariant($product, $variantData);
            }

            foreach ($images as $index => $image) {
                if ($image instanceof UploadedFile) {
                    $this->storeImage($product, $image, $index === 0);
                }
            }

            return $product;
        });
    }

    public function update(Product $product, array $data, ?int $userId = null): Product
    {
        return DB::transaction(function () use ($product, $data, $userId) {
            $variants = $data['variants'] ?? null;
            $newImages = $data['images'] ?? [];
            unset($data['variants'], $data['images']);

            if (isset($data['name']) && $data['name'] !== $product->name && empty($data['slug'])) {
                $data['slug'] = $this->uniqueSlug($data['name'], $product->id);
            }

            $data['updated_by'] = $userId;
            $product->update($data);

            if ($variants !== null) {
                $this->syncVariants($product, $variants);
            }

            foreach ($newImages as $image) {
                if ($image instanceof UploadedFile) {
                    $this->storeImage($product, $image, false);
                }
            }

            return $product->fresh();
        });
    }

    public function createVariant(Product $product, array $variantData): ProductVariant
    {
        return $product->variants()->create([
            'sku' => $variantData['sku'] ?? $this->generateVariantSku($product, $variantData['color'] ?? null, $variantData['size'] ?? null),
            'size' => $variantData['size'] ?? null,
            'color' => $variantData['color'] ?? null,
            'purchase_price' => $variantData['purchase_price'] ?? $product->purchase_price,
            'selling_price' => $variantData['selling_price'] ?? $product->selling_price,
            'discount_type' => $variantData['discount_type'] ?? null,
            'discount_value' => $variantData['discount_value'] ?? 0,
            'stock' => $variantData['stock'] ?? 0,
            'minimum_stock' => $variantData['minimum_stock'] ?? 0,
            'status' => $variantData['status'] ?? true,
        ]);
    }

    /**
     * Replace the product's variant set: update existing (by id), create new
     * (no id), and delete any not present in the incoming payload.
     */
    public function syncVariants(Product $product, array $variants): void
    {
        $keepIds = [];

        foreach ($variants as $variantData) {
            if (! empty($variantData['id'])) {
                $variant = $product->variants()->find($variantData['id']);
                if ($variant) {
                    $variant->update([
                        'sku' => $variantData['sku'] ?? $variant->sku,
                        'size' => $variantData['size'] ?? $variant->size,
                        'color' => $variantData['color'] ?? $variant->color,
                        'purchase_price' => $variantData['purchase_price'] ?? $variant->purchase_price,
                        'selling_price' => $variantData['selling_price'] ?? $variant->selling_price,
                        'discount_type' => $variantData['discount_type'] ?? $variant->discount_type,
                        'discount_value' => $variantData['discount_value'] ?? $variant->discount_value,
                        'stock' => $variantData['stock'] ?? $variant->stock,
                        'minimum_stock' => $variantData['minimum_stock'] ?? $variant->minimum_stock,
                        'status' => $variantData['status'] ?? $variant->status,
                    ]);
                    $keepIds[] = $variant->id;
                }
                continue;
            }

            $keepIds[] = $this->createVariant($product, $variantData)->id;
        }

        $product->variants()->whereNotIn('id', $keepIds)->delete();
    }

    public function storeImage(Product $product, UploadedFile $file, bool $isPrimary = false, ?int $variantId = null): void
    {
        $path = $file->store('products', 'public');

        if ($isPrimary) {
            $product->images()->update(['is_primary' => false]);
        }

        $product->images()->create([
            'variant_id' => $variantId,
            'image' => $path,
            'is_primary' => $isPrimary,
            'sort_order' => $product->images()->max('sort_order') + 1,
        ]);
    }

    public function deleteImage(Product $product, int $imageId): void
    {
        $image = $product->images()->find($imageId);

        if (! $image) {
            return;
        }

        Storage::disk('public')->delete($image->image);
        $image->delete();
    }

    /**
     * Duplicate a product with a new SKU/slug and copy variants with fresh
     * unique SKUs. Images are referenced (not re-uploaded).
     */
    public function duplicate(Product $product, ?int $userId = null): Product
    {
        return DB::transaction(function () use ($product, $userId) {
            $newName = "{$product->name} Copy";

            $copy = $product->replicate(['slug', 'sku']);
            $copy->name = $newName;
            $copy->slug = $this->uniqueSlug($newName);
            $copy->sku = $this->uniqueSku($product->sku);
            $copy->status = false;
            $copy->created_by = $userId;
            $copy->updated_by = $userId;
            $copy->save();

            foreach ($product->variants as $variant) {
                $copy->variants()->create([
                    'sku' => $this->uniqueVariantSku($variant->sku),
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'purchase_price' => $variant->purchase_price,
                    'selling_price' => $variant->selling_price,
                    'discount_type' => $variant->discount_type,
                    'discount_value' => $variant->discount_value,
                    'stock' => 0,
                    'minimum_stock' => $variant->minimum_stock,
                    'status' => $variant->status,
                ]);
            }

            foreach ($product->images as $image) {
                $copy->images()->create([
                    'image' => $image->image,
                    'is_primary' => $image->is_primary,
                    'sort_order' => $image->sort_order,
                ]);
            }

            return $copy;
        });
    }

    public function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            Product::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    public function uniqueSku(string $baseSku): string
    {
        $sku = $baseSku . '-COPY';
        $i = 1;

        while (Product::where('sku', $sku)->exists()) {
            $sku = "{$baseSku}-COPY-{$i}";
            $i++;
        }

        return $sku;
    }

    private function uniqueVariantSku(string $baseSku): string
    {
        $sku = $baseSku . '-COPY';
        $i = 1;

        while (ProductVariant::where('sku', $sku)->exists()) {
            $sku = "{$baseSku}-COPY-{$i}";
            $i++;
        }

        return $sku;
    }

    public function generateVariantSku(Product $product, ?string $color, ?string $size): string
    {
        $base = strtoupper(Str::slug($product->sku, ''));
        $colorPart = $color ? strtoupper(substr(Str::slug($color, ''), 0, 3)) : '';
        $sizePart = $size ? strtoupper($size) : '';

        $sku = trim("{$base}-{$colorPart}-{$sizePart}", '-');
        $original = $sku;
        $i = 1;

        while (ProductVariant::where('sku', $sku)->exists()) {
            $sku = "{$original}-{$i}";
            $i++;
        }

        return $sku;
    }
}
