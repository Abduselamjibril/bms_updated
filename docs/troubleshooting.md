# Troubleshooting

## Frontend Redirects to Login

Possible causes:

- No token exists in `localStorage`.
- Backend returned `401`.
- Token expired.
- Backend `JWT_SECRET` changed.
- Frontend is calling the wrong API base URL.

Check:

- `localStorage.token`
- `VITE_API_BASE_URL`
- Backend logs
- `/auth/login` response

## Sidebar Item Is Missing

Possible causes:

- User role does not match the nav item.
- User permission does not match the nav item.
- Permission was added in DB after login, but JWT is stale.
- `NavBar.tsx` permission string does not match backend seed/controller permission.

Fix:

- Confirm role/permission in the JWT.
- Log out and back in.
- Check `seed-super-admin.ts`.
- Check `NavBar.tsx`.

## Backend Says Insufficient Permissions

Possible causes:

- Route has `@Permissions(...)` and the user's role does not grant it.
- User has no `UserRole` record.
- Permission exists but is not mapped through `RolePermission`.
- Token belongs to a different user than expected.

Check:

- `user_roles`
- `role_permissions`
- `permissions`
- The controller decorator.
- `RolesGuard`.

## Permission Was Added but User Still Cannot Access

JWT permissions are generated at login time.

After changing permissions:

1. Run the seed script if needed.
2. Log out.
3. Log in again.

## Database Schema Did Not Update

Current setup uses TypeORM `synchronize: true`.

Check:

- Entity field exists and decorator is correct.
- Entity belongs to a module imported by `AppModule`.
- Module uses `TypeOrmModule.forFeature(...)` where needed.
- Backend restarted.
- Database connection points to the expected DB.

## Database Schema Changed Unexpectedly

Because `synchronize: true` is enabled, TypeORM may alter schema on startup.

For production, prefer migrations and `synchronize: false`.

## CORS Error in Browser

Check:

- Backend `FRONTEND_URL`.
- Frontend port. Default Vite port is `5173`.
- `main.ts` allowed origins.
- Whether the frontend is using `localhost` vs `127.0.0.1`.

## File Upload Does Not Display

Check:

- File was saved under backend `uploads/`.
- URL begins with `/uploads/...`.
- Backend static serving is active.
- Helmet `crossOriginResourcePolicy` is set to `cross-origin`.
- Frontend API base URL is correct if displaying absolute URLs.

## Finance Invoice Creation Fails

Possible cause:

- Organization settings are missing.

`FinanceService.createInvoice()` requires settings to load VAT rate.

Fix:

- Configure settings through the settings page/API.
- Confirm `organization_settings` has a row.

## Lease Activation Fails

Common causes:

- Lease is not `DRAFT`.
- Unit is not `VACANT`.
- Lease dates overlap another draft/active/renewed lease.
- Tenant does not have a verified ID/passport document.

Check:

- `leases.status`
- `units.status`
- tenant documents and `verified` field.

## Redis or Queue Problems

The codebase uses both Bull and BullMQ:

- Notifications use `@nestjs/bullmq`.
- Finance queues use `@nestjs/bull`.

Check:

- `REDIS_HOST`
- `REDIS_PORT`
- Redis container/service is running.
- The queue library used by the affected module.

## Swagger Does Not Authorize Requests

Use `/auth/login` first, copy the token, then click Swagger Authorize and enter the bearer token.

Swagger is at:

```text
http://localhost:2546/api
```

## Frontend Calls Production API by Accident

If `VITE_API_BASE_URL` is missing, Axios falls back to:

```text
https://bms.skylinkict.com
```

Set `.env` in `BMS-frontend/bms-frontend/`:

```env
VITE_API_BASE_URL=http://localhost:2546
```

