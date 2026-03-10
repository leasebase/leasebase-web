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

/* ── KPI grid ── */

function buildKpiGrid(data: OwnerDashboardData): KpiGridViewModel {
  const { kpis } = data;

  const items: KpiItem[] = [
    {
      key: "totalProperties",
      label: "Properties",
      value: fmtKpiValue(kpis.totalProperties, fmtNumber),
      rawValue: kpis.totalProperties.value,
      source: kpis.totalProperties.source,
      icon: "properties",
      href: "/app/properties",
    },
    {
      key: "totalUnits",
      label: "Units",
      value: fmtKpiValue(kpis.totalUnits, fmtNumber),
      rawValue: kpis.totalUnits.value,
      source: kpis.totalUnits.source,
      icon: "units",
      href: "/app/units",
    },
    {
      key: "occupiedUnits",
      label: "Occupied",
      value: fmtKpiValue(kpis.occupiedUnits, fmtNumber),
      rawValue: kpis.occupiedUnits.value,
      source: kpis.occupiedUnits.source,
      icon: "tenants",
    },
    {
      key: "vacancyRate",
      label: "Vacancy",
      value: fmtKpiValue(kpis.vacancyRate, fmtPercent),
      rawValue: kpis.vacancyRate.value,
      source: kpis.vacancyRate.source,
      icon: "reports",
    },
    {
      key: "monthlyScheduledRent",
      label: "Scheduled Rent",
      value: fmtKpiValue(kpis.monthlyScheduledRent, fmtCurrency),
      rawValue: kpis.monthlyScheduledRent.value,
      source: kpis.monthlyScheduledRent.source,
      icon: "payments",
      href: "/app/payments",
    },
    {
      key: "collectedThisMonth",
      label: "Collected (MTD)",
      value: fmtKpiValue(kpis.collectedThisMonth, fmtCurrency),
      rawValue: kpis.collectedThisMonth.value,
      source: kpis.collectedThisMonth.source,
      icon: "payments",
      href: "/app/payments",
    },
    {
      key: "overdueAmount",
      label: "Overdue",
      value: fmtKpiValue(kpis.overdueAmount, fmtCurrency),
      rawValue: kpis.overdueAmount.value,
      source: kpis.overdueAmount.source,
      icon: "payments",
      href: "/app/payments",
    },
    {
      key: "openMaintenanceRequests",
      label: "Open Maintenance",
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
  // Sort by severity: danger first, then warning, then info
  const order: Record<string, number> = { danger: 0, warning: 1, info: 2 };
  const sorted = [...data.alerts].sort(
    (a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9)
  );
  return { alerts: sorted, hasAlerts: sorted.length > 0 };
}

/* ── Activity Feed ── */

function buildActivityFeed(data: OwnerDashboardData): ActivityFeedViewModel {
  return {
    events: data.recentActivity,
    isStub: true, // all activity data is currently stub
  };
}

/* ── Portfolio Health ── */

function buildPortfolioHealth(data: OwnerDashboardData): PortfolioHealthViewModel {
  return { ...data.portfolioHealth };
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
    { label: "Create a lease", href: "/app/leases", icon: "leases", priority: "primary" },
    { label: "Invite tenants", href: "/app/tenants", icon: "tenants", priority: "secondary" },
  ],
  "no-payments": [
    { label: "Record a payment", href: "/app/payments", icon: "payments", priority: "primary" },
    { label: "View leases", href: "/app/leases", icon: "leases", priority: "secondary" },
  ],
  active: [
    { label: "Add property", href: "/app/properties", icon: "properties", priority: "secondary" },
    { label: "Create lease", href: "/app/leases", icon: "leases", priority: "secondary" },
    { label: "Record payment", href: "/app/payments", icon: "payments", priority: "secondary" },
    { label: "New maintenance", href: "/app/maintenance", icon: "maintenance", priority: "secondary" },
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
    kpis: buildKpiGrid(data),
    alerts: buildAlerts(data),
    activityFeed: buildActivityFeed(data),
    portfolioHealth: buildPortfolioHealth(data),
    quickActions: buildQuickActions(data),
    propertiesSummary: buildPropertiesSummary(data),
    setupStage: data.setupStage,
    domainErrors: data.domainErrors,
  };
}
