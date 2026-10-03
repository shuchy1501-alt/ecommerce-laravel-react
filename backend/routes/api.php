<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\Admin\SalesController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SubcategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\Customer\CustomerProfileController;
use App\Http\Controllers\Api\Customer\CustomerAddressController;
use App\Http\Controllers\Api\Customer\CustomerDashboardController;
use App\Http\Controllers\Api\Customer\ChangePasswordController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\ShippingMethodController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\Customer\ReturnController as CustomerReturnController;
use App\Http\Controllers\Api\Customer\RefundController as CustomerRefundController;
use App\Http\Controllers\Api\Customer\ExchangeController as CustomerExchangeController;
use App\Http\Controllers\Api\Admin\ReturnController as AdminReturnController;
use App\Http\Controllers\Api\Admin\RefundController as AdminRefundController;
use App\Http\Controllers\Api\Admin\ExchangeController as AdminExchangeController;
use App\Http\Controllers\Api\Admin\FinanceController;
use App\Http\Controllers\Api\Admin\ExpenseController;
use App\Http\Controllers\Api\Admin\ExpenseCategoryController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\SearchController;
use App\Http\Controllers\Api\Admin\AuditLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All routes here are automatically prefixed with /api by bootstrap/app.php.
|
*/

Route::get('/health', HealthController::class)->name('health');

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register')->name('register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    });
});

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
| Listing/detail are public (storefront browsing). Write operations require
| authentication + the matching permission.
*/
Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/products', [ProductController::class, 'store'])
        ->middleware('permission:products.create')
        ->name('products.store');

    Route::put('/products/{product}', [ProductController::class, 'update'])
        ->middleware('permission:products.update')
        ->name('products.update');

    Route::delete('/products/{product}', [ProductController::class, 'destroy'])
        ->middleware('permission:products.delete')
        ->name('products.destroy');

    Route::post('/products/{product}/duplicate', [ProductController::class, 'duplicate'])
        ->middleware('permission:products.create')
        ->name('products.duplicate');

    Route::patch('/products/{product}/status', [ProductController::class, 'updateStatus'])
        ->middleware('permission:products.update')
        ->name('products.updateStatus');

    Route::delete('/products/{product}/images/{image}', [ProductController::class, 'deleteImage'])
        ->middleware('permission:products.update')
        ->name('products.deleteImage');

    Route::get('/products/{product}/variants', [ProductVariantController::class, 'index'])
        ->middleware('permission:products.view')
        ->name('products.variants.index');

    Route::post('/products/{product}/variants', [ProductVariantController::class, 'store'])
        ->middleware('permission:products.update')
        ->name('products.variants.store');

    Route::put('/products/{product}/variants/{variant}', [ProductVariantController::class, 'update'])
        ->middleware('permission:products.update')
        ->name('products.variants.update');

    Route::delete('/products/{product}/variants/{variant}', [ProductVariantController::class, 'destroy'])
        ->middleware('permission:products.update')
        ->name('products.variants.destroy');

    Route::post('/products/{product}/variants/generate', [ProductVariantController::class, 'generate'])
        ->middleware('permission:products.update')
        ->name('products.variants.generate');
});

/*
|--------------------------------------------------------------------------
| Catalog: Categories, Subcategories, Brands
|--------------------------------------------------------------------------
*/
Route::get('/categories/active', [CategoryController::class, 'active'])->name('categories.active');
Route::get('/categories/{category}/subcategories', [SubcategoryController::class, 'byCategory'])->name('categories.subcategories');
Route::get('/brands/active', [BrandController::class, 'active'])->name('brands.active');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index'])->middleware('permission:categories.view')->name('categories.index');
    Route::get('/categories/{category}', [CategoryController::class, 'show'])->middleware('permission:categories.view')->name('categories.show');
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('permission:categories.create')->name('categories.store');
    Route::post('/categories/{category}', [CategoryController::class, 'update'])->middleware('permission:categories.update')->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:categories.delete')->name('categories.destroy');

    Route::get('/subcategories', [SubcategoryController::class, 'index'])->middleware('permission:subcategories.view')->name('subcategories.index');
    Route::get('/subcategories/{subcategory}', [SubcategoryController::class, 'show'])->middleware('permission:subcategories.view')->name('subcategories.show');
    Route::post('/subcategories', [SubcategoryController::class, 'store'])->middleware('permission:subcategories.create')->name('subcategories.store');
    Route::post('/subcategories/{subcategory}', [SubcategoryController::class, 'update'])->middleware('permission:subcategories.update')->name('subcategories.update');
    Route::delete('/subcategories/{subcategory}', [SubcategoryController::class, 'destroy'])->middleware('permission:subcategories.delete')->name('subcategories.destroy');

    Route::get('/brands', [BrandController::class, 'index'])->middleware('permission:brands.view')->name('brands.index');
    Route::get('/brands/{brand}', [BrandController::class, 'show'])->middleware('permission:brands.view')->name('brands.show');
    Route::post('/brands', [BrandController::class, 'store'])->middleware('permission:brands.create')->name('brands.store');
    Route::post('/brands/{brand}', [BrandController::class, 'update'])->middleware('permission:brands.update')->name('brands.update');
    Route::delete('/brands/{brand}', [BrandController::class, 'destroy'])->middleware('permission:brands.delete')->name('brands.destroy');
});

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
| All order routes require authentication. Customers may only place orders
| and view their own; staff permissions gate status changes and cancellation.
*/
/*
|--------------------------------------------------------------------------
| Orders + Payments + Invoices + Sales (Phase 9)
|--------------------------------------------------------------------------
| All order routes require authentication. Customers may only place orders
| and view/cancel their own; staff permissions gate status changes,
| payment-status changes, and cancellation of any order.
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('/orders/{order}/invoice', [OrderController::class, 'invoice'])
        ->middleware('permission:invoices.view')
        ->name('orders.invoice');

    Route::post('/orders', [OrderController::class, 'store'])
        ->middleware('permission:orders.create')
        ->name('orders.store');

    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])
        ->middleware('permission:orders.update_status')
        ->name('orders.updateStatus');

    Route::patch('/orders/{order}/payment-status', [OrderController::class, 'updatePaymentStatus'])
        ->middleware('permission:payments.manage')
        ->name('orders.updatePaymentStatus');

    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])
        ->middleware('permission:orders.cancel')
        ->name('orders.cancel');

    Route::post('/payments/initialize', [PaymentController::class, 'initialize'])->name('payments.initialize');
    Route::post('/payments/verify', [PaymentController::class, 'verify'])->name('payments.verify');
    Route::post('/payments/{id}/retry', [PaymentController::class, 'retry'])->name('payments.retry');

    /*
    |----------------------------------------------------------------------
    | Returns + Refunds + Exchanges + Cancellation (Phase 11)
    |----------------------------------------------------------------------
    | Customer routes are scoped to the authenticated user inside each
    | controller (never trust a user id from the request). Admin routes
    | are gated by the matching returns./refunds./exchanges. permission.
    */
    Route::get('/returns', [CustomerReturnController::class, 'index'])->name('returns.index');
    Route::get('/returns/{return}', [CustomerReturnController::class, 'show'])->name('returns.show');
    Route::post('/orders/{order}/returns', [CustomerReturnController::class, 'store'])->name('returns.store');
    Route::post('/returns/{return}/cancel', [CustomerReturnController::class, 'cancel'])->name('returns.cancel');

    Route::get('/refunds', [CustomerRefundController::class, 'index'])->name('refunds.index');
    Route::get('/refunds/{refund}', [CustomerRefundController::class, 'show'])->name('refunds.show');

    Route::post('/orders/{order}/exchange', [CustomerExchangeController::class, 'store'])->name('exchanges.store');
    Route::get('/exchanges', [CustomerExchangeController::class, 'index'])->name('exchanges.index');
    Route::get('/exchanges/{exchange}', [CustomerExchangeController::class, 'show'])->name('exchanges.show');

    Route::get('/admin/returns', [AdminReturnController::class, 'index'])
        ->middleware('permission:returns.view')->name('admin.returns.index');
    Route::get('/admin/returns/{return}', [AdminReturnController::class, 'show'])
        ->middleware('permission:returns.view')->name('admin.returns.show');
    Route::patch('/admin/returns/{return}/approve', [AdminReturnController::class, 'approve'])
        ->middleware('permission:returns.approve')->name('admin.returns.approve');
    Route::patch('/admin/returns/{return}/reject', [AdminReturnController::class, 'reject'])
        ->middleware('permission:returns.reject')->name('admin.returns.reject');
    Route::patch('/admin/returns/{return}/status', [AdminReturnController::class, 'updateStatus'])
        ->middleware('permission:returns.approve')->name('admin.returns.updateStatus');
    Route::post('/admin/returns/{return}/receive', [AdminReturnController::class, 'receive'])
        ->middleware('permission:returns.receive')->name('admin.returns.receive');
    Route::post('/admin/returns/{return}/inspect', [AdminReturnController::class, 'inspect'])
        ->middleware('permission:returns.inspect')->name('admin.returns.inspect');

    Route::get('/admin/refunds', [AdminRefundController::class, 'index'])
        ->middleware('permission:refunds.view')->name('admin.refunds.index');
    Route::get('/admin/refunds/{refund}', [AdminRefundController::class, 'show'])
        ->middleware('permission:refunds.view')->name('admin.refunds.show');
    Route::post('/admin/refunds/{refund}/process', [AdminRefundController::class, 'process'])
        ->middleware('permission:refunds.process')->name('admin.refunds.process');
    Route::post('/admin/refunds/{refund}/verify', [AdminRefundController::class, 'verify'])
        ->middleware('permission:refunds.verify')->name('admin.refunds.verify');

    Route::get('/admin/exchanges', [AdminExchangeController::class, 'index'])
        ->middleware('permission:exchanges.view')->name('admin.exchanges.index');
    Route::get('/admin/exchanges/{exchange}', [AdminExchangeController::class, 'show'])
        ->middleware('permission:exchanges.view')->name('admin.exchanges.show');
    Route::patch('/admin/exchanges/{exchange}/status', [AdminExchangeController::class, 'updateStatus'])
        ->middleware('permission:exchanges.process')->name('admin.exchanges.updateStatus');

    Route::get('/admin/sales', [SalesController::class, 'index'])
        ->middleware('permission:sales.view')
        ->name('admin.sales.index');
    Route::get('/admin/sales/summary', [SalesController::class, 'summary'])
        ->middleware('permission:sales.view')
        ->name('admin.sales.summary');

    /*
    |----------------------------------------------------------------------
    | Accounting + Expense + Revenue + Profit Management (Phase 12)
    |----------------------------------------------------------------------
    */
    Route::get('/admin/finance/dashboard', [FinanceController::class, 'dashboard'])
        ->middleware('permission:finance.view')->name('admin.finance.dashboard');
    Route::get('/admin/finance/revenue', [FinanceController::class, 'revenue'])
        ->middleware('permission:finance.reports')->name('admin.finance.revenue');
    Route::get('/admin/finance/expenses', [FinanceController::class, 'expenses'])
        ->middleware('permission:finance.reports')->name('admin.finance.expenses');
    Route::get('/admin/finance/payments', [FinanceController::class, 'payments'])
        ->middleware('permission:finance.reports')->name('admin.finance.payments');
    Route::get('/admin/finance/refunds', [FinanceController::class, 'refunds'])
        ->middleware('permission:finance.reports')->name('admin.finance.refunds');
    Route::get('/admin/finance/profit-loss', [FinanceController::class, 'profitLoss'])
        ->middleware('permission:finance.reports')->name('admin.finance.profitLoss');
    Route::get('/admin/finance/cash-flow', [FinanceController::class, 'cashFlow'])
        ->middleware('permission:finance.reports')->name('admin.finance.cashFlow');
    Route::get('/admin/finance/transactions', [FinanceController::class, 'transactions'])
        ->middleware('permission:transactions.view')->name('admin.finance.transactions');

    Route::get('/admin/expenses', [ExpenseController::class, 'index'])
        ->middleware('permission:expenses.view')->name('admin.expenses.index');
    Route::get('/admin/expenses/{expense}', [ExpenseController::class, 'show'])
        ->middleware('permission:expenses.view')->name('admin.expenses.show');
    Route::post('/admin/expenses', [ExpenseController::class, 'store'])
        ->middleware('permission:expenses.create')->name('admin.expenses.store');
    Route::put('/admin/expenses/{expense}', [ExpenseController::class, 'update'])
        ->middleware('permission:expenses.edit')->name('admin.expenses.update');
    Route::post('/admin/expenses/{expense}/mark-paid', [ExpenseController::class, 'markPaid'])
        ->middleware('permission:expenses.edit')->name('admin.expenses.markPaid');
    Route::delete('/admin/expenses/{expense}', [ExpenseController::class, 'destroy'])
        ->middleware('permission:expenses.delete')->name('admin.expenses.destroy');

    Route::get('/admin/expense-categories', [ExpenseCategoryController::class, 'index'])
        ->middleware('permission:expenses.view')->name('admin.expenseCategories.index');
    Route::post('/admin/expense-categories', [ExpenseCategoryController::class, 'store'])
        ->middleware('permission:expenses.create')->name('admin.expenseCategories.store');
    Route::put('/admin/expense-categories/{expense_category}', [ExpenseCategoryController::class, 'update'])
        ->middleware('permission:expenses.edit')->name('admin.expenseCategories.update');
    Route::delete('/admin/expense-categories/{expense_category}', [ExpenseCategoryController::class, 'destroy'])
        ->middleware('permission:expenses.delete')->name('admin.expenseCategories.destroy');

    // ------------------------------------------------------------------
    // Phase 13B — Report Management
    // ------------------------------------------------------------------
    Route::get('/admin/reports', [ReportController::class, 'index'])
        ->middleware('permission:reports.view')->name('admin.reports.index');
    Route::get('/admin/reports/sales', [ReportController::class, 'sales'])
        ->middleware('permission:reports.sales')->name('admin.reports.sales');
    Route::get('/admin/reports/orders', [ReportController::class, 'orders'])
        ->middleware('permission:reports.orders')->name('admin.reports.orders');
    Route::get('/admin/reports/products', [ReportController::class, 'products'])
        ->middleware('permission:reports.products')->name('admin.reports.products');
    Route::get('/admin/reports/customers', [ReportController::class, 'customers'])
        ->middleware('permission:reports.customer')->name('admin.reports.customers');
    Route::get('/admin/reports/inventory', [ReportController::class, 'inventory'])
        ->middleware('permission:reports.inventory')->name('admin.reports.inventory');
    Route::get('/admin/reports/purchases', [ReportController::class, 'purchases'])
        ->middleware('permission:reports.purchase')->name('admin.reports.purchases');
    Route::get('/admin/reports/suppliers', [ReportController::class, 'suppliers'])
        ->middleware('permission:reports.suppliers')->name('admin.reports.suppliers');
    Route::get('/admin/reports/expenses', [ReportController::class, 'expenses'])
        ->middleware('permission:reports.expenses')->name('admin.reports.expenses');
    Route::get('/admin/reports/profit-loss', [ReportController::class, 'profitLoss'])
        ->middleware('permission:reports.profit_loss')->name('admin.reports.profitLoss');
    Route::get('/admin/reports/refunds', [ReportController::class, 'refunds'])
        ->middleware('permission:reports.refunds')->name('admin.reports.refunds');
    Route::get('/admin/reports/returns', [ReportController::class, 'returns'])
        ->middleware('permission:reports.returns')->name('admin.reports.returns');
    Route::get('/admin/reports/cash-flow', [ReportController::class, 'cashFlow'])
        ->middleware('permission:reports.cash_flow')->name('admin.reports.cashFlow');
    Route::get('/admin/reports/{type}/export', [ReportController::class, 'export'])
        ->name('admin.reports.export');
});

// Gateway callback: deliberately public — see PaymentController::callback doc-block.
Route::post('/payments/callback', [PaymentController::class, 'callback'])->name('payments.callback');

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
| Aggregate stats for the admin dashboard. Requires authentication.
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');
});

/*
|--------------------------------------------------------------------------
| Final Admin Dashboard (Phase 13A)
|--------------------------------------------------------------------------
| Full business overview: sales/orders/customers/products/inventory/finance
| cards plus chart-ready series. Distinct from /dashboard/stats above (kept
| for backward compatibility with any existing consumer of that endpoint).
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/dashboard', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'index'])
        ->middleware('permission:dashboard.view')->name('admin.dashboard.index');
});

/*
|--------------------------------------------------------------------------
| Customer Account (Phase 7)
|--------------------------------------------------------------------------
| Profile, addresses, password, and the account dashboard. Every route here
| is scoped to auth:sanctum only (no extra permission gate) because these
| endpoints only ever operate on the authenticated user's own data — see
| CustomerAddressController's doc-block for how address ownership is
| enforced against IDOR.
*/
Route::prefix('customer')->name('customer.')->middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [CustomerProfileController::class, 'show'])->name('profile.show');
    Route::put('/profile', [CustomerProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/photo', [CustomerProfileController::class, 'uploadPhoto'])->name('profile.photo.upload');
    Route::delete('/profile/photo', [CustomerProfileController::class, 'removePhoto'])->name('profile.photo.remove');

    Route::post('/change-password', [ChangePasswordController::class, 'update'])->name('change-password');

    Route::get('/addresses', [CustomerAddressController::class, 'index'])->name('addresses.index');
    Route::get('/addresses/{id}', [CustomerAddressController::class, 'show'])->name('addresses.show');
    Route::post('/addresses', [CustomerAddressController::class, 'store'])->name('addresses.store');
    Route::put('/addresses/{id}', [CustomerAddressController::class, 'update'])->name('addresses.update');
    Route::delete('/addresses/{id}', [CustomerAddressController::class, 'destroy'])->name('addresses.destroy');
    Route::patch('/addresses/{id}/default', [CustomerAddressController::class, 'setDefault'])->name('addresses.default');

    Route::get('/dashboard/stats', [CustomerDashboardController::class, 'stats'])->name('dashboard.stats');
});

/*
|--------------------------------------------------------------------------
| Wishlist (Phase 7)
|--------------------------------------------------------------------------
| Kept at the top-level /wishlist path (rather than nested under /customer)
| to match the existing frontend wishlistService.js, which the storefront
| product cards / header wishlist icon already call.
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
    Route::post('/wishlist', [WishlistController::class, 'store'])->name('wishlist.store');
    Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy'])->name('wishlist.destroy');
    Route::get('/wishlist/check/{product}', [WishlistController::class, 'check'])->name('wishlist.check');
    Route::post('/wishlist/toggle/{product}', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
});

/*
|--------------------------------------------------------------------------
| Cart + Coupon + Shipping + Checkout validation (Phase 8)
|--------------------------------------------------------------------------
| Deliberately public (no auth:sanctum) so guests can shop — see
| CartService::resolveCart for how guest vs. authenticated carts are
| resolved (X-Guest-Cart-Id header vs. the sanctum-guarded user). Address
| selection and cart merge require login and check for it explicitly inside
| the controller. Checkout validation always requires login.
*/
Route::prefix('cart')->name('cart.')->group(function () {
    Route::get('/', [CartController::class, 'show'])->name('show');
    Route::post('/items', [CartController::class, 'addItem'])->name('items.store');
    Route::put('/items/{id}', [CartController::class, 'updateItem'])->name('items.update');
    Route::delete('/items/{id}', [CartController::class, 'removeItem'])->name('items.destroy');
    Route::post('/items/{id}/wishlist', [CartController::class, 'moveToWishlist'])->name('items.wishlist');
    Route::delete('/', [CartController::class, 'clear'])->name('clear');
    Route::post('/coupon', [CartController::class, 'applyCoupon'])->name('coupon.apply');
    Route::delete('/coupon', [CartController::class, 'removeCoupon'])->name('coupon.remove');
    Route::post('/shipping', [CartController::class, 'selectShipping'])->name('shipping.select');
    Route::post('/address', [CartController::class, 'selectAddress'])->name('address.select');
    Route::post('/validate', [CartController::class, 'validateCart'])->name('validate');
});

Route::middleware('auth:sanctum')->post('/cart/merge', [CartController::class, 'merge'])->name('cart.merge');

Route::get('/shipping-methods', [ShippingMethodController::class, 'index'])->name('shipping-methods.index');

Route::middleware('auth:sanctum')->post('/checkout/validate', [CheckoutController::class, 'validateCheckout'])->name('checkout.validate');

/*
|--------------------------------------------------------------------------
| Inventory + Suppliers + Purchases + Stock Movements (Phase 10)
|--------------------------------------------------------------------------
| All admin-only, behind auth:sanctum + the matching permission. Supplier
| purchase history relies on Purchase::belongsTo(Supplier); stock changes
| always flow through InventoryService (see its class doc-block) so this
| module never writes to product_variants.stock directly.
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/suppliers/active', [SupplierController::class, 'active'])
        ->middleware('permission:suppliers.view')
        ->name('suppliers.active');
    Route::get('/suppliers', [SupplierController::class, 'index'])->middleware('permission:suppliers.view')->name('suppliers.index');
    Route::get('/suppliers/{supplier}', [SupplierController::class, 'show'])->middleware('permission:suppliers.view')->name('suppliers.show');
    Route::post('/suppliers', [SupplierController::class, 'store'])->middleware('permission:suppliers.create')->name('suppliers.store');
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('permission:suppliers.edit')->name('suppliers.update');
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->middleware('permission:suppliers.delete')->name('suppliers.destroy');

    Route::get('/admin/purchases', [PurchaseController::class, 'index'])->middleware('permission:purchases.view')->name('admin.purchases.index');
    Route::get('/admin/purchases/{purchase}', [PurchaseController::class, 'show'])->middleware('permission:purchases.view')->name('admin.purchases.show');
    Route::post('/admin/purchases', [PurchaseController::class, 'store'])->middleware('permission:purchases.create')->name('admin.purchases.store');
    Route::put('/admin/purchases/{purchase}', [PurchaseController::class, 'update'])->middleware('permission:purchases.edit')->name('admin.purchases.update');
    Route::post('/admin/purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->middleware('permission:purchases.receive')->name('admin.purchases.receive');
    Route::post('/admin/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel'])->middleware('permission:purchases.cancel')->name('admin.purchases.cancel');

    Route::get('/admin/inventory', [InventoryController::class, 'overview'])->middleware('permission:inventory.view')->name('admin.inventory.overview');
    Route::get('/admin/inventory/stock', [InventoryController::class, 'stock'])->middleware('permission:stock.view')->name('admin.inventory.stock');
    Route::get('/admin/inventory/stock/{variant}', [InventoryController::class, 'stockDetail'])->middleware('permission:stock.view')->name('admin.inventory.stock.show');
    Route::get('/admin/inventory/movements', [InventoryController::class, 'movements'])->middleware('permission:stock.view')->name('admin.inventory.movements');
    Route::post('/admin/inventory/adjustments', [InventoryController::class, 'adjust'])->middleware('permission:inventory.adjust')->name('admin.inventory.adjustments');
});

/*
|--------------------------------------------------------------------------
| Notifications (Phase 13C)
|--------------------------------------------------------------------------
| Shared between admin and customer users — every route is scoped to the
| authenticated user's own notifications only (see NotificationController).
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notification/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');
    Route::delete('/notification/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
});

/*
|--------------------------------------------------------------------------
| Settings (Phase 13C)
|--------------------------------------------------------------------------
| Single centralized settings architecture — see SettingService. Reads
| require settings.view, writes require settings.update.
*/
Route::prefix('admin/settings')->name('admin.settings.')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [SettingController::class, 'index'])->middleware('permission:settings.view')->name('index');

    Route::get('/general', [SettingController::class, 'general'])->middleware('permission:settings.view')->name('general');
    Route::post('/general', [SettingController::class, 'updateGeneral'])->middleware('permission:settings.update')->name('general.update');

    Route::get('/store', [SettingController::class, 'store'])->middleware('permission:settings.view')->name('store');
    Route::post('/store', [SettingController::class, 'updateStore'])->middleware('permission:settings.update')->name('store.update');

    Route::get('/order', [SettingController::class, 'order'])->middleware('permission:settings.view')->name('order');
    Route::post('/order', [SettingController::class, 'updateOrder'])->middleware('permission:settings.update')->name('order.update');

    Route::get('/payment', [SettingController::class, 'payment'])->middleware('permission:settings.view')->name('payment');
    Route::post('/payment', [SettingController::class, 'updatePayment'])->middleware('permission:settings.update')->name('payment.update');

    Route::get('/shipping', [SettingController::class, 'shipping'])->middleware('permission:settings.view')->name('shipping');
    Route::post('/shipping', [SettingController::class, 'updateShipping'])->middleware('permission:settings.update')->name('shipping.update');

    Route::get('/return', [SettingController::class, 'returnSettings'])->middleware('permission:settings.view')->name('return');
    Route::post('/return', [SettingController::class, 'updateReturn'])->middleware('permission:settings.update')->name('return.update');

    Route::get('/tax', [SettingController::class, 'tax'])->middleware('permission:settings.view')->name('tax');
    Route::post('/tax', [SettingController::class, 'updateTax'])->middleware('permission:settings.update')->name('tax.update');

    Route::get('/notification', [SettingController::class, 'notification'])->middleware('permission:settings.view')->name('notification');
    Route::post('/notification', [SettingController::class, 'updateNotification'])->middleware('permission:settings.update')->name('notification.update');

    Route::get('/seo', [SettingController::class, 'seo'])->middleware('permission:settings.view')->name('seo');
    Route::post('/seo', [SettingController::class, 'updateSeo'])->middleware('permission:settings.update')->name('seo.update');
});

/*
|--------------------------------------------------------------------------
| Global Admin Search (Phase 13D)
|--------------------------------------------------------------------------
| Auth-only at the route level — SearchService enforces per-category
| permissions internally (see SearchService::categories). Throttled since
| it's a free-text query endpoint hit on every keystroke from the UI.
*/
Route::middleware(['auth:sanctum', 'throttle:search'])->prefix('admin/search')->name('admin.search.')->group(function () {
    Route::get('/', [SearchController::class, 'index'])->name('index');
    Route::get('/{type}', [SearchController::class, 'type'])->name('type');
});

/*
|--------------------------------------------------------------------------
| Audit Log (Phase 13D)
|--------------------------------------------------------------------------
| Read-only, append-only — no update/delete route exists anywhere in the
| app for audit_logs.
*/
Route::middleware('auth:sanctum')->prefix('admin/audit-logs')->name('admin.auditLogs.')->group(function () {
    Route::get('/', [AuditLogController::class, 'index'])->middleware('permission:audit_logs.view')->name('index');
    Route::get('/{auditLog}', [AuditLogController::class, 'show'])->middleware('permission:audit_logs.view')->name('show');
});
