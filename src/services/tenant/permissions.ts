/**
 * Tenant Dashboard — Permissions Audit
 *
 * Documents which backend endpoints the TENANT role can and cannot call,
 * derived from actual `requireRole()` guards in each microservice.
 *
 * Last audited: 2026-03-09 against leasebase microservice source code.
 */

export interface EndpointPermission {
  endpoint: string;
  service: string;
  allowedRoles: string[];
  tenantAllowed: boolean;
  notes?: string;
}

export const TENANT_ENDPOINT_PERMISSIONS: EndpointPermission[] = [
  // ── auth-service ──
  {
    endpoint: "GET /api/auth/me",
    service: "auth-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
  },

  // ── tenant-service ──
  {
    endpoint: "GET /api/tenants/me",
    service: "tenant-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "NEW endpoint. Returns current user's tenant_profile by user_id. Anchor for tenant UX.",
  },
  {
    endpoint: "GET /api/tenants/:id",
    service: "tenant-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "requireAuth only, but route handler checks user_id === user.userId for TENANT role. Self-read only.",
  },
  {
    endpoint: "GET /api/tenants",
    service: "tenant-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    tenantAllowed: false,
    notes: "Cannot list all tenants.",
  },
  {
    endpoint: "PATCH /api/tenants/me",
    service: "tenant-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "Phase 2. Self-update: phone, emergency_contact, notification_preferences. Zod .strict() rejects unknown keys.",
  },
  {
    endpoint: "PUT /api/tenants/:id",
    service: "tenant-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    tenantAllowed: false,
    notes: "Admin-only full update.",
  },

  // ── lease-service ──
  {
    endpoint: "GET /api/leases",
    service: "lease-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    tenantAllowed: false,
    notes: "Data isolation phase: requireRole guard added. TENANT gets 403.",
  },
  {
    endpoint: "GET /api/leases/:id",
    service: "lease-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "Data isolation phase: TENANT ownership check added (tenant_profiles + org alignment). Safe when lease_id comes from /tenants/me.",
  },

  // ── payments-service ──
  {
    endpoint: "GET /api/payments",
    service: "payments-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    tenantAllowed: false,
    notes: "Data isolation phase: requireRole guard added. TENANT gets 403. Use GET /api/payments/mine instead.",
  },
  {
    endpoint: "GET /api/payments/mine",
    service: "payments-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "Phase 2. Tenant-scoped: resolves via JWT → tenant_profiles → lease_id. Server-side filtered.",
  },
  {
    endpoint: "POST /api/payments/checkout",
    service: "payments-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "Phase 2. Creates Stripe Checkout Session scoped to tenant's lease. Duplicate-safe via billing_period.",
  },
  {
    endpoint: "GET /api/payments/:id",
    service: "payments-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "Safe for single-record access.",
  },
  {
    endpoint: "POST /api/payments",
    service: "payments-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    tenantAllowed: false,
    notes: "Data isolation phase: requireRole guard added. TENANT/OWNER get 403.",
  },
  {
    endpoint: "GET /api/payments/ledger",
    service: "payments-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    tenantAllowed: false,
    notes: "Cannot view ledger entries.",
  },

  // ── maintenance-service ──
  {
    endpoint: "GET /api/maintenance",
    service: "maintenance-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    tenantAllowed: false,
    notes: "Data isolation phase: requireRole guard added. TENANT gets 403. Use GET /api/maintenance/mine instead.",
  },
  {
    endpoint: "GET /api/maintenance/mine",
    service: "maintenance-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "Phase 2. Tenant-scoped: filters by created_by_user_id from JWT. Server-side filtered.",
  },
  {
    endpoint: "GET /api/maintenance/:id",
    service: "maintenance-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
  },
  {
    endpoint: "POST /api/maintenance",
    service: "maintenance-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
  },
  {
    endpoint: "GET /api/maintenance/:id/comments",
    service: "maintenance-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
  },
  {
    endpoint: "POST /api/maintenance/:id/comments",
    service: "maintenance-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
  },
  {
    endpoint: "PUT /api/maintenance/:id",
    service: "maintenance-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    tenantAllowed: false,
  },
  {
    endpoint: "PATCH /api/maintenance/:id/status",
    service: "maintenance-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    tenantAllowed: false,
  },

  // ── document-service ──
  {
    endpoint: "GET /api/documents",
    service: "document-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    tenantAllowed: false,
    notes: "Org-wide documents list. Tenant uses GET /api/documents/mine instead.",
  },
  {
    endpoint: "GET /api/documents/mine",
    service: "document-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "Phase 2. Tenant-scoped: resolves via JWT → tenant_profiles → lease_id. Only LEASE-related docs. s3_key excluded.",
  },
  {
    endpoint: "GET /api/documents/:id",
    service: "document-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    tenantAllowed: false,
  },
  {
    endpoint: "GET /api/documents/:id/download",
    service: "document-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    tenantAllowed: false,
  },
  {
    endpoint: "POST /api/documents/upload",
    service: "document-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    tenantAllowed: false,
  },

  // ── notification-service ──
  {
    endpoint: "GET /api/notifications",
    service: "notification-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
    notes: "Already user-scoped: filters by recipient_user_id.",
  },
  {
    endpoint: "GET /api/notifications/:id",
    service: "notification-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
  },
  {
    endpoint: "PATCH /api/notifications/:id/read",
    service: "notification-service",
    allowedRoles: ["*"],
    tenantAllowed: true,
  },
];

export function isTenantAuthorized(endpoint: string): boolean {
  const perm = TENANT_ENDPOINT_PERMISSIONS.find((p) => p.endpoint === endpoint);
  return perm?.tenantAllowed ?? false;
}
