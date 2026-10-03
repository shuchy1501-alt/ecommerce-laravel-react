<?php

namespace App\Providers;

use App\Policies\RolePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Fail loudly on lazy-loading / mass-assignment mistakes outside production.
        Model::shouldBeStrict(! $this->app->isProduction());
        Model::unguard(false);

        // Default page size for all paginate() calls unless a controller overrides it.
        Paginator::defaultView('default');
        Paginator::currentPageResolver(fn () => (int) request()->integer('page', 1));

        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        // Spatie's Role model lives outside App\Models, so Laravel's policy
        // auto-discovery can't find RolePolicy for it automatically.
        // Every other model (Product, Order, Customer, ...) IS auto-discovered
        // and needs no entry here.
        Gate::policy(Role::class, RolePolicy::class);

        $this->registerRateLimiters();
    }

    /**
     * Phase 13D security fix — no rate limiting existed anywhere in the
     * app before this, leaving login/register open to unlimited brute
     * force / credential-stuffing attempts. Keyed by IP + the submitted
     * email/name (not the authenticated user, since there isn't one yet)
     * so one attacker can't lock out a legitimate user by hammering their
     * email from many IPs, while still bounding per-IP volume.
     */
    private function registerRateLimiters(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return [
                Limit::perMinute(5)->by($key),
                Limit::perMinute(20)->by($request->ip()),
            ];
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
