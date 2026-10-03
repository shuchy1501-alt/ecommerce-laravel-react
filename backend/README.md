# FashionMart API — Backend (Phase 1: Foundation)

Laravel REST API for FashionMart (Fashion E-Commerce + Sales + Inventory + Purchase +
Supplier + Returns + Finance Management). This phase ships the technical foundation
only — authentication, JSON conventions, CORS/Sanctum, and error handling. No business
tables (products, orders, inventory, etc.) exist yet; they arrive in their own phases.

## Stack

- Laravel 11 (PHP 8.2+)
- MySQL 8
- Laravel Sanctum (SPA cookie auth + API tokens)
- Spatie Laravel Permission (roles/permissions)

## Requirements

- PHP >= 8.2 with `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json` extensions
- Composer 2.x
- MySQL 8.x (or MariaDB 10.6+)
- Node is **not** required for the backend (the frontend is a separate app)

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate

# Create the database first (e.g. `CREATE DATABASE fashionmart CHARACTER SET utf8mb4;`)
# then set DB_* values in .env to match.

php artisan migrate --seed
php artisan storage:link

php artisan serve   # http://localhost:8000
```

Default seeded account (from `RolePermissionSeeder`): `admin@fashionmart.test` / `password`
with the **Super Admin** role — **change or remove this in any non-local environment.**

Approved roles (Spatie Laravel Permission, `guard_name: web`): `Super Admin`, `Admin`,
`Sales Manager`, `Inventory Manager`, `Customer`. Public self-registration always
creates a `Customer` account — the role is assigned server-side in `AuthService` and is
never accepted from the request.

## Environment notes

- `APP_TIMEZONE=Asia/Dhaka` and `APP_CURRENCY=BDT` are project-wide defaults, read via
  `config('app.timezone')` / `config('app.currency')` — never hard-code these in code.
- `FRONTEND_URL` / `SANCTUM_STATEFUL_DOMAINS` must list every origin the React SPA runs
  on (comma-separated) for CORS + Sanctum cookie auth to work.
- `APP_PAGINATION_SIZE` sets the default `paginate()` page size app-wide.

## Conventions for future phases

- **Controllers** stay thin: validate via a **Form Request**, delegate business logic to
  a **Service** class, return data through an **API Resource**, respond via
  `$this->success()` / `$this->error()` from the base `Controller`.
- **Every response is one JSON envelope:**
  - Success: `{ "success": true, "message": "...", "data": ..., "meta"?: {...} }`
  - Error: `{ "success": false, "message": "...", "code": "...", "errors"?: {...} }`
    (handled centrally in `bootstrap/app.php` → `withExceptions`, so controllers rarely
    need their own try/catch for validation/auth/not-found errors)
- **Money, stock, discount, refund, and permission checks are always server-side** —
  never trust a price/total/stock value sent from the frontend. Use DB transactions
  (`DB::transaction()`) for any multi-step write that touches stock or money.
- **Authorization**: use Laravel Policies + the `permission:` / `role:` route middleware
  aliases (registered in `bootstrap/app.php`) rather than ad hoc checks in controllers.
- New business routes are added to `routes/api.php` inside `Route::middleware('auth:sanctum')`
  groups, following the commented example already in that file.

## API conventions quick reference

| Concern | Where |
|---|---|
| JSON success/error envelope | `app/Http/Controllers/Controller.php` |
| Centralized exception → JSON mapping | `bootstrap/app.php` (`withExceptions`) |
| CORS | `config/cors.php` (origins from `FRONTEND_URL`) |
| Sanctum Bearer token auth | `config/sanctum.php`, `bootstrap/app.php` (no `statefulApi()`) |
| Roles/permissions | `config/permission.php`, `spatie/laravel-permission` |
| Pagination default | `config('app.pagination_size')` |

## Testing

```bash
php artisan test
# or
vendor/bin/phpunit
```

Tests run against an in-memory SQLite DB (see `phpunit.xml`), so no MySQL setup is
needed to run the suite. Covers: `/api/health`, JSON 404 shape, and the full
register/login/me/logout auth flow.

## Seed strategy

- `DatabaseSeeder` calls `RolePermissionSeeder` only in this phase — it creates the
  five approved roles (`Super Admin`, `Admin`, `Sales Manager`, `Inventory Manager`,
  `Customer`) and one seeded Super Admin user. The seeder is idempotent (`db:seed` is
  safe to run repeatedly) and safely migrates any pre-correction `staff`/`admin`/
  `manager` role assignments forward without deleting a role while users still hold it.
- Each future phase appends its own seeder (e.g. `ProductSeeder`, `SupplierSeeder`) to
  the `$this->call([...])` list in `DatabaseSeeder`, and adds any module-specific
  permissions (e.g. `products.manage`, `finance.view`) in its own seeder rather than here.

## A note on this scaffold

This backend was hand-authored to Laravel 11 conventions in an environment without PHP
or access to packagist.org, so `composer install` has **not** been run or verified here.
Run `composer install` locally before `php artisan serve`/`migrate`/`test` — if anything
doesn't boot, it's most likely a version-drift issue in `composer.json` worth double
checking against a fresh `laravel new` for your installed PHP version.
