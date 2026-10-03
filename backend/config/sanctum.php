<?php

/*
| Authentication strategy (Phase 1 correction): this project uses Sanctum
| Personal Access Tokens exclusively — issued on login, sent back by the
| React SPA as `Authorization: Bearer {token}`, and validated by the
| `auth:sanctum` middleware. The cookie/CSRF "stateful SPA" flow is not
| used (see bootstrap/app.php, which does not call statefulApi()), so the
| `stateful` list below has no effect in this app but is left configured
| in case a first-party cookie session is ever reintroduced deliberately.
*/

return [
    'stateful' => array_filter(explode(',', env('SANCTUM_STATEFUL_DOMAINS', ''))),

    'guard' => ['web'],

    // Personal access tokens expire after 30 days by default; the React app
    // treats a 401 from any request as "log the user out" (see api/axios.js).
    'expiration' => (int) env('SANCTUM_TOKEN_EXPIRATION', 60 * 24 * 30),

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
