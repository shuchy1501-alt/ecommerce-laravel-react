<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ShippingMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Every price, discount, shipping fee, and total the frontend ever sees
 * comes out of this service — nothing here is ever taken from request input
 * (spec section 63: never trust frontend price/discount/shipping/total).
 */
class CartService
{
    /**
     * Resolve (or create) the cart for the current request: user_id for an
     * authenticated customer, session_id for a guest. Guests are identified
     * by a client-generated id sent as the X-Guest-Cart-Id header (this API
     * is pure Bearer-token/stateless, so there is no PHP session to key on).
     */
    public function resolveCart(Request $request): Cart
    {
        if ($user = $request->user('sanctum')) {
            return Cart::firstOrCreate(['user_id' => $user->id]);
        }

        $guestId = $request->header('X-Guest-Cart-Id');

        if (! $guestId) {
            throw ValidationException::withMessages([
                'guest_id' => ['A guest cart id is required for unauthenticated carts.'],
            ]);
        }

        return Cart::firstOrCreate(['session_id' => $guestId, 'user_id' => null]);
    }

    public function loadCart(Cart $cart): Cart
    {
        return $cart->load([
            'items.product' => fn ($q) => $q->withTrashed()->with(['brand', 'images']),
            'items.variant',
            'coupon',
            'shippingMethod',
            'address',
        ]);
    }

    /**
     * Add a product/variant to the cart, or merge quantity into an existing
     * line for the same product+variant (spec sections 7–10).
     */
    public function addItem(Cart $cart, int $productId, ?int $variantId, int $quantity): CartItem
    {
        if ($quantity < 1) {
            throw ValidationException::withMessages(['quantity' => ['Quantity must be greater than zero.']]);
        }

        $product = Product::find($productId);

        if (! $product || ! $product->status) {
            throw ValidationException::withMessages(['product_id' => ['This product is not available.']]);
        }

        $variant = null;
        if ($product->variants()->exists()) {
            if (! $variantId) {
                throw ValidationException::withMessages(['variant_id' => ['Please select a size/color option.']]);
            }
            $variant = ProductVariant::where('product_id', $product->id)->find($variantId);

            if (! $variant) {
                throw ValidationException::withMessages(['variant_id' => ['This product option could not be found.']]);
            }
            if (! $variant->status) {
                throw ValidationException::withMessages(['variant_id' => ['This product option is no longer available.']]);
            }
        } elseif ($variantId) {
            throw ValidationException::withMessages(['variant_id' => ['This product does not have selectable options.']]);
        }

        $stock = $variant ? $variant->stock : 0;
        $unitPrice = $variant ? $variant->final_price : $product->final_price;

        return DB::transaction(function () use ($cart, $product, $variant, $quantity, $stock, $unitPrice) {
            $existing = $cart->items()
                ->where('product_id', $product->id)
                ->where('variant_id', $variant?->id)
                ->lockForUpdate()
                ->first();

            $desiredQuantity = $existing ? $existing->quantity + $quantity : $quantity;

            if ($desiredQuantity > $stock) {
                throw ValidationException::withMessages([
                    'quantity' => ["Only {$stock} unit(s) of this product are available."],
                ]);
            }

            if ($existing) {
                $existing->update([
                    'quantity' => $desiredQuantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => round($unitPrice * $desiredQuantity, 2),
                ]);

                return $existing->fresh();
            }

            return $cart->items()->create([
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => round($unitPrice * $quantity, 2),
            ]);
        });
    }

    public function updateItemQuantity(Cart $cart, CartItem $item, int $quantity): CartItem
    {
        if ($quantity < 1) {
            throw ValidationException::withMessages(['quantity' => ['Quantity must be at least 1.']]);
        }

        $stock = $item->variant ? $item->variant->stock : 0;

        if ($quantity > $stock) {
            throw ValidationException::withMessages([
                'quantity' => ["Only {$stock} unit(s) of this product are available."],
            ]);
        }

        $item->update([
            'quantity' => $quantity,
            'subtotal' => round((float) $item->unit_price * $quantity, 2),
        ]);

        return $item->fresh();
    }

    public function removeItem(CartItem $item): void
    {
        $item->delete();
    }

    public function clearCart(Cart $cart): void
    {
        DB::transaction(function () use ($cart) {
            $cart->items()->delete();
            $cart->update(['coupon_id' => null, 'discount_amount' => 0]);
        });
    }

    /**
     * Re-checks every line against the database (spec section 17/58/59):
     * product/variant still active, price still current, stock still
     * sufficient. Stale unit_price is refreshed and reported as a warning
     * rather than silently kept, so the customer always sees today's price
     * before paying. Also drops the coupon if the (possibly now-lower)
     * subtotal no longer meets its minimum order amount.
     */
    public function validateCart(Cart $cart): array
    {
        $errors = [];
        $cart = $this->loadCart($cart);

        foreach ($cart->items as $item) {
            $product = $item->product;

            if (! $product || $product->trashed()) {
                $errors[] = "\"{$item->product?->name}\" is no longer available and has been removed from your cart.";
                $item->delete();
                continue;
            }

            if (! $product->status) {
                $errors[] = "\"{$product->name}\" is no longer available.";
                continue;
            }

            $variant = $item->variant_id ? $item->variant()->withTrashed()->first() : null;

            if ($item->variant_id && (! $variant || $variant->trashed() || ! $variant->status)) {
                $errors[] = "The selected option for \"{$product->name}\" is no longer available.";
                continue;
            }

            $stock = $variant ? $variant->stock : 0;
            $currentPrice = $variant ? $variant->final_price : $product->final_price;

            if ($stock < $item->quantity) {
                if ($stock <= 0) {
                    $errors[] = "\"{$product->name}\" is now out of stock.";
                } else {
                    $errors[] = "Only {$stock} unit(s) of \"{$product->name}\" are available. Your quantity has been adjusted.";
                    $item->update(['quantity' => $stock, 'subtotal' => round($currentPrice * $stock, 2)]);
                }
            }

            if (round((float) $item->unit_price, 2) !== round($currentPrice, 2)) {
                $errors[] = "The price of \"{$product->name}\" has changed. Please review your cart.";
                $item->update([
                    'unit_price' => $currentPrice,
                    'subtotal' => round($currentPrice * $item->quantity, 2),
                ]);
            }
        }

        $cart = $this->loadCart($cart->fresh());
        $subtotal = (float) $cart->items->sum('subtotal');

        if ($cart->coupon && ! $cart->coupon->isValidFor($subtotal)) {
            $errors[] = "Coupon \"{$cart->coupon->code}\" no longer applies to your cart and has been removed.";
            $cart->update(['coupon_id' => null, 'discount_amount' => 0]);
            $cart = $this->loadCart($cart->fresh());
        }

        return ['valid' => empty($errors), 'errors' => $errors, 'cart' => $cart];
    }

    public function applyCoupon(Cart $cart, string $code, ?int $userId): Coupon
    {
        $coupon = Coupon::whereRaw('LOWER(code) = ?', [mb_strtolower(trim($code))])->first();

        if (! $coupon) {
            throw ValidationException::withMessages(['coupon_code' => ['This coupon code does not exist.']]);
        }

        if (! $coupon->status) {
            throw ValidationException::withMessages(['coupon_code' => ['Coupon is currently unavailable.']]);
        }

        if (now()->lt($coupon->start_date) || now()->gt($coupon->end_date)) {
            throw ValidationException::withMessages(['coupon_code' => ['Coupon has expired.']]);
        }

        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            throw ValidationException::withMessages(['coupon_code' => ['This coupon has reached its usage limit.']]);
        }

        if ($userId && $coupon->usage_limit_per_customer !== null
            && $coupon->timesUsedBy($userId) >= $coupon->usage_limit_per_customer) {
            throw ValidationException::withMessages(['coupon_code' => ['You have already used this coupon the maximum number of times.']]);
        }

        $subtotal = (float) $cart->items->sum('subtotal');

        if ($subtotal < (float) $coupon->minimum_order_amount) {
            $formatted = number_format((float) $coupon->minimum_order_amount, 2);
            throw ValidationException::withMessages(['coupon_code' => ["Minimum order amount is ৳{$formatted}."]]);
        }

        $discount = $coupon->calculateDiscount($subtotal);

        // Coupon usage is only ever incremented on order creation (Phase 9) —
        // applying it here just previews/reserves it on the cart.
        $cart->update(['coupon_id' => $coupon->id, 'discount_amount' => $discount]);

        return $coupon;
    }

    public function removeCoupon(Cart $cart): void
    {
        $cart->update(['coupon_id' => null, 'discount_amount' => 0]);
    }

    public function selectShippingMethod(Cart $cart, int $shippingMethodId): ShippingMethod
    {
        $method = ShippingMethod::active()->find($shippingMethodId);

        if (! $method) {
            throw ValidationException::withMessages(['shipping_method_id' => ['This shipping method is not available.']]);
        }

        $cart->update(['shipping_method_id' => $method->id]);

        return $method;
    }

    public function selectAddress(Cart $cart, int $addressId, int $userId): void
    {
        $address = \App\Models\CustomerAddress::where('user_id', $userId)->find($addressId);

        if (! $address) {
            throw ValidationException::withMessages(['address_id' => ['Address not found.']]);
        }

        $cart->update(['customer_address_id' => $address->id]);
    }

    /**
     * The only place grand_total is computed. subtotal/discount/shipping/tax
     * are all derived from the database, never from client input.
     */
    public function computeTotals(Cart $cart): array
    {
        $cart = $this->loadCart($cart);
        $subtotal = round((float) $cart->items->sum('subtotal'), 2);
        $discount = $cart->coupon ? min((float) $cart->discount_amount, $subtotal) : 0.0;
        $shipping = $cart->shippingMethod ? (float) $cart->shippingMethod->price : 0.0;
        $tax = 0.0;
        $grandTotal = max(0, round($subtotal - $discount + $shipping + $tax, 2));

        return compact('subtotal', 'discount', 'shipping', 'tax', 'grandTotal');
    }

    /**
     * Full pre-checkout validation (spec section 41/61): cart contents,
     * address ownership, and an active shipping method — no order is
     * created here.
     */
    public function validateCheckout(Cart $cart, int $userId): array
    {
        $result = $this->validateCart($cart);
        $cart = $result['cart'];
        $errors = $result['errors'];

        if ($cart->items->isEmpty()) {
            $errors[] = 'Your cart is empty.';
        }

        if (! $cart->customer_address_id) {
            $errors[] = 'Please select a shipping address.';
        } elseif (! $cart->address || $cart->address->user_id !== $userId) {
            $errors[] = 'The selected address is invalid.';
        }

        if (! $cart->shipping_method_id || ! $cart->shippingMethod || ! $cart->shippingMethod->status) {
            $errors[] = 'Please select a shipping method.';
        }

        return ['valid' => empty($errors), 'errors' => $errors, 'cart' => $cart];
    }

    /**
     * Merges a guest cart into the just-authenticated user's cart, capping
     * combined quantities at available stock, then discards the guest cart.
     */
    public function mergeGuestCart(string $guestSessionId, int $userId): Cart
    {
        return DB::transaction(function () use ($guestSessionId, $userId) {
            $userCart = Cart::firstOrCreate(['user_id' => $userId]);
            $guestCart = Cart::where('session_id', $guestSessionId)->whereNull('user_id')->first();

            if (! $guestCart) {
                return $this->loadCart($userCart);
            }

            foreach ($guestCart->items as $guestItem) {
                $stock = $guestItem->variant ? $guestItem->variant->stock : 0;

                $existing = $userCart->items()
                    ->where('product_id', $guestItem->product_id)
                    ->where('variant_id', $guestItem->variant_id)
                    ->first();

                $desiredQuantity = min(($existing?->quantity ?? 0) + $guestItem->quantity, max($stock, 0));

                if ($desiredQuantity <= 0) {
                    continue;
                }

                if ($existing) {
                    $existing->update([
                        'quantity' => $desiredQuantity,
                        'subtotal' => round((float) $existing->unit_price * $desiredQuantity, 2),
                    ]);
                } else {
                    $userCart->items()->create([
                        'product_id' => $guestItem->product_id,
                        'variant_id' => $guestItem->variant_id,
                        'quantity' => $desiredQuantity,
                        'unit_price' => $guestItem->unit_price,
                        'subtotal' => round((float) $guestItem->unit_price * $desiredQuantity, 2),
                    ]);
                }
            }

            $guestCart->items()->delete();
            $guestCart->delete();

            return $this->loadCart($userCart->fresh());
        });
    }
}
