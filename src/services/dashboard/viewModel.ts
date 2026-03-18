/**
 * Owner Dashboard — View-Model Mapper
 *
 * Pure function that transforms the raw OwnerDashboardData (from the service layer)
 * into per-widget view-model slices ready for rendering. All formatting, provenance
 * labeling, and CTA prioritisation happens here — components stay dumb.
 */

import type {
  OwnerDashboardData,
  OwnerDashboardViewModel,
  KpiGridViewModel,
  KpiItem,
  AlertsViewModel,
  ActivityFeedViewModel,
  PortfolioHealthViewModel,
  QuickActionsViewModel,
  QuickAction,
  PropertiesSummaryViewModel,
  CashFlowViewModel,
  CashFlowBreakdownVM,
  MaintenanceOverviewViewModel,
  LeaseRiskViewModel,
  LeaseExpirationVM,
  VacancyReadinessViewModel,
  PropertyHealthViewModel,
  PageHeaderViewModel,
  Sourced,
  SetupStage,
} from "./types";

/* ── Formatting helpers ── */

function fmtCurrency(cents: number): string {
  const abs = Math.abs(cents);
  if (abs >= 100_000) {
    return `$${(cents / 100_000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtKpiValue(kpi: Sourced<number>, formatter: (v: number) => string): string {
  if (kpi.source === "unavailable") return "—";
  return formatter(kpi.value);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

/* ── Page Header ── */

function buildHeader(data: OwnerDashboardData): PageHeaderViewModel {
  const overdue = data.kpis.overdueAmount.value;
  const openMaint = data.kpis.openMaintenanceRequests.value;

  const alerts: string[] = [];
  if (overdue > 0) alerts.push(`${fmtCurrency(overdue)} outstanding`);
  if (openMaint > 0) alerts.push(`${openMaint} maintenance ${openMaint === 1 ? "request" : "requests"}`);

  const subtitle = alerts.length > 0
    ? `Needs attention: ${alerts.join(", ")}.`
    : "Everything is on track.";

  return {
    title: "Dashboard",
    subtitle,
  };
}

/* ── KPI grid (exactly 4 cards per spec) ── */

function buildKpiGrid(data: OwnerDashboardData): KpiGridViewModel {
  const { kpis } = data;

  const items: KpiItem[] = [
    {
      key: "collectedThisMonth",
      label: "Monthly Cash Flow",
      value: fmtKpiValue(kpis.collectedThisMonth, fmtCurrency),
      rawValue: kpis.collectedThisMonth.value,
      change: kpis.monthlyScheduledRent.value > 0
        ? `${fmtCurrency(kpis.collectedThisMonth.value)} of ${fmtCurrency(kpis.monthlyScheduledRent.value)} expected`
        : undefined,
      source: kpis.collectedThisMonth.source,
      icon: "payments",
      href: "/app/payments",
    },
    {
      key: "overdueAmount",
      label: "Outstanding Payments",
      value: fmtKpiValue(kpis.overdueAmount, fmtCurrency),
      rawValue: kpis.overdueAmount.value,
      source: kpis.overdueAmount.source,
      icon: "payments",
      href: "/app/payments",
    },
    {
      key: "occupancy",
      label: "Occupancy",
      value: kpis.totalUnits.source === "unavailable"
        ? "—"
        : kpis.totalUnits.value > 0
          ? fmtPercent(100 - kpis.vacancyRate.value)
          : "—",
      rawValue: kpis.totalUnits.value > 0 ? 100 - kpis.vacancyRate.value : 0,
      change: kpis.totalUnits.source !== "unavailable"
        ? `${kpis.occupiedUnits.value} of ${kpis.totalUnits.value} units`
        : undefined,
      source: kpis.vacancyRate.source,
      icon: "units",
      href: "/app/units",
    },
    {
      key: "openMaintenanceRequests",
      label: "Maintenance Requests",
      value: fmtKpiValue(kpis.openMaintenanceRequests, fmtNumber),
      rawValue: kpis.openMaintenanceRequests.value,
      source: kpis.openMaintenanceRequests.source,
      icon: "maintenance",
      href: "/app/maintenance",
    },
  ];

  return { items };
}

/* ── Alerts ── */

function buildAlerts(data: OwnerDashboardData): AlertsViewModel {
  const order: Record<string, number> = { danger: 0, warning: 1, info: 2 };
  const sorted = [...data.alerts].sort(
    (a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9)
  );
  return { alerts: sorted, hasAlerts: sorted.length > 0 };
}

/* ── Activity Feed (live from payments/maintenance/leases) ── */

function buildActivityFeed(data: OwnerDashboardData): ActivityFeedViewModel {
  return {
    events: data.recentActivity,
    isStub: data.recentActivity.length === 0,
  };
}

/* ── Portfolio Health ── */

function buildPortfolioHealth(data: OwnerDashboardData): PortfolioHealthViewModel {
  return { ...data.portfolioHealth };
}

/* ── Cash Flow ── */

function buildCashFlowVM(data: OwnerDashboardData): CashFlowViewModel {
  const cf = data.cashFlow;
  const billed = cf.billedThisMonth.value;
  const collected = cf.collectedThisMonth.value;
  const collectionPct = billed > 0 ? Math.round((collected / billed) * 100) : 0;

  const perProperty: CashFlowBreakdownVM[] = cf.perProperty.map((p) => ({
    propertyId: p.propertyId,
    propertyName: p.propertyName,
    billed: fmtCurrency(p.billed),
    collected: fmtCurrency(p.collected),
    overdue: fmtCurrency(p.overdue),
  }));

  return {
    billedThisMonth: fmtCurrency(billed),
    collectedThisMonth: fmtCurrency(collected),
    overdueAmount: fmtCurrency(cf.overdueAmount.value),
    upcomingDue: fmtCurrency(cf.upcomingDue.value),
    collectionPercent: collectionPct,
    perProperty,
    source: cf.billedThisMonth.source,
  };
}

/* ── Maintenance Overview ── */

function buildMaintenanceOverviewVM(data: OwnerDashboardData): MaintenanceOverviewViewModel {
  const m = data.maintenanceOverview;
  return {
    open: m.open.value,
    inProgress: m.inProgress.value,
    waiting: m.waiting.value,
    urgent: m.urgent.value,
    oldestOpenAgeDays: m.oldestOpenAgeDays.value,
    mostAffectedProperty: m.mostAffectedProperty.value,
    source: m.open.source,
  };
}

/* ── Lease Risk ── */

function buildLeaseRiskVM(data: OwnerDashboardData): LeaseRiskViewModel {
  const lr = data.leaseRisk;
  const topExpirations: LeaseExpirationVM[] = lr.topExpirations.map((e) => ({
    leaseId: e.leaseId,
    unitId: e.unitId,
    endDate: fmtDate(e.endDate),
    daysLeft: e.daysLeft,
    rentAmount: fmtCurrency(e.rentAmount),
  }));

  return {
    expiring30: lr.expiring30.value,
    expiring60: lr.expiring60.value,
    monthToMonth: lr.monthToMonth.value,
    topExpirations,
    source: lr.expiring30.source,
  };
}

/* ── Vacancy / Readiness ── */

function buildVacancyReadinessVM(data: OwnerDashboardData): VacancyReadinessViewModel {
  const vr = data.vacancyReadiness;
  return {
    vacantUnits: vr.vacantUnits.value,
    readyToLease: vr.readyToLease.value,
    missingRentConfig: vr.missingRentConfig.value,
    missingSetup: vr.missingSetup.value,
    source: vr.vacantUnits.source,
  };
}

/* ── Property Health Table ── */

function buildPropertyHealthVM(data: OwnerDashboardData): PropertyHealthViewModel {
  return {
    rows: data.propertyHealth,
    hasData: data.propertyHealth.length > 0,
  };
}

/* ── Quick Actions ── */

const QUICK_ACTIONS_BY_STAGE: Record<SetupStage, QuickAction[]> = {
  "no-properties": [
    { label: "Add your first property", href: "/app/properties", icon: "properties", priority: "primary" },
  ],
  "no-units": [
    { label: "Add units", href: "/app/units", icon: "units", priority: "primary" },
    { label: "View properties", href: "/app/properties", icon: "properties", priority: "secondary" },
  ],
  "no-leases": [
    { label: "Create a lease", href: "/app/leases/new", icon: "leases", priority: "primary" },
    { label: "Invite tenants", href: "/app/tenants", icon: "tenants", priority: "secondary" },
  ],
  "no-payments": [
    { label: "Record a payment", href: "/app/payments", icon: "payments", priority: "primary" },
    { label: "View leases", href: "/app/leases", icon: "leases", priority: "secondary" },
  ],
  active: [
    { label: "Add property", href: "/app/properties", icon: "properties", priority: "secondary" },
    { label: "Create lease", href: "/app/leases/new", icon: "leases", priority: "secondary" },
    { label: "Record payment", href: "/app/payments", icon: "payments", priority: "secondary" },
    { label: "New maintenance", href: "/app/maintenance/new", icon: "maintenance", priority: "secondary" },
  ],
};

function buildQuickActions(data: OwnerDashboardData): QuickActionsViewModel {
  return { actions: QUICK_ACTIONS_BY_STAGE[data.setupStage] ?? QUICK_ACTIONS_BY_STAGE.active };
}

/* ── Properties Summary ── */

function buildPropertiesSummary(data: OwnerDashboardData): PropertiesSummaryViewModel {
  return {
    properties: data.properties,
    hasProperties: data.properties.length > 0,
  };
}

/* ── Public mapper ── */

export function toOwnerDashboardViewModel(
  data: OwnerDashboardData
): OwnerDashboardViewModel {
  return {
    header: buildHeader(data),
    kpis: buildKpiGrid(data),
    alerts: buildAlerts(data),
    activityFeed: buildActivityFeed(data),
    portfolioHealth: buildPortfolioHealth(data),
    cashFlow: buildCashFlowVM(data),
    maintenanceOverview: buildMaintenanceOverviewVM(data),
    leaseRisk: buildLeaseRiskVM(data),
    vacancyReadiness: buildVacancyReadinessVM(data),
    propertyHealthTable: buildPropertyHealthVM(data),
    quickActions: buildQuickActions(data),
    propertiesSummary: buildPropertiesSummary(data),
    setupStage: data.setupStage,
    domainErrors: data.domainErrors,
  };
}
