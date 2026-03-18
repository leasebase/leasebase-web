# Owner Portfolio — Authorization Notes

## Role-Based Access Control

The property-service uses `requireRole()` middleware from `@leasebase/service-common`. Each endpoint declares which roles are allowed.

### Properties Endpoints

| Endpoint | ORG_ADMIN | PM_STAFF | OWNER | TENANT |
|----------|-----------|----------|-------|--------|
| GET /properties | ✅ | ✅ | ✅ | ❌ 403 |
| POST /properties | ✅ | ✅ | ✅ | ❌ 403 |
| GET /properties/:id | ✅ | ✅ | ✅ | ❌ 403 |
| PUT /properties/:id | ✅ | ✅ | ✅ | ❌ 403 |
| DELETE /properties/:id | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |

### Units Endpoints

| Endpoint | ORG_ADMIN | PM_STAFF | OWNER | TENANT |
|----------|-----------|----------|-------|--------|
| GET /:propertyId/units | ✅ | ✅ | ✅ | ❌ 403 |
| POST /:propertyId/units | ✅ | ✅ | ✅ | ❌ 403 |
| GET /units/:unitId | ✅ | ✅ | ✅ | ✅ |
| PUT /units/:unitId | ✅ | ✅ | ✅ | ❌ 403 |
| DELETE /units/:unitId | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |

## Organization Isolation

- All SQL queries include `WHERE organization_id = $orgId` where `$orgId` comes from the JWT.
- Cross-org access is impossible: OWNER in org-X querying for a property in org-Y gets a 404 (not 403).
- The frontend never sends `organization_id` — the server resolves it entirely from the token.

## Owner vs PM Scope Differences

| Aspect | OWNER | PM_STAFF |
|--------|-------|----------|
| Properties scope | All org properties | Only assigned properties (via `manager_property_assignments`) |
| Units scope | Via property (all org) | Via assigned properties |
| Route prefix | `/api/properties` (direct) | `/api/pm/properties` (PM-scoped) |
| Frontend branch | `persona === "owner"` | `persona === "propertyManager"` |

PM_STAFF has an additional scoping layer (`resolvePMPropertyIds`) that restricts them to their assigned properties. OWNER sees all properties in their org because the direct `/api/properties` endpoint only scopes by `organization_id`.

## Frontend Auth Flow

1. Auth state lives in Zustand (`authStore`).
2. `mapUserRoleToPersona()` maps `OWNER` → `"owner"` persona.
3. Pages check `user.persona` to render the correct branch (owner vs PM).
4. `apiRequest()` attaches Bearer token (Cognito) or dev-bypass headers.
5. On 401: auth state cleared, user redirected to login.
6. On 403: error displayed inline, auth state NOT cleared.

## Backend Auth Middleware Stack

For each request:
1. `requireAuth` — validates JWT, extracts user into `req.user`
2. `requireRole(UserRole.OWNER, ...)` — checks `req.user.role` against allowed roles
3. SQL queries — `WHERE organization_id = $orgId` for data isolation

No additional authorization middleware was needed for owner access — the existing `requireRole` + org-scoped queries provide complete protection.

## Test Coverage

- **Backend** (`leasebase-property-service/src/__tests__/`):
  - `owner-properties.test.ts` — 27 tests: role guards, CRUD, cross-org isolation, meta envelope
  - `owner-units.test.ts` — 29 tests: role guards, CRUD, cross-org isolation, TENANT read access
- **Frontend** (`leasebase-web/tests/unit/properties/`):
  - Component tests: PropertiesTable, PropertyForm, UnitsTable, UnitForm
  - Service test: propertyService (all API calls + fan-out aggregation)
  - Integration test: owner portfolio flow + 403 error handling
