<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase 13A — GET /api/admin/dashboard
 * Read-only aggregate endpoint. Every figure is computed server-side by
 * DashboardService (which itself delegates to the Phase 12 financial
 * services); React only renders what it receives.
 */
class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,last_7_days,last_30_days,this_month,last_month,this_year,custom'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $overview = $this->dashboardService->getOverview(
            $data['range'] ?? 'this_month',
            $data['date_from'] ?? null,
            $data['date_to'] ?? null
        );

        return $this->success($overview, 'Dashboard overview fetched successfully');
    }
}
