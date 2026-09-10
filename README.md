# TTK Travel CRM — Web client

React SPA for the TTK Travel CRM. Talks to the API in `../TTKB`.

## Requirements

- Node.js 20.11+ (22 LTS recommended)
- The API running and reachable

## Setup

```bash
npm install
cp .env.example .env      # point VITE_APP_BASE_URL at your API
npm run dev               # http://localhost:5173
```

Two values must match the API's configuration or the app will not work:

| Web | API | Consequence of a mismatch |
|---|---|---|
| `VITE_APP_BASE_URL` origin | must appear in `CORS_URLS` | every request blocked by the browser |
| `VITE_APP_NAME` | `APP_NAME` | the client looks for a differently-named CSRF cookie, so every write fails with "Missing CSRF token" |

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run lint` | ESLint (the build fails on errors) |
| `npm test` | Vitest |

## Architecture

```
src/
  app/
    routes/         route table; every screen is lazy-loaded
    guards/         AuthGuard -> ClientGuard -> UrlAccessGuard -> AppLayout
    store/
      slices/       redux state
      slices/api/   RTK Query endpoints, one file per resource
    views/          screens, grouped by domain
    layouts/        shell, sidebar, navbar
  core/components/  shared UI
  constants/
    permissions.js  mirrors the API's permission model
  hooks/
    usePermission   the hook to gate a control on a permission
  utilities/        helpers
```

### Authentication

The API sets httpOnly session cookies; JavaScript cannot read them, and there
is no token in `localStorage` to steal. `configSlice.js` sets
`credentials: 'include'` on every request and echoes the readable CSRF cookie
in `x-csrf-token` on writes.

### Permissions

`GET /v1/auth/user` returns the caller's effective permissions. They land in
`state.auth.permissions` and drive two things:

```jsx
// 1. whole screens — handled for you by UrlAccessGuard
//    (src/app/guards/UrlPermissionGuard.jsx, mapping in constants/permissions.js)

// 2. individual controls
import { usePermission } from '@/hooks/usePermission'
import { PERMISSIONS } from '@/constants/permissions'

const canSeeMargin = usePermission(PERMISSIONS.MARGIN_READ)
{canSeeMargin && <SupplierCostColumn />}
```

> **This layer decides what the UI offers, not what the data allows.** Anyone can
> edit the redux store in devtools. Every permission is enforced again by the
> API on the request the control would make. Never treat a hidden button as a
> protected operation.

### Adding a screen

1. Build the view under `src/app/views/<domain>/`
2. Add the RTK Query endpoints in `src/app/store/slices/api/`
3. Register the route in `src/app/routes/protectedRoutes.jsx`
4. Map it to a permission in `src/constants/permissions.js` → `ROUTE_PERMISSIONS`
5. Add the matching permission to the API route (`requirePermission`) — the
   frontend mapping alone protects nothing

## Conventions

- Directories `camelCase`; components `PascalCase.jsx`; other files `camelCase.js`
- State goes in redux rather than deep prop drilling
- Reusable static data goes in `src/constants`
- ESLint runs during `vite build` and **fails the build on errors**, so
  `npm run lint` before pushing

## Production

Do not serve this with `vite dev`. `npm run build` produces static files;
`Dockerfile` builds them and serves the output from nginx with hashed-asset
caching, an SPA fallback and security headers. See `../TTKB/docs/DEPLOYMENT.md`.

The API URL is inlined **at build time** — Vite substitutes `VITE_*` variables
into the bundle — so changing it needs a rebuild, not a restart. That means one
image per environment.

## Licence

Proprietary. All rights reserved.
