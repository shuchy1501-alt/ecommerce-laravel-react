<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase 8 stops here on purpose: this only ever verifies the cart/address/
 * shipping are ready for payment. Order creation and payment belong to
 * Phase 9 and are never touched by this controller.
 */
class CheckoutController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function validateCheckout(Request $request): JsonResponse
    {
        if (! $request->user()) {
            return $this->error('Please login to continue to checkout.', 401, null, 'UNAUTHENTICATED');
        }

        $cart = $this->cartService->resolveCart($request);
        $result = $this->cartService->validateCheckout($cart, $request->user()->id);

        return $this->success([
            'valid' => $result['valid'],
            'errors' => $result['errors'],
            'cart' => new CartResource($result['cart']),
        ], $result['valid'] ? 'Ready for payment.' : 'Please resolve the issues below before continuing.');
    }
}
