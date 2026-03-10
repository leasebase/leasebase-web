/**
 * Owner Portfolio — Permissions Audit
 *
 * Documents which backend endpoints the OWNER role can call for
 * property and unit management, derived from actual requireRole()
 * guards in the property-service.
 *
 * Last audited: 2026-03-10 against leasebase-property-service source code.
 */

export interface EndpointPermission {
  endpoint: string;
  service: string;
  allowedRoles: string[];
  ownerAllowed: boolean;
  notes?: string;
}

export const PORTFOLIO_ENDPOINT_PERMISSIONS: EndpointPermission[] = [
  {
    endpoint: "GET /api/properties",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
  },
  {
    endpoint: "POST /api/properties",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
    notes: "OWNER added in portfolio epic. Org scoping via JWT.",
  },
  {
    endpoint: "GET /api/properties/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
  },
  {
    endpoint: "PUT /api/properties/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
    notes: "OWNER added in portfolio epic. Org scoping via JWT.",
  },
  {
    endpoint: "GET /api/properties/:propertyId/units",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
  },
  {
    endpoint: "POST /api/properties/:propertyId/units",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
    notes: "OWNER added in portfolio epic. Org scoping via JWT.",
  },
  {
    endpoint: "GET /api/properties/units/:unitId",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER", "TENANT"],
    ownerAllowed: true,
  },
  {
    endpoint: "PUT /api/properties/units/:unitId",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN", "PM_STAFF", "OWNER"],
    ownerAllowed: true,
    notes: "OWNER added in portfolio epic. Org scoping via JWT.",
  },
  {
    endpoint: "DELETE /api/properties/:id",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN"],
    ownerAllowed: false,
    notes: "Delete is ORG_ADMIN only. Owner cannot delete properties.",
  },
  {
    endpoint: "DELETE /api/properties/units/:unitId",
    service: "property-service",
    allowedRoles: ["ORG_ADMIN"],
    ownerAllowed: false,
    notes: "Delete is ORG_ADMIN only. Owner cannot delete units.",
  },
];
