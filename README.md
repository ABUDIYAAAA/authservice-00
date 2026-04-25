# Kael Auth Service

A modular Node.js authentication and identity service for multi-tenant applications.

It provides:

- JWT-based auth with refresh rotation and session tracking
- Email/password signup, verification, password reset, and session revocation
- OAuth (Google, GitHub) and OIDC-compatible authorization/token endpoints
- Multi-organization support with invites, roles, ownership transfer
- Organization-specific OAuth client/provider management
- Outbound webhook dispatch with delivery logs and replay support
- Background workers (BullMQ + Redis) for cleanup, email, and webhooks

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database and Migrations](#database-and-migrations)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [API Surface](#api-surface)
- [Background Jobs and Workers](#background-jobs-and-workers)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Public Repository Standards](#public-repository-standards)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Architecture

This repository follows a layered architecture:

- `src/modules/*`: domain modules (auth, oauth, user, organization, client, webhook)
- `src/core/*`: cross-cutting infrastructure (config, constants, logger, rate limiters)
- `src/db/*`: Drizzle ORM schemas, migrations, and DB client
- `src/queues/*`: queue producers
- `src/workers/*`: queue consumers/workers
- `src/docs/*`: OpenAPI source and generated JSON

HTTP API and worker process are intentionally separate:

- API process: `index.js`
- Worker process: `src/workers/worker.js`

## Tech Stack

- Runtime: Node.js (ESM)
- Server: Express 5
- Validation: Zod
- Database: PostgreSQL + Drizzle ORM
- Queue/Jobs: BullMQ + Redis
- Auth: JWT + cookie sessions
- API Docs: OpenAPI + Scalar UI
- Testing: Vitest

## Getting Started

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- OpenSSL (for local key generation)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill all required values in `.env`.

### 4. Generate JWT key pairs

```bash
npm run gen:keys
```

This creates key files in `keys/` and ensures `OAUTH_CLIENT_SECRET_ENCRYPTION_KEY` exists in `.env`.

### 5. Point `.env` key paths to generated files

Use values like:

- `ACCESS_TOKEN_PRIVATE_KEY_PATH=keys/access-private.pem`
- `ACCESS_TOKEN_PUBLIC_KEY_PATH=keys/access-public.pem`
- `REFRESH_TOKEN_PRIVATE_KEY_PATH=keys/refresh-private.pem`
- `REFRESH_TOKEN_PUBLIC_KEY_PATH=keys/refresh-public.pem`

### 6. Run migrations

```bash
npm run db:migrate
```

### 7. Start API and workers

```bash
npm run dev:all
```

## Environment Variables

The runtime validates env vars on boot from `src/core/config/config.js`. Missing/invalid required values fail fast.

See `.env.example` for the canonical list.

Key groups:

- Service: `APP_ENV`, `PORT`, `API_BASE_URL`, `FRONTEND_URL`
- Data stores: `DATABASE_URL`, `REDIS_URL`
- JWT keys/TTL: `ACCESS_TOKEN_*`, `REFRESH_TOKEN_*`
- OAuth providers: Google and GitHub credentials/callback URLs
- SMTP: host/port/user/pass/from
- Cookie/session/security: domain, secure, same-site, bcrypt, session TTL
- OAuth relogin/state TTL controls
- Postgres pool tuning values

## Database and Migrations

Drizzle configuration:

- Config: `drizzle.config.js`
- Schemas: `src/db/schemas`
- Migrations: `src/db/drizzle`

Useful commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:drop
```

## Running the Service

### Development API only

```bash
npm run dev
```

### Development API + workers

```bash
npm run dev:all
```

### Workers only

```bash
npm run worker
```

### Production start

```bash
npm start
```

## API Documentation

- Scalar UI: `GET /api-docs`
- OpenAPI JSON: `GET /api-docs.json`

Generate/refresh OpenAPI file:

```bash
npm run docs:generate
```

## API Surface

Primary route groups:

- Health
  - `GET /health`
- Auth
  - `/api/auth/signup`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/refresh`
  - `/api/auth/verify-email/:token`
  - `/api/auth/resend-verification`
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`
  - `/api/auth/sessions`
- Users
  - `/api/users/me`
- OAuth/OIDC
  - `/.well-known/openid-configuration`
  - `/api/oauth/.well-known/openid-configuration`
  - `/api/oauth/authorize`
  - `/api/oauth/token`
  - `/api/oauth/userinfo`
  - `/api/oauth/jwks`
  - `/api/oauth/google`
  - `/api/oauth/github`
  - organization client OAuth initiation/callback routes under `/api/oauth/orgs/*`
- Organizations
  - `/api/organizations/*`
- Organization Clients
  - nested under `/api/organizations/:orgId/clients/*`

For request/response schemas, use the OpenAPI docs.

## Background Jobs and Workers

Queues are defined in `src/queues/index.js`:

- `emailQueue`
- `deviceAlertQueue`
- `cleanupQueue`
- `serviceWebhookQueue`
- `deadLetterQueue`

Workers are started in `src/workers/worker.js`:

- Cleanup worker for expirable records
- Email worker
- Webhook delivery worker
- Device alert worker

Cleanup is scheduled every 15 minutes by the API process.

## Project Structure

```text
.
├── index.js
├── src
│   ├── core
│   ├── db
│   ├── docs
│   ├── modules
│   ├── queues
│   ├── scripts
│   ├── utils
│   ├── validations
│   └── workers
├── tests
└── drizzle.config.js
```

## Testing

Run tests with:

```bash
npm test
```

Vitest is configured via the package script. Add tests under `tests/` as modules evolve.

## Public Repository Standards

This repository includes:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- GitHub issue and PR templates in `.github/`

## Contributing

See `CONTRIBUTING.md` for branch, commit, and pull request guidance.

## Security

See `SECURITY.md` for vulnerability reporting instructions.

## License

Licensed under ISC. See `LICENSE`.
