<?php

/*
| Authentication strategy (Phase 1 correction): API auth is Bearer-token
| only (Sanctum Personal Access Tokens), not cookie-based, so
| supports_credentials is false and the CORS surface is limited to /api/*.
*/

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    // Comma-separated in .env so staging/prod can list their real frontend origins.
    'allowed_origins' => array_filter(explode(',', env('FRONTEND_URL', 'http://localhost:5173'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
