# API integration

Leasebase Web talks to the Leasebase backend API (`leasebase-api`) using a small typed client.

## Base URL

- `NEXT_PUBLIC_API_BASE_URL` points at the backend API:
  - Local: `http://localhost:4000`
  - Staging/Prod: environment-specific URLs

## OpenAPI code generation

This repo includes a placeholder OpenAPI spec at `openapi/openapi.json`. When the real
OpenAPI spec from the backend is available, you should replace this file.

To generate a typed client (into `src/lib/api/generated`):

```bash
npm run api:generate
```

The generated client can then be wrapped or consumed from within `src/lib/api`.

## Hand-written API layer

Until codegen is wired to the real backend spec, a small hand-written layer is provided:

- `src/lib/api/types.ts` – TS interfaces for properties, units, leases, ledger entries,
  work orders, documents, org users/profile, billing, and dashboard summaries.
- `src/lib/api/http.ts` – axios instance configured with `NEXT_PUBLIC_API_BASE_URL` and
  `withCredentials: true`.
  - Adds header `x-lb-dev-mock: true` when dev mock auth is enabled, so the backend can
    recognize bypass traffic.
- `src/lib/api/client.ts` – high-level functions like `getPmDashboard`, `listProperties`,
  `getBillingSummary`, `getTenantDashboard`, etc.
- `src/lib/api/hooks.ts` – simple React hooks (`usePmDashboard`, `useTenantDashboard`,
  `usePmProperties`, `useTenantWorkOrders`) that expose `{ data, loading, error }`.

Pages use this layer to fetch data and render loading / error / empty states. Forms and
mutations (e.g., creating leases, maintenance requests, documents) call `api.post(...)`
with payloads that match expected backend contracts.

## Error handling

- All API errors are normalized via `toApiError`, which extracts a human-readable message
  and optional HTTP status.
- UI pages display these messages in a small red error banner.

## Auth headers and cookies

- Authentication is primarily handled via cookies set by the backend.
- In dev mock mode, `x-lb-dev-mock` is added so the backend can bypass Cognito and attach
  a mock identity for the request.
