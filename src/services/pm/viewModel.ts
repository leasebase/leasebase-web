/**
 * PM Dashboard — View Model Layer
 *
 * Transforms PMDashboardData into widget-ready view models.
 * Components consume view models only — no domain logic in components.
 */

import type {
  PMDashboardData,
  PMDashboardViewModel,
  PMKpiGridViewModel,
  PMKpiItem,
  PMTasksListViewModel,
  PMTaskViewModel,
  PMMaintenanceWidgetViewModel,
  PMMaintenanceItem,
  PMPropertySummary,
  PMWorkOrderRow,
  PMLeaseRow,
} from "./types";

/* ─── Currency formatting ─── */

function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCentsLong(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ─── KPI Grid ─── */

export function buildPMKpiGrid(data: PMDashboardData): PMKpiGridViewModel {
  const k = data.kpis;

  const items: PMKpiItem[] = [
    {
      key: "properties",
      label: "Properties",
      value: String(k.totalProperties.value),
      rawValue: k.totalProperties.value,
      source: k.totalProperties.source,
      icon: "building-2",
      href: "/app/properties",
    },
    {
      key: "units",
      label: "Units",
      value: String(k.totalUnits.value),
      rawValue: k.totalUnits.value,
      change: `${k.totalUnits.value - k.occupiedUnits.value} vacant`,
      source: k.totalUnits.source,
      icon: "door-open",
      href: "/app/units",
    },
    {
      key: "occupancy",
      label: "Occupancy",
      value: k.totalUnits.value > 0
        ? `${Math.round(100 - k.vacancyRate.value)}%`
        : "—",
      rawValue: k.totalUnits.value > 0 ? 100 - k.vacancyRate.value : 0,
      source: k.vacancyRate.source,
      icon: "trending-up",
    },
    {
      key: "revenue",
      label: "Revenue (MTD)",
      value: formatCentsLong(k.collectedThisMonth.value),
      rawValue: k.collectedThisMonth.value,
      change: k.collectedThisMonth.value >= k.monthlyScheduledRent.value
        ? "On track"
        : `${formatCents(k.monthlyScheduledRent.value - k.collectedThisMonth.value)} remaining`,
      source: k.collectedThisMonth.source,
      icon: "trending-up",
    },
  ];

  return { items };
}

/* ─── Tasks ─── */

function taskBadgeText(task: { severity: string; due_date?: string }): string {
  if (task.severity === "danger") return "Overdue";
  if (task.due_date) {
    const daysUntil = Math.ceil(
      (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil <= 0) return "Overdue";
    if (daysUntil <= 7) return `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
    return "Upcoming";
  }
  if (task.severity === "info") return "New";
  return "Pending";
}

export function buildPMTasksList(data: PMDashboardData): PMTasksListViewModel {
  const tasks: PMTaskViewModel[] = data.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    severity: t.severity,
    badgeText: taskBadgeText(t),
    link: t.link,
  }));

  return { tasks, hasTasks: tasks.length > 0 };
}

/* ─── Maintenance ─── */

function maintenanceStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "OPEN":
      return "danger";
    case "IN_PROGRESS":
      return "warning";
    case "RESOLVED":
      return "success";
    case "CLOSED":
      return "neutral";
    default:
      return "info";
  }
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function buildPMMaintenanceWidget(
  data: PMDashboardData,
): PMMaintenanceWidgetViewModel {
  const open = data.maintenanceRequests.filter(
    (w) => w.status === "OPEN" || w.status === "IN_PROGRESS",
  );

  // Show most recent 5, sorted by created_at desc
  const sorted = [...data.maintenanceRequests]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  const recentRequests: PMMaintenanceItem[] = sorted.map((w) => ({
    id: w.id,
    title: w.description,
    status: w.status.replace("_", " "),
    statusVariant: maintenanceStatusVariant(w.status),
    priority: w.priority,
    date: formatRelativeDate(w.created_at),
  }));

  // Source: all KPIs share the same source in our model
  const source = data.kpis.openMaintenanceRequests.source;

  return {
    openCount: open.length,
    recentRequests,
    source,
    hasRequests: data.maintenanceRequests.length > 0,
  };
}

/* ─── Property summaries ─── */

export function buildPMPropertySummaries(data: PMDashboardData): PMPropertySummary[] {
  const activeLeaseUnitIds = new Set(
    data.leases.filter((l: PMLeaseRow) => l.status === "ACTIVE").map((l) => l.unit_id),
  );

  return data.properties.map((p) => {
    const propertyUnits = data.units.filter((u) => u.property_id === p.id);
    const total = propertyUnits.length;
    const occupied = propertyUnits.filter((u) => activeLeaseUnitIds.has(u.id)).length;

    return {
      id: p.id,
      name: p.name,
      address: [p.address_line1, p.city, p.state, p.postal_code]
        .filter(Boolean)
        .join(", "),
      totalUnits: total,
      occupiedUnits: occupied,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  });
}

/* ─── Main transformer ─── */

export function toPMDashboardViewModel(data: PMDashboardData): PMDashboardViewModel {
  return {
    kpis: buildPMKpiGrid(data),
    tasks: buildPMTasksList(data),
    maintenance: buildPMMaintenanceWidget(data),
    properties: buildPMPropertySummaries(data),
    setupStage: data.setupStage,
    domainErrors: data.domainErrors,
  };
}
