/**
 * PM Dashboard — Stub data
 *
 * Used when /api/pm/dashboard is not yet implemented on the backend.
 * Every value carries `source: "stub"` provenance so the UI can display
 * a badge or tooltip indicating the data is not live.
 *
 * GUARDRAIL: Stubs never call real API endpoints. They return canned data only.
 */

import type {
  PMDashboardData,
  PMDashboardKpis,
  PMPropertyRow,
  PMUnitRow,
  PMLeaseRow,
  PMTenantRow,
  PMWorkOrderRow,
  PMPaymentRow,
  PMTaskItem,
  PMDomainErrors,
  Sourced,
} from "../types";

function stubSourced<T>(value: T): Sourced<T> {
  return { value, source: "stub" };
}

export function getStubPMKpis(): PMDashboardKpis {
  return {
    totalProperties: stubSourced(12),
    totalUnits: stubSourced(48),
    occupiedUnits: stubSourced(45),
    vacancyRate: stubSourced(6.25),
    monthlyScheduledRent: stubSourced(6840000), // $68,400 in cents
    collectedThisMonth: stubSourced(3420000),   // $34,200 in cents
    overdueAmount: stubSourced(450000),         // $4,500 in cents
    openMaintenanceRequests: stubSourced(5),
  };
}

export function getStubPMProperties(): PMPropertyRow[] {
  return [
    {
      id: "stub-prop-1",
      name: "Riverside Apartments",
      address_line1: "123 River Rd",
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      country: "US",
      status: "ACTIVE",
      created_at: "2025-01-15T00:00:00Z",
      updated_at: "2025-01-15T00:00:00Z",
    },
    {
      id: "stub-prop-2",
      name: "Oak Park Residences",
      address_line1: "456 Oak Blvd",
      city: "Austin",
      state: "TX",
      postal_code: "78702",
      country: "US",
      status: "ACTIVE",
      created_at: "2025-02-01T00:00:00Z",
      updated_at: "2025-02-01T00:00:00Z",
    },
  ];
}

export function getStubPMUnits(): PMUnitRow[] {
  return [
    { id: "stub-unit-1", property_id: "stub-prop-1", unit_number: "1A", bedrooms: 2, bathrooms: 1, square_feet: 850, rent_amount: 145000, status: "OCCUPIED" },
    { id: "stub-unit-2", property_id: "stub-prop-1", unit_number: "2B", bedrooms: 1, bathrooms: 1, square_feet: 650, rent_amount: 120000, status: "OCCUPIED" },
    { id: "stub-unit-3", property_id: "stub-prop-1", unit_number: "3C", bedrooms: 2, bathrooms: 2, square_feet: 950, rent_amount: 160000, status: "OCCUPIED" },
    { id: "stub-unit-4", property_id: "stub-prop-2", unit_number: "4B", bedrooms: 1, bathrooms: 1, square_feet: 600, rent_amount: 110000, status: "AVAILABLE" },
  ];
}

export function getStubPMLeases(): PMLeaseRow[] {
  return [
    { id: "stub-lease-1", unit_id: "stub-unit-1", start_date: "2025-06-01", end_date: "2026-05-31", rent_amount: 145000, deposit_amount: 145000, status: "ACTIVE" },
    { id: "stub-lease-2", unit_id: "stub-unit-2", start_date: "2025-08-01", end_date: "2026-07-31", rent_amount: 120000, deposit_amount: 120000, status: "ACTIVE" },
    { id: "stub-lease-3", unit_id: "stub-unit-3", start_date: "2025-03-01", end_date: "2026-05-15", rent_amount: 160000, deposit_amount: 160000, status: "ACTIVE" },
  ];
}

export function getStubPMTenants(): PMTenantRow[] {
  return [
    { id: "stub-tenant-1", user_id: "stub-user-1", lease_id: "stub-lease-1", name: "Jane Doe", email: "jane@example.com", phone: "512-555-0101" },
    { id: "stub-tenant-2", user_id: "stub-user-2", lease_id: "stub-lease-2", name: "John Smith", email: "john@example.com", phone: null },
  ];
}

export function getStubPMWorkOrders(): PMWorkOrderRow[] {
  return [
    {
      id: "stub-wo-1",
      unit_id: "stub-unit-3",
      category: "Plumbing",
      priority: "HIGH",
      status: "IN_PROGRESS",
      description: "Fix leaking faucet — Unit 3C",
      assignee_id: null,
      tenant_user_id: "stub-user-3",
      created_at: "2026-03-05T10:00:00Z",
      updated_at: "2026-03-06T14:00:00Z",
    },
    {
      id: "stub-wo-2",
      unit_id: "stub-unit-1",
      category: "HVAC",
      priority: "MEDIUM",
      status: "OPEN",
      description: "Replace HVAC filter — Building A",
      assignee_id: null,
      tenant_user_id: null,
      created_at: "2026-03-07T08:00:00Z",
      updated_at: "2026-03-07T08:00:00Z",
    },
    {
      id: "stub-wo-3",
      unit_id: "stub-unit-1",
      category: "General",
      priority: "LOW",
      status: "RESOLVED",
      description: "Paint touch-up — Unit 1A",
      assignee_id: null,
      tenant_user_id: null,
      created_at: "2026-03-01T12:00:00Z",
      updated_at: "2026-03-04T16:00:00Z",
    },
  ];
}

export function getStubPMPayments(): PMPaymentRow[] {
  return [
    { id: "stub-pay-1", lease_id: "stub-lease-1", amount: 145000, currency: "usd", method: "ACH", status: "SUCCEEDED", created_at: "2026-03-01T00:00:00Z" },
    { id: "stub-pay-2", lease_id: "stub-lease-2", amount: 120000, currency: "usd", method: "Card", status: "SUCCEEDED", created_at: "2026-03-01T00:00:00Z" },
  ];
}

export function getStubPMTasks(): PMTaskItem[] {
  return [
    {
      id: "stub-task-1",
      type: "lease_renewal",
      title: "Review lease renewal — Unit 4B",
      severity: "warning",
      link: "/app/leases",
      due_date: "2026-03-12",
      created_at: "2026-03-06T00:00:00Z",
    },
    {
      id: "stub-task-2",
      type: "vendor_invoice",
      title: "Approve vendor invoice — ABC Plumbing",
      severity: "info",
      link: "/app/payments",
      created_at: "2026-03-08T00:00:00Z",
    },
    {
      id: "stub-task-3",
      type: "tenant_complaint",
      title: "Follow up on tenant complaint — Unit 2A",
      severity: "danger",
      link: "/app/maintenance",
      due_date: "2026-03-07",
      created_at: "2026-03-04T00:00:00Z",
    },
  ];
}

/**
 * Returns a complete stub PMDashboardData payload.
 * Every domain is sourced as "stub".
 */
export function getStubPMDashboardData(): PMDashboardData {
  const noDomainErrors: PMDomainErrors = {
    properties: null,
    units: null,
    leases: null,
    tenants: null,
    maintenance: null,
    payments: null,
    documents: null,
    tasks: null,
  };

  return {
    kpis: getStubPMKpis(),
    properties: getStubPMProperties(),
    units: getStubPMUnits(),
    leases: getStubPMLeases(),
    tenants: getStubPMTenants(),
    maintenanceRequests: getStubPMWorkOrders(),
    recentPayments: getStubPMPayments(),
    tasks: getStubPMTasks(),
    setupStage: "active",
    domainErrors: noDomainErrors,
  };
}
