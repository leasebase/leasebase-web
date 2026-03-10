# PM Backend Contract

This document defines the backend API contract required by the PM frontend.
It separates what is needed **now** for the dashboard from what is needed
**later** for full PM persona pages.

## Phase 1 — Required Now (Dashboard)

### `GET /api/pm/dashboard`

Single aggregate endpoint that powers the entire PM dashboard.
The frontend makes exactly one call to this endpoint and derives all
widget data from its response.

**Authorization:**
- Requires `requireAuth` + `requireRole(ORG_ADMIN, PM_STAFF)`.
- Server resolves scope via `manager_property_assignments` + `organization_id`.
- `ORG_ADMIN` sees all org properties.
- `PM_STAFF` sees only assigned properties.
- Frontend never passes `property_id`, `lease_id`, `tenant_id`, or `org_id`
  as authorization hints.

**Response shape:**

```json
{
  "kpis": {
    "totalProperties": 12,
    "totalUnits": 48,
    "occupiedUnits": 45,
    "vacancyRate": 6.25,
    "monthlyScheduledRent": 6840000,
    "collectedThisMonth": 3420000,
    "overdueAmount": 450000,
    "openMaintenanceRequests": 5
  },
  "properties": [
    {
      "id": "clx...",
      "name": "Riverside Apartments",
      "address_line1": "123 River Rd",
      "address_line2": null,
      "city": "Austin",
      "state": "TX",
      "postal_code": "78701",
      "country": "US",
      "status": "ACTIVE",
      "created_at": "2025-01-15T00:00:00Z",
      "updated_at": "2025-01-15T00:00:00Z"
    }
  ],
  "units": [
    {
      "id": "clx...",
      "property_id": "clx...",
      "unit_number": "1A",
      "bedrooms": 2,
      "bathrooms": 1,
      "square_feet": 850,
      "rent_amount": 145000,
      "status": "OCCUPIED"
    }
  ],
  "leases": [
    {
      "id": "clx...",
      "unit_id": "clx...",
      "start_date": "2025-06-01",
      "end_date": "2026-05-31",
      "rent_amount": 145000,
      "deposit_amount": 145000,
      "status": "ACTIVE"
    }
  ],
  "tenants": [
    {
      "id": "clx...",
      "user_id": "clx...",
      "lease_id": "clx...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "512-555-0101"
    }
  ],
  "maintenanceRequests": [
    {
      "id": "clx...",
      "unit_id": "clx...",
      "category": "Plumbing",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "description": "Fix leaking faucet — Unit 3C",
      "assignee_id": null,
      "tenant_user_id": "clx...",
      "created_at": "2026-03-05T10:00:00Z",
      "updated_at": "2026-03-06T14:00:00Z"
    }
  ],
  "recentPayments": [
    {
      "id": "clx...",
      "lease_id": "clx...",
      "amount": 145000,
      "currency": "usd",
      "method": "ACH",
      "status": "SUCCEEDED",
      "created_at": "2026-03-01T00:00:00Z"
    }
  ],
  "tasks": [
    {
      "id": "clx...",
      "type": "lease_renewal",
      "title": "Review lease renewal — Unit 4B",
      "severity": "warning",
      "link": "/app/leases",
      "due_date": "2026-03-12",
      "created_at": "2026-03-06T00:00:00Z"
    }
  ]
}
```

**Field details:**

- `kpis.monthlyScheduledRent`, `kpis.collectedThisMonth`, `kpis.overdueAmount`:
  amounts in **cents** (integer).
- `kpis.vacancyRate`: percentage 0–100 (float).
- `units[].rent_amount`, `leases[].rent_amount`: amounts in **cents**.
- `tasks[].type`: one of `lease_renewal`, `vendor_invoice`, `tenant_complaint`,
  `maintenance`, `payment_overdue`.
- `tasks[].severity`: one of `danger`, `warning`, `info`.

**Error responses:**

- `401 Unauthorized` — missing or invalid token.
- `403 Forbidden` — user role not ORG_ADMIN or PM_STAFF.
- `500 Internal Server Error` — server-side failure.

### BFF Gateway Routing

The BFF gateway (`leasebase-bff-gateway`) needs a new proxy route:

```
/api/pm/* → pm-service (or internal service that aggregates PM data)
```

### Database Schema — `manager_property_assignments`

Required if `PM_STAFF` scope filtering is needed (not for `ORG_ADMIN`):

```sql
CREATE TABLE manager_property_assignments (
  id            TEXT PRIMARY KEY DEFAULT cuid(),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id       TEXT NOT NULL REFERENCES users(id),
  property_id   TEXT NOT NULL REFERENCES properties(id),
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id, property_id)
);

CREATE INDEX idx_mpa_org_user ON manager_property_assignments(organization_id, user_id);
CREATE INDEX idx_mpa_org_property ON manager_property_assignments(organization_id, property_id);
```

---

## Phase 2 — Implemented (Full PM Persona Pages)

All Phase 2 endpoints are live in `property-service`, mounted at
`/internal/pm/*` and proxied via BFF gateway at `/api/pm/*`.

**Backend files:**
- `leasebase-property-service/src/routes/pm-scope.ts` — scope resolution helpers
- `leasebase-property-service/src/routes/pm-routes.ts` — all 15 PM endpoints
- `leasebase-property-service/src/routes/pm-routes.test.ts` — 43 route tests

**Frontend files:**
- `leasebase-web/src/services/pm/pmApiService.ts` — typed fetch adapters
- `leasebase-web/tests/unit/pmApiService.test.ts` — adapter tests

### Per-domain PM endpoints (all implemented)

**Properties:**
- `GET /api/pm/properties` — paginated list, PM-scoped
- `GET /api/pm/properties/:id` — single property detail

**Units:**
- `GET /api/pm/units` — cross-property unit list
- `GET /api/pm/units/:id` — single unit detail (scoped via parent property)

**Tenants (full lineage: assignment → unit → lease → tenant):**
- `GET /api/pm/tenants` — paginated list with unit/property context
- `GET /api/pm/tenants/:id` — detail with lease info

**Maintenance:**
- `GET /api/pm/maintenance` — work orders across assigned properties
- `GET /api/pm/maintenance/:id` — work order detail
- `PATCH /api/pm/maintenance/:id/status` — update status (zod enum validated)
- `GET /api/pm/maintenance/:id/comments` — list comments
- `POST /api/pm/maintenance/:id/comments` — add comment

**Payments:**
- `GET /api/pm/payments` — payments for leases in assigned properties
- `GET /api/pm/payments/:id` — single payment detail

**Documents (multi-relationship scope: property, unit, lease):**
- `GET /api/pm/documents` — documents across assigned properties
- `GET /api/pm/documents/:id` — single document detail

### Authorization model

- `PM_STAFF`: sees only resources linked to assigned properties
- `ORG_ADMIN`: sees all org resources
- `OWNER`, `TENANT`: receive `403 Forbidden` on all PM endpoints
- Cross-org requests: receive `404 Not Found` (no data leaks)

### Pagination format (all list endpoints)

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "hasMore": true
  }
}
```

Note: uses `hasMore` (not `totalPages`) per guardrail.

### Subresource authorization rule

Every subresource inherits authorization from its parent:
- Maintenance comments inherit work order authorization.
- Payment details inherit payment authorization.
- Document downloads inherit document authorization.
- If the caller cannot access the parent, subresource returns `404`.

### Test coverage

**Backend (property-service):** 53 tests total (8 dashboard + 2 health + 43 routes)
- 24 role guard tests (OWNER/TENANT → 403 on all 12 endpoint groups)
- Property scope isolation, unit parent check, tenant full lineage
- Maintenance subresource auth + enum validation
- Cross-org isolation, meta envelope consistency

**Frontend (leasebase-web):** 71 PM-specific tests
- Service adapter path correctness (all 15 endpoints)
- Endpoint safety (namespace enforcement, import analysis)
- Dashboard service + view model tests
