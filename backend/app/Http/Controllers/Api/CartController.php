<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\ApplyCouponRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\Wishlist;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Guests are identified by the X-Guest-Cart-Id header (see
 * CartService::resolveCart) rather than a PHP session, matching this app's
 * pure Bearer-token auth. Every item mutation re-derives price/stock from
 * the database via CartService — nothing here trusts request input for
 * money or availability.
 */
class CartController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);
        $cart = $this->cartService->loadCart($cart);

        return $this->success(new CartResource($cart), 'Cart retrieved.');
    }

    public function addItem(AddCartItemRequest $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);

        $this->cartService->addItem(
            $cart,
            (int) $request->validated('product_id'),
            $request->validated('variant_id') ? (int) $request->validated('variant_id') : null,
            (int) $request->validated('quantity')
        );

        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Added to cart.', 201);
    }

    public function updateItem(UpdateCartItemRequest $request, int $id): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);
        $item = $cart->items()->findOrFail($id);

        $this->cartService->updateItemQuantity($cart, $item, (int) $request->validated('quantity'));
        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Cart updated.');
    }

    public function removeItem(Request $request, int $id): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);
        $item = $cart->items()->findOrFail($id);

        $this->cartService->removeItem($item);
        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Product removed from cart.');
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);
        $this->cartService->clearCart($cart);
        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Cart cleared.');
    }

    public function moveToWishlist(Request $request, int $id): JsonResponse
    {
        $user = $request->user('sanctum');

        if (! $user) {
            return $this->error('Please login to save items to your wishlist.', 401, null, 'UNAUTHENTICATED');
        }

        $cart = $this->cartService->resolveCart($request);
        $item = $cart->items()->findOrFail($id);

        $wishlist = Wishlist::firstOrCreate(['user_id' => $user->id]);
        $exists = $wishlist->items()
            ->where('product_id', $item->product_id)
            ->where('variant_id', $item->variant_id)
            ->exists();

        if (! $exists) {
            $wishlist->items()->create(['product_id' => $item->product_id, 'variant_id' => $item->variant_id]);
        }

        $this->cartService->removeItem($item);
        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Moved to wishlist.');
    }

    public function applyCoupon(ApplyCouponRequest $request): JsonResponse
    {
        $cart = $this->cartService->loadCart($this->cartService->resolveCart($request));

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages(['coupon_code' => ['Your cart is empty.']]);
        }

        $this->cartService->applyCoupon($cart, $request->validated('coupon_code'), $request->user('sanctum')?->id);
        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Coupon applied.');
    }

    public function removeCoupon(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);
        $this->cartService->removeCoupon($cart);
        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Coupon removed.');
    }

    public function selectShipping(Request $request): JsonResponse
    {
        $data = $request->validate(['shipping_method_id' => ['required', 'integer', 'exists:shipping_methods,id']]);
        $cart = $this->cartService->resolveCart($request);

        $this->cartService->selectShippingMethod($cart, (int) $data['shipping_method_id']);
        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Shipping method selected.');
    }

    public function selectAddress(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        if (! $user) {
            return $this->error('Please login to continue.', 401, null, 'UNAUTHENTICATED');
        }

        $data = $request->validate(['address_id' => ['required', 'integer']]);
        $cart = $this->cartService->resolveCart($request);

        $this->cartService->selectAddress($cart, (int) $data['address_id'], $user->id);
        $cart = $this->cartService->loadCart($cart->fresh());

        return $this->success(new CartResource($cart), 'Address selected.');
    }

    public function validateCart(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);
        $result = $this->cartService->validateCart($cart);

        return $this->success([
            'valid' => $result['valid'],
            'errors' => $result['errors'],
            'cart' => new CartResource($result['cart']),
        ], $result['valid'] ? 'Cart is valid.' : 'Some items in your cart need attention.');
    }

    /**
     * Merges a guest cart into the freshly authenticated user's cart.
     * Called by the frontend immediately after login/register.
     */
    public function merge(Request $request): JsonResponse
    {
        $guestId = $request->header('X-Guest-Cart-Id') ?? $request->input('guest_id');

        if (! $guestId) {
            $cart = $this->cartService->loadCart($this->cartService->resolveCart($request));

            return $this->success(new CartResource($cart), 'Cart retrieved.');
        }

        $cart = $this->cartService->mergeGuestCart($guestId, $request->user('sanctum')->id);

        return $this->success(new CartResource($cart), 'Cart merged.');
    }
}
