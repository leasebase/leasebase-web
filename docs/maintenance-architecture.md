# Maintenance Domain — Architecture

## Overview

The Maintenance domain covers the full lifecycle of work orders (maintenance requests) across all three personas: tenant, owner, and property manager. Tenants submit and track requests; owners and property managers triage, assign, update status, and comment.

## Service Responsibilities

### maintenance-service (backend — `../leasebase/services/api`)

- CRUD operations on work orders scoped to the caller's organization (via JWT `organizationId`).
- Status transitions: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`.
- Assignment of work orders to staff/vendors by `assigneeId`.
- Threaded comments per work order.
- Aggregated status counts (`GET /stats`) for dashboard KPIs.
- Property context resolution: each work order references a `unitId`; the service JOINs through `Unit → Property` to surface `propertyId` on reads.

### Frontend services (this repo)

- `src/services/maintenance/maintenanceApiService.ts` — typed API client for owner/PM endpoints (list, detail, comments, status update, assignment, stats).
- `src/services/tenant/adapters/maintenanceAdapter.ts` — tenant-scoped adapter for the tenant maintenance API.
- `src/services/dashboard/ownerDashboardService.ts` — fetches `GET /api/maintenance/stats` in parallel with other domain fetches; `computeMaintenanceOverview()` prefers server-aggregated counts, falls back to client-side counting.

## Database Tables

The maintenance-service reads and writes these Prisma-managed tables:

- **`MaintenanceWorkOrder`** — Primary table. Columns: `id`, `organizationId`, `unitId`, `createdByUserId`, `tenantUserId`, `assigneeId`, `category`, `priority` (enum: LOW, MEDIUM, HIGH), `status` (enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED), `description`, `createdAt`, `updatedAt`.
- **`MaintenanceComment`** — Comments thread. Columns: `id`, `workOrderId`, `userId`, `comment`, `createdAt`. Author name is resolved via JOIN to `User`.
- **`Unit`** — Referenced for property context. JOINed to resolve `propertyId` from `unitId`.
- **`Property`** — Referenced for property name in dashboard "most affected property" computation.

## API Surface

All endpoints are proxied through the Next.js BFF at `/api/maintenance`.

### Work Orders

- `GET /api/maintenance` — Paginated list with optional filters (`status`, `priority`, `propertyId`, `search`). Scoped by org.
- `GET /api/maintenance/:id` — Single work order detail.
- `PATCH /api/maintenance/:id/status` — Update status. Body: `{ status }`.
- `PATCH /api/maintenance/:id/assign` — Assign work order. Body: `{ assigneeId }`.

### Comments

- `GET /api/maintenance/:id/comments` — List comments for a work order.
- `POST /api/maintenance/:id/comments` — Add comment. Body: `{ comment }`.

### Stats

- `GET /api/maintenance/stats` — Aggregated counts by status: `{ open, in_progress, resolved, closed }`. Used by the owner dashboard MaintenanceOverviewCard.

### Tenant Endpoints

Tenant-scoped endpoints live under a separate path (`/api/tenant/maintenance`) and return only the authenticated tenant's own requests.

## Frontend Entry Points

### Pages

- **`/app/maintenance`** — Persona-routed list page.
  - Tenant: own requests with "New Request" action.
  - Owner: org-wide list with status/priority/search filters.
  - PM: property-scoped list.
- **`/app/maintenance/[id]`** — Persona-routed detail page.
  - Tenant: read-only detail card + comments thread with add-comment input.
  - Owner / PM: shared `ManagerMaintenanceDetail` component — detail card, status-change buttons, assignee input, comments thread.
- **`/app` (dashboard)** — `MaintenanceOverviewCard` on owner dashboard shows live open/in-progress counts from stats endpoint, plus derived metrics (waiting, urgent, oldest age, most affected property) from full list.

### Key Components

- `src/components/dashboards/owner/MaintenanceOverviewCard.tsx` — Dashboard card rendering the maintenance overview view model.
- `app/(dashboard)/app/maintenance/page.tsx` — Exports `OwnerMaintenancePage` (with filters).
- `app/(dashboard)/app/maintenance/[id]/page.tsx` — Exports `TenantMaintenanceDetail` and `ManagerMaintenanceDetail`.

## Test Coverage

- `tests/unit/MaintenanceOverviewCard.test.tsx` — 11 tests (card rendering + stats integration).
- `tests/unit/TenantMaintenanceDetail.test.tsx` — 9 tests.
- `tests/unit/OwnerMaintenanceList.test.tsx` — 12 tests.
- `tests/unit/ManagerMaintenanceDetail.test.tsx` — 16 tests.
- Backend: 44/44 tests in `maintenance-service`.

## Deferred Items

- **Assignment candidates dropdown** — requires an org-members endpoint to list assignable users.
- **Resolved/closed counts in dashboard card** — requires card UI redesign (currently shows open + in-progress only).
- **`init-db.sql` alignment** — the bootstrap SQL is misaligned with the Prisma schema; fix tracked separately.
