/**
 * Lease Management — Permissions Audit
 *
 * Documents which backend endpoints each role can call for
 * lease management, derived from actual requireRole() guards
 * in the lease-service.
 *
 * Last audited: 2026-03-10 against leasebase-lease-service source code.
 */

export interface EndpointPermission {
  endpoint: string;
  service: string;
  allowedRoles: string[];
  ownerAllowed: boolean;
  notes?: string;
}

export const LEASE_ENDPOINT_PERMISSIONS: EndpointPermission[] = [
  {
    endpoint: "GET /api/leases",
    service: "lease-service",
    allowedRoles: ["OWNER"],
    ownerAllowed: true,
    notes: "Supports ?status=, ?propertyId=, ?unitId= filters.",
  },
  {
    endpoint: "POST /api/leases",
    service: "lease-service",
    allowedRoles: ["OWNER"],
    ownerAllowed: true,
    notes: "OWNER added in lease epic. Validates unit existence, org match, property/unit match, no active lease.",
  },
  {
    endpoint: "GET /api/leases/:id",
    service: "lease-service",
    allowedRoles: ["OWNER", "TENANT"],
    ownerAllowed: true,
    notes: "TENANT can only see their own lease (tenant_id match). No role guard — uses auth + tenant ownership check.",
  },
  {
    endpoint: "PUT /api/leases/:id",
    service: "lease-service",
    allowedRoles: ["OWNER"],
    ownerAllowed: true,
    notes: "OWNER added in lease epic. Tenant assignment via tenantId field.",
  },
  {
    endpoint: "DELETE /api/leases/:id",
    service: "lease-service",
    allowedRoles: ["OWNER"],
    ownerAllowed: true,
    notes: "Destructive operation. OWNER-only.",
  },
  {
    endpoint: "POST /api/leases/:id/terminate",
    service: "lease-service",
    allowedRoles: ["OWNER"],
    ownerAllowed: true,
    notes: "Only ACTIVE leases can be terminated. Sets status=TERMINATED, end_date=NOW().",
  },
  {
    endpoint: "POST /api/leases/:id/renew",
    service: "lease-service",
    allowedRoles: ["OWNER"],
    ownerAllowed: true,
    notes: "Creates successor DRAFT lease. Original stays ACTIVE. Only ACTIVE leases can be renewed.",
  },
];
