/**
 * Property Manager Dashboard — Permissions Audit
 *
 * Documents which /api/pm/* endpoints the PM_STAFF and ORG_ADMIN roles
 * can call. This drives the service layer: if an endpoint is not yet
 * implemented on the backend, the adapter returns stub data.
 *
 * GUARDRAIL: PM flows ONLY call /api/pm/* endpoints. Never org-wide
 * endpoints like /api/properties, /api/leases, etc.
 *
 * All PM endpoints resolve authorization server-side via:
 *   manager_property_assignments + organization_id + resource joins.
 *
 * Last audited: 2026-03-09
 */

export interface PMEndpointPermission {
  /** HTTP method + path */
  endpoint: string;
  /** Backend service that owns this route */
  service: string;
  /** Roles that can call this endpoint */
  allowedRoles: string[];
  /** Whether the endpoint exists in the backend */
  implemented: boolean;
  /** Notes */
  notes?: string;
}

/**
 * Complete list of /api/pm/* endpoints the dashboard may call.
 *
 * Endpoints marked `implemented: false` will use stub data until
 * the backend implements them.
 */
export const PM_ENDPOINT_PERMISSIONS: PMEndpointPermission[] = [
  // ── Dashboard aggregate ──
  {
    endpoint: "GET /api/pm/dashboard",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Aggregated PM dashboard endpoint.",
  },

  // ── Properties (PM-scoped) ──
  {
    endpoint: "GET /api/pm/properties",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes:
      "Returns only properties assigned to this PM via manager_property_assignments. " +
      "ORG_ADMIN sees all org properties.",
  },
  {
    endpoint: "GET /api/pm/properties/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Single property detail, scoped to PM assignments.",
  },

  // ── Units (PM-scoped) ──
  {
    endpoint: "GET /api/pm/units",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Units across assigned properties. Server-side filtered.",
  },
  {
    endpoint: "GET /api/pm/units/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Single unit detail, scoped via parent property.",
  },

  // ── Tenants (PM-scoped) ──
  {
    endpoint: "GET /api/pm/tenants",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Tenants via full lineage: assignment → unit → lease → tenant.",
  },
  {
    endpoint: "GET /api/pm/tenants/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Single tenant detail with lease context.",
  },

  // ── Maintenance (PM-scoped) ──
  {
    endpoint: "GET /api/pm/maintenance",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Work orders for units in assigned properties.",
  },
  {
    endpoint: "GET /api/pm/maintenance/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Single work order detail.",
  },
  {
    endpoint: "PATCH /api/pm/maintenance/:id/status",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Update work order status. Validates against allowed enum.",
  },
  {
    endpoint: "GET /api/pm/maintenance/:id/comments",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "List comments on a work order.",
  },
  {
    endpoint: "POST /api/pm/maintenance/:id/comments",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Add comment to a work order.",
  },

  // ── Payments (PM-scoped) ──
  {
    endpoint: "GET /api/pm/payments",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Payments for leases in assigned properties.",
  },
  {
    endpoint: "GET /api/pm/payments/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Single payment detail.",
  },

  // ── Documents (PM-scoped) ──
  {
    endpoint: "GET /api/pm/documents",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Documents related to assigned properties, units, leases.",
  },
  {
    endpoint: "GET /api/pm/documents/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF"],
    implemented: true,
    notes: "Single document detail.",
  },
];

/**
 * PM endpoint allowlist — used by the service layer to validate
 * that all API calls stay within the /api/pm/* namespace.
 */
export const PM_ALLOWED_PATH_PREFIX = "api/pm/" as const;

/**
 * Validate that a path is within the PM-scoped namespace.
 * Throws if the path does not start with "api/pm/".
 */
export function assertPMPath(path: string): void {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  if (!clean.startsWith(PM_ALLOWED_PATH_PREFIX)) {
    throw new Error(
      `PM safety violation: path "${path}" is outside the /api/pm/* namespace. ` +
        `PM flows must only call /api/pm/* endpoints.`
    );
  }
}

/**
 * Check if a given PM endpoint is implemented in the backend.
 */
export function isPMEndpointImplemented(endpoint: string): boolean {
  const perm = PM_ENDPOINT_PERMISSIONS.find((p) => p.endpoint === endpoint);
  return perm?.implemented ?? false;
}
