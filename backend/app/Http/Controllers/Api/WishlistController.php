<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistResource;
use App\Models\Product;
use App\Models\Wishlist;
use App\Models\WishlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Every method resolves the current user's own Wishlist row first (creating
 * it on first use) and only ever touches items through that relationship —
 * so a wishlist item belonging to another customer is never reachable here.
 */
class WishlistController extends Controller
{
    private function wishlistFor(Request $request): Wishlist
    {
        return Wishlist::firstOrCreate(['user_id' => $request->user()->id]);
    }

    public function index(Request $request): JsonResponse
    {
        $wishlist = $this->wishlistFor($request);

        $items = $wishlist->items()
            ->with([
                'product' => fn ($q) => $q->withTrashed()->with(['brand', 'images']),
                'variant',
            ])
            ->latest()
            ->get();

        return $this->success(WishlistResource::collection($items), 'Wishlist retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'variant_id' => ['nullable', 'exists:product_variants,id'],
        ]);

        $wishlist = $this->wishlistFor($request);

        $exists = $wishlist->items()
            ->where('product_id', $data['product_id'])
            ->where('variant_id', $data['variant_id'] ?? null)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'product_id' => ['This product is already in your wishlist.'],
            ]);
        }

        $item = $wishlist->items()->create([
            'product_id' => $data['product_id'],
            'variant_id' => $data['variant_id'] ?? null,
        ]);

        $item->load(['product' => fn ($q) => $q->withTrashed()->with(['brand', 'images']), 'variant']);

        return $this->success(new WishlistResource($item), 'Added to wishlist.', 201);
    }

    public function destroy(Request $request, int $product): JsonResponse
    {
        $wishlist = $this->wishlistFor($request);

        $deleted = $wishlist->items()->where('product_id', $product)->delete();

        if (! $deleted) {
            return $this->error('This product is not in your wishlist.', 404, null, 'NOT_FOUND');
        }

        return $this->success(null, 'Removed from wishlist.');
    }

    public function check(Request $request, int $product): JsonResponse
    {
        $wishlist = $this->wishlistFor($request);
        $inWishlist = $wishlist->items()->where('product_id', $product)->exists();

        return $this->success(['in_wishlist' => $inWishlist], 'Checked.');
    }

    public function toggle(Request $request, int $product): JsonResponse
    {
        Product::findOrFail($product);
        $wishlist = $this->wishlistFor($request);
        $item = $wishlist->items()->where('product_id', $product)->first();

        if ($item) {
            $item->delete();

            return $this->success(['in_wishlist' => false], 'Removed from wishlist.');
        }

        $wishlist->items()->create(['product_id' => $product]);

        return $this->success(['in_wishlist' => true], 'Added to wishlist.');
    }
}
