# analysis-collector

Backend service for collecting analysis batch results and serving batch/download APIs.

## Stack

- NestJS 10
- TypeScript
- PostgreSQL (`pg`)
- AWS S3
- PM2

## Main API

- `POST /analysis/batches`
- `POST /analysis/batches/:batch_id/upload-urls`
- `POST /analysis/batches/:batch_id/confirm`
- `GET /analysis/batches/:batch_id`
- `GET /analysis/batches/:batch_id/result-urls`
- `GET /analysis/customers/:customer_id/result-urls`
- `GET /analysis/consultants/:consultant_id/result-urls`

Swagger is available at `/docs` when `SWAGGER_ENABLED=true`.

Authenticated endpoints use the standard `Authorization: Bearer <token>` header.

## Project Structure

```text
src/
  analysis/    analysis APIs and services
  common/      auth, logger, interceptors, filters
  config/      env validation and config
  database/    PostgreSQL service
  health/      health check APIs
  s3/          S3 upload/download service
```

## Environment Variables

Use `.env.example` as the starting point for deployment.

```bash
NODE_ENV=development
PORT=3010
SWAGGER_ENABLED=true

JWT_SECRET=
CRM_ACCESS_TOKEN_SECRET=
APP_ID=
DOMAIN=

DB_HOST=
DB_PORT=5432
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_BOOTSTRAP_DATABASE=postgres
DB_AUTO_CREATE_DATABASE=true
DB_AUTO_MIGRATE=true
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

AWS_REGION=
AWS_BUCKET=
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
CDN_URL=

LOGIN_CRM_ANALYSIS_COMPLETE_URL=
LOGIN_CRM_INTERNAL_TOKEN=
LOGIN_CRM_WEBHOOK_TIMEOUT_MS=10000
```

## Run

```bash
npm install
npm run start:dev
```

## Build

```bash
npm run build
npm run start:prod
```

## PM2

```bash
npm run build
pm2 start ecosystem.config.js --env production
```

`ecosystem.config.js` uses its own directory as the PM2 `cwd`, so the repository
can live under different absolute paths on each server.

## GitHub Actions Deploy

This repository includes a production deploy workflow that runs on every push to `main`.
Production currently targets two servers, deployed in this order: Paris first, then China.

Required repository secrets:

- `PROD_PARIS_SSH_PRIVATE_KEY`
- `PROD_CHINA_SSH_PRIVATE_KEY`

Required repository variables:

- `PROD_PARIS_HOST`
- `PROD_PARIS_USER`
- `PROD_PARIS_PORT`
- `PROD_PARIS_PATH`
- `PROD_CHINA_HOST`
- `PROD_CHINA_USER`
- `PROD_CHINA_PORT`
- `PROD_CHINA_PATH`

Each server must already have:

- the repository cloned at each `path`
- Node.js and npm installed
- PM2 installed and configured
- the production `.env` file present on the server
- SSH access allowed for the deploy key

There is also a staging deploy workflow that runs on every push to `stg_main`.
Staging targets a single server.

Required staging repository secrets:

- `STG_SSH_PRIVATE_KEY`

Required staging repository variables:

- `STG_HOST`
- `STG_USER`
- `STG_PORT`
- `STG_PATH`

The staging server must already have:

- the repository cloned at `path`
- Node.js and npm installed
- PM2 installed and configured
- the staging `.env` file present on the server
- SSH access allowed for the deploy key

## Migration

On startup the app:

1. Connects to `DB_BOOTSTRAP_DATABASE` to verify access.
2. Creates `DB_NAME` automatically if it does not exist and `DB_AUTO_CREATE_DATABASE=true`.
3. Applies every `migrations/*.sql` file in lexical order.
4. Records applied files in `schema_migrations`.

Current batch-only schema creation SQL is in:

- `migrations/2026-04-02-batch-only-refactor.sql`
