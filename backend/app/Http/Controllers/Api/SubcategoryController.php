<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subcategory\StoreSubcategoryRequest;
use App\Http\Requests\Subcategory\UpdateSubcategoryRequest;
use App\Http\Resources\SubcategoryResource;
use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubcategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Subcategory::query()
            ->with('category')
            ->withCount('products')
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where('name', 'like', "%{$search}%");
            })
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->orderBy($request->input('sort_by', 'sort_order'), $request->input('sort_dir', 'asc'));

        $perPage = min((int) $request->input('per_page', 15), 100);
        $subcategories = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Subcategories fetched successfully',
            'data' => SubcategoryResource::collection($subcategories->items()),
            'meta' => $this->paginationMeta($subcategories),
        ]);
    }

    /**
     * GET /api/categories/{category}/subcategories
     * Used by the product/subcategory form to load options for a chosen category.
     */
    public function byCategory(Category $category): JsonResponse
    {
        $subcategories = $category->subcategories()->active()->orderBy('sort_order')->get();

        return response()->json([
            'success' => true,
            'message' => 'Subcategories fetched successfully',
            'data' => SubcategoryResource::collection($subcategories),
        ]);
    }

    public function show(Subcategory $subcategory): JsonResponse
    {
        $subcategory->load('category')->loadCount('products');

        return response()->json([
            'success' => true,
            'message' => 'Subcategory fetched successfully',
            'data' => new SubcategoryResource($subcategory),
        ]);
    }

    public function store(StoreSubcategoryRequest $request): JsonResponse
    {
        $data = $request->safe()->except('image');
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($request->string('name'));
        $data['created_by'] = $request->user()?->id;
        $data['updated_by'] = $request->user()?->id;

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('subcategories', 'public');
        }

        $subcategory = Subcategory::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Subcategory created successfully',
            'data' => new SubcategoryResource($subcategory->load('category')),
        ], 201);
    }

    public function update(UpdateSubcategoryRequest $request, Subcategory $subcategory): JsonResponse
    {
        $data = $request->safe()->except('image');

        if (isset($data['name']) && $data['name'] !== $subcategory->name && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'], $subcategory->id);
        }

        $data['updated_by'] = $request->user()?->id;

        if ($request->hasFile('image')) {
            if ($subcategory->image) {
                Storage::disk('public')->delete($subcategory->image);
            }
            $data['image'] = $request->file('image')->store('subcategories', 'public');
        }

        $subcategory->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Subcategory updated successfully',
            'data' => new SubcategoryResource($subcategory->fresh('category')),
        ]);
    }

    public function destroy(Subcategory $subcategory): JsonResponse
    {
        if ($subcategory->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This subcategory cannot be deleted because it contains products.',
            ], 422);
        }

        $subcategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subcategory deleted successfully',
        ]);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            Subcategory::where('slug', $slug)
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
