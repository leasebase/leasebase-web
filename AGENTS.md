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

- As of now, this repository primarily contains documentation and lockfiles; the actual web application code and `package.json` have not yet been added.
- Treat this repo as the future home for the web UI and static build artifacts that will be deployed to AWS (S3 + CloudFront) provisioned from the backend repo.
- Any framework-specific decisions (e.g., Next.js vs. another React stack) and the exact build output directory (`out/`, `build/`, `.next`, etc.) must be confirmed once the frontend stack is chosen.

When you add concrete application code or change the stack, **update this file and the README** with precise commands and paths.

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

Because there is **no `package.json` yet in this repo**, there are currently **no concrete build, test, or lint scripts** defined here. Future agents should:

1. Inspect this repo's `package.json` (once it exists) for authoritative scripts.
2. Update this section with the exact commands for the chosen stack.

Until then, use the following expectations from the existing documentation:

### Build (expected pattern, to be confirmed)

```bash path=null start=null
cd ../leasebase-web
npm install
npm run build
```

- The static output directory is not yet fixed; it may be `out/`, `build/`, or framework-specific (e.g., `.next`).
- Once the stack is chosen, document the exact output directory here.

### Tests

- No test runner or test scripts are currently configured in this repo.
- When tests are added, ensure that:
  - There is a script in `package.json` (e.g., `"test"`) to run the full test suite.
  - You document in this file how to run a **single test file or a focused test** using that runner's CLI (for example, passing a test file path or pattern).

Until that exists, **do not assume** a specific test framework or single-test command.

### Linting / formatting

- No lint or format scripts are currently defined in this repo.
- When linting is introduced (e.g., ESLint, Prettier), add the exact commands here (for example, `npm run lint` for the full codebase and any supported filters for linting a single file or directory).

## How future agents should reason about changes

- Keep a **strict separation of concerns** between this repo (web UI) and the backend repo (`../leasebase`):
  - Web-only logic, client-side routing, and UI state live here.
  - Business logic that clearly belongs to the backend (authorization, data validation, persistence, heavy computations) stays in the backend service.
- If a change spans both frontend and backend:
  - Coordinate with the backend code in `../leasebase/services/api` and its schema/migrations.
  - Make sure any API contract changes (types, DTOs, error shapes) are reflected in both repos.
- When in doubt about infrastructure, deployment pipelines, or API shape, prefer **reading and aligning with the backend repo docs** rather than guessing from this repository alone.
