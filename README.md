# Leasebase Web -- 

This repository is the **standalone web frontend** for the Leasebase platform.

- **Frontend-only**: no backend API or database code lives here.
- **Web client only**: mobile apps live in a separate repo.
- The web client talks to the backend API provided by the v2 microservices. Schema and migrations are in `../leasebase-schema-dev` (transitional only).

The goal of this repo is to host all browser-facing UI for Leasebase: routing, pages, components, styling, and web-specific utilities.

---

## Repository status

This repo is now bootstrapped as a **Next.js (TypeScript) + Tailwind CSS** application.

- Uses the **App Router** in `app/`.
- Integrates with the backend API via `NEXT_PUBLIC_API_BASE_URL`.
- Is intended to integrate with AWS Cognito for authentication using `NEXT_PUBLIC_COGNITO_*` env vars.

Concrete dev/build commands and output directory are documented below.

---

## Related repositories

The full Leasebase system spans multiple repos:

- **Backend/API**: v2 microservices (leasebase-auth-service, leasebase-property-service, etc.)
  - Schema & migrations: `../leasebase-schema-dev` (transitional only).
  - Infrastructure: `../leasebase-iac`.
- **Web frontend**: this repo (`leasebase-web`).
- **Mobile app**: `../leasebase-mobile`.

Keep a **strict separation of concerns**:

- Web-only UI, client-side routing, and presentation live here.
- Backend business logic, data validation, persistence, and heavy computations live in the backend microservices.

---

## Local development

A full local environment (API + web + DB) uses two repos side by side:

- Backend/API: v2 microservices + `../leasebase-schema-dev` (schema only, transitional)
- Web frontend: `./` (this repo)

### 1. Run the backend API locally

For local development, `leasebase-schema-dev` provides a NestJS dev API on port 4000 (transitional). In production, the v2 microservices are the canonical runtime.

Refer to `../leasebase-schema-dev/README.md` for authoritative commands. A typical flow is:

1. Install dependencies.
2. Start or provision the database.
3. Run migrations and seeds.
4. Start the API server (commonly on `http://localhost:4000`).

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

## Design System & Tokens

The UI is built on a **canonical design token system** that lives in `tokens/` as JSON files. These tokens are the single source of truth for colors, typography, spacing, radius, and shadows.

### Token files

- `tokens/colors.json` — Brand, secondary, neutral, semantic palettes (WCAG AA)
- `tokens/typography.json` — Font families, sizes, weights, line-heights
- `tokens/spacing.json` — Spacing scale (0–64)
- `tokens/radius.json` — Border-radius scale
- `tokens/shadows.json` — Box-shadow scale
- `tokens/README.md` — Full conventions and usage guide

### Generating CSS custom properties

After editing any token JSON file, regenerate the CSS variables:

```bash
npm run tokens:generate
```

This produces `src/design-system/tokens.css` with `--lb-*` CSS custom properties.
`tailwind.config.ts` references these vars, so all Tailwind classes automatically update.

### Figma sync

If you have a Figma file with design tokens/icons, set `FIGMA_FILE_KEY` in `.env.local` and run:

```bash
npm run design:sync
```

This pulls variables + SVG icons from Figma and regenerates CSS tokens.

### Component library

All UI primitives live in `src/components/ui/` and are exported from `src/components/ui/index.ts`:

Button, Input, Textarea, Select, RadioGroup, Badge, Card, Modal, Toast,
DataTable, Checkbox, Switch, Tabs, Tooltip, Breadcrumb, Pagination,
EmptyState, Skeleton, Avatar, DropdownMenu, Icon, PageHeader.

Visit `/dev/components` in the dev server to see all components rendered.

### Adding a new component

1. Create `src/components/ui/MyComponent.tsx` following existing patterns.
2. Export from `src/components/ui/index.ts`.
3. Add a section in `app/dev/components/page.tsx`.
4. Add unit tests in `tests/unit/`.

---

## Tests

Run unit/component tests with Jest:

```bash
npm test
```

Run Playwright e2e smoke tests (requires the dev server running with mock auth enabled):

```bash
# in one terminal
DEV_ONLY_MOCK_AUTH=true NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true npm run dev

# in another terminal
npm run test:e2e
```

## OpenAPI client generation

When the backend OpenAPI spec is available, place it at `openapi/openapi.json` (or update
the path in `package.json`) and run:

```bash
npm run api:generate
```

This will generate a typed client into `src/lib/api/generated`.

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

## Automatic Documentation

This repo includes a documentation engine (`docs-engine/`) that automatically scans the codebase and synchronizes documentation to Confluence.

### What it does

The engine extracts:

- **Routes** — all Next.js App Router pages with their metadata
- **Navigation structure** — from `src/lib/appNav.ts`
- **Permissions** — persona-to-route mappings from the nav config and roles
- **User flows** — login, dashboard, property management, maintenance, payments (with Mermaid diagrams)
- **Use cases** — structured use cases with actors, steps, errors, and API dependencies

It then generates Confluence storage-format HTML and creates/updates pages via the Confluence REST API.

### Run locally

```bash
# Preview mode (no Confluence updates, outputs markdown summary)
npm run docs:preview

# Full mode (updates Confluence — requires env vars)
npm run docs
```

Required environment variables for Confluence updates:

- `CONFLUENCE_BASE_URL` — e.g. `https://yourorg.atlassian.net`
- `CONFLUENCE_EMAIL` — Atlassian account email
- `CONFLUENCE_API_TOKEN` — Atlassian API token
- `CONFLUENCE_SPACE_KEY` — Confluence space key

### CI/CD integration

The GitHub Action `.github/workflows/update-docs.yml` runs automatically:

- **On push to `main`**: updates all Confluence pages
- **On pull requests**: posts a preview comment with detected routes, flows, use cases, and permissions

Confluence secrets must be configured in the repository's GitHub Actions secrets.

### Confluence page structure

- **LeaseBase Web Documentation** (root)
  - Overview (architecture, personas, auth)
  - User Flows (Mermaid diagrams)
  - Use Cases (grouped by category)
  - Page Reference (per-route documentation)
  - Permissions Matrix
  - Error Handling
  - Testing Scenarios

---

## Contributing

When adding or changing code in this repo:

- Keep backend responsibilities (authorization, persistence, complex business rules) in the backend microservices.
- Keep this repo focused on web UI concerns: components, layout, navigation, client-side state, and integration with the backend API.
- When a change spans both frontend and backend:
  - Coordinate API contracts (types, DTOs, error responses) between this repo and the relevant backend service.
  - Reflect any API shape changes in both places.

This repo is already configured with Next.js + TypeScript + Tailwind, along with Jest and Playwright.

Future changes should keep this README in sync by updating:

- Dev/build/test/lint commands when scripts change.
- Project structure and conventions as new modules and routes are added.
- Any framework-specific notes (routing, data fetching, SSR/SSG, etc.) that impact how contributors work on the app.



---

## Docker Tagging Strategy

Every CI build on `develop` pushes **two Docker image tags** to Amazon ECR:

- **`dev-latest`** — moving tag that always points to the most recent develop build. ECS services are configured to deploy this tag.
- **`<git-sha>`** — immutable tag using the full 40-character commit SHA, retained for traceability and rollback.

**ECS deployments** reference `dev-latest`. After pushing, the pipeline registers a new ECS task definition with `dev-latest` and forces a new deployment.

**Rollbacks**: to roll back to a previous build, update the ECS task definition to reference the specific `<git-sha>` tag of the desired commit.
