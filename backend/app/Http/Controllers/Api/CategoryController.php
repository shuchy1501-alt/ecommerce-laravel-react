<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * GET /api/categories
     * Admin listing — search, status filter, sort, pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query()
            ->withCount(['subcategories', 'products'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where('name', 'like', "%{$search}%");
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->orderBy($request->input('sort_by', 'sort_order'), $request->input('sort_dir', 'asc'));

        $perPage = min((int) $request->input('per_page', 15), 100);
        $categories = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Categories fetched successfully',
            'data' => CategoryResource::collection($categories->items()),
            'meta' => $this->paginationMeta($categories),
        ]);
    }

    /**
     * GET /api/categories/active
     * Public — only active categories, for storefront navigation.
     */
    public function active(): JsonResponse
    {
        $categories = Category::query()
            ->active()
            ->with(['subcategories' => fn ($q) => $q->active()->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Active categories fetched successfully',
            'data' => CategoryResource::collection($categories),
        ]);
    }

    public function show(Category $category): JsonResponse
    {
        $category->load('subcategories')->loadCount('products');

        return response()->json([
            'success' => true,
            'message' => 'Category fetched successfully',
            'data' => new CategoryResource($category),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->safe()->except('image');
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($request->string('name'));
        $data['created_by'] = $request->user()?->id;
        $data['updated_by'] = $request->user()?->id;

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category = Category::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => new CategoryResource($category),
        ], 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->safe()->except('image');

        if (isset($data['name']) && $data['name'] !== $category->name && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'], $category->id);
        }

        $data['updated_by'] = $request->user()?->id;

        if ($request->hasFile('image')) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => new CategoryResource($category->fresh()),
        ]);
    }

    /**
     * DELETE /api/categories/{category}
     * Blocked while active products/subcategories depend on this category.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This category cannot be deleted because it contains products.',
            ], 422);
        }

        if ($category->subcategories()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This category cannot be deleted because it contains subcategories.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully',
        ]);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            Category::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    private function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
