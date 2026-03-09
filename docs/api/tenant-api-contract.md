# Tenant API Contract

## Overview

This document defines the BFF endpoints the tenant UI consumes, their response shapes, provenance rules, and TENANT role permissions. All requests go through the BFF gateway at the configured `NEXT_PUBLIC_API_BASE_URL`.

## Authentication

All requests include either:
- `Authorization: Bearer <cognito-access-token>` (production)
- `x-dev-user-email` + `x-dev-user-role` + `x-dev-org-id` headers (dev bypass)

The TENANT role is set via Cognito custom attribute `custom:role = TENANT`.

## Provenance Rules

Every service adapter returns `DomainResult<T>` with:
- `source: "live"` — data fetched successfully from real endpoint
- `source: "stub"` — TENANT role is forbidden (403) or endpoint missing; stub data used
- `source: "unavailable"` — fetch failed (network error, 5xx); no data available

The view model propagates provenance to UI components. Components display provenance via tooltips on data values.

## Security-Critical Rules

**MUST NOT call from tenant UI:**
- `GET /api/leases` — returns ALL org leases (data leak)
- `GET /api/payments` — returns ALL org payments (data leak)
- `GET /api/maintenance` — returns ALL org work orders (data leak)

These endpoints use `requireAuth` only with no role restriction. A TENANT calling them receives every record in the org regardless of client-side filtering.

## Endpoint Reference

### Safe Live Endpoints

#### GET /api/auth/me
**Provenance:** Live
**Response:**
```json
{
  "id": "uuid",
  "orgId": "uuid",
  "email": "tenant@example.com",
  "name": "Jane Doe",
  "role": "TENANT"
}
```

#### GET /api/tenants/me
**Provenance:** Live
**Note:** Anchor endpoint for tenant UX. Returns current user's tenant_profile by `user_id`. If this endpoint is not deployed or returns 404, the entire dashboard shows "context unavailable".
**Response:**
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "lease_id": "uuid",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "email": "tenant@example.com",
    "name": "Jane Doe"
  }
}
```

#### GET /api/leases/:id
**Provenance:** Live
**Note:** Safe for single-record access. `lease_id` comes from `/tenants/me`. Never call the list endpoint.
**Response:** `{ "data": { ...lease } }`

#### POST /api/maintenance
**Provenance:** Live
**Note:** Creates work order for current user. Safe (sets `created_by_user_id` server-side).
**Request:**
```json
{
  "unitId": "uuid",
  "category": "Plumbing",
  "priority": "MEDIUM",
  "description": "Kitchen faucet is leaking"
}
```

#### GET /api/maintenance/:id
**Provenance:** Live
**Note:** Safe for single-record access (tenant gets IDs from creation response or notifications).

#### GET /api/maintenance/:id/comments
**Provenance:** Live

#### POST /api/maintenance/:id/comments
**Provenance:** Live
**Request:** `{ "comment": "Still leaking after repair attempt" }`

#### GET /api/notifications
**Provenance:** Live
**Note:** Already user-scoped server-side (filters by `recipient_user_id`).

#### GET /api/notifications/:id
**Provenance:** Live

#### PATCH /api/notifications/:id/read
**Provenance:** Live

#### GET /api/payments/mine (**NEW** — Phase 2)
**Provenance:** Live
**Note:** Tenant-scoped payments. Resolves via JWT → `tenant_profiles` → `lease_id`. Server-side filtered. Consistent pagination: `{ data, meta: { page, limit, total, hasMore } }`.
**Response:** `{ "data": [...payments], "meta": { "page": 1, "limit": 20, "total": 5, "hasMore": false } }`

#### POST /api/payments/checkout (**NEW** — Phase 2)
**Provenance:** Live
**Note:** Creates Stripe Checkout Session scoped to tenant's lease. Duplicate-safe via `billing_period` (1st of current month UTC). If a reusable pending session exists, returns it. URL validation against `ALLOWED_CHECKOUT_ORIGINS`.
**Request:** `{ "returnUrl": "https://app.example.com/success", "cancelUrl": "https://app.example.com/cancel" }`
**Response:** `{ "data": { "checkoutUrl": "https://checkout.stripe.com/...", "sessionId": "cs_..." } }`
**Error cases:** 404 (no lease), 409 (duplicate pending), 503 (Stripe not configured / no payment account)

#### GET /api/maintenance/mine (**NEW** — Phase 2)
**Provenance:** Live
**Note:** Tenant-scoped work orders. Filters by `created_by_user_id` from JWT. Server-side filtered.
**Response:** `{ "data": [...work_orders], "meta": { "page": 1, "limit": 20, "total": 3, "hasMore": false } }`

#### GET /api/documents/mine (**NEW** — Phase 2)
**Provenance:** Live
**Note:** Tenant-scoped documents. Resolves via JWT → `tenant_profiles` → `lease_id`. Only `related_type = 'LEASE'` documents. `s3_key` excluded from response.
**Response:** `{ "data": [...documents], "meta": { ... } }`

#### PATCH /api/tenants/me (**NEW** — Phase 2)
**Provenance:** Live
**Note:** Self-update for tenant profile. Allowed fields: `phone`, `emergency_contact`, `notification_preferences`. Unknown keys rejected (Zod `.strict()`). Field clearing: omit = no change, `null` = clear, value = set. Phone validated: `/^\+?[0-9\s\-().]{7,20}$/`. Emergency contact max 500 chars. Notification prefs: known keys only (`email_payments`, `email_maintenance`, etc.).
**Request:** `{ "phone": "+1234567890", "emergency_contact": "Jane Smith, 555-0123, spouse" }`
**Response:** `{ "data": { ...tenant_profile_with_email_name } }`

### Forbidden Endpoints (403 for TENANT)
- `GET /api/tenants` (ORG_ADMIN, PM_STAFF only)
- `PUT /api/tenants/:id` (ORG_ADMIN, PM_STAFF only)
- `GET /api/payments` (org-wide — use `/mine` instead)
- `GET /api/payments/ledger` (ORG_ADMIN, PM_STAFF, OWNER only)
- `GET /api/maintenance` (org-wide — use `/mine` instead)
- `GET /api/documents` + `/:id` + `/:id/download` (ORG_ADMIN, PM_STAFF, OWNER only — use `/mine` instead)
- `POST /api/documents/upload` (ORG_ADMIN, PM_STAFF only)

## Tenant API Security Model

### Data Isolation Rules
1. **Identity from JWT only**: All `/mine` endpoints resolve tenant identity from `req.user.userId` (JWT). The client never supplies `tenant_id`, `lease_id`, or `org_id`.
2. **Fail closed**: If `userId` does not resolve to a `tenant_profile` in the same org, return 404. Never fall back to org-wide data.
3. **Server-side filtering**: All queries use JOINs on `tenant_profiles` + `users` to scope data. No client-side filtering.
4. **No bypasses**: No debug backdoors, no optional `tenant_id`/`lease_id` query params on `/mine` endpoints.
5. **URL validation**: Checkout `returnUrl`/`cancelUrl` validated against `ALLOWED_CHECKOUT_ORIGINS` allowlist.
6. **Duplicate-safe checkout**: Billing period dedup prevents double payments. Existing reusable sessions are returned.
7. **Document safety**: `s3_key` excluded from tenant responses. Download via signed URL pattern (future).

### Allowed Endpoints Summary
- `GET /api/auth/me`
- `GET /api/tenants/me` / `PATCH /api/tenants/me`
- `GET /api/leases/:id` (lease_id from `/tenants/me`)
- `GET /api/payments/mine` / `POST /api/payments/checkout`
- `GET /api/maintenance/mine` / `POST /api/maintenance` / `GET /api/maintenance/:id` + comments
- `GET /api/documents/mine`
- `GET /api/notifications` / `GET /api/notifications/:id` / `PATCH /api/notifications/:id/read`

## Backend Gaps (Follow-up Tickets)

1. **Add TENANT to payments/ledger** — scoped to own lease charges.
2. **Invite system** — `POST /api/tenants/invite` with token-based registration flow.
3. **Receipt generation** — `GET /api/payments/:id/receipt` returning PDF or structured receipt data.
4. **Document download endpoint for tenants** — `GET /api/documents/mine/:id/download` returning presigned URL.
5. **Autopay configuration** — `POST /api/payments/autopay` for recurring payment setup.
6. **Late fee calculation** — automated late fee charges based on lease terms.
7. **Messaging/chat** — tenant-to-manager communication.
