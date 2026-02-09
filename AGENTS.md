# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository scope and related projects

- This repo is the **standalone web frontend** for the Leasebase platform.
- It is **frontend-only**:
  - No backend API code lives here.
  - No mobile code lives here.
- The web client talks to the backend API running from the separate backend repo:
  - Backend/API: `../leasebase` (a.k.a. `leasebase-backend`), `services/api` (NestJS + Prisma + PostgreSQL).
  - Mobile app: `../leasebase-mobile`.
- All **web/frontend concerns** (pages, components, styling, web routing, web-only utilities) belong here once the app is bootstrapped.
- Backend services, database schema/migrations, and infrastructure code live in `../leasebase` and should not be added to this repo.

For system-level and AWS architecture, consult the backend monorepo:
- `../leasebase/README.md` – backend & web deployment to AWS (per account).
- `../leasebase/docs/architecture.md` – overall system and AWS architecture.

## Current state of this repo

- This repository is bootstrapped as a **Next.js (TypeScript) + Tailwind CSS** app using the App Router (`app/`).
- A concrete `package.json` exists with scripts for dev, build, tests, and OpenAPI client generation.
- The web UI will be deployed as static/SSR assets (Next.js) behind AWS infrastructure provisioned from the backend repo.
- The Next.js build output directory is the default `.next/`.

If you materially change the frontend stack or core commands, **update this file and the README** with precise commands and paths.

## Local development workflow

A full local environment (API + web + DB) uses **two repos side by side**:

- Backend/API: `../leasebase`
- Web frontend: `./` (this repo, `leasebase-web`)

### 1. Run the backend API locally (from `../leasebase`)

These commands are run in the backend monorepo and are included here because the web client depends on that API:

```bash path=null start=null
cd ../leasebase
npm install
# Start or provision the DB (see ../leasebase docs for the exact command, e.g. docker-compose up -d db)
npm run migrate
npm run seed
npm run dev:api    # API on http://localhost:4000 (check ../leasebase for the actual port)
```

Always treat the backend repo as the source of truth for API ports, env vars, and DB setup.

### 2. Run the web frontend locally (this repo)

Once this repository is bootstrapped with a concrete frontend framework and `package.json`:

```bash path=null start=null
cd ../leasebase-web
npm install
npm run dev        # starts the web dev server
```

Notes:
- The exact dev command (`npm run dev` vs something else) must match the scripts defined in this repo's `package.json` once created.
- Configure the API base URL via an environment file (likely `.env.local` or similar), pointing at the Leasebase API (local, dev, or prod), e.g. `http://localhost:4000`.

## Build, test, and lint commands

Authoritative scripts live in `package.json`. Current expectations:

### Build

```bash path=null start=null
cd ../leasebase-web
npm install
npm run build
```

- Next.js uses the default `.next/` build output directory.

### Dev server

```bash path=null start=null
cd ../leasebase-web
npm install
npm run dev
```

### Tests

- Unit/component tests use Jest + Testing Library:

```bash path=null start=null
cd ../leasebase-web
npm test           # run Jest test suite
npm run test:watch # optional watch mode
```

- Minimal Playwright E2E smoke tests:

```bash path=null start=null
cd ../leasebase-web
npm run test:e2e
```

### Linting / formatting

- ESLint is configured via `eslint-config-next`:

```bash path=null start=null
cd ../leasebase-web
npm run lint
```

## How future agents should reason about changes

- Keep a **strict separation of concerns** between this repo (web UI) and the backend repo (`../leasebase`):
  - Web-only logic, client-side routing, and UI state live here.
  - Business logic that clearly belongs to the backend (authorization, data validation, persistence, heavy computations) stays in the backend service.
- If a change spans both frontend and backend:
  - Coordinate with the backend code in `../leasebase/services/api` and its schema/migrations.
  - Make sure any API contract changes (types, DTOs, error shapes) are reflected in both repos.
- When in doubt about infrastructure, deployment pipelines, or API shape, prefer **reading and aligning with the backend repo docs** rather than guessing from this repository alone.
