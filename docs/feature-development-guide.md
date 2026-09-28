# Feature Development Guide

Use this guide when adding or modifying features.

## Backend Feature Checklist

1. Identify the existing module that owns the feature.
2. Add or update the entity if database changes are needed.
3. Add or update DTOs for request validation.
4. Add service methods for business logic.
5. Add controller routes.
6. Protect routes with `@Auth()` and `@Permissions()` where needed.
7. Add any new permission to `seed-super-admin.ts`.
8. Update frontend API helpers.
9. Test through Swagger.
10. Update docs in `docs/`.

## Frontend Feature Checklist

1. Add or update an API helper in `src/api`.
2. Add route-level UI in `src/pages`.
3. Extract reusable UI into `src/components` when needed.
4. Add route in `src/App.tsx`.
5. Add nav item in `src/components/NavBar.tsx` if it should appear in the sidebar.
6. Add role/permission visibility rules.
7. Handle loading, error, empty, success, and unauthorized states.
8. Test using a user role that should have access and one that should not.

## Adding a New Backend Module

Recommended structure:

```text
src/modules/example/
  dto/
    create-example.dto.ts
    update-example.dto.ts
  entities/
    example.entity.ts
  example.controller.ts
  example.module.ts
  example.service.ts
```

Then register the module in `src/app.module.ts`.

If the module uses TypeORM repositories, add:

```ts
TypeOrmModule.forFeature([Example])
```

inside the module imports.

## Adding a New Entity Field

Example: adding `notes` to units.

Backend:

1. Add a column to `Unit` entity:

```ts
@Column({ type: 'varchar', length: 500, nullable: true })
notes?: string;
```

2. Add the field to create/update DTOs if it should be accepted from API requests.
3. Ensure service create/update methods assign the field.
4. Restart the backend so TypeORM synchronizes the column.

Frontend:

1. Add the field to the relevant form/page.
2. Include it in `api/units.ts` payloads.
3. Display it where appropriate.

Docs:

1. Update `database.md` if the field matters to future developers.
2. Update domain docs if it changes behavior.

## Adding a New Permission-Protected Action

Example permission:

```text
assets:export
```

Steps:

1. Add `{ code: 'assets:export', description: 'Export assets' }` to `seed-super-admin.ts`.
2. Map it to default roles if needed.
3. Add `@Permissions('assets:export')` to the controller method.
4. Add frontend `PermissionGate` or nav rule.
5. Run `npm run seed:super-admin`.
6. Log out and back in so the token includes the new permission.
7. Update `auth-and-permissions.md`.

## Adding a New Page

1. Create `src/pages/NewPage.tsx`.
2. Create or update `src/api/newFeature.ts`.
3. Import the page in `src/App.tsx`.
4. Add:

```tsx
<Route path="/new-feature" element={<NewPage />} />
```

inside the authenticated layout if it requires login.

5. Add a nav item in `NavBar.tsx`:

```ts
{ to: '/new-feature', label: 'New Feature', icon: SomeIcon, permission: 'new:read' }
```

6. Make sure backend permission and frontend permission string match exactly.

## Adding a New Report

Backend:

1. Add service method in `reports.service.ts` or the owning domain service.
2. Add controller route in `reports.controller.ts`.
3. Protect with `@Auth()` and `@Permissions(...)`.
4. If exporting PDF/CSV, set correct response headers and response type.

Frontend:

1. Add function to `api/reports.ts`.
2. Add chart/table UI to `Reports.tsx` or `Dashboard.tsx`.
3. Use `recharts` for chart visualizations.
4. Handle empty datasets.

Docs:

1. Update `api-guide.md`.
2. Update `business-flows.md` if report logic has business meaning.

## Testing Expectations

This repo has Jest configuration for the backend and Vite build scripts for the frontend.

Recommended checks after changes:

Backend:

```bash
cd BMS
npm run build
npm run test
```

Frontend:

```bash
cd BMS-frontend/bms-frontend
npm run build
```

For route/API changes, also test manually through:

- Swagger at `/api`
- Frontend page workflow
- A user with permission
- A user without permission

## Documentation Checklist for Every Feature

Update:

| Change | Documentation |
| --- | --- |
| New route | `api-guide.md` |
| New table/field | `database.md` |
| New workflow | `business-flows.md` |
| New permission | `auth-and-permissions.md` |
| New frontend page | `frontend.md` |
| New setup/env requirement | `setup-and-deployment.md` |

