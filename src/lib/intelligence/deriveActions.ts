/**
 * Intelligence derivation — pure functions.
 *
 * Derives PriorityAction[] and Insight[] from existing dashboard payloads.
 * No new API calls needed — all data comes from already-fetched dashboard state.
 */

import type { PriorityAction } from "@/components/ui/PriorityActions";
import type { Insight } from "@/components/ui/RecommendedActions";
import type {
  OwnerDashboardData,
  DashboardAlert,
} from "@/services/dashboard/types";
import type { TenantDashboardData } from "@/services/tenant/types";

/* ─── Helpers ─── */

function fmtCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/* ═══════════════════════════════════════════
   Owner — Priority Actions
   ═══════════════════════════════════════════ */

export function deriveOwnerPriorityActions(data: OwnerDashboardData): PriorityAction[] {
  const actions: PriorityAction[] = [];
  const kpis = data.kpis;

  // Overdue payments
  if (kpis.overdueAmount.value > 0 && kpis.overdueAmount.source !== "unavailable") {
    actions.push({
      id: "owner-overdue",
      title: "Review overdue payments",
      description: `${fmtCents(kpis.overdueAmount.value)} outstanding across your portfolio.`,
      severity: "danger",
      ctaLabel: "View Payments",
      ctaHref: "/app/payments",
    });
  }

  // Lease expiring alerts
  const leaseAlert = data.alerts.find((a: DashboardAlert) => a.type === "LEASE_EXPIRING");
  if (leaseAlert) {
    actions.push({
      id: "owner-lease-expiring",
      title: `Start renewal for ${leaseAlert.count} expiring lease${leaseAlert.count > 1 ? "s" : ""}`,
      description: leaseAlert.message,
      severity: "warning",
      ctaLabel: "View Leases",
      ctaHref: "/app/leases",
    });
  }

  // Maintenance aging
  const maintAlert = data.alerts.find((a: DashboardAlert) => a.type === "MAINTENANCE_AGING");
  if (maintAlert) {
    actions.push({
      id: "owner-maint-aging",
      title: `Respond to ${maintAlert.count} maintenance request${maintAlert.count > 1 ? "s" : ""}`,
      description: maintAlert.message,
      severity: "warning",
      ctaLabel: "Review Requests",
      ctaHref: "/app/maintenance",
    });
  } else if (kpis.openMaintenanceRequests.value > 0 && kpis.openMaintenanceRequests.source !== "unavailable") {
    actions.push({
      id: "owner-open-maint",
      title: `Respond to ${kpis.openMaintenanceRequests.value} open maintenance request${kpis.openMaintenanceRequests.value > 1 ? "s" : ""}`,
      description: "Assign or resolve open work orders to keep your properties in top shape.",
      severity: "info",
      ctaLabel: "Review Requests",
      ctaHref: "/app/maintenance",
    });
  }

  // Vacant units
  if (kpis.vacancyRate.value > 0 && kpis.vacancyRate.source !== "unavailable") {
    const vacantCount = kpis.totalUnits.value - kpis.occupiedUnits.value;
    if (vacantCount > 0) {
      actions.push({
        id: "owner-vacancy",
        title: `${vacantCount} vacant unit${vacantCount > 1 ? "s" : ""} need attention`,
        description: "Vacant units may be missing lease or setup details.",
        severity: "info",
        ctaLabel: "View Units",
        ctaHref: "/app/units",
      });
    }
  }

  // Setup incomplete
  const setupAlert = data.alerts.find((a: DashboardAlert) => a.type === "SETUP_INCOMPLETE");
  if (setupAlert) {
    actions.push({
      id: "owner-setup",
      title: "Portfolio setup is incomplete",
      description: setupAlert.message,
      severity: "info",
      ctaLabel: "Complete Setup",
      ctaHref: setupAlert.link,
    });
  }

  // Document gap — no documents uploaded
  if (data.documentCount === 0 && data.setupStage === "active") {
    actions.push({
      id: "owner-no-docs",
      title: "Upload your first document",
      description: "Keep leases, insurance, and inspection reports organized in one place.",
      severity: "info",
      ctaLabel: "Upload Documents",
      ctaHref: "/app/documents",
    });
  }

  // Vacant units missing rent config (from vacancyReadiness)
  if (data.vacancyReadiness.missingRentConfig.value > 0 && data.vacancyReadiness.missingRentConfig.source !== "unavailable") {
    const count = data.vacancyReadiness.missingRentConfig.value;
    actions.push({
      id: "owner-missing-rent",
      title: `${count} vacant unit${count > 1 ? "s" : ""} missing rent configuration`,
      description: "Set a rent amount on vacant units so they can be listed.",
      severity: "warning",
      ctaLabel: "Configure Units",
      ctaHref: "/app/units",
    });
  }

  return actions;
}

/* ═══════════════════════════════════════════
   Owner — Insights / Recommended Actions
   ═══════════════════════════════════════════ */

export function deriveOwnerInsights(data: OwnerDashboardData): Insight[] {
  const insights: Insight[] = [];
  const kpis = data.kpis;

  if (kpis.overdueAmount.value > 0 && kpis.overdueAmount.source !== "unavailable") {
    insights.push({
      id: "oi-overdue",
      message: "Send rent reminders to tenants with outstanding balances",
      explanation: `${fmtCents(kpis.overdueAmount.value)} is past due.`,
      severity: "danger",
      ctaLabel: "View Payments",
      ctaHref: "/app/payments",
    });
  }

  const leaseAlert = data.alerts.find((a) => a.type === "LEASE_EXPIRING");
  if (leaseAlert) {
    insights.push({
      id: "oi-lease-renew",
      message: "Start lease renewal conversations before expiration",
      explanation: `${leaseAlert.count} lease${leaseAlert.count > 1 ? "s expire" : " expires"} soon.`,
      severity: "warning",
      ctaLabel: "View Leases",
      ctaHref: "/app/leases",
    });
  }

  const vacantCount = kpis.totalUnits.value - kpis.occupiedUnits.value;
  if (vacantCount > 0 && kpis.totalUnits.source !== "unavailable") {
    insights.push({
      id: "oi-vacancy-setup",
      message: "Complete setup on vacant units to attract tenants",
      explanation: `${vacantCount} unit${vacantCount > 1 ? "s are" : " is"} currently vacant.`,
      severity: "info",
      ctaLabel: "View Units",
      ctaHref: "/app/units",
    });
  }

  if (kpis.openMaintenanceRequests.value > 3 && kpis.openMaintenanceRequests.source !== "unavailable") {
    insights.push({
      id: "oi-maint-review",
      message: "Review property condition — maintenance volume is elevated",
      explanation: `${kpis.openMaintenanceRequests.value} open requests across your portfolio.`,
      severity: "warning",
      ctaLabel: "View Maintenance",
      ctaHref: "/app/maintenance",
    });
  }

  return insights;
}

/* ═══════════════════════════════════════════
   Tenant Dashboard — Insights (tenant-facing)
   ═══════════════════════════════════════════ */

export function deriveTenantInsights(data: TenantDashboardData): Insight[] {
  const insights: Insight[] = [];

  // Lease ending soon
  if (data.lease && data.lease.status === "ACTIVE") {
    const days = daysUntil(data.lease.end_date);
    if (days <= 60 && days >= 0) {
      insights.push({
        id: "ti-lease-expiring",
        message: `Your lease expires in ${days} day${days !== 1 ? "s" : ""}`,
        explanation: "Contact your property manager about renewal options.",
        severity: days <= 14 ? "warning" : "info",
        ctaLabel: "View Lease",
        ctaHref: "/app/leases",
      });
    }
  }

  // Open maintenance
  if (data.openMaintenanceCount > 0) {
    insights.push({
      id: "ti-open-maint",
      message: `You have ${data.openMaintenanceCount} open maintenance request${data.openMaintenanceCount > 1 ? "s" : ""}`,
      explanation: "Check the status of your submitted requests.",
      severity: "info",
      ctaLabel: "View Requests",
      ctaHref: "/app/maintenance",
    });
  }

  // No documents uploaded
  if (data.documents.length === 0 && data.lease) {
    insights.push({
      id: "ti-no-docs",
      message: "No documents uploaded to your account",
      explanation: "Upload your signed lease and other important documents.",
      severity: "info",
      ctaLabel: "View Documents",
      ctaHref: "/app/documents",
    });
  }

  return insights;
}
