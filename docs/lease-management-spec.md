# Lease Management — Specification

## Overview

The Lease Management feature gives property owners (role `OWNER`) and property managers (role `PM_STAFF`) a UI to manage leases across their portfolio. Owners can create, view, edit, terminate, and renew leases. Tenant lease UX is out of scope for this epic — tenants continue to see leases via the tenant dashboard adapter.

## Scope

- **In scope**: Leases CRUD, terminate, renew (successor DRAFT model), property/unit enrichment, status filtering.
- **Out of scope (deferred)**: Tenant name enrichment, tenant-facing lease detail page, automatic lease expiration, bulk operations, lease document attachments.

## User Flows

### Leases List (`/app/leases`)

1. Owner navigates to Leases from the sidebar.
2. Page loads leases via `fetchLeases()` with default pagination.
3. DataTable renders with columns: Property (linked), Unit, Tenant ID, Rent ($), Status (badge), Dates, Actions.
4. Filter dropdown for status (DRAFT, PENDING, ACTIVE, TERMINATED, EXPIRED).
5. Client-side search across property name, unit number.
6. "Create Lease" button navigates to `/app/leases/new`.
7. Row click navigates to `/app/leases/{id}`.

### Create Lease (`/app/leases/new`)

1. LeaseForm renders with empty fields.
2. Property selector loads all org properties via `fetchProperties()`.
3. Selecting a property loads its units via `fetchUnitsForProperty()`.
4. Required fields: property, unit, start date, end date, monthly rent (dollars — converted to cents on submit).
5. Optional fields: tenant ID, lease type (default FIXED_TERM), security deposit, lease terms (JSON textarea).
6. On success, redirects to `/app/leases/{id}`.
7. On 409 conflict (active lease exists), displays error banner.

### Lease Detail (`/app/leases/[id]`)

Two-tab layout: **Overview**, **Edit**.

- **Overview**:
  - Cards grid: Rent amount (formatted dollars), Deposit, Start/End dates, Status badge, Lease type.
  - Property + Unit info with links to property/unit detail pages.
  - Tenant ID display (raw ID or "Not assigned").
  - Status-dependent action buttons:
    - ACTIVE: "Terminate" and "Renew" buttons open confirmation modals.
    - DRAFT/PENDING: "Activate" button (via PUT status=ACTIVE).
    - TERMINATED/EXPIRED: Read-only, no actions.
- **Edit**: LeaseForm pre-filled with current values. On submit: `updateLease(id, dto)` → refresh.

### Terminate Lease (modal from detail page)

1. Owner clicks "Terminate" on an ACTIVE lease.
2. Confirmation modal with optional reason textarea.
3. On confirm: `terminateLease(id, reason)` → sets status=TERMINATED, end_date=NOW().
4. Detail page refreshes to show TERMINATED status.

### Renew Lease (modal from detail page)

1. Owner clicks "Renew" on an ACTIVE lease.
2. Modal with form: new start date, end date, monthly rent, optional security deposit.
3. On submit: `renewLease(id, dto)` → creates successor DRAFT lease.
4. Original lease stays ACTIVE. User is redirected to the new lease's detail page.

## Component Hierarchy

```
app/(dashboard)/app/leases/
├── page.tsx                  — LeasesListPage (owner-focused)
├── new/page.tsx              — CreateLeasePage
└── [id]/page.tsx             — LeaseDetailPage (Overview + Edit tabs)

src/components/leases/
├── LeasesTable.tsx           — DataTable wrapper
├── LeasesSkeleton.tsx        — Loading skeleton
├── LeasesEmptyState.tsx      — Empty state with CTA
├── LeaseDetailSkeleton.tsx   — Detail page skeleton
└── LeaseForm.tsx             — Create/Edit form

src/services/leases/
├── types.ts                  — LeaseRow, DTOs, status enums
├── leaseService.ts           — API client (fetchLeases, createLease, etc.)
└── permissions.ts            — Endpoint role documentation
```

## Lease Lifecycle

```
DRAFT → PENDING → ACTIVE → TERMINATED
                         → EXPIRED (future: automatic via cron)
                         → ACTIVE (renew creates new DRAFT successor)
```

- **DRAFT**: Newly created, not yet signed or activated.
- **PENDING**: Awaiting signature or approval.
- **ACTIVE**: Current active lease.
- **TERMINATED**: Manually ended via terminate action.
- **EXPIRED**: End date has passed (not yet automated).

Renew creates a successor DRAFT — the original ACTIVE lease is NOT modified. Both coexist until the original ends or is terminated.

## Technical Decisions

1. **PUT not PATCH** — All updates use PUT, matching backend contract and properties pattern.
2. **Cents for monetary values** — `monthly_rent` and `security_deposit` stored as integer cents. Frontend converts dollars↔cents.
3. **Tenant name deferred** — `tenant_id` displayed raw. Resolving to a name requires cross-schema user mapping not yet built.
4. **Owner-focused only** — This epic serves `owner` and `propertyManager` personas. Tenant lease view deferred.
5. **Successor DRAFT model for renewal** — Avoids mutating the original ACTIVE lease. Clean audit trail.
6. **Cross-schema JOINs** — Property name and unit number enriched via `property_service.properties` and `property_service.units` JOINs. Works because all services share the same PostgreSQL database.
7. **No automatic expiration** — Future scheduled job will transition ACTIVE → EXPIRED when `end_date < NOW()`.
