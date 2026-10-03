<?php

use Illuminate\Support\Facades\Route;

/*
| The frontend is a separate React SPA (Vite dev server / static build), so
| this backend has no Blade views. Authentication is Bearer-token only
| (Sanctum Personal Access Tokens) — see bootstrap/app.php and
| config/sanctum.php — so no stateful cookie/CSRF web routes are required
| here. This file exists mainly so hitting the API's root in a browser
| returns something sensible.
*/

Route::get('/', fn () => response()->json([
    'success' => true,
    'message' => 'FashionMart API is running. See /api for endpoints.',
]));
