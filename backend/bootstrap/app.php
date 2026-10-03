<?php

use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Authentication strategy (Phase 1 correction): Sanctum Personal Access
        // Tokens via the `Authorization: Bearer {token}` header only. We
        // deliberately do NOT call $middleware->statefulApi() — that enables
        // Sanctum's cookie/CSRF-based SPA session flow, which this project
        // does not use, to avoid the two competing auth strategies that
        // existed in the original Phase 1 draft.
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        $middleware->alias([
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Every /api/* error response is normalized to a single JSON envelope:
        // { "success": false, "message": "...", "errors": {...}, "code": "..." }
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null; // fall back to default HTML handling for non-API requests
            }

            $status = 500;
            $message = 'Server error. Please try again later.';
            $errors = null;
            $code = 'SERVER_ERROR';

            if ($e instanceof ValidationException) {
                $status = 422;
                $message = 'The given data was invalid.';
                $errors = $e->errors();
                $code = 'VALIDATION_ERROR';
            } elseif ($e instanceof AuthenticationException) {
                $status = 401;
                $message = 'Unauthenticated.';
                $code = 'UNAUTHENTICATED';
            } elseif ($e instanceof AuthorizationException) {
                $status = 403;
                $message = $e->getMessage() ?: 'This action is unauthorized.';
                $code = 'FORBIDDEN';
            } elseif ($e instanceof ModelNotFoundException) {
                $status = 404;
                $message = 'Resource not found.';
                $code = 'NOT_FOUND';
            } elseif ($e instanceof NotFoundHttpException) {
                $status = 404;
                $message = 'Endpoint not found.';
                $code = 'NOT_FOUND';
            } elseif ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $message = $e->getMessage() ?: 'Request failed.';
                $code = 'HTTP_ERROR';
            }

            if (! app()->environment('production') && $status === 500) {
                $message = $e->getMessage() ?: $message;
            }

            return new JsonResponse(array_filter([
                'success' => false,
                'message' => $message,
                'code' => $code,
                'errors' => $errors,
            ], fn ($v) => ! is_null($v)), $status);
        });
    })->create();
