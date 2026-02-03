# Leasebase Web

This repository is the **standalone web frontend** for the Leasebase platform.

- **Frontend-only**: no backend API or database code lives here.
- **Web client only**: mobile apps live in a separate repo.
- The web client talks to the backend API running from the `../leasebase` backend monorepo (NestJS + Prisma + PostgreSQL).

The goal of this repo is to host all browser-facing UI for Leasebase: routing, pages, components, styling, and web-specific utilities.

---

## Repository status

This repo is now bootstrapped as a **Next.js (TypeScript) + Tailwind CSS** application.

- Uses the **App Router** in `app/`.
- Integrates with the `../leasebase` backend API via `NEXT_PUBLIC_API_BASE_URL`.
- Is intended to integrate with AWS Cognito for authentication using `NEXT_PUBLIC_COGNITO_*` env vars.

Concrete dev/build commands and output directory are documented below.

---

## Related repositories

The full Leasebase system spans multiple repos:

- **Backend/API**: `../leasebase`
  - Core API in `services/api` (NestJS + Prisma + PostgreSQL).
  - Infrastructure for API and web hosting (managed outside this repo).
- **Web frontend**: this repo (`leasebase-web`).
- **Mobile app**: `../leasebase-mobile`.

Keep a **strict separation of concerns**:

- Web-only UI, client-side routing, and presentation live here.
- Backend business logic, data validation, persistence, and heavy computations live in `../leasebase`.

---

## Local development

A full local environment (API + web + DB) uses two repos side by side:

- Backend/API: `../leasebase`
- Web frontend: `./` (this repo)

### 1. Run the backend API locally (from `../leasebase`)

Refer to the backend repo docs for the authoritative commands. A typical flow is:

1. Install dependencies.
2. Start or provision the database.
3. Run migrations and seeds.
4. Start the API server (commonly on `http://localhost:4000`, but always check the backend docs).

### 2. Run the web frontend (this repo)

From this directory:

```bash
npm install
cp .env.example .env.local   # then edit values as needed
npm run dev
```

This will start the Next.js dev server (default on `http://localhost:3000`).

Key env vars (see `.env.example`):

- `NEXT_PUBLIC_API_BASE_URL` – base URL of the Leasebase API (e.g. `http://localhost:4000`).
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`, `NEXT_PUBLIC_COGNITO_DOMAIN` – AWS Cognito configuration for auth.
- `DEV_ONLY_MOCK_AUTH` – optional dev-only flag for mock auth flows (must remain `false` in production).

---

## Docker / cloud deployment

A production-ready container image can be built from the root `Dockerfile`:

```bash
# Build image
docker build -t leasebase-web:latest .

# Run container locally (example)
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://host.docker.internal:4000 \
  -e NEXT_PUBLIC_COGNITO_USER_POOL_ID=... \
  -e NEXT_PUBLIC_COGNITO_CLIENT_ID=... \
  -e NEXT_PUBLIC_COGNITO_DOMAIN=... \
  leasebase-web:latest
```

The container:

- Serves the app on port `3000` using `npm run start`.
- Exposes a basic health endpoint at `GET /api/health` that returns `{ "status": "ok" }`.
- Is stateless; env vars configure API base URL and Cognito.

For ECS or other orchestrators, see `docs/RUNTIME_CONTRACT.md` and `docs/ENVIRONMENT_CONFIG.md` for the full runtime contract and environment requirements.

---

---

## Contributing

When adding or changing code in this repo:

- Keep backend responsibilities (authorization, persistence, complex business rules) in the backend service (`../leasebase/services/api`).
- Keep this repo focused on web UI concerns: components, layout, navigation, client-side state, and integration with the backend API.
- When a change spans both frontend and backend:
  - Coordinate API contracts (types, DTOs, error responses) between this repo and `../leasebase`.
  - Reflect any API shape changes in both places.

This repo is already configured with Next.js + TypeScript + Tailwind, along with Jest and Playwright.

Future changes should keep this README in sync by updating:

- Dev/build/test/lint commands when scripts change.
- Project structure and conventions as new modules and routes are added.
- Any framework-specific notes (routing, data fetching, SSR/SSG, etc.) that impact how contributors work on the app.

