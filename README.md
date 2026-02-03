# Leasebase Web

This repository is the **standalone web frontend** for the Leasebase platform.

- **Frontend-only**: no backend API or database code lives here.
- **Web client only**: mobile apps live in a separate repo.
- The web client talks to the backend API running from the `../leasebase` backend monorepo (NestJS + Prisma + PostgreSQL).

The goal of this repo is to host all browser-facing UI for Leasebase: routing, pages, components, styling, and web-specific utilities.

---

## Repository status

As of now, this repository primarily contains documentation and lockfiles. The actual web application code and `package.json` have **not yet** been added.

That means:

- There are currently **no npm scripts** (no `npm run dev`, `npm run build`, etc.).
- There is **no configured frontend framework** yet (e.g., Next.js, Vite, CRA, etc.).
- This repo should be treated as the future home for the Leasebase web UI and static build artifacts.

Once the frontend stack is chosen and bootstrapped, this README should be updated with:

- The exact development server command (e.g. `npm run dev`).
- The exact build command (e.g. `npm run build`).
- The exact output directory used for static assets (e.g. `out/`, `build/`, `.next`, etc.).

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

## Local development (high level)

A full local environment (API + web + DB) uses two repos side by side:

- Backend/API: `../leasebase`
- Web frontend: `./` (this repo)

Until the web app is bootstrapped, only the backend is runnable. For the authoritative backend setup (DB, migrations, seeding, API port), refer to the docs in `../leasebase`, especially its `README.md` and any `docs/` it provides.

Once this repo has real frontend code and a `package.json`, the local dev flow will roughly look like:

1. **Run the backend API locally** (from `../leasebase`)
   - Install dependencies.
   - Start or provision the database.
   - Run migrations and seeds.
   - Start the API server (commonly on `http://localhost:4000`, but check the backend docs to be sure).

2. **Run the web frontend** (from this repo)
   - Install dependencies with `npm install` (or your chosen package manager).
   - Configure the API base URL via an env file (e.g. `.env.local`).
   - Start the dev server (e.g. `npm run dev`).

The exact commands and ports must be taken from the chosen web stack and `package.json` once they exist.

---

---

## Contributing

When adding or changing code in this repo:

- Keep backend responsibilities (authorization, persistence, complex business rules) in the backend service (`../leasebase/services/api`).
- Keep this repo focused on web UI concerns: components, layout, navigation, client-side state, and integration with the backend API.
- When a change spans both frontend and backend:
  - Coordinate API contracts (types, DTOs, error responses) between this repo and `../leasebase`.
  - Reflect any API shape changes in both places.

Once the concrete frontend framework and tooling are in place, expand this README with:

- Exact dev/build/test/lint commands.
- Project structure and conventions.
- Any framework-specific notes (routing, data fetching, SSR/SSG, etc.).

