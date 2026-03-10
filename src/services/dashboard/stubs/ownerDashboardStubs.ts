/**
 * Stub data for the Owner Dashboard.
 *
 * These stubs are used ONLY when:
 * 1. A backend endpoint does not yet exist (e.g. activity feed)
 * 2. The owner role is not authorized for an endpoint (e.g. tenants list)
 *
 * TODO: Remove each stub as the corresponding backend endpoint becomes available.
 * Each function is clearly marked so it's easy to find and replace.
 */

import type { ActivityEvent, DashboardAlert } from "../types";

/**
 * TODO: Replace with real activity feed from BFF endpoint
 * GET /api/dashboard/owner → data.recentActivity
 *
 * No activity-feed endpoint exists in any microservice today.
 * This requires either EventBridge event persistence or BFF aggregation
 * of recent records across services.
 */
export function getStubActivityFeed(): ActivityEvent[] {
  return [
    {
      id: "stub_evt_1",
      type: "PAYMENT_RECEIVED",
      title: "Payment received",
      description: "$1,450.00 from Alice Johnson — Unit 1A",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      link: "/app/payments",
    },
    {
      id: "stub_evt_2",
      type: "MAINTENANCE_CREATED",
      title: "Maintenance request created",
      description: "Leaking kitchen faucet — Unit 3C",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      link: "/app/maintenance",
    },
    {
      id: "stub_evt_3",
      type: "LEASE_RENEWED",
      title: "Lease renewed",
      description: "Bob Smith — Unit 1A, renewed through Aug 2027",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      link: "/app/leases",
    },
    {
      id: "stub_evt_4",
      type: "TENANT_INVITED",
      title: "Tenant invited",
      description: "carol.davis@email.com invited to Unit 2B",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      link: "/app/tenants",
    },
    {
      id: "stub_evt_5",
      type: "MAINTENANCE_COMPLETED",
      title: "Maintenance completed",
      description: "Broken blinds repair — Unit 1A",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      link: "/app/maintenance",
    },
  ];
}

/**
 * TODO: Replace with real setup-check logic from backend
 *
 * Setup alerts are computed from dashboard KPIs (zero properties, zero units, etc.).
 * This stub provides a fallback for the tenant-count check since OWNER role
 * is not currently authorized on GET /api/tenants.
 */
export function getStubSetupAlerts(context: {
  totalProperties: number;
  totalUnits: number;
  hasAnyTenants: boolean | null; // null = couldn't determine (OWNER not authorized)
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (context.totalProperties === 0) {
    alerts.push({
      type: "SETUP_INCOMPLETE",
      severity: "info",
      count: 1,
      message: "Add your first property to get started",
      link: "/app/properties",
    });
  } else if (context.totalUnits === 0) {
    alerts.push({
      type: "SETUP_INCOMPLETE",
      severity: "info",
      count: 1,
      message: "Add units to your properties",
      link: "/app/units",
    });
  } else if (context.hasAnyTenants === false) {
    alerts.push({
      type: "SETUP_INCOMPLETE",
      severity: "info",
      count: 1,
      message: "Invite tenants to get started",
      link: "/app/tenants",
    });
  } else if (context.hasAnyTenants === null) {
    // Can't determine tenant count — OWNER role not authorized.
    // Don't show a misleading alert; silently skip.
  }

  return alerts;
}
