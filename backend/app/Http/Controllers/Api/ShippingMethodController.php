<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShippingMethodResource;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;

class ShippingMethodController extends Controller
{
    public function index(): JsonResponse
    {
        $methods = ShippingMethod::active()->orderBy('sort_order')->get();

        return $this->success(ShippingMethodResource::collection($methods), 'Shipping methods retrieved.');
    }
}
