# Backend Guide

The backend is a NestJS application in `BMS/`.

## Entry Points

| File | Purpose |
| --- | --- |
| `src/main.ts` | Creates the Nest app, configures Helmet, CORS, static uploads, validation, Swagger, and listens on `PORT` or `2546`. |
| `src/app.module.ts` | Registers global modules, TypeORM, feature modules, throttling, and static file serving. |
| `seed-super-admin.ts` | Seeds roles, permissions, users, unit types, and default document templates. |
| `docker-compose.yml` | Defines API, Postgres, pgAdmin, and Redis services. |

## Module Pattern

Most modules follow this structure:

```text
src/modules/<module>/
  <module>.module.ts
  <module>.controller.ts
  <module>.service.ts
  dto/
  entities/
```

Common responsibilities:

| Layer | Responsibility |
| --- | --- |
| Module | Registers repositories, providers, controllers, and imported modules. |
| Controller | Defines HTTP routes and decorators such as `@Auth()` and `@Permissions()`. |
| Service | Holds business rules and database operations. |
| DTO | Defines accepted request payloads and validation. |
| Entity | Defines the TypeORM table, columns, relations, indexes, and enums. |

## Global Backend Configuration

Configured in `src/app.module.ts` and `src/main.ts`:

| Feature | Current behavior |
| --- | --- |
| Config | `ConfigModule.forRoot({ isGlobal: true })` reads `.env`. |
| Database | TypeORM connects to Postgres using `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`. |
| Entities | `autoLoadEntities: true`. |
| Schema sync | `synchronize: true`. This updates schema from entities at runtime. |
| Upload serving | `uploads/` is served under `/uploads`. |
| CORS | Allows `FRONTEND_URL`, localhost ports `3000`, `3001`, `5173`, `5174`, and 127.0.0.1 equivalents. |
| Validation | Global `ValidationPipe` with whitelist, transform, and forbid non-whitelisted fields. |
| Swagger | Available at `/api` with bearer auth support. |
| Throttling | Global throttler set to 100 requests per minute. |

## Backend Modules

| Module | Purpose |
| --- | --- |
| `auth` | Login, profile, login history, token refresh, password change. |
| `users` | User CRUD, role assignment, account activation, signatures. |
| `roles` | Roles, permissions, role-permission assignments. |
| `owners` | Building owner records. |
| `sites` | Site-level property grouping. |
| `buildings` | Buildings, building admin assignments, building amenities. |
| `units` | Units, bulk upload, unit amenities. |
| `unit-types` | Configurable unit types. |
| `amenities` | Amenity catalog and linking to buildings/units. |
| `tenants` | Tenant registration, applications, documents, announcements, messages. |
| `leases` | Lease creation, activation, renewal, termination, occupancy history, lease PDFs. |
| `finance` | Bank accounts, invoices, payments, expenses, deposit advice, tax rules, reports, PDFs. |
| `maintenance` | Requests, contractors, work orders, schedules, SLA checks, feedback, reports. |
| `documents` | Upload/search/history/templates/generated contracts and receipts. |
| `upload` | Image/document upload endpoints. |
| `qr` | QR generation, public unit/building views, scan logs, analytics, export. |
| `visitors` | Visitor check-in/out and visitor records. |
| `utility` | Utility meters, meter readings, leak alerts. |
| `notifications` | In-app notifications, email, push notification device tokens, Telegram bot notification integration, notification queue. |
| `reports` | Dashboard, finance, occupancy, maintenance, people, lease, property, export reports. |
| `automations` | Cron jobs, job status, job logs, manual job runs. |
| `inspections` | Inspection generation, workflow, item updates, submit/verify. |
| `assets` | Property asset inventory. |
| `management` | Management companies, assignments, permissions. |
| `commission` | Commission rules, commission calculation, payments. |
| `tenders` | Lease tenders and bids. |
| `settings` | Organization settings, tax rules, branding values. |
| `audit` | Admin activity logging. |
| `workforce` | Agencies, contracts, agency employees, internal employees, assignments, attendance, leaves. |

## Auth Pattern

Most protected controllers use:

```ts
@Auth()
```

`@Auth()` applies:

```ts
UseGuards(JwtAuthGuard, RolesGuard)
ApiBearerAuth()
```

For permission checks:

```ts
@Permissions('users:read')
```

For role checks:

```ts
@Roles('super_admin', 'admin')
```

See [Auth and Permissions](auth-and-permissions.md).

## Database Access

Services use TypeORM repositories injected with:

```ts
@InjectRepository(Entity)
private readonly repo: Repository<Entity>
```

Some services also inject `DataSource` for transactions or dynamic repositories.

Example transaction behavior appears in lease activation and termination, where lease status, unit status, occupancy history, expenses, invoices, and commission hooks may be changed together.

## Queues and Scheduled Work

The project uses both Bull and BullMQ:

| Area | Library | Notes |
| --- | --- | --- |
| Notifications | `@nestjs/bullmq` | Registers `notification` queue with Redis connection. |
| Finance | `@nestjs/bull` | Registers `monthly-invoice` and `overdue-penalty` queues. |
| Automations | `@nestjs/schedule` | Runs cron scanners for leases, payments, utilities, and log cleanup. |

This mixed queue setup is important when debugging queue runtime behavior.

## File Uploads

Uploads are stored in the backend `uploads/` folder and served at:

```text
/uploads/<filename>
```

`src/main.ts` and `ServeStaticModule` both configure static upload serving.

## Swagger

Swagger is available at:

```text
http://localhost:2546/api
```

Bearer token authorization is configured, so protected routes can be tested from Swagger after login.

## Important Backend Conventions

- Password fields are stored as `password_hash`.
- User roles are stored through `UserRole`, not directly on `User`.
- Role permissions are stored through `RolePermission`.
- Tenant records are linked one-to-one to users.
- Lease activation changes unit status to occupied.
- Lease termination changes unit status to vacant.
- Invoice/payment logic should update invoice status and bank/advance balances consistently.
- Owner, tenant, and nominee-admin data access is often filtered inside service methods, not only by decorators.

