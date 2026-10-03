<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;

/**
 * Phase 13D — Global Admin Search.
 *
 * Design notes:
 *  - PERMISSION-AWARE, not all-or-nothing: a caller only ever sees results
 *    for categories they hold the matching *existing* permission for
 *    (products.view, customers.view, orders.view, sales.view,
 *    suppliers.view, purchases.view) — reusing the exact permissions
 *    already enforced on those entities' own list endpoints, not a new
 *    "search.*" permission. A user missing one permission still gets
 *    results for the categories they can see; categories they can't are
 *    silently omitted from the response, not an error.
 *  - SERVER-SIDE + BOUNDED: every category query is `limit()`-capped
 *    (default 5 per category for the combined "all types" search, or
 *    paginated when a single `type` is requested) — the full dataset is
 *    never pulled into PHP, let alone shipped to React.
 *  - Each result carries a `path` so the frontend can navigate directly
 *    to the matching admin screen.
 */
class SearchService
{
    private const PER_CATEGORY_LIMIT = 5;

    /**
     * @return array<string, array{label: string, results: array}>
     */
    public function searchAll(string $term, User $user, int $limit = self::PER_CATEGORY_LIMIT): array
    {
        $term = trim($term);
        $sections = [];

        foreach ($this->categories() as $type => $meta) {
            if (! $user->can($meta['permission'])) {
                continue;
            }

            $results = $meta['query']($term, $limit);

            if ($results->isNotEmpty()) {
                $sections[$type] = [
                    'label' => $meta['label'],
                    'results' => $results->all(),
                ];
            }
        }

        return $sections;
    }

    /**
     * Single-category, paginated search — used when the admin clicks
     * "see all results" for one type rather than the combined dropdown.
     */
    public function searchType(string $type, string $term, User $user, int $perPage = 20, int $page = 1): ?array
    {
        $categories = $this->categories();

        if (! isset($categories[$type]) || ! $user->can($categories[$type]['permission'])) {
            return null;
        }

        $paginator = $categories[$type]['paginatedQuery'](trim($term), $perPage, $page);

        return [
            'label' => $categories[$type]['label'],
            'results' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function categoryKeys(): array
    {
        return array_keys($this->categories());
    }

    /**
     * @return array<string, array{label: string, permission: string, query: \Closure, paginatedQuery: \Closure}>
     */
    private function categories(): array
    {
        return [
            'products' => [
                'label' => 'Products',
                'permission' => 'products.view',
                'query' => fn (string $term, int $limit) => $this->baseProductQuery($term)->limit($limit)->get()->map($this->mapProduct(...)),
                'paginatedQuery' => fn (string $term, int $perPage, int $page) => $this->baseProductQuery($term)->paginate($perPage, ['*'], 'page', $page)->through($this->mapProduct(...)),
            ],
            'customers' => [
                'label' => 'Customers',
                'permission' => 'customers.view',
                'query' => fn (string $term, int $limit) => $this->baseCustomerQuery($term)->limit($limit)->get()->map($this->mapCustomer(...)),
                'paginatedQuery' => fn (string $term, int $perPage, int $page) => $this->baseCustomerQuery($term)->paginate($perPage, ['*'], 'page', $page)->through($this->mapCustomer(...)),
            ],
            'orders' => [
                'label' => 'Orders',
                'permission' => 'orders.view',
                'query' => fn (string $term, int $limit) => $this->baseOrderQuery($term)->limit($limit)->get()->map($this->mapOrder(...)),
                'paginatedQuery' => fn (string $term, int $perPage, int $page) => $this->baseOrderQuery($term)->paginate($perPage, ['*'], 'page', $page)->through($this->mapOrder(...)),
            ],
            'sales' => [
                'label' => 'Sales',
                'permission' => 'sales.view',
                'query' => fn (string $term, int $limit) => $this->baseSaleQuery($term)->limit($limit)->get()->map($this->mapSale(...)),
                'paginatedQuery' => fn (string $term, int $perPage, int $page) => $this->baseSaleQuery($term)->paginate($perPage, ['*'], 'page', $page)->through($this->mapSale(...)),
            ],
            'suppliers' => [
                'label' => 'Suppliers',
                'permission' => 'suppliers.view',
                'query' => fn (string $term, int $limit) => $this->baseSupplierQuery($term)->limit($limit)->get()->map($this->mapSupplier(...)),
                'paginatedQuery' => fn (string $term, int $perPage, int $page) => $this->baseSupplierQuery($term)->paginate($perPage, ['*'], 'page', $page)->through($this->mapSupplier(...)),
            ],
            'purchases' => [
                'label' => 'Purchases',
                'permission' => 'purchases.view',
                'query' => fn (string $term, int $limit) => $this->basePurchaseQuery($term)->limit($limit)->get()->map($this->mapPurchase(...)),
                'paginatedQuery' => fn (string $term, int $perPage, int $page) => $this->basePurchaseQuery($term)->paginate($perPage, ['*'], 'page', $page)->through($this->mapPurchase(...)),
            ],
        ];
    }

    private function baseProductQuery(string $term)
    {
        return Product::query()
            ->select(['id', 'name', 'sku', 'selling_price', 'status'])
            ->where(fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('sku', 'like', "%{$term}%"))
            ->latest('id');
    }

    private function baseCustomerQuery(string $term)
    {
        return Customer::query()
            ->select(['id', 'name', 'email', 'phone'])
            ->where(fn ($q) => $q->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%"))
            ->latest('id');
    }

    private function baseOrderQuery(string $term)
    {
        return Order::query()
            ->select(['id', 'order_number', 'customer_id', 'total', 'order_status', 'payment_status'])
            ->with(['customer:id,name'])
            ->where(fn ($q) => $q->where('order_number', 'like', "%{$term}%")
                ->orWhere('shipping_name', 'like', "%{$term}%")
                ->orWhere('shipping_phone', 'like', "%{$term}%")
                ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$term}%")))
            ->latest('id');
    }

    private function baseSaleQuery(string $term)
    {
        return Sale::query()
            ->select(['id', 'order_id', 'customer_id', 'total', 'payment_status', 'sale_date'])
            ->with(['order:id,order_number', 'customer:id,name'])
            ->where(fn ($q) => $q->whereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$term}%"))
                ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$term}%")))
            ->latest('id');
    }

    private function baseSupplierQuery(string $term)
    {
        return Supplier::query()
            ->select(['id', 'name', 'email', 'phone'])
            ->where(fn ($q) => $q->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%"))
            ->latest('id');
    }

    private function basePurchaseQuery(string $term)
    {
        return Purchase::query()
            ->select(['id', 'purchase_number', 'supplier_id', 'total', 'status'])
            ->with(['supplier:id,name'])
            ->where(fn ($q) => $q->where('purchase_number', 'like', "%{$term}%")
                ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$term}%")))
            ->latest('id');
    }

    private function mapProduct(Product $p): array
    {
        return [
            'type' => 'product',
            'id' => $p->id,
            'title' => $p->name,
            'subtitle' => $p->sku,
            'meta' => ['price' => (float) $p->selling_price, 'status' => (bool) $p->status],
            'path' => "/admin/products/{$p->id}",
        ];
    }

    private function mapCustomer(Customer $c): array
    {
        return [
            'type' => 'customer',
            'id' => $c->id,
            'title' => $c->name,
            'subtitle' => $c->email ?? $c->phone,
            'meta' => ['phone' => $c->phone],
            // No standalone customer profile screen exists yet — the
            // closest real destination is that customer's order history.
            'path' => "/admin/orders?customer_id={$c->id}",
        ];
    }

    private function mapOrder(Order $o): array
    {
        return [
            'type' => 'order',
            'id' => $o->id,
            'title' => $o->order_number,
            'subtitle' => $o->customer?->name,
            'meta' => ['total' => (float) $o->total, 'status' => $o->order_status, 'payment_status' => $o->payment_status],
            'path' => "/admin/orders/{$o->id}",
        ];
    }

    private function mapSale(Sale $s): array
    {
        return [
            'type' => 'sale',
            'id' => $s->id,
            'title' => 'SALE-'.str_pad((string) $s->id, 6, '0', STR_PAD_LEFT),
            'subtitle' => $s->order?->order_number ?? $s->customer?->name,
            'meta' => ['total' => (float) $s->total, 'payment_status' => $s->payment_status],
            // Sales have no dedicated detail screen — they mirror the order.
            'path' => $s->order_id ? "/admin/orders/{$s->order_id}" : '/admin/sales',
        ];
    }

    private function mapSupplier(Supplier $s): array
    {
        return [
            'type' => 'supplier',
            'id' => $s->id,
            'title' => $s->name,
            'subtitle' => $s->email ?? $s->phone,
            'meta' => [],
            'path' => "/admin/suppliers/{$s->id}",
        ];
    }

    private function mapPurchase(Purchase $p): array
    {
        return [
            'type' => 'purchase',
            'id' => $p->id,
            'title' => $p->purchase_number,
            'subtitle' => $p->supplier?->name,
            'meta' => ['total' => (float) $p->total, 'status' => $p->status],
            'path' => "/admin/purchases/{$p->id}",
        ];
    }
}
