# E2E Testing — Playwright

## Overview

LeaseBase uses Playwright for end-to-end UI testing. The suite validates persona-specific walkthroughs, auth routing, and access-control boundaries using the dev bypass auth mechanism.

## Prerequisites

1. **Dev server** running at `http://localhost:3000` with:
   - `NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true` in `.env.local`
2. **Backend API** running at `http://localhost:4000` with:
   - `DEV_AUTH_BYPASS=true`
   - Database seeded via `npm run seed` (from `leasebase-backend/services/api`)
3. **Playwright browsers** installed: `npx playwright install chromium`

## Run Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run headed (visible browser)
npm run test:e2e:headed

# Run a single suite
npx playwright test tests/e2e/auth/persona-routing.spec.ts
npx playwright test tests/e2e/personas/tenant.spec.ts
npx playwright test tests/e2e/personas/pm.spec.ts
npx playwright test tests/e2e/personas/owner.spec.ts
npx playwright test tests/e2e/personas/vendor.spec.ts
npx playwright test tests/e2e/access-control/role-boundaries.spec.ts

# Run by persona group
npx playwright test tests/e2e/personas/

# View test report after failure
npx playwright show-report
```

## Environment Variables

All env vars have defaults matching the seeded data. Override via `tests/e2e/.env.e2e` or shell env.

| Variable | Default | Description |
|---|---|---|
| `PLAYWRIGHT_BASE_URL` | `http://localhost:3000` | App base URL |
| `E2E_TENANT_EMAIL` | `tenant@landlord.local` | Tenant account |
| `E2E_TENANT_ORG` | `landlord-demo` | Tenant org |
| `E2E_PM_EMAIL` | `alice@pm.local` | PM_STAFF account (2 properties) |
| `E2E_PM_ORG` | `pm-demo` | PM org |
| `E2E_PM_EMPTY_EMAIL` | `carol@pm.local` | PM_STAFF with 0 assignments |
| `E2E_PM_ADMIN_EMAIL` | `admin@pm.local` | ORG_ADMIN account |
| `E2E_OWNER_EMAIL` | `owner@pm.local` | OWNER account |
| `E2E_ADMIN_EMAIL` | `admin@landlord.local` | Landlord ORG_ADMIN |

## Test Structure

```
tests/e2e/
├── .env.e2e                         # Local env defaults (gitignored convenience)
├── smoke.spec.ts                    # Legacy smoke tests (retained until new auth suite is green)
├── auth/
│   └── persona-routing.spec.ts      # Auth guard + persona dashboard routing
├── personas/
│   ├── tenant.spec.ts               # Tenant full walkthrough
│   ├── pm.spec.ts                   # PM full walkthrough + empty state
│   ├── owner.spec.ts                # Owner walkthrough (actual current behavior)
│   └── vendor.spec.ts               # Vendor scaffold (Coming soon)
├── access-control/
│   └── role-boundaries.spec.ts      # Direct URL access boundary tests
├── fixtures/
│   └── auth.fixture.ts              # Playwright test extension with pre-auth pages
└── helpers/
    ├── config.ts                    # Persona credentials + env var lookup
    ├── login.ts                     # Dev bypass login helper
    └── nav.ts                       # Sidebar nav + page readiness helpers
```

## Coverage Matrix

### Auth + Routing (persona-routing.spec.ts) — 11 tests
- Unauthenticated redirect (2)
- Dashboard routing per persona (4)
- Sidebar nav filtering per persona (3)
- Replaces and supersedes smoke.spec.ts

### Tenant (tenant.spec.ts) — 10 tests
- Dashboard, Payment History, Pay Rent (initiation only, stops before Stripe)
- Maintenance list, New Request form
- Documents, Notifications, Settings with Tenant Profile
- Leases and Messages (Coming soon)

### PM (pm.spec.ts) — 14 tests
- Dashboard, Properties list + detail, Units list + detail
- Tenants list + detail, Maintenance list + detail (comments, status)
- Payments list + detail, Documents list
- Leases + Rent Roll (Coming soon)
- Empty-state PM (carol, 0 assignments)

### Owner (owner.spec.ts) — 10 tests
- Dashboard loads with owner heading
- Properties, Leases, Payments, Maintenance, Documents, Messages, Reports (all Coming soon)
- Notifications (live, shared)
- Settings (Account card, no Tenant Profile)

### Vendor (vendor.spec.ts) — 2 runnable + 6 scaffolded
- Vendor Dashboard and Work Order Detail route placeholders render
- 6 tests skipped with TODO markers for when vendor persona is built

### Access Control (role-boundaries.spec.ts) — 21 tests
- Unauthenticated access → redirect (8 routes)
- Tenant → PM pages via direct URL → "Coming soon" (6)
- Owner → PM-only pages via direct URL → "Coming soon" (3)
- Owner → tenant-only pages via direct URL (2)
- PM → tenant-only pages via direct URL (2)

### Total: ~68 tests (62 runnable + 6 scaffolded)

## Design Decisions

**Dev bypass auth**: Tests use the existing dev-bypass login mechanism, not test-only backdoors. This means tests are realistic but require the backend to be running with `DEV_AUTH_BYPASS=true`.

**No server-side route guards**: The app uses client-side persona checks. Non-matching personas see "Coming soon" fallbacks, not redirects. Access-control tests assert this visible behavior.

**Stripe/external providers**: The pay-rent test validates the checkout button exists and is enabled but does NOT click it to avoid Stripe redirect. No sandbox mode was found.

**Backend dependency**: PM list/detail tests use `test.skip()` when the backend is not connected (no data visible). This prevents false failures during frontend-only testing.

**smoke.spec.ts retention**: The legacy smoke spec is retained until the new auth suite is verified green in the running environment. It can be safely removed once `persona-routing.spec.ts` passes.

## CI Notes

For CI, you'll need:
1. Backend + DB running (Docker Compose recommended)
2. Database seeded
3. Frontend built and served (`npm run build && npm start`)
4. `NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true` at build time
5. `npx playwright install --with-deps chromium` in CI

Recommended: run E2E tests as a separate job after unit tests pass. Use `--retries=2` (already configured for CI in `playwright.config.ts`).

## Known Limitations

- **Backend required**: Most PM and tenant data-dependent tests need the backend running. Without it, they'll skip (gracefully) or show error states.
- **Vendor persona**: Not implemented. Tests are scaffolded only.
- **Stripe payment flow**: Cannot test end-to-end without Stripe test mode integration.
- **Data mutations**: Tests are read-only except for the maintenance new-request form validation (which renders the form but doesn't submit). For mutation tests, consider dedicated test fixtures.
- **Owner pages**: Most owner pages show "Coming soon" — tests document current behavior and will need updating as owner features are built.
