# Frontend Guide

The frontend is a Vite + React + TypeScript application in `BMS-frontend/bms-frontend/`.

## Entry Points

| File | Purpose |
| --- | --- |
| `src/main.tsx` | Mounts React, BrowserRouter, ThemeProvider, ToastProvider, and App. |
| `src/App.tsx` | Defines all routes and the authenticated layout. |
| `src/api/axios.ts` | Creates the Axios client, sets API base URL, injects JWT bearer token, logs requests, handles 401 responses. |
| `src/auth/auth.ts` | Login/logout/token/profile/password helpers. |
| `src/utils/jwt.ts` | Decodes JWT, reads roles, permissions, user id, and user payload. |
| `src/components/NavBar.tsx` | Main sidebar navigation with role/permission visibility rules. |
| `src/components/ProtectedRoute.tsx` | Redirects to `/login` when no token exists. |
| `src/components/PermissionGate.tsx` | Conditionally renders children based on one permission. |

## Folder Structure

```text
src/
  api/          API helper files grouped by backend domain
  auth/         Login/logout/profile helpers
  components/   Shared UI and layout components
  contexts/     Theme, notification, and layout state
  pages/        Route-level screens
  utils/        JWT, Firebase, export utilities
  App.tsx       Route tree
  main.tsx      React boot file
  index.css     Tailwind/global styles
```

## API Client

The Axios client uses:

```ts
baseURL: import.meta.env.VITE_API_BASE_URL || 'https://bms.skylinkict.com'
```

Every request checks `localStorage.getItem('token')` and sets:

```text
Authorization: Bearer <token>
```

On a `401`, it removes the token and redirects to `/login`.

## Routes

Public routes:

| Route | Page |
| --- | --- |
| `/login` | Login |
| `/public/building/:token` | Public building view |
| `/public/q/:token` | Public unit QR view |

Authenticated routes are wrapped by `AuthLayout`, which applies:

| Wrapper | Purpose |
| --- | --- |
| `ProtectedRoute` | Requires a token in localStorage. |
| `LayoutProvider` | Manages sidebar/mobile layout state. |
| `NotificationProvider` | Provides unread notification state. |
| `NavBar` | Shows permission-aware sidebar. |

Authenticated pages include dashboard, sites, buildings, units, facilities, tenants, leases, utilities, visitors, maintenance, finance, documents, users, roles, owners, reports, settings, QR, profile, login history, automations, notifications, management, commissions, tenders, assets, and inspections.

## Navigation Permissions

`NavBar.tsx` defines `NAV_GROUPS`.

Each nav item can have:

| Field | Meaning |
| --- | --- |
| `permission` | One required permission. |
| `permissions` | Any one of several permissions is enough. |
| `roles` | Any listed role can see the item. |

`super_admin` bypasses all frontend nav checks.

Important: frontend nav visibility is only a UX filter. Backend controllers and service-level checks are the real security layer.

## JWT Utilities

`src/utils/jwt.ts` decodes the JWT stored in localStorage.

The frontend expects token payload fields like:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "roles": ["admin"],
  "permissions": ["users:read"]
}
```

## API Helper Files

The frontend maps backend domains into files under `src/api/`.

Examples:

| File | Backend area |
| --- | --- |
| `api/users.ts` | `/users` |
| `api/roles.ts` | `/roles`, `/permissions` |
| `api/buildings.ts` | `/buildings` |
| `api/units.ts` | `/units` |
| `api/tenants.ts` | tenant/application/document/message routes |
| `api/leases.ts` | `/leases` routes |
| `api/finance.ts` | `/finance` and upload helpers |
| `api/maintenance.ts` | `/maintenance` |
| `api/documents.ts` | `/documents` |
| `api/qr.ts` | `/qr`, `/public/q`, exports |
| `api/reports.ts` | `/reports` |
| `api/automations.ts` | `/automations` |
| `api/notifications.ts` | `/notifications` |

## Adding a Frontend Feature

1. Add or update an API helper in `src/api/<domain>.ts`.
2. Add page/component code in `src/pages` or `src/components`.
3. Add a route in `src/App.tsx`.
4. Add a navigation item in `src/components/NavBar.tsx` if it is a primary page.
5. Use `PermissionGate` or nav permissions when the feature is role/permission-specific.
6. Handle loading, empty, error, and success states.
7. Make sure the backend endpoint returns the shape the page expects.

## Frontend Environment

`BMS-frontend/bms-frontend/.env.example` contains:

```env
VITE_API_BASE_URL=http://localhost:2546
```

The local `.env` should define the backend API URL used by Axios.

