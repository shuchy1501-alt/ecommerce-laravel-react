<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\SalesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesController extends Controller
{
    public function __construct(private readonly SalesService $salesService) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $byDate = $this->salesService->getSalesByDate(
            $data['date_from'] ?? now()->subDays(29)->toDateString(),
            $data['date_to'] ?? now()->toDateString()
        );

        return $this->success(['by_date' => $byDate], 'Sales retrieved.');
    }

    public function summary(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $summary = $this->salesService->getSalesSummary($data['date_from'] ?? null, $data['date_to'] ?? null);

        return $this->success($summary, 'Sales summary retrieved.');
    }
}
