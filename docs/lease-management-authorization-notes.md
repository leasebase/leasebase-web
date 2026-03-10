# Lease Management — Authorization Notes

## Role-Based Access Control

The lease-service uses `requireRole()` middleware from `@leasebase/service-common`. Each endpoint declares which roles are allowed.

### Lease Endpoints

| Endpoint | ORG_ADMIN | PM_STAFF | OWNER | TENANT |
|----------|-----------|----------|-------|--------|
| GET /leases | ✅ | ✅ | ✅ | ❌ 403 |
| POST /leases | ✅ | ✅ | ✅ | ❌ 403 |
| GET /leases/:id | ✅ | ✅ | ✅ | ✅ (own only) |
| PUT /leases/:id | ✅ | ✅ | ✅ | ❌ 403 |
| DELETE /leases/:id | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| POST /leases/:id/terminate | ✅ | ✅ | ✅ | ❌ 403 |
| POST /leases/:id/renew | ✅ | ✅ | ✅ | ❌ 403 |

### TENANT Access — Special Rules

- `GET /leases/:id` — TENANTs can view leases where `lease.tenant_id === user.userId`.
- If a TENANT requests a lease that exists but belongs to another tenant, the server returns 404 (not 403) to prevent tenant enumeration.
- TENANTs cannot list all leases (GET /leases returns 403). The tenant dashboard uses a separate adapter.

## Organization Isolation

- All SQL queries include `WHERE org_id = $orgId` where `$orgId` comes from the JWT.
- Cross-org access is impossible: OWNER in org-X querying for a lease in org-Y gets a 404 (not 403).
- The frontend never sends `org_id` — the server resolves it entirely from the token.

## POST Validation (Create Lease)

Beyond role checks, the create endpoint validates:
1. **Unit exists** — cross-schema query to `property_service.units`. Returns 404 if not found.
2. **Org match** — unit's owning property must belong to the caller's org. Returns 403 if mismatch.
3. **Property match** — submitted `propertyId` must match the unit's actual `property_id`. Returns 400 if mismatch (prevents client-side bugs).
4. **No active lease** — unit must not already have an ACTIVE lease. Returns 409 if conflict.

## Frontend Auth Flow

1. Auth state lives in Zustand (`authStore`).
2. `mapUserRoleToPersona()` maps `OWNER` → `"owner"` persona.
3. Pages check `user.persona` to render the correct branch (owner vs PM).
4. Persona guard: if `persona === "tenant"`, lease list and create pages show "not available" / "no permission" messages.
5. `apiRequest()` attaches Bearer token (Cognito) or dev-bypass headers.
6. On 401: auth state cleared, user redirected to login.
7. On 403: error displayed inline, auth state NOT cleared.

## Backend Auth Middleware Stack

For each request:
1. `requireAuth` — validates JWT, extracts user into `req.user`
2. `requireRole(UserRole.OWNER, ...)` — checks `req.user.role` against allowed roles
3. SQL queries — `WHERE org_id = $orgId` for data isolation
4. Endpoint-specific validation (unit ownership, active lease check, etc.)

## Test Coverage

- **Backend** (`leasebase-lease-service/src/__tests__/`):
  - `leases-crud.test.ts` — 25+ tests: role guards, CRUD, filters, validation (unit not found, active lease conflict, property/unit mismatch), terminate, renew, tenant ownership, cross-org isolation
- **Frontend** (`leasebase-web/tests/unit/leases/`):
  - `leaseService.test.ts` — API client tests
  - `LeasesTable.test.tsx` — table rendering, badges, formatting
  - `LeaseForm.test.tsx` — form validation, dollars→cents, property/unit selectors
  - `lease-integration.test.tsx` — page-level tests, persona guard, submit→redirect flow
