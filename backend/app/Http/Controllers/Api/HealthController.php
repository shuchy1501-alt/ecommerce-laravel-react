<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $dbConnected = true;
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $dbConnected = false;
        }

        return $this->success([
            'status' => 'ok',
            'timezone' => config('app.timezone'),
            'currency' => config('app.currency'),
            'database' => $dbConnected ? 'connected' : 'unreachable',
            'timestamp' => now()->toIso8601String(),
        ], 'FashionMart API is healthy.');
    }
}
