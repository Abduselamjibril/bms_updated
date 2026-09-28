# Setup and Deployment

## Requirements

| Requirement | Notes |
| --- | --- |
| Node.js | Backend Dockerfile uses `node:18-alpine`; local development should use a compatible modern Node version. |
| npm | Both apps use `package-lock.json`. |
| PostgreSQL | Primary database. |
| Redis | Required for queues/notifications/finance jobs. |
| Docker | Optional but recommended for local backend stack. |

## Backend Setup

Path:

```bash
cd BMS
```

Install:

```bash
npm install
```

Run development server:

```bash
npm run start:dev
```

Run production build:

```bash
npm run build
npm run start:prod
```

Seed roles, permissions, users, unit types, and templates:

```bash
npm run seed:super-admin
```

## Backend Environment Variables

The backend reads `.env` using `ConfigModule`.

Observed variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend API port. Defaults to `2546` in `main.ts`. |
| `DB_HOST` | Postgres host. |
| `DB_PORT` | Postgres port used by API. |
| `DB_USERNAME` | Postgres username. |
| `DB_PASSWORD` | Postgres password. |
| `DB_NAME` | Postgres database name. |
| `DB_PORT_EXTERNAL` | Docker host port for Postgres. |
| `PGADMIN_PORT` | Docker host port for pgAdmin. |
| `REDIS_HOST` | Redis host. |
| `REDIS_PORT` | Redis port used by API. |
| `REDIS_PORT_EXTERNAL` | Docker host port for Redis. |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASS` | SMTP password. |
| `FROM_EMAIL` | Sender email address. |
| `FRONTEND_URL` | Frontend URL allowed by CORS and used in links. |
| `JWT_SECRET` | JWT signing secret. Falls back to `defaultSecret` if unset. |
| `SUPER_ADMIN_EMAIL` | Optional seed super admin email. |
| `SUPER_ADMIN_PASSWORD` | Optional seed super admin password. |

## Docker Backend Stack

Path:

```bash
cd BMS
```

Run:

```bash
docker-compose up --build
```

Services:

| Service | Purpose |
| --- | --- |
| `api` | NestJS API container. |
| `db` | Postgres 15 Alpine. |
| `pgadmin` | Browser-based DB admin tool. |
| `redis` | Redis 7 Alpine. |

The API container mounts:

```text
./uploads:/usr/src/app/uploads
```

## Running Locally With Docker Desktop

Use this method when you want Docker Desktop to run the backend infrastructure.

1. Open Docker Desktop and make sure it is running.
2. Open a terminal in the backend folder:

```bash
cd BMS
```

3. Confirm the backend `.env` file exists and contains the required variables:

```env
PORT=2546
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=bms_db
DB_PORT_EXTERNAL=5432
PGADMIN_PORT=5050
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PORT_EXTERNAL=6379
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-secure-secret
```

The exact values can differ, but the Docker Compose service names matter:

| Variable | Docker value |
| --- | --- |
| `DB_HOST` | `db` |
| `DB_PORT` | `5432` |
| `REDIS_HOST` | `redis` |
| `REDIS_PORT` | `6379` |

4. Start the Docker stack:

```bash
docker-compose up --build
```

5. Wait until the API, database, Redis, and pgAdmin containers are running in Docker Desktop.

6. Open the backend:

```text
http://localhost:2546
```

7. Open Swagger:

```text
http://localhost:2546/api
```

8. If the database is empty, run the seed command in another terminal:

```bash
cd BMS
npm run seed:super-admin
```

If the seed command runs outside Docker, adjust the local `.env` temporarily so the host machine can reach Postgres through the exposed port:

```env
DB_HOST=localhost
DB_PORT=<DB_PORT_EXTERNAL>
REDIS_HOST=localhost
REDIS_PORT=<REDIS_PORT_EXTERNAL>
```

Then change the Docker values back before running the API inside Docker again.

## pgAdmin Method

The Docker Compose stack includes pgAdmin.

Open pgAdmin in the browser:

```text
http://localhost:<PGADMIN_PORT>
```

For example, if `PGADMIN_PORT=5050`:

```text
http://localhost:5050
```

Default pgAdmin login from `docker-compose.yml`:

| Field | Value |
| --- | --- |
| Email | `admin@admin.com` |
| Password | `admin` |

After logging in, register the Postgres server:

1. Right-click `Servers`.
2. Select `Register` -> `Server`.
3. In the `General` tab, set any name, for example `BMS Local`.
4. In the `Connection` tab, use:

| Field | Value |
| --- | --- |
| Host name/address | `db` |
| Port | `5432` |
| Maintenance database | value of `DB_NAME` |
| Username | value of `DB_USERNAME` |
| Password | value of `DB_PASSWORD` |

Because pgAdmin is running inside the same Docker network as Postgres, the host should be the Compose service name `db`.

If you connect from a desktop database tool outside Docker, use:

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | value of `DB_PORT_EXTERNAL` |
| Database | value of `DB_NAME` |
| Username | value of `DB_USERNAME` |
| Password | value of `DB_PASSWORD` |

## Running Frontend Against Docker Backend

Start the backend stack first, then run the frontend locally:

```bash
cd BMS-frontend/bms-frontend
npm run dev
```

Make sure the frontend `.env` points to the Docker backend API:

```env
VITE_API_BASE_URL=http://localhost:2546
```

Then open:

```text
http://localhost:5173
```

## Frontend Setup

Path:

```bash
cd BMS-frontend/bms-frontend
```

Install:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## Frontend Environment Variables

`.env.example`:

```env
VITE_API_BASE_URL=http://localhost:2546
```

The frontend Axios client falls back to:

```text
https://bms.skylinkict.com
```

if `VITE_API_BASE_URL` is not set.

## Local Development URLs

| App | URL |
| --- | --- |
| Backend | `http://localhost:2546` |
| Swagger | `http://localhost:2546/api` |
| Frontend | `http://localhost:5173` |

## CORS

The backend allows:

- `FRONTEND_URL`
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- `http://localhost:5174`
- 127.0.0.1 equivalents

If the frontend runs on a different host/port, update `FRONTEND_URL`.

## Production Notes

Before production hardening:

1. Set a strong `JWT_SECRET`.
2. Consider changing TypeORM `synchronize` to `false` and using migrations.
3. Ensure SMTP and Firebase credentials are configured correctly.
4. Ensure uploaded files are backed up or stored in durable object storage.
5. Make sure Redis is reachable by both Bull and BullMQ integrations.
6. Review Docker port bindings. Current compose binds services to `127.0.0.1`.
7. Run `npm run build` for backend and frontend before deployment.
