<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Phase 13D — Global Admin Search.
 *
 * GET /api/admin/search?q=term            -> a few results per category (dropdown)
 * GET /api/admin/search/{type}?q=term      -> full paginated results for one category
 *
 * Auth only (no single blanket permission) — SearchService itself decides,
 * per category, whether the authenticated user's existing permission
 * (products.view, customers.view, ...) allows it. A Customer-role token
 * would authenticate fine here but get an empty result set back, since
 * they hold none of the underlying permissions.
 */
class SearchController extends Controller
{
    public function __construct(private readonly SearchService $search) {}

    public function index(Request $request): JsonResponse
    {
        $term = trim((string) $request->input('q', ''));

        if (mb_strlen($term) < 2) {
            throw ValidationException::withMessages(['q' => ['Search term must be at least 2 characters.']]);
        }

        $sections = $this->search->searchAll($term, $request->user());

        return $this->success($sections, 'Search results fetched successfully');
    }

    public function type(Request $request, string $type): JsonResponse
    {
        $term = trim((string) $request->input('q', ''));

        if (mb_strlen($term) < 2) {
            throw ValidationException::withMessages(['q' => ['Search term must be at least 2 characters.']]);
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
        $page = max((int) $request->input('page', 1), 1);

        $result = $this->search->searchType($type, $term, $request->user(), $perPage, $page);

        if ($result === null) {
            return $this->error('Unknown search type or you do not have permission to search it.', 403, null, 'FORBIDDEN');
        }

        return response()->json([
            'success' => true,
            'message' => 'Search results fetched successfully',
            'data' => $result['results'],
            'meta' => $result['meta'],
        ]);
    }
}
