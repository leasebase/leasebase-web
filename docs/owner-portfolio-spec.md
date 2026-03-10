# Owner Portfolio Management — Specification

## Overview

The Owner Portfolio feature gives property owners (role `OWNER`) a dedicated UI to manage their properties and units. Owners can create, view, edit properties and add/edit units within those properties. All data is org-scoped via JWT — no client-side scope hints are sent.

## Scope

- **In scope**: Properties CRUD, Units CRUD (property-first), client-side search/filter/sort.
- **Out of scope (deferred)**: Org-scoped `/app/units` list page (no `GET /api/units` endpoint), bulk operations, property deletion (ORG_ADMIN only), server-side query params.

## User Flows

### Properties List (`/app/properties`)

1. Owner navigates to Properties from the sidebar.
2. Page loads properties via `fetchPropertiesWithUnitCounts()` — fetches properties then fans out for unit counts.
3. DataTable renders with columns: Property (linked), Address, Units, Occupancy, Status.
4. Client-side search across name, address, city, state.
5. Filter dropdown for status (Active/Inactive).
6. "Add Property" button navigates to `/app/properties/new`.

### Create Property (`/app/properties/new`)

1. PropertyForm renders with empty fields.
2. Required fields: name, address line 1, city, state, ZIP code.
3. ZIP code validated with regex: `^\d{5}(-\d{4})?$`.
4. On success, redirects to `/app/properties`.

### Property Detail (`/app/properties/[id]`)

Three-tab layout: **Overview**, **Units**, **Edit**.

- **Overview**: Address card, occupancy stats, scheduled rent, status/country/dates.
- **Units**: UnitsTable with search/filter + "Add Unit" modal (UnitForm).
- **Edit**: Inline PropertyForm pre-filled with current values. Shows success toast on save.

### Unit Detail (`/app/units/[id]`)

- Breadcrumb: Properties → Property Name → Unit Number
- Displays all unit fields with edit modal.
- Rent displayed in dollars (stored as cents in DB).

## Data Model

### PropertyRow (DB columns → API response, snake_case)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | |
| organization_id | uuid | From JWT |
| name | string | |
| address_line1 | string | |
| address_line2 | string? | Optional |
| city | string | |
| state | string | US state code |
| postal_code | string | |
| country | string | Default "US" |
| status | string | ACTIVE / INACTIVE |
| created_at | timestamp | |
| updated_at | timestamp | |

### UnitRow (DB columns → API response, snake_case)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | |
| organization_id | uuid | From JWT |
| property_id | uuid | Parent property |
| unit_number | string | |
| bedrooms | int | Min 0 |
| bathrooms | decimal | Min 0 |
| square_feet | int? | Optional |
| rent_amount | int | Cents |
| status | string | AVAILABLE / OCCUPIED / MAINTENANCE / OFFLINE |
| created_at | timestamp | |
| updated_at | timestamp | |

### Fields NOT in DB (documented as "not yet supported")

`property_type`, `year_built`, `notes`, `deposit_amount`

## Technical Decisions

1. **PUT not PATCH** — All updates use PUT, matching backend contract.
2. **Client-side search/filter/sort** — No server-side query params verified. DataTable handles it.
3. **Concurrency-capped fan-out** — `fetchPropertiesWithUnitCounts` batches unit-count calls (6 concurrent).
4. **Owner units page deferred** — No org-scoped `GET /api/units` endpoint exists. Owner accesses units via property detail only.
5. **Frontend routes directly to `/api/properties`** — Not through `/api/pm` (which has PM-specific scope rules).
