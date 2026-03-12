# ADR-001: Approved Target Architecture

**Status:** Accepted  
**Date:** 2026-03-12  
**Decision makers:** Rachid (founder)

## Context

LeaseBase v2 consists of a frontend web app and a set of backend microservices. The legacy monorepo (`leasebase-schema-dev`, formerly `leasebase-backend`) held both the API runtime and the Prisma schema. The v2 architecture splits services into dedicated repos.

The product previously supported three personas: Owner, Tenant, and Property Manager. Property Manager is no longer part of the product model.

## Decision

### Canonical Repos (Active Runtime)
- `leasebase-web` — Next.js frontend
- `leasebase-bff-gateway` — API gateway / BFF
- `leasebase-auth-service` — Authentication + identity
- `leasebase-property-service` — Property + unit management
- `leasebase-tenant-service` — Tenant profiles + invitations
- `leasebase-lease-service` — Lease management
- `leasebase-maintenance-service` — Work orders
- `leasebase-payments-service` — Payment processing
- `leasebase-document-service` — Document storage
- `leasebase-notification-service` — Notifications
- `leasebase-reporting-service` — Reporting
- `leasebase-service-common` — Shared types, middleware, utilities (library)
- `leasebase-iac` — Infrastructure as code

### Transitional Only
- `leasebase-schema-dev` — Prisma schema, migrations, seed data. Not an active runtime. Will be retired once schema ownership is migrated to individual services.

### Supported Personas
- **OWNER** — Landlord / property owner
- **TENANT** — Renter

Property Manager (ORG_ADMIN, PM_STAFF) has been removed from the product model. All PM-specific code, routes, components, and documentation should be removed.

## Consequences

- All new feature work targets the v2 microservice repos.
- `leasebase-schema-dev` is only used for schema migrations and reference data.
- PM-related code in frontend and backend is being systematically removed.
- Backend role guards will be simplified from `requireRole(ORG_ADMIN, PM_STAFF, OWNER)` to `requireRole(OWNER)`.
