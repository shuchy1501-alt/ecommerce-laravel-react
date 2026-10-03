<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Brand\StoreBrandRequest;
use App\Http\Requests\Brand\UpdateBrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Brand::query()
            ->withCount('products')
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where('name', 'like', "%{$search}%");
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->orderBy($request->input('sort_by', 'name'), $request->input('sort_dir', 'asc'));

        $perPage = min((int) $request->input('per_page', 15), 100);
        $brands = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Brands fetched successfully',
            'data' => BrandResource::collection($brands->items()),
            'meta' => $this->paginationMeta($brands),
        ]);
    }

    public function active(): JsonResponse
    {
        $brands = Brand::active()->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Active brands fetched successfully',
            'data' => BrandResource::collection($brands),
        ]);
    }

    public function show(Brand $brand): JsonResponse
    {
        $brand->loadCount('products');

        return response()->json([
            'success' => true,
            'message' => 'Brand fetched successfully',
            'data' => new BrandResource($brand),
        ]);
    }

    public function store(StoreBrandRequest $request): JsonResponse
    {
        $data = $request->safe()->except('logo');
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($request->string('name'));
        $data['created_by'] = $request->user()?->id;
        $data['updated_by'] = $request->user()?->id;

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $brand = Brand::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Brand created successfully',
            'data' => new BrandResource($brand),
        ], 201);
    }

    public function update(UpdateBrandRequest $request, Brand $brand): JsonResponse
    {
        $data = $request->safe()->except('logo');

        if (isset($data['name']) && $data['name'] !== $brand->name && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'], $brand->id);
        }

        $data['updated_by'] = $request->user()?->id;

        if ($request->hasFile('logo')) {
            if ($brand->logo) {
                Storage::disk('public')->delete($brand->logo);
            }
            $data['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $brand->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Brand updated successfully',
            'data' => new BrandResource($brand->fresh()),
        ]);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        if ($brand->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This brand cannot be deleted because it contains products.',
            ], 422);
        }

        $brand->delete();

        return response()->json([
            'success' => true,
            'message' => 'Brand deleted successfully',
        ]);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            Brand::where('slug', $slug)
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
