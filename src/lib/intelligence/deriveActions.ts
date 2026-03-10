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
import type {
  PMDashboardData,
  PMLeaseRow,
  PMUnitRow,
  PMWorkOrderRow,
  PMPropertyRow,
} from "@/services/pm/types";
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
      title: "Overdue tenant balances need follow-up",
      description: `${fmtCents(kpis.overdueAmount.value)} in overdue rent across your portfolio.`,
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
      title: `${leaseAlert.count} lease${leaseAlert.count > 1 ? "s" : ""} expiring soon`,
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
      title: `${maintAlert.count} maintenance request${maintAlert.count > 1 ? "s" : ""} waiting`,
      description: maintAlert.message,
      severity: "warning",
      ctaLabel: "Review Requests",
      ctaHref: "/app/maintenance",
    });
  } else if (kpis.openMaintenanceRequests.value > 0 && kpis.openMaintenanceRequests.source !== "unavailable") {
    actions.push({
      id: "owner-open-maint",
      title: `${kpis.openMaintenanceRequests.value} open maintenance request${kpis.openMaintenanceRequests.value > 1 ? "s" : ""}`,
      description: "Review and assign open work orders to keep your properties in top shape.",
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
      message: "Send payment reminders to tenants with overdue balances",
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
   PM — Priority Actions
   ═══════════════════════════════════════════ */

export function derivePMPriorityActions(data: PMDashboardData): PriorityAction[] {
  const actions: PriorityAction[] = [];
  const kpis = data.kpis;

  // Overdue payments
  if (kpis.overdueAmount.value > 0 && kpis.overdueAmount.source !== "unavailable") {
    actions.push({
      id: "pm-overdue",
      title: "Overdue payments need follow-up",
      description: `${fmtCents(kpis.overdueAmount.value)} in overdue rent across managed properties.`,
      severity: "danger",
      ctaLabel: "View Payments",
      ctaHref: "/app/payments",
    });
  }

  // Leases expiring within 30 days
  const expiringLeases = data.leases.filter(
    (l: PMLeaseRow) => l.status === "ACTIVE" && daysUntil(l.end_date) <= 30 && daysUntil(l.end_date) >= 0,
  );
  if (expiringLeases.length > 0) {
    actions.push({
      id: "pm-lease-expiring",
      title: `${expiringLeases.length} lease${expiringLeases.length > 1 ? "s" : ""} expiring within 30 days`,
      description: "Begin renewal conversations to avoid vacancy gaps.",
      severity: "warning",
      ctaLabel: "View Leases",
      ctaHref: "/app/leases",
    });
  }

  // Open/in-progress maintenance
  const openMaint = data.maintenanceRequests.filter(
    (w: PMWorkOrderRow) => w.status === "OPEN" || w.status === "IN_PROGRESS",
  );
  if (openMaint.length > 0) {
    const unassigned = openMaint.filter((w) => !w.assignee_id);
    actions.push({
      id: "pm-open-maint",
      title: `${openMaint.length} maintenance request${openMaint.length > 1 ? "s" : ""} need action`,
      description: unassigned.length > 0
        ? `${unassigned.length} unassigned. Review and assign to vendors.`
        : "All assigned — monitor progress.",
      severity: unassigned.length > 0 ? "warning" : "info",
      ctaLabel: "Review Requests",
      ctaHref: "/app/maintenance",
    });
  }

  // Vacant units missing leases
  const activeLeaseUnitIds = new Set(
    data.leases.filter((l: PMLeaseRow) => l.status === "ACTIVE").map((l) => l.unit_id),
  );
  const vacantUnits = data.units.filter((u: PMUnitRow) => !activeLeaseUnitIds.has(u.id));
  if (vacantUnits.length > 0) {
    const missingRent = vacantUnits.filter((u) => u.rent_amount === 0);
    actions.push({
      id: "pm-vacant-units",
      title: `${vacantUnits.length} vacant unit${vacantUnits.length > 1 ? "s" : ""} missing active leases`,
      description: missingRent.length > 0
        ? `${missingRent.length} also missing rent configuration.`
        : "Create leases or mark as available for listing.",
      severity: "info",
      ctaLabel: "View Units",
      ctaHref: "/app/units",
    });
  }

  // Missing tenants
  if (data.tenants.length === 0 && data.units.length > 0) {
    actions.push({
      id: "pm-no-tenants",
      title: "No tenants have been invited yet",
      description: "Invite tenants to activate their portals and enable rent collection.",
      severity: "info",
      ctaLabel: "View Tenants",
      ctaHref: "/app/tenants",
    });
  }

  return actions;
}

/* ═══════════════════════════════════════════
   PM — Insights / Recommended Actions
   ═══════════════════════════════════════════ */

export function derivePMInsights(data: PMDashboardData): Insight[] {
  const insights: Insight[] = [];
  const kpis = data.kpis;

  // Overdue
  if (kpis.overdueAmount.value > 0 && kpis.overdueAmount.source !== "unavailable") {
    insights.push({
      id: "pi-overdue",
      message: "Send payment reminders to tenants with overdue balances",
      explanation: `${fmtCents(kpis.overdueAmount.value)} is past due.`,
      severity: "danger",
      ctaLabel: "View Payments",
      ctaHref: "/app/payments",
    });
  }

  // Lease renewals
  const expiringLeases = data.leases.filter(
    (l) => l.status === "ACTIVE" && daysUntil(l.end_date) <= 30 && daysUntil(l.end_date) >= 0,
  );
  if (expiringLeases.length > 0) {
    insights.push({
      id: "pi-renew",
      message: "Start lease renewals before units go vacant",
      explanation: `${expiringLeases.length} lease${expiringLeases.length > 1 ? "s" : ""} ending within 30 days.`,
      severity: "warning",
      ctaLabel: "View Leases",
      ctaHref: "/app/leases",
    });
  }

  // Missing tenants
  if (data.tenants.length === 0 && data.units.length > 0) {
    insights.push({
      id: "pi-invite",
      message: "Invite tenants to activate their portal access",
      explanation: "No tenants are currently linked. Invite them to enable self-service.",
      severity: "info",
      ctaLabel: "Add Tenants",
      ctaHref: "/app/tenants",
    });
  }

  // Repeated maintenance on same unit
  const unitMaintCount = new Map<string, number>();
  for (const w of data.maintenanceRequests) {
    unitMaintCount.set(w.unit_id, (unitMaintCount.get(w.unit_id) || 0) + 1);
  }
  const hotUnits = Array.from(unitMaintCount.entries()).filter(([, c]) => c >= 3);
  if (hotUnits.length > 0) {
    insights.push({
      id: "pi-hot-unit",
      message: "Some units have repeated maintenance activity",
      explanation: `${hotUnits.length} unit${hotUnits.length > 1 ? "s have" : " has"} 3+ requests — consider a property inspection.`,
      severity: "warning",
      ctaLabel: "View Maintenance",
      ctaHref: "/app/maintenance",
    });
  }

  // Vacant units with 0 rent
  const activeUnitIds = new Set(
    data.leases.filter((l) => l.status === "ACTIVE").map((l) => l.unit_id),
  );
  const vacantNoRent = data.units.filter((u) => !activeUnitIds.has(u.id) && u.rent_amount === 0);
  if (vacantNoRent.length > 0) {
    insights.push({
      id: "pi-vacant-setup",
      message: "Complete setup on vacant units missing rent configuration",
      explanation: `${vacantNoRent.length} unit${vacantNoRent.length > 1 ? "s" : ""} need a rent amount before listing.`,
      severity: "info",
      ctaLabel: "View Units",
      ctaHref: "/app/units",
    });
  }

  return insights;
}

/* ═══════════════════════════════════════════
   Property Detail — Insights
   ═══════════════════════════════════════════ */

export function derivePropertyInsights(
  property: PMPropertyRow,
  units: PMUnitRow[],
): Insight[] {
  const insights: Insight[] = [];

  if (units.length === 0) {
    insights.push({
      id: "prop-no-units",
      message: "Add units to this property to start managing tenants",
      severity: "info",
      ctaLabel: "Add Units",
      ctaHref: "/app/units",
    });
    return insights;
  }

  const vacantUnits = units.filter((u) => u.status !== "OCCUPIED");
  if (vacantUnits.length > 0) {
    insights.push({
      id: "prop-vacant",
      message: `${vacantUnits.length} unit${vacantUnits.length > 1 ? "s are" : " is"} currently vacant`,
      explanation: "Create leases or list units to fill vacancies.",
      severity: "warning",
      ctaLabel: "View Units",
      ctaHref: "/app/units",
    });
  }

  const noRent = units.filter((u) => u.rent_amount === 0);
  if (noRent.length > 0) {
    insights.push({
      id: "prop-no-rent",
      message: `${noRent.length} unit${noRent.length > 1 ? "s are" : " is"} missing rent configuration`,
      explanation: "Set a rent amount to enable invoicing and payment tracking.",
      severity: "info",
      ctaLabel: "View Units",
      ctaHref: "/app/units",
    });
  }

  return insights;
}

/* ═══════════════════════════════════════════
   Tenant Detail — Insights (PM-facing)
   ═══════════════════════════════════════════ */

export interface TenantDetailContext {
  name: string;
  lease_status: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
}

export function deriveTenantDetailInsights(tenant: TenantDetailContext): Insight[] {
  const insights: Insight[] = [];

  // Lease ending soon
  if (tenant.lease_status === "ACTIVE") {
    const days = daysUntil(tenant.end_date);
    if (days <= 30 && days >= 0) {
      insights.push({
        id: "td-lease-expiring",
        message: `Lease expires in ${days} day${days !== 1 ? "s" : ""} — start renewal`,
        explanation: `Current lease ends ${new Date(tenant.end_date).toLocaleDateString()}.`,
        severity: days <= 7 ? "danger" : "warning",
        ctaLabel: "View Leases",
        ctaHref: "/app/leases",
      });
    }
  }

  // Lease not active
  if (tenant.lease_status !== "ACTIVE") {
    insights.push({
      id: "td-no-active-lease",
      message: `Tenant lease is ${tenant.lease_status.toLowerCase()} — create or renew`,
      severity: "warning",
      ctaLabel: "View Leases",
      ctaHref: "/app/leases",
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
