import {
  computeKpis,
  computeAlerts,
  buildPropertySummaries,
  computeSetupStage,
} from "@/services/dashboard/ownerDashboardService";
import { toOwnerDashboardViewModel } from "@/services/dashboard/viewModel";
import type { DomainResult, OwnerDashboardData } from "@/services/dashboard/types";

/* ── Helpers ── */

function liveResult<T>(data: T): DomainResult<T> {
  return { data, source: "live", error: null };
}

function unavailableResult<T>(data: T): DomainResult<T> {
  return { data, source: "unavailable", error: "Service down" };
}

/* ── Test fixtures ── */

const properties = [
  { id: "p1", name: "Main St", address_line1: "123 Main", city: "NY", state: "NY", postal_code: "10001" },
  { id: "p2", name: "Elm Ave", address_line1: "456 Elm", city: "NY", state: "NY", postal_code: "10002" },
];

const units = [
  { id: "u1", property_id: "p1", status: "ACTIVE", rent_amount: 150000 },
  { id: "u2", property_id: "p1", status: "ACTIVE", rent_amount: 120000 },
  { id: "u3", property_id: "p2", status: "ACTIVE", rent_amount: 100000 },
];

const leases = [
  { id: "l1", unit_id: "u1", status: "ACTIVE", rent_amount: 150000, start_date: "2024-01-01", end_date: "2026-12-31" },
  { id: "l2", unit_id: "u2", status: "ACTIVE", rent_amount: 120000, start_date: "2024-01-01", end_date: "2025-04-01" },
];

const payments = [
  { id: "pay1", lease_id: "l1", amount: 150000, status: "SUCCEEDED", created_at: new Date().toISOString() },
];

const ledger = [
  { id: "led1", lease_id: "l1", type: "CHARGE", amount: 120000, status: "PENDING", due_date: "2024-01-01" },
];

const workOrders = [
  { id: "wo1", unit_id: "u1", status: "SUBMITTED", priority: "MEDIUM", description: "Leaky faucet", assignee_id: null, created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "wo2", unit_id: "u2", status: "COMPLETED", priority: "LOW", description: "Replace bulb", assignee_id: "maint-1", created_at: "2024-06-01T00:00:00.000Z" },
];

/* ── computeKpis ── */

describe("computeKpis", () => {
  test("computes all KPIs from live data", () => {
    const kpis = computeKpis(
      liveResult(properties),
      liveResult(units),
      liveResult(leases),
      liveResult(payments),
      liveResult(ledger),
      liveResult(workOrders),
    );

    expect(kpis.totalProperties.value).toBe(2);
    expect(kpis.totalProperties.source).toBe("live");
    expect(kpis.totalUnits.value).toBe(3);
    expect(kpis.occupiedUnits.value).toBe(2); // u1 and u2 have active leases
    expect(kpis.openMaintenanceRequests.value).toBe(1); // wo1 is SUBMITTED
  });

  test("marks KPIs unavailable when domain fails", () => {
    const kpis = computeKpis(
      liveResult(properties),
      unavailableResult([]),
      liveResult(leases),
      liveResult(payments),
      liveResult(ledger),
      liveResult(workOrders),
    );

    expect(kpis.totalUnits.source).toBe("unavailable");
    expect(kpis.totalUnits.value).toBe(0);
    expect(kpis.occupiedUnits.source).toBe("unavailable");
  });

  test("vacancy is 0 when no units exist", () => {
    const kpis = computeKpis(
      liveResult([]),
      liveResult([]),
      liveResult([]),
      liveResult([]),
      liveResult([]),
      liveResult([]),
    );

    expect(kpis.vacancyRate.value).toBe(0);
  });
});

/* ── computeAlerts ── */

describe("computeAlerts", () => {
  test("emits alerts only for live domains", () => {
    const kpis = computeKpis(
      liveResult(properties),
      liveResult(units),
      liveResult(leases),
      liveResult(payments),
      liveResult(ledger),
      liveResult(workOrders),
    );

    const alerts = computeAlerts(
      liveResult(leases),
      liveResult(ledger),
      liveResult(workOrders),
      kpis,
    );

    // Should have late rent (ledger has past-due charge)
    const lateRent = alerts.find((a) => a.type === "LATE_RENT");
    expect(lateRent).toBeDefined();
    expect(lateRent?.count).toBe(1);

    // Should have aging maintenance (wo1 open >7 days)
    const aging = alerts.find((a) => a.type === "MAINTENANCE_AGING");
    expect(aging).toBeDefined();
  });

  test("skips alerts for unavailable domains", () => {
    const kpis = computeKpis(
      liveResult(properties),
      liveResult(units),
      liveResult(leases),
      liveResult(payments),
      unavailableResult([]),
      unavailableResult([]),
    );

    const alerts = computeAlerts(
      liveResult(leases),
      unavailableResult([]),
      unavailableResult([]),
      kpis,
    );

    // No LATE_RENT or MAINTENANCE_AGING since those domains are unavailable
    expect(alerts.find((a) => a.type === "LATE_RENT")).toBeUndefined();
    expect(alerts.find((a) => a.type === "MAINTENANCE_AGING")).toBeUndefined();
  });
});

/* ── buildPropertySummaries ── */

describe("buildPropertySummaries", () => {
  test("builds summaries with occupancy", () => {
    const summaries = buildPropertySummaries(
      liveResult(properties),
      liveResult(units),
      liveResult(leases),
    );

    expect(summaries).toHaveLength(2);
    expect(summaries[0].name).toBe("Main St");
    expect(summaries[0].totalUnits).toBe(2);
    expect(summaries[0].occupiedUnits).toBe(2);
    expect(summaries[0].occupancyRate).toBe(100);
  });

  test("returns empty when properties are unavailable", () => {
    const summaries = buildPropertySummaries(
      unavailableResult([]),
      liveResult(units),
      liveResult(leases),
    );

    expect(summaries).toEqual([]);
  });
});

/* ── computeSetupStage ── */

describe("computeSetupStage", () => {
  function sourced(value: number, source: "live" | "stub" | "unavailable" = "live") {
    return { value, source };
  }

  test("no-properties when 0 properties", () => {
    const kpis = {
      totalProperties: sourced(0),
      totalUnits: sourced(0),
      occupiedUnits: sourced(0),
      vacancyRate: sourced(0),
      monthlyScheduledRent: sourced(0),
      collectedThisMonth: sourced(0),
      overdueAmount: sourced(0),
      openMaintenanceRequests: sourced(0),
    };
    expect(computeSetupStage(kpis)).toBe("no-properties");
  });

  test("active when all metrics populated", () => {
    const kpis = {
      totalProperties: sourced(2),
      totalUnits: sourced(3),
      occupiedUnits: sourced(2),
      vacancyRate: sourced(33.33),
      monthlyScheduledRent: sourced(270000),
      collectedThisMonth: sourced(150000),
      overdueAmount: sourced(0),
      openMaintenanceRequests: sourced(0),
    };
    expect(computeSetupStage(kpis)).toBe("active");
  });
});

/* ── View-model mapper ── */

describe("toOwnerDashboardViewModel", () => {
  const dashboardData: OwnerDashboardData = {
    kpis: computeKpis(
      liveResult(properties),
      liveResult(units),
      liveResult(leases),
      liveResult(payments),
      liveResult(ledger),
      liveResult(workOrders),
    ),
    alerts: [
      { type: "LATE_RENT", severity: "danger", count: 1, message: "1 rent payment overdue", link: "/app/payments" },
      { type: "SETUP_INCOMPLETE", severity: "info", count: 1, message: "Add more units", link: "/app/units" },
      { type: "LEASE_EXPIRING", severity: "warning", count: 2, message: "2 leases expiring", link: "/app/leases" },
    ],
    recentActivity: [],
    portfolioHealth: {
      occupancyRate: { value: 66.67, source: "live" },
      collectionRate: { value: 55.56, source: "live" },
      openWorkOrders: { value: 1, source: "live" },
      trendAvailable: false,
    },
    cashFlow: {
      billedThisMonth: { value: 0, source: "live" },
      collectedThisMonth: { value: 150000, source: "live" },
      overdueAmount: { value: 120000, source: "live" },
      upcomingDue: { value: 0, source: "live" },
      perProperty: [],
    },
    maintenanceOverview: {
      open: { value: 1, source: "live" },
      inProgress: { value: 0, source: "live" },
      waiting: { value: 0, source: "live" },
      urgent: { value: 0, source: "live" },
      oldestOpenAgeDays: { value: 10, source: "live" },
      mostAffectedProperty: { value: null, source: "live" },
    },
    leaseRisk: {
      expiring30: { value: 0, source: "live" },
      expiring60: { value: 0, source: "live" },
      monthToMonth: { value: 0, source: "live" },
      topExpirations: [],
    },
    vacancyReadiness: {
      vacantUnits: { value: 1, source: "live" },
      readyToLease: { value: 1, source: "live" },
      missingRentConfig: { value: 0, source: "live" },
      missingSetup: { value: 0, source: "live" },
    },
    propertyHealth: [],
    properties: [
      { id: "p1", name: "Main St", address: "123 Main, NY, NY, 10001", totalUnits: 2, occupiedUnits: 2, occupancyRate: 100 },
    ],
    documentCount: 0,
    setupStage: "active",
    domainErrors: {
      properties: null, units: null, leases: null,
      payments: null, ledger: null, maintenance: null, documents: null, activity: null,
    },
  };

  test("produces 4 KPI items", () => {
    const vm = toOwnerDashboardViewModel(dashboardData);
    expect(vm.kpis.items).toHaveLength(4);
  });

  test("sorts alerts by severity (danger → warning → info)", () => {
    const vm = toOwnerDashboardViewModel(dashboardData);
    expect(vm.alerts.alerts[0].severity).toBe("danger");
    expect(vm.alerts.alerts[1].severity).toBe("warning");
    expect(vm.alerts.alerts[2].severity).toBe("info");
  });

  test("formats unavailable KPIs as dash", () => {
    const data: OwnerDashboardData = {
      ...dashboardData,
      kpis: computeKpis(
        liveResult(properties),
        unavailableResult([]),
        liveResult(leases),
        liveResult(payments),
        liveResult(ledger),
        liveResult(workOrders),
      ),
    };
    const vm = toOwnerDashboardViewModel(data);
    // Occupancy depends on units — should show dash when units unavailable
    const occupancyKpi = vm.kpis.items.find((k) => k.key === "occupancy");
    expect(occupancyKpi?.value).toBe("—");
  });

  test("provides setup-stage-aware quick actions", () => {
    const noPropsData: OwnerDashboardData = {
      ...dashboardData,
      setupStage: "no-properties",
    };
    const vm = toOwnerDashboardViewModel(noPropsData);
    expect(vm.quickActions.actions).toHaveLength(1);
    expect(vm.quickActions.actions[0].priority).toBe("primary");
  });
});
