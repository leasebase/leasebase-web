# LeaseBase Authentication & Authorization Flow

**Last updated:** 2026-03-15 (Option B: auth-service owns all User writes)

## Overview

LeaseBase uses AWS Cognito for identity, JWTs for session tokens, and a two-role model (`OWNER`, `TENANT`) enforced at the service layer.

## Roles

| Role | Description |
|------|-------------|
| `OWNER` | Property owner / landlord. Full admin access to their organization's data. |
| `TENANT` | Renter. Scoped access to their own profile, lease, payments, and maintenance requests. |


## Authentication Flow

### 1. Registration (Owner)

```
Browser → auth-service POST /auth/register
  → Cognito: create user (email, password)
  → DB: INSERT INTO "User" (role='OWNER') + INSERT INTO "Organization"
  → Cognito: set custom attributes (custom:role=OWNER, custom:orgId, custom:orgType)
  → Return: Cognito tokens (access + id + refresh)
```

### 2. Registration (Tenant — via invitation)

```
Browser → tenant-service POST /invitations/accept (public, no auth)
  → SELECT ... FOR UPDATE (lock invitation row, status must be PENDING)
  → tenant-service → auth-service POST /internal/auth/create-tenant
    → Cognito: create user (email, password, custom:role=TENANT)
    → DB: INSERT INTO "User" (role='TENANT', organizationId)
    → Return: { cognitoSub, userId }
  → DB (transaction, same connection holding row lock):
    → UPDATE invitation SET status='ACCEPTED'
    → INSERT INTO lease_service.leases
    → INSERT INTO "TenantProfile"
    → UPDATE property_service.units SET status='OCCUPIED'
    → COMMIT
  → On domain provisioning failure:
    → ROLLBACK
    → auth-service POST /internal/auth/delete-tenant (compensating cleanup)
  → Return: success
```

**Service ownership boundaries:**
- auth-service owns: Cognito identity + `public."User"` row (sole writer)
- tenant-service owns: `public."TenantProfile"`, `lease_service.leases`, `property_service.units` status, `tenant_service.tenant_invitations`

### 3. Login

```
Browser → Cognito: authenticateUser (email, password)
  → Return: JWT tokens (access + id + refresh)
```

### 4. Authenticated Request

```
Browser → BFF gateway (JWT in Authorization header)
  → BFF proxies to target v2 service (no DB access, no enrichment)
  → v2 service: requireAuth middleware
    → Verify JWT signature via Cognito JWKS
    → Extract claims: sub, custom:role, custom:orgId, custom:orgType, email, name
    → Attach to req.user
  → v2 service: requireRole middleware (optional)
    → Check req.user.role against allowed roles
    → 403 if not authorized
  → Route handler executes with org-scoped queries (WHERE organization_id = user.orgId)
```

## JWT Claims

The JWT `custom:role` claim is the **sole source of authorization role** for all v2 services. There is no database role enrichment or fallback.

Key claims extracted by `requireAuth` (service-common):
- `sub` → `userId`
- `custom:role` → `role` (OWNER or TENANT)
- `custom:orgId` → `orgId`
- `custom:orgType` → `orgType`
- `email` → `email`
- `name` → `name`

If `custom:role` is missing from the JWT, the request is rejected (fail-closed).

## BFF Gateway

The BFF is a **stateless HTTP proxy**. It:
- Forwards requests to the appropriate v2 service based on URL path
- Passes the JWT `Authorization` header through
- Has **no database dependency** (DATABASE_URL removed)
- Performs **no role enrichment** (enrichRole middleware removed)
- Has **no PM proxy routes** (removed)

## Guard Patterns

All v2 services use guards from `@leasebase/service-common`:

- `requireAuth` — verifies JWT, extracts user context
- `requireRole(UserRole.OWNER)` — owner-only endpoints (CRUD on properties, units, leases, tenants, documents, etc.)
- `requireRole(UserRole.OWNER, UserRole.TENANT)` — shared endpoints (e.g. GET unit by ID)
- No guard (beyond `requireAuth`) — user-scoped endpoints (e.g. GET /me, tenant self-service)

## Identity Table

All v2 services read from the canonical `"User"` (Prisma-managed, PascalCase) table.
**Only `auth_user` (auth-service) may INSERT into `public."User"`.**

Key `"User"` columns used in queries:
- `id`, `email`, `name`, `role`, `status` (lowercase, no quoting needed)
- `"organizationId"`, `"cognitoSub"`, `"createdAt"`, `"updatedAt"` (camelCase, must be quoted in raw SQL)

DB grants:
- `auth_user`: SELECT, INSERT on `public."User"`, `public."Organization"`, `public."Subscription"`
- All other service roles: SELECT only on `public."User"`
- `tenant_user`: INSERT on `public."TenantProfile"`, `lease_service.leases`; UPDATE on `property_service.units`

## Pre-Deployment Steps

No legacy migration scripts are required — LeaseBase launches with the canonical two-role model (`OWNER`, `TENANT`) from day one.
