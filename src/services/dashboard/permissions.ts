/**
 * Owner Dashboard — Permissions Audit
 *
 * Documents which backend endpoints the OWNER role can and cannot call,
 * derived from actual `requireRole()` guards in each microservice.
 *
 * This audit drives the service layer: if OWNER is not authorized for an
 * endpoint, the adapter skips the call and returns `{ source: "unavailable" }`
 * instead of triggering a 403 error.
 *
 * Last audited: 2026-03-09 against leasebase microservice source code.
 */

export interface EndpointPermission {
  /** HTTP method + path as seen from the BFF */
  endpoint: string;
  /** Service that owns this route */
  service: string;
  /** Roles explicitly listed in requireRole() */
  allowedRoles: string[];
  /** Whether OWNER can call this */
  ownerAllowed: boolean;
  /** Notes on limitations or workarounds */
  notes?: string;
}

/**
 * Complete list of endpoints the dashboard service layer may call,
 * with OWNER access status.
 *
 * Source of truth: `requireRole()` calls in each service's route files.
 */
export const DASHBOARD_ENDPOINT_PERMISSIONS: EndpointPermission[] = [
  // ── property-service ──
  {
    endpoint: "GET /api/properties",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
  },
  {
    endpoint: "GET /api/properties/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
  },
  {
    endpoint: "GET /api/properties/:id/units",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
  },

  // ── lease-service ──
  {
    endpoint: "GET /api/leases",
    service: "lease-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
    notes: "Data isolation phase: requireRole guard added. TENANT blocked.",
  },

  // ── payments-service ──
  {
    endpoint: "GET /api/payments",
    service: "payments-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
    notes: "Data isolation phase: requireRole guard added. TENANT blocked.",
  },
  {
    endpoint: "GET /api/payments/ledger",
    service: "payments-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
  },

  // ── maintenance-service ──
  {
    endpoint: "GET /api/maintenance",
    service: "maintenance-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
    notes: "Data isolation phase: requireRole guard added. TENANT blocked.",
  },

  // ── tenant-service ──
  {
    endpoint: "GET /api/tenants",
    service: "tenant-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    ownerAllowed: false,
    notes:
      "OWNER is NOT in the allowedRoles list. Dashboard cannot fetch tenant count. " +
      "Workaround: derive tenant presence from active leases (if a lease exists, a tenant exists). " +
      "TODO: Request backend to add OWNER to GET /api/tenants or add a GET /api/tenants/count endpoint.",
  },

  // ── auth-service ──
  {
    endpoint: "GET /api/auth/me",
    service: "auth-service",
    allowedRoles: ["*"], // requireAuth only
    ownerAllowed: true,
  },

  // ── Endpoints that do NOT exist yet ──
  {
    endpoint: "GET /api/dashboard/owner",
    service: "bff-gateway",
    allowedRoles: [],
    ownerAllowed: false,
    notes: "Aggregated dashboard endpoint does not exist. Frontend orchestrates calls directly.",
  },
  {
    endpoint: "GET /api/activity",
    service: "N/A",
    allowedRoles: [],
    ownerAllowed: false,
    notes: "Activity feed endpoint does not exist in any service. Using stub data.",
  },
];

/**
 * Quick lookup: can the OWNER role call this endpoint?
 */
export function isOwnerAuthorized(endpoint: string): boolean {
  const perm = DASHBOARD_ENDPOINT_PERMISSIONS.find((p) => p.endpoint === endpoint);
  return perm?.ownerAllowed ?? false;
}
