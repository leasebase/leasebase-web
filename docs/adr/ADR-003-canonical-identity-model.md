# ADR-003: Canonical Identity Model

**Status:** Accepted — Phase 3 (compatibility retirement) implemented  
**Date:** 2026-03-12 (proposed), 2026-03-12 (Phase 2), 2026-03-12 (Phase 3)  
**Decision makers:** Rachid (founder)

## Context

The identity model had drift between two user tables:

- **`"User"` (Prisma/PascalCase):** Used by auth-service (registration, `/me`), BFF (role enrichment), and maintenance-service (comments, work orders). Contains: id, organizationId, email, name, cognitoSub, role, status, createdAt, updatedAt.
- **`users` (snake_case):** Used by tenant-service (profiles, invitations, listings) and property-service (some joins). Contains: id, organization_id, cognito_sub, email, first_name, last_name, role, is_active, created_at, updated_at.

Owner registration only wrote to `"User"`. Tenant invitation accept dual-wrote to both tables. The BFF queried `"User"` directly for role enrichment, which was a boundary violation.

## Decision

### Canonical Table: `"User"` (Prisma-managed)

**Justification:**
1. Auth-service `/me` — the identity anchor — reads from `"User"`.
2. Owner registration creates records only in `"User"`.
3. All users (owners AND tenants) exist in `"User"`. Only tenants exist in `users`.
4. Migrating tenant-service to `"User"` is simpler than migrating auth-service + BFF + maintenance-service to `users`.

### Minimal Role Set: OWNER, TENANT

- ORG_ADMIN and PM_STAFF removed from the `UserRole` enum in service-common.
- All `requireRole()` guards across v2 services updated to use only OWNER and TENANT.

### Eliminate BFF DB Role Enrichment

- Auth-service `/me` already returns the DB-backed role and orgId.
- `enrichRole` middleware, `DATABASE_URL` dependency, and `x-lb-enriched-role` header removed from BFF.
- Downstream services get role exclusively from JWT `custom:role` claim.

### Eliminate Dual-Write

- Tenant invitation accept now writes only to `"User"` (dual-write to `users` removed).
- Remaining `users` table reads are marked with `TODO(identity-migration)` for Phase 3.

## Implementation Status

### Phase 2 — Safe Refactor (COMPLETED)

All changes applied to v2 runtime code. No schema-destructive operations.

**service-common:**
- `UserRole` enum reduced to `OWNER | TENANT`
- Auth middleware uses JWT `custom:role` as sole role source; fail-closed if missing
- Tests updated for two-role model

**BFF gateway:**
- `enrichRole` middleware, `decodeJwtPayload`, DB imports, PM proxy route all removed
- BFF is now a pure HTTP proxy with no DB dependency

**auth-service:**
- `mapUserTypeToRole()` simplified to always return `OWNER`
- `mapUserTypeToOrgType()` simplified to always return `LANDLORD`
- Dead PM/PM_COMPANY branches removed

**property-service:**
- PM dashboard, PM scope, and PM routes deleted
- All guards updated to OWNER/TENANT

**All v2 services (maintenance, lease, document, reporting, payments, notification, tenant):**
- All `requireRole()` guards updated — no ORG_ADMIN or PM_STAFF in runtime code

**tenant-service — invitation accept:**
- Dual-write removed; sole write target is `"User"` table
- Legacy `users` INSERT and catch block deleted

### Phase 3 — Compatibility Retirement (COMPLETED)

All v2 runtime reads migrated from legacy `users` to canonical `"User"` table.

**tenant-service/tenants.ts (15 query sites):**
- All `JOIN users u` → `JOIN "User" u`, `organization_id` → `"organizationId"`
- Includes LIST_SELECT, DETAIL_SELECT, GET /users, GET /me, PATCH /me, PUT /:id, DELETE /:id, deactivate, reactivate, history endpoints

**tenant-service/invitations.ts (2 query sites):**
- Inviter-name JOINs: `LEFT JOIN users inv` → `LEFT JOIN "User" inv`
- Query shape adjusted: `inv.first_name || ' ' || inv.last_name` → `inv.name`

**notification-service/notifications.ts (2 query sites):**
- Recipient validation: `SELECT id FROM users` → `SELECT id FROM "User"`

**document-service/documents.ts (2 query sites):**
- Tenant /mine endpoint: `JOIN users u` → `JOIN "User" u`

**Backfill script:** `leasebase-auth-service/scripts/backfill-user-table.ts` — non-destructive, dry-run by default, copies missing `users` rows into `"User"` with column mapping.

**Cognito normalization script:** `leasebase-auth-service/scripts/normalize-cognito-roles.ts` — finds ORG_ADMIN/PM_STAFF users in Cognito, updates to OWNER, dry-run by default.

### Phase 4 — Final Retirement (REMAINING)

1. **Run backfill script** against production to ensure all legacy `users` rows exist in `"User"`.
2. **Run Cognito normalization** to update stale ORG_ADMIN/PM_STAFF JWT claims to OWNER.
3. **Audit foreign keys:** Verify no remaining FK constraints reference `users` table.
4. **Drop `users` table** (or convert to a view over `"User"` for safety).
5. **Clean up Prisma schema:** Remove ORG_ADMIN/PM_STAFF from `UserRole` enum in `leasebase-schema-dev`.

## Consequences

- Single runtime role model: OWNER and TENANT only.
- JWT `custom:role` is the sole authorization source for all v2 services.
- BFF is a stateless HTTP proxy — no DB dependency.
- All v2 runtime reads use the canonical `"User"` table.
- Legacy `users` table still exists but has **zero runtime readers** — safe to drop after backfill verification.
- Backfill and Cognito normalization scripts are ready but must be executed before final retirement.
