# Lease Management — API Contract

All endpoints use **PUT** (not PATCH) for updates. Responses follow the `{ data, meta }` envelope.

## Base URL

- **Local dev**: `http://localhost:4000` (BFF gateway)
- **BFF proxy**: `/api/leases` → lease-service `/internal/leases`

## Authentication

All requests require a valid JWT Bearer token (or dev-bypass headers). The `org_id` is extracted from the JWT — no client-side org hint is sent.

## Endpoints

### List Leases
```
GET /api/leases?page=1&limit=50&status=ACTIVE&propertyId=...&unitId=...
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Query params** (all optional):
- `page` — default 1
- `limit` — default 50
- `status` — filter by lease status (DRAFT, PENDING, ACTIVE, TERMINATED, EXPIRED)
- `propertyId` — filter by property
- `unitId` — filter by unit
**Response**:
```json
{
  "data": [LeaseRow, ...],
  "meta": { "page": 1, "limit": 50, "total": 3, "totalPages": 1 }
}
```
Enriched fields: `property_name`, `unit_number` (via cross-schema JOIN).
Tenant name enrichment is **deferred** — `tenant_id` is returned as-is.

### Get Lease
```
GET /api/leases/:id
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER, TENANT (own lease only)
**Response**: `{ "data": LeaseRow }`
**Errors**: 404 if not found, not in org, or TENANT accessing another tenant's lease.
TENANT access checks `lease.tenant_id === user.userId`.

### Create Lease
```
POST /api/leases
Content-Type: application/json
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Request body**:
```json
{
  "propertyId": "uuid",
  "unitId": "uuid",
  "tenantId": "uuid (optional)",
  "leaseType": "FIXED_TERM",
  "status": "DRAFT",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "monthlyRent": 150000,
  "securityDeposit": 300000,
  "leaseTerms": { "any": "json" },
  "signedAt": "2026-01-01T00:00:00Z"
}
```
Required: `propertyId`, `unitId`, `startDate`, `endDate`, `monthlyRent`
Optional: `tenantId`, `leaseType` (default FIXED_TERM), `status` (default DRAFT), `securityDeposit`, `leaseTerms`, `signedAt`
Note: `monthlyRent` and `securityDeposit` are in **cents** (150000 = $1,500).
**Validation**:
1. Unit must exist → 404
2. Unit must belong to caller's org → 403
3. Unit's `property_id` must match submitted `propertyId` → 400 ("Unit does not belong to the specified property")
4. Unit must not have an existing ACTIVE lease → 409 ("Unit already has an active lease")
**Response**: `201 { "data": LeaseRow }`

### Update Lease
```
PUT /api/leases/:id
Content-Type: application/json
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Request body**: Partial of create body (all fields optional). Uses `camelCase→snake_case` dynamic SET.
**Response**: `200 { "data": LeaseRow }`
**Errors**: 404 if not found or not in org.
Note: Tenant assignment is done via `PUT /:id` with `{ "tenantId": "..." }`.

### Delete Lease
```
DELETE /api/leases/:id
```
**Roles**: ORG_ADMIN only (OWNER/PM_STAFF/TENANT → 403)
**Response**: `204 No Content`

### Terminate Lease
```
POST /api/leases/:id/terminate
Content-Type: application/json
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Request body**: `{ "reason": "optional string" }`
**Validation**: Lease must be ACTIVE → 400 if not.
**Action**: Sets `status = 'TERMINATED'`, `end_date = NOW()`.
**Response**: `200 { "data": LeaseRow }`

### Renew Lease
```
POST /api/leases/:id/renew
Content-Type: application/json
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Request body**:
```json
{
  "startDate": "2027-01-01",
  "endDate": "2027-12-31",
  "monthlyRent": 160000,
  "securityDeposit": 320000,
  "leaseTerms": {}
}
```
Required: `startDate`, `endDate`, `monthlyRent`
**Validation**: Original lease must be ACTIVE → 400 if not.
**Business rule — Successor model**: Creates a new DRAFT lease copying `org_id`, `property_id`, `unit_id`, `tenant_id`, `lease_type` from the original. The original lease **stays ACTIVE** — it is not immediately expired.
**Response**: `201 { "data": NewLeaseRow }`

## Data Model — LeaseRow

| Field | Type | Notes |
|-------|------|-------|
| id | text (uuid) | Primary key |
| org_id | text | From JWT |
| property_id | text | FK to property_service.properties |
| unit_id | text | FK to property_service.units |
| tenant_id | text? | Optional — user ID of tenant |
| lease_type | text | FIXED_TERM or MONTH_TO_MONTH |
| status | text | DRAFT, PENDING, ACTIVE, TERMINATED, EXPIRED |
| start_date | timestamptz | |
| end_date | timestamptz | |
| monthly_rent | integer | Cents |
| security_deposit | integer? | Cents |
| lease_terms | jsonb? | Freeform terms |
| signed_at | timestamptz? | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| property_name | text? | Enriched (GET only) |
| unit_number | text? | Enriched (GET only) |

## Error Responses

All errors use the envelope:
```json
{
  "error": { "code": "NOT_FOUND", "message": "Lease not found" }
}
```

- **400** — Validation error or invalid state transition (e.g. terminate non-ACTIVE).
- **401** — Unauthenticated. Frontend clears auth state.
- **403** — Unauthorized (wrong role, or unit belongs to different org).
- **404** — Not found or not in caller's org.
- **409** — Conflict (unit already has an active lease).

## Cross-org Isolation

All queries include `WHERE org_id = $orgId` from the JWT. An OWNER in org-X never sees data from org-Y — the backend returns 404 (not 403) to prevent information leakage.

## Deferred Items

- **Tenant name enrichment**: `tenant_id` is returned raw. Resolving tenant_id → user name requires cross-schema mapping not yet implemented.
- **Automatic expiration**: No scheduled job transitions ACTIVE → EXPIRED when `end_date < NOW()`. Manual termination or future cron job.
- **POST /:id/tenants**: Removed. Tenant assignment via `PUT /:id` with `{ tenantId }`.
