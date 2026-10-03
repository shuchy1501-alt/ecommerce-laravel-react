# FashionMart

Fashion E-Commerce + Sales + Inventory + Purchase + Supplier + Returns + Finance
Management platform. React SPA frontend + Laravel REST API backend.

**Phase 1 (this delivery): technical foundation only.** No business modules
(products, orders, inventory, purchases, suppliers, returns, finance) exist yet —
those are built in their own dedicated phases on top of this scaffold.

## Structure

```
fashionmart/
├── backend/     Laravel 11 API (MySQL, Sanctum, Spatie Permission)
└── frontend/    React 19 + Vite + Tailwind v4 SPA
```

Each app has its own README with setup steps:
- [`backend/README.md`](./backend/README.md)
- [`frontend/README.md`](./frontend/README.md) *(Vite's default — see notes below)*

## Quick start

**Backend** (needs PHP 8.2+, Composer, MySQL):
```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve   # http://localhost:8000
```

**Frontend** (needs Node 18+):
```bash
cd frontend
npm install
cp .env.example .env   # already points at http://localhost:8000/api
npm run dev            # http://localhost:5173
```

With both running, the dashboard's health indicator (top of page after login) should
read **API connected** — that's the Phase 1 smoke test.

## Design system

FashionMart's UI uses an editorial fashion-house palette (ink/bone/oxblood/gold),
Fraunces + Inter + Space Mono type, and a "swing-tag" notch motif on badges and
active nav items — see `frontend/src/index.css` for the token definitions.

## A note on this build environment

This scaffold was produced in a sandboxed environment with Node/npm access but no PHP
runtime and no access to `packagist.org`. The **frontend was actually installed, built,
and verified** (`npm run build` succeeds). The **backend was hand-authored** to Laravel
11 conventions but `composer install` / `php artisan` have not been executed or verified
here — run them locally as the first step.
