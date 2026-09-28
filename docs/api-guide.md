# API Guide

The backend exposes REST endpoints through NestJS controllers.

Swagger is available at:

```text
http://localhost:2546/api
```

## Authentication Header

Protected endpoints expect:

```http
Authorization: Bearer <jwt>
```

The frontend injects this header from `localStorage.token` in `src/api/axios.ts`.

## Main Route Groups

| Route group | Purpose |
| --- | --- |
| `/auth` | Login, profile, login history, refresh token, change password. |
| `/users` | User CRUD, activation, role assignment, signatures. |
| `/roles` | Role CRUD and role-permission assignment. |
| `/permissions` | Permission CRUD/list. |
| `/sites` | Site CRUD. |
| `/buildings` | Building CRUD, amenities, building admin assignment. |
| `/owners` | Owner CRUD. |
| `/units` | Unit CRUD, bulk upload, amenities. |
| `/unit-types` | Unit type CRUD. |
| `/amenities` | Amenities and building/unit links. |
| `/tenants` | Tenant list/detail/register/update. |
| `/applications` | Tenant applications. |
| `/documents` | Document upload/search/history/delete/generation/verification. |
| `/leases` | Lease lifecycle, lease payment schedule, downloads, occupancy reports. |
| `/finance` | Invoices, payments, banks, ledgers, analytics, tax rules, reports, expenses, deposit advice. |
| `/maintenance` | Requests, contractors, work orders, schedules, SLA, feedback, reports. |
| `/visitors` | Visitor CRUD and checkout. |
| `/utilities` | Meters, readings, utility alerts. |
| `/notifications` | Notification list/read/delete, announcements, devices, push tests. |
| `/automations` | Automation status, manual run, enable/disable, logs. |
| `/reports` | Dashboard, financial, occupancy, maintenance, people, lease, property, exports. |
| `/qr` | QR generation, analytics, deactivate, export. |
| `/public/q/:token` | Public unit QR lookup. |
| `/public/building/:token/units` | Public building QR lookup. |
| `/assets` | Asset CRUD. |
| `/management` | Management companies and assignments. |
| `/commissions` | Commissions, rules, payments, approval. |
| `/tenders` | Lease tenders and bids. |
| `/inspections` | Inspection generation and workflow. |
| `/settings` | Organization settings. |
| `/upload` | Image/document upload and deletion. |
| `/audit` | Admin activity logs. |

## Important Endpoint Patterns

### Auth

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Login and return access token. |
| `GET` | `/auth/profile` | Return authenticated user payload. |
| `GET` | `/auth/login-history` | Return recent login history. |
| `POST` | `/auth/change-password` | Change current user's password. |

### Lease Lifecycle

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/leases` | Create draft lease. |
| `GET` | `/leases` | List leases, filtered by role/service logic. |
| `GET` | `/leases/:id` | Get lease details. |
| `PATCH` | `/leases/:id/activate` | Activate draft lease. |
| `PATCH` | `/leases/:id/terminate` | Terminate active/renewed lease. |
| `POST` | `/leases/:id/renew` | Create renewal draft. |
| `PATCH` | `/leases/:id` | Update draft lease. |
| `DELETE` | `/leases/:id` | Delete draft or terminated lease. |
| `GET` | `/leases/:id/download` | Download lease PDF. |
| `GET` | `/leases/:id/payment-schedule` | Get lease payment schedule. |

### Finance

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/finance/invoices` | List invoices with filters and role-aware service logic. |
| `GET` | `/finance/invoices/all` | Admin/all invoice listing. |
| `POST` | `/finance/invoices` | Create invoice. |
| `PATCH` | `/finance/invoices/:id/draft` | Update draft invoice. |
| `PATCH` | `/finance/invoices/:id/confirm` | Approve draft invoice. |
| `DELETE` | `/finance/invoices/:id` | Void invoice. |
| `POST` | `/finance/payments` | Submit payment. |
| `PATCH` | `/finance/payments/:id/verify` | Confirm/reject payment. |
| `GET` | `/finance/payments/:id/receipt` | Download receipt PDF. |
| `GET` | `/finance/ledger/tenant/:tenantId` | Tenant ledger. |
| `GET` | `/finance/ledger/tenant/:tenantId/pdf` | Tenant ledger PDF. |
| `GET` | `/finance/my-summary` | Tenant summary. |
| `GET` | `/finance/analytics` | Finance dashboard analytics. |

## File and Blob Responses

Some frontend API helpers request blobs:

- Lease PDF downloads.
- Finance receipt PDFs.
- Tenant ledger PDFs.
- QR exports.

For blob responses, frontend API calls must set:

```ts
{ responseType: 'blob' }
```

## Error Handling

The backend uses Nest exceptions such as:

- `BadRequestException`
- `UnauthorizedException`
- `ForbiddenException`
- `NotFoundException`
- `ConflictException`

The frontend Axios response interceptor logs errors and redirects to login on `401`.

