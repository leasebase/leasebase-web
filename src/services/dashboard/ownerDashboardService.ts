/**
 * Owner Dashboard — Service Layer
 *
 * Orchestrates data fetching from multiple microservices via the BFF proxy,
 * computes derived dashboard values, and tracks provenance per-value.
 *
 * Key design decisions:
 * - **Per-domain failure isolation**: Each fetcher returns DomainResult<T>.
 *   A failure in payments-service does not affect properties or maintenance.
 * - **Full pagination traversal**: If a list endpoint returns partial data
 *   (meta.total > fetched count), we page through ALL remaining pages.
 *   If any page fails mid-traversal the entire domain is marked "unavailable"
 *   rather than presenting a silent undercount.
 * - **Concurrency-capped fan-out**: Unit fetches (one per property) are
 *   capped at UNIT_FANOUT_CONCURRENCY (6) parallel requests.
 * - **BFF threshold**: When property count exceeds BFF_THRESHOLD (50),
 *   frontend orchestration should be replaced by a BFF aggregation endpoint.
 *   The threshold is logged as a warning in the console.
 */

import { apiRequest } from "@/lib/api/client";
import {
  fetchMaintenanceStats as fetchStatsApi,
  type MaintenanceStats,
} from "@/services/maintenance/maintenanceApiService";
import type {
  OwnerDashboardData,
  DashboardKpis,
  DashboardAlert,
  PortfolioHealth,
  PropertySummary,
  DomainResult,
  DomainErrors,
  SetupStage,
  Sourced,
  DataSource,
  CashFlowData,
  CashFlowPropertyBreakdown,
  MaintenanceOverviewData,
  LeaseRiskData,
  LeaseExpirationItem,
  VacancyReadinessData,
  PropertyHealthRow,
  ActivityEvent,
  DocumentRow,
} from "./types";
import { getStubSetupAlerts } from "./stubs/ownerDashboardStubs";

/* ─── Constants ─── */

/** Max concurrent property→unit fan-out requests. */
export const UNIT_FANOUT_CONCURRENCY = 6;

/**
 * When the portfolio has more properties than this, log a warning
 * recommending migration to a BFF aggregation endpoint.
 */
export const BFF_THRESHOLD = 50;

/* ─── API response shapes ─── */

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface PropertyRow {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

interface UnitRow {
  id: string;
  property_id: string;
  status: string;
}

interface LeaseRow {
  id: string;
  unit_id: string;
  status: string;
  rent_amount: number;
  start_date: string;
  end_date: string;
}

interface PaymentRow {
  id: string;
  lease_id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface LedgerRow {
  id: string;
  lease_id: string;
  type: string;
  amount: number;
  status: string;
  due_date: string;
}

interface WorkOrderRow {
  id: string;
  unit_id: string;
  status: string;
  priority: string;
  description: string;
  assignee_id: string | null;
  created_at: string;
}

/* ─── Pagination helper ─── */

/**
 * Fetch ALL pages from a paginated endpoint.
 * Returns the complete array, or throws if any page fails.
 * This guarantees: either the KPI is correct (all pages fetched)
 * or the domain is marked unavailable. Never a silent undercount.
 */
async function fetchAllPages<T>(basePath: string): Promise<T[]> {
  const sep = basePath.includes("?") ? "&" : "?";
  const first = await apiRequest<PaginatedResponse<T>>({
    path: `${basePath}${sep}limit=100&page=1`,
  });

  const all: T[] = [...first.data];
  const { total, limit } = first.meta;
  const totalPages = Math.ceil(total / limit);

  for (let page = 2; page <= totalPages; page++) {
    const res = await apiRequest<PaginatedResponse<T>>({
      path: `${basePath}${sep}limit=100&page=${page}`,
    });
    all.push(...res.data);
  }

  return all;
}

/* ─── Domain fetchers (per-domain isolation) ─── */

async function fetchPropertiesDomain(): Promise<DomainResult<PropertyRow[]>> {
  try {
    const data = await fetchAllPages<PropertyRow>("api/properties");
    return { data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch properties" };
  }
}

async function fetchUnitsForProperty(propertyId: string): Promise<UnitRow[]> {
  return fetchAllPages<UnitRow>(`api/properties/${propertyId}/units`);
}

/**
 * Fan-out: fetch units for all properties with concurrency cap.
 * If ANY single property's unit fetch fails, the entire domain is marked
 * unavailable — we refuse to present partial unit totals as accurate.
 */
async function fetchUnitsDomain(
  propertyIds: string[]
): Promise<DomainResult<UnitRow[]>> {
  if (propertyIds.length === 0) {
    return { data: [], source: "live", error: null };
  }

  if (propertyIds.length > BFF_THRESHOLD) {
    console.warn(
      `[OwnerDashboard] Portfolio has ${propertyIds.length} properties (>${BFF_THRESHOLD}). ` +
        `Consider migrating to a BFF aggregation endpoint (GET /api/dashboard/owner or ` +
        `GET /api/properties/summary) to avoid ${propertyIds.length} fan-out HTTP calls.`
    );
  }

  const allUnits: UnitRow[] = [];
  let hadError = false;

  for (let i = 0; i < propertyIds.length; i += UNIT_FANOUT_CONCURRENCY) {
    const batch = propertyIds.slice(i, i + UNIT_FANOUT_CONCURRENCY);
    const results = await Promise.allSettled(batch.map(fetchUnitsForProperty));

    for (const r of results) {
      if (r.status === "fulfilled") {
        allUnits.push(...r.value);
      } else {
        hadError = true;
      }
    }
  }

  if (hadError) {
    return {
      data: [],
      source: "unavailable",
      error: "Some property unit data could not be fetched. Totals would be inaccurate.",
    };
  }

  return { data: allUnits, source: "live", error: null };
}

async function fetchLeasesDomain(): Promise<DomainResult<LeaseRow[]>> {
  try {
    const data = await fetchAllPages<LeaseRow>("api/leases");
    return { data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch leases" };
  }
}

async function fetchPaymentsDomain(): Promise<DomainResult<PaymentRow[]>> {
  try {
    const data = await fetchAllPages<PaymentRow>("api/payments");
    return { data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch payments" };
  }
}

async function fetchLedgerDomain(): Promise<DomainResult<LedgerRow[]>> {
  try {
    const data = await fetchAllPages<LedgerRow>("api/payments/ledger");
    return { data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch ledger" };
  }
}

async function fetchMaintenanceDomain(): Promise<DomainResult<WorkOrderRow[]>> {
  try {
    const data = await fetchAllPages<WorkOrderRow>("api/maintenance");
    return { data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch maintenance" };
  }
}

const EMPTY_STATS: MaintenanceStats = { submitted: 0, in_review: 0, scheduled: 0, in_progress: 0, completed: 0, closed: 0, cancelled: 0 };

async function fetchMaintenanceStatsDomain(): Promise<DomainResult<MaintenanceStats>> {
  try {
    const res = await fetchStatsApi();
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: EMPTY_STATS, source: "unavailable", error: e?.message || "Failed to fetch stats" };
  }
}

async function fetchDocumentsDomain(): Promise<DomainResult<DocumentRow[]>> {
  try {
    const data = await fetchAllPages<DocumentRow>("api/documents");
    return { data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch documents" };
  }
}

/* ─── Sourced helper ─── */

function sourced<T>(value: T, source: DataSource): Sourced<T> {
  return { value, source };
}

/* ─── Computation helpers (exported for testing) ─── */

export function computeKpis(
  propertiesResult: DomainResult<PropertyRow[]>,
  unitsResult: DomainResult<UnitRow[]>,
  leasesResult: DomainResult<LeaseRow[]>,
  paymentsResult: DomainResult<PaymentRow[]>,
  ledgerResult: DomainResult<LedgerRow[]>,
  maintenanceResult: DomainResult<WorkOrderRow[]>
): DashboardKpis {
  const propSrc = propertiesResult.source;
  const unitSrc = unitsResult.source;
  const leaseSrc = leasesResult.source;
  const paySrc = paymentsResult.source;
  const ledgSrc = ledgerResult.source;
  const maintSrc = maintenanceResult.source;

  const properties = propertiesResult.data;
  const units = unitsResult.data;
  const leases = leasesResult.data;
  const payments = paymentsResult.data;
  const ledger = ledgerResult.data;
  const workOrders = maintenanceResult.data;

  const totalProperties = sourced(properties.length, propSrc);
  const totalUnits = sourced(units.length, unitSrc);

  // Occupied — requires both units AND leases to be live
  const occupiedSrc: DataSource =
    unitSrc === "live" && leaseSrc === "live"
      ? "live"
      : unitSrc === "unavailable" || leaseSrc === "unavailable"
        ? "unavailable"
        : "stub";
  const activeLeaseUnitIds = new Set(
    leases.filter((l) => l.status === "ACTIVE").map((l) => l.unit_id)
  );
  const occupiedCount = units.filter((u) => activeLeaseUnitIds.has(u.id)).length;
  const occupiedUnits = sourced(occupiedCount, occupiedSrc);

  const vacancyVal =
    units.length > 0
      ? Math.round(((units.length - occupiedCount) / units.length) * 10000) / 100
      : 0;
  const vacancyRate = sourced(vacancyVal, occupiedSrc);

  const monthlyRent = leases
    .filter((l) => l.status === "ACTIVE")
    .reduce((sum, l) => sum + (l.rent_amount || 0), 0);
  const monthlyScheduledRent = sourced(monthlyRent, leaseSrc);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const collected = payments
    .filter((p) => p.status === "SUCCEEDED" && p.created_at >= monthStart)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const collectedThisMonth = sourced(collected, paySrc);

  // Overdue = CHARGE ledger entries past due, still PENDING
  const today = new Date().toISOString().split("T")[0];
  const overdue = ledger
    .filter((e) => e.type === "CHARGE" && e.status === "PENDING" && e.due_date < today)
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const overdueAmount = sourced(overdue, ledgSrc);

  // Active maintenance (not closed/completed/cancelled)
  const activeStatuses = ["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS"];
  const openCount = workOrders.filter(
    (w) => activeStatuses.includes(w.status)
  ).length;
  const openMaintenanceRequests = sourced(openCount, maintSrc);

  return {
    totalProperties,
    totalUnits,
    occupiedUnits,
    vacancyRate,
    monthlyScheduledRent,
    collectedThisMonth,
    overdueAmount,
    openMaintenanceRequests,
  };
}

export function computeAlerts(
  leasesResult: DomainResult<LeaseRow[]>,
  ledgerResult: DomainResult<LedgerRow[]>,
  maintenanceResult: DomainResult<WorkOrderRow[]>,
  kpis: DashboardKpis
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Late rent — only if ledger data is live
  if (ledgerResult.source === "live") {
    const lateCount = ledgerResult.data.filter(
      (e) => e.type === "CHARGE" && e.status === "PENDING" && e.due_date < todayStr
    ).length;
    if (lateCount > 0) {
      alerts.push({
        type: "LATE_RENT",
        severity: "danger",
        count: lateCount,
        message: `${lateCount} rent payment${lateCount > 1 ? "s" : ""} overdue`,
        link: "/app/payments",
      });
    }
  }

  // Leases expiring — only if lease data is live
  if (leasesResult.source === "live") {
    const sixtyDaysOut = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const expiringCount = leasesResult.data.filter(
      (l) =>
        l.status === "ACTIVE" && l.end_date >= todayStr && l.end_date <= sixtyDaysOut
    ).length;
    if (expiringCount > 0) {
      alerts.push({
        type: "LEASE_EXPIRING",
        severity: "warning",
        count: expiringCount,
        message: `${expiringCount} lease${expiringCount > 1 ? "s" : ""} expiring within 60 days`,
        link: "/app/leases",
      });
    }
  }

  // Maintenance aging — only if maintenance data is live
  if (maintenanceResult.source === "live") {
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const agingCount = maintenanceResult.data.filter(
      (w) =>
        (["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS"] as string[]).includes(w.status) &&
        w.created_at < sevenDaysAgo
    ).length;
    if (agingCount > 0) {
      alerts.push({
        type: "MAINTENANCE_AGING",
        severity: "warning",
        count: agingCount,
        message: `${agingCount} maintenance request${agingCount > 1 ? "s" : ""} open for 7+ days`,
        link: "/app/maintenance",
      });
    }
  }

  // Setup alerts — derive tenant presence from leases (OWNER can't call /api/tenants)
  const hasAnyTenants =
    leasesResult.source === "live"
      ? leasesResult.data.some((l) => l.status === "ACTIVE")
      : null;
  const setupAlerts = getStubSetupAlerts({
    totalProperties: kpis.totalProperties.value,
    totalUnits: kpis.totalUnits.value,
    hasAnyTenants,
  });
  alerts.push(...setupAlerts);

  return alerts;
}

export function buildPropertySummaries(
  propertiesResult: DomainResult<PropertyRow[]>,
  unitsResult: DomainResult<UnitRow[]>,
  leasesResult: DomainResult<LeaseRow[]>
): PropertySummary[] {
  if (propertiesResult.source === "unavailable") return [];

  const units = unitsResult.data;
  const leases = leasesResult.data;
  const activeLeaseUnitIds = new Set(
    leases.filter((l) => l.status === "ACTIVE").map((l) => l.unit_id)
  );

  return propertiesResult.data.map((p) => {
    const propertyUnits = units.filter((u) => u.property_id === p.id);
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

/* ── Cash Flow computation ── */

export function computeCashFlow(
  propertiesResult: DomainResult<PropertyRow[]>,
  unitsResult: DomainResult<UnitRow[]>,
  leasesResult: DomainResult<LeaseRow[]>,
  paymentsResult: DomainResult<PaymentRow[]>,
  ledgerResult: DomainResult<LedgerRow[]>,
): CashFlowData {
  const ledgSrc = ledgerResult.source;
  const paySrc = paymentsResult.source;
  const combinedSrc: DataSource =
    ledgSrc === "live" && paySrc === "live" ? "live" : "unavailable";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  const today = now.toISOString().split("T")[0];
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0];

  // Billed this month: CHARGE ledger entries with due_date in current month
  const billed = ledgerResult.data
    .filter((e) => e.type === "CHARGE" && e.due_date >= monthStart.split("T")[0] && e.due_date <= monthEnd.split("T")[0])
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Collected this month
  const collected = paymentsResult.data
    .filter((p) => p.status === "SUCCEEDED" && p.created_at >= monthStart)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Overdue
  const overdue = ledgerResult.data
    .filter((e) => e.type === "CHARGE" && e.status === "PENDING" && e.due_date < today)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Upcoming due (next 30 days)
  const upcoming = ledgerResult.data
    .filter((e) => e.type === "CHARGE" && e.status === "PENDING" && e.due_date >= today && e.due_date <= thirtyDaysOut)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Per-property breakdown
  // Build unit_id -> property_id map, then lease_id -> property_id via leases
  const unitToProperty = new Map<string, string>();
  for (const u of unitsResult.data) {
    unitToProperty.set(u.id, u.property_id);
  }
  const leaseToProperty = new Map<string, string>();
  for (const l of leasesResult.data) {
    const pid = unitToProperty.get(l.unit_id);
    if (pid) leaseToProperty.set(l.id, pid);
  }
  const propertyNames = new Map<string, string>();
  for (const p of propertiesResult.data) {
    propertyNames.set(p.id, p.name);
  }

  const propBreakdown = new Map<string, { billed: number; collected: number; overdue: number }>();
  for (const e of ledgerResult.data) {
    if (e.type !== "CHARGE") continue;
    const pid = leaseToProperty.get(e.lease_id ?? "");
    if (!pid) continue;
    if (!propBreakdown.has(pid)) propBreakdown.set(pid, { billed: 0, collected: 0, overdue: 0 });
    const entry = propBreakdown.get(pid)!;
    if (e.due_date >= monthStart.split("T")[0] && e.due_date <= monthEnd.split("T")[0]) {
      entry.billed += e.amount;
    }
    if (e.status === "PENDING" && e.due_date < today) {
      entry.overdue += e.amount;
    }
  }
  // Add collected from payments
  for (const p of paymentsResult.data) {
    if (p.status !== "SUCCEEDED" || p.created_at < monthStart) continue;
    const pid = leaseToProperty.get(p.lease_id ?? "");
    if (!pid || !propBreakdown.has(pid)) continue;
    propBreakdown.get(pid)!.collected += p.amount;
  }

  const perProperty: CashFlowPropertyBreakdown[] = Array.from(propBreakdown.entries()).map(
    ([pid, vals]) => ({
      propertyId: pid,
      propertyName: propertyNames.get(pid) ?? "Unknown",
      ...vals,
    })
  );

  return {
    billedThisMonth: sourced(billed, combinedSrc),
    collectedThisMonth: sourced(collected, paySrc),
    overdueAmount: sourced(overdue, ledgSrc),
    upcomingDue: sourced(upcoming, ledgSrc),
    perProperty,
  };
}

/* ── Maintenance Overview computation ── */

export function computeMaintenanceOverview(
  maintenanceResult: DomainResult<WorkOrderRow[]>,
  unitsResult: DomainResult<UnitRow[]>,
  propertiesResult: DomainResult<PropertyRow[]>,
  statsResult?: DomainResult<MaintenanceStats>,
): MaintenanceOverviewData {
  const workOrders = maintenanceResult.data;
  const now = Date.now();

  // Prefer server-aggregated counts from /stats when available;
  // fall back to client-side counting from the full list.
  const useStats = statsResult?.source === "live";
  const src = useStats ? "live" : maintenanceResult.source;

  const activeStatuses = ["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS"];
  const open = useStats
    ? (statsResult!.data.submitted || 0)
    : workOrders.filter((w) => w.status === "SUBMITTED").length;
  const inProgress = useStats
    ? (statsResult!.data.in_progress || 0)
    : workOrders.filter((w) => w.status === "IN_PROGRESS").length;
  const waiting = workOrders.filter(
    (w) => w.status === "SUBMITTED" && !w.assignee_id &&
      (now - new Date(w.created_at).getTime()) > 3 * 86400000
  ).length;
  const urgent = workOrders.filter((w) =>
    activeStatuses.includes(w.status) && w.priority === "HIGH"
  ).length;

  // Oldest open request
  const openOrders = workOrders.filter((w) => activeStatuses.includes(w.status));
  let oldestDays = 0;
  for (const w of openOrders) {
    const age = Math.floor((now - new Date(w.created_at).getTime()) / 86400000);
    if (age > oldestDays) oldestDays = age;
  }

  // Most affected property
  const unitToProperty = new Map<string, string>();
  for (const u of unitsResult.data) unitToProperty.set(u.id, u.property_id);
  const propCount = new Map<string, number>();
  for (const w of openOrders) {
    const pid = unitToProperty.get(w.unit_id);
    if (pid) propCount.set(pid, (propCount.get(pid) || 0) + 1);
  }
  let mostAffected: { id: string; name: string; count: number } | null = null;
  for (const [pid, count] of propCount) {
    if (!mostAffected || count > mostAffected.count) {
      const pName = propertiesResult.data.find((p) => p.id === pid)?.name ?? "Unknown";
      mostAffected = { id: pid, name: pName, count };
    }
  }

  return {
    open: sourced(open, src),
    inProgress: sourced(inProgress, src),
    waiting: sourced(waiting, src),
    urgent: sourced(urgent, src),
    oldestOpenAgeDays: sourced(oldestDays, src),
    mostAffectedProperty: sourced(mostAffected, src),
  };
}

/* ── Lease Risk computation ── */

export function computeLeaseRisk(
  leasesResult: DomainResult<LeaseRow[]>,
): LeaseRiskData {
  const src = leasesResult.source;
  const leases = leasesResult.data;
  const now = Date.now();
  const today = new Date().toISOString().split("T")[0];
  const thirtyOut = new Date(now + 30 * 86400000).toISOString().split("T")[0];
  const sixtyOut = new Date(now + 60 * 86400000).toISOString().split("T")[0];

  const active = leases.filter((l) => l.status === "ACTIVE");

  const exp30 = active.filter((l) => l.end_date >= today && l.end_date <= thirtyOut).length;
  const exp60 = active.filter((l) => l.end_date >= today && l.end_date <= sixtyOut).length;

  // Month-to-month: leases past end_date but still ACTIVE
  const m2m = active.filter((l) => l.end_date < today).length;

  // Top upcoming expirations (sorted by end_date, first 5)
  const upcoming = active
    .filter((l) => l.end_date >= today)
    .sort((a, b) => a.end_date.localeCompare(b.end_date))
    .slice(0, 5)
    .map((l): LeaseExpirationItem => ({
      leaseId: l.id,
      unitId: l.unit_id,
      endDate: l.end_date,
      daysLeft: Math.ceil((new Date(l.end_date).getTime() - now) / 86400000),
      rentAmount: l.rent_amount,
    }));

  return {
    expiring30: sourced(exp30, src),
    expiring60: sourced(exp60, src),
    monthToMonth: sourced(m2m, src),
    topExpirations: upcoming,
  };
}

/* ── Vacancy / Readiness computation ── */

export function computeVacancyReadiness(
  unitsResult: DomainResult<UnitRow[]>,
  leasesResult: DomainResult<LeaseRow[]>,
): VacancyReadinessData {
  const src: DataSource =
    unitsResult.source === "live" && leasesResult.source === "live" ? "live" : "unavailable";

  const activeLeaseUnitIds = new Set(
    leasesResult.data.filter((l) => l.status === "ACTIVE").map((l) => l.unit_id)
  );
  const vacant = unitsResult.data.filter((u) => !activeLeaseUnitIds.has(u.id));
  // Rent now lives on the lease, not the unit. All vacant units are considered
  // ready to lease — rent is set when creating the lease.
  const readyToLease = vacant.length;

  return {
    vacantUnits: sourced(vacant.length, src),
    readyToLease: sourced(readyToLease, src),
    missingRentConfig: sourced(0, src),  // deprecated — rent is on the lease now
    missingSetup: sourced(0, src),
  };
}

/* ── Property Health rows ── */

export function buildPropertyHealthRows(
  propertiesResult: DomainResult<PropertyRow[]>,
  unitsResult: DomainResult<UnitRow[]>,
  leasesResult: DomainResult<LeaseRow[]>,
  paymentsResult: DomainResult<PaymentRow[]>,
  ledgerResult: DomainResult<LedgerRow[]>,
  maintenanceResult: DomainResult<WorkOrderRow[]>,
): PropertyHealthRow[] {
  if (propertiesResult.source === "unavailable") return [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const today = now.toISOString().split("T")[0];
  const sixtyOut = new Date(now.getTime() + 60 * 86400000).toISOString().split("T")[0];

  // Build indexes
  const unitToProperty = new Map<string, string>();
  for (const u of unitsResult.data) unitToProperty.set(u.id, u.property_id);
  const leaseToProperty = new Map<string, string>();
  for (const l of leasesResult.data) {
    const pid = unitToProperty.get(l.unit_id);
    if (pid) leaseToProperty.set(l.id, pid);
  }

  return propertiesResult.data.map((p) => {
    const pUnits = unitsResult.data.filter((u) => u.property_id === p.id);
    const pLeases = leasesResult.data.filter((l) => unitToProperty.get(l.unit_id) === p.id);
    const activeLeases = pLeases.filter((l) => l.status === "ACTIVE");
    const activeUnitIds = new Set(activeLeases.map((l) => l.unit_id));
    const occupied = pUnits.filter((u) => activeUnitIds.has(u.id)).length;
    const total = pUnits.length;
    const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

    // Billed (scheduled rent for active leases)
    const billedCents = activeLeases.reduce((s, l) => s + (l.rent_amount || 0), 0);

    // Collected this month
    const collectedCents = paymentsResult.data
      .filter((pay) => pay.status === "SUCCEEDED" && pay.created_at >= monthStart && leaseToProperty.get(pay.lease_id ?? "") === p.id)
      .reduce((s, pay) => s + (pay.amount || 0), 0);

    // Overdue
    const overdueCents = ledgerResult.data
      .filter((e) => e.type === "CHARGE" && e.status === "PENDING" && e.due_date < today && leaseToProperty.get(e.lease_id ?? "") === p.id)
      .reduce((s, e) => s + (e.amount || 0), 0);

    // Open maintenance
    const openMaint = maintenanceResult.data
      .filter((w) => (w.status === "OPEN" || w.status === "IN_PROGRESS") && unitToProperty.get(w.unit_id) === p.id)
      .length;

    // Expiring leases (60 days)
    const expiring = activeLeases.filter((l) => l.end_date >= today && l.end_date <= sixtyOut).length;

    // Status
    let status: PropertyHealthRow["status"] = "healthy";
    if (overdueCents > 0 || openMaint > 3) status = "critical";
    else if (occupancy < 80 || expiring > 0 || openMaint > 0) status = "attention";

    return {
      id: p.id,
      name: p.name,
      totalUnits: total,
      occupancy,
      collectedCents,
      billedCents,
      overdueCents,
      openMaintenance: openMaint,
      expiringLeases: expiring,
      status,
    };
  });
}

/* ── Live Recent Activity (from payments + maintenance + leases) ── */

export function buildRecentActivity(
  paymentsResult: DomainResult<PaymentRow[]>,
  maintenanceResult: DomainResult<WorkOrderRow[]>,
  leasesResult: DomainResult<LeaseRow[]>,
): { events: ActivityEvent[]; isLive: boolean } {
  const events: ActivityEvent[] = [];
  let anyLive = false;

  // Recent payments (last 10 succeeded)
  if (paymentsResult.source === "live") {
    anyLive = true;
    const recent = paymentsResult.data
      .filter((p) => p.status === "SUCCEEDED")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5);
    for (const p of recent) {
      events.push({
        id: `pay-${p.id}`,
        type: "PAYMENT_RECEIVED",
        title: "Payment received",
        description: `$${(p.amount / 100).toFixed(2)}`,
        timestamp: p.created_at,
        link: "/app/payments",
      });
    }
  }

  // Recent maintenance
  if (maintenanceResult.source === "live") {
    anyLive = true;
    const recent = maintenanceResult.data
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5);
    for (const w of recent) {
      const type = w.status === "RESOLVED" || w.status === "CLOSED"
        ? "MAINTENANCE_COMPLETED" as const
        : "MAINTENANCE_CREATED" as const;
      events.push({
        id: `maint-${w.id}`,
        type,
        title: type === "MAINTENANCE_COMPLETED" ? "Maintenance completed" : "Maintenance request",
        description: w.description?.slice(0, 60) || "Work order",
        timestamp: w.created_at,
        link: `/app/maintenance/${w.id}`,
      });
    }
  }

  // Recent lease changes
  if (leasesResult.source === "live") {
    anyLive = true;
    const recent = leasesResult.data
      .sort((a, b) => (b.start_date > a.start_date ? 1 : -1))
      .slice(0, 3);
    for (const l of recent) {
      events.push({
        id: `lease-${l.id}`,
        type: l.status === "TERMINATED" ? "LEASE_DEACTIVATED" : "LEASE_RENEWED",
        title: l.status === "TERMINATED" ? "Lease deactivated" : "Lease active",
        description: `Unit ${l.unit_id} — $${(l.rent_amount / 100).toFixed(2)}/mo`,
        timestamp: l.start_date,
        link: "/app/leases",
      });
    }
  }

  // Sort all by timestamp descending, take top 10
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { events: events.slice(0, 10), isLive: anyLive };
}

export function computeSetupStage(kpis: DashboardKpis): SetupStage {
  if (kpis.totalProperties.value === 0) return "no-properties";
  if (kpis.totalUnits.value === 0) return "no-units";
  if (kpis.occupiedUnits.value === 0 && kpis.monthlyScheduledRent.value === 0)
    return "no-leases";
  if (kpis.collectedThisMonth.value === 0 && kpis.monthlyScheduledRent.value > 0)
    return "no-payments";
  return "active";
}

/* ─── Main orchestrator ─── */

/**
 * Fetches and assembles the full Owner dashboard from individual microservice endpoints.
 *
 * ## Network profile
 *   1. **6 parallel domain fetches** (properties, leases, payments, ledger, maintenance, documents)
 *   2. **N sequential-batched unit sub-requests** — one GET /api/properties/:id/units per property,
 *      capped at UNIT_FANOUT_CONCURRENCY (6) concurrent requests.
 *   Total HTTP calls: 6 + ceil(propertyCount / 6) batches.
 *
 * ## Why this is acceptable short-term
 *   - Typical owner portfolios have <20 properties → 6 + 4 batches ≈ 10 round-trips.
 *   - Each domain fetcher uses full pagination traversal — no silent undercounts.
 *   - Per-domain failure isolation ensures partial data is surfaced, not a full error.
 *
 * ## When to migrate to a BFF endpoint
 *   When property count exceeds BFF_THRESHOLD (50), the fan-out becomes expensive.
 *   At that point, a single `GET /api/dashboard/owner` BFF endpoint should replace
 *   this orchestration. See `ownerDashboardAggregationContract.ts` for the
 *   recommended response shape.
 *
 * ## Block → Endpoint → Direct/Derived → Limitation
 *   Page Header          | properties, units, leases                     | Derived  | —
 *   Priority Actions     | all 6 domains                                 | Derived  | tenant count from lease proxy
 *   KPI Row (4 cards)    | payments, ledger, units, leases, maintenance   | Mixed    | occupancy needs units+leases live
 *   Cash Flow            | ledger, payments, leases, units                | Derived  | needs ledger+payments live
 *   Maintenance Overview | maintenance, units, properties                 | Mixed    | "needs review" = heuristic (3d + no assignee)
 *   Lease Risk           | leases                                        | Mixed    | month-to-month = ACTIVE past end_date
 *   Vacancy/Readiness    | units, leases                                 | Derived  | needs units+leases live
 *   Property Health      | all 6 domains                                 | Derived  | status thresholds are frontend heuristics
 *   Recommended Actions  | all (via deriveOwnerInsights)                  | Derived  | —
 *   Recent Activity      | payments, maintenance, leases                  | Derived  | no tenant/document events; max 10 items
 *   Onboarding Checklist | all + documents                                | Derived  | tenant step uses lease proxy
 */
export async function fetchOwnerDashboard(): Promise<OwnerDashboardData> {
  // 7 parallel domain fetches (units depend on property IDs, fetched separately below)
  const [propertiesResult, leasesResult, paymentsResult, ledgerResult, maintenanceResult, documentsResult, maintenanceStatsResult] =
    await Promise.all([
      fetchPropertiesDomain(),
      fetchLeasesDomain(),
      fetchPaymentsDomain(),
      fetchLedgerDomain(),
      fetchMaintenanceDomain(),
      fetchDocumentsDomain(),
      fetchMaintenanceStatsDomain(),
    ]);

  // Fan-out: fetch units for all properties (concurrency-capped)
  const propertyIds = propertiesResult.data.map((p) => p.id);
  const unitsResult = await fetchUnitsDomain(propertyIds);

  // Compute core KPIs and alerts
  const kpis = computeKpis(
    propertiesResult, unitsResult, leasesResult,
    paymentsResult, ledgerResult, maintenanceResult
  );
  const alerts = computeAlerts(leasesResult, ledgerResult, maintenanceResult, kpis);

  const portfolioHealth: PortfolioHealth = {
    occupancyRate: sourced(
      kpis.totalUnits.value > 0
        ? Math.round((kpis.occupiedUnits.value / kpis.totalUnits.value) * 10000) / 100
        : 0,
      kpis.occupiedUnits.source
    ),
    collectionRate: sourced(
      kpis.monthlyScheduledRent.value > 0
        ? Math.round(
            (kpis.collectedThisMonth.value / kpis.monthlyScheduledRent.value) * 10000
          ) / 100
        : 0,
      kpis.collectedThisMonth.source === "live" && kpis.monthlyScheduledRent.source === "live"
        ? "live"
        : "unavailable"
    ),
    openWorkOrders: kpis.openMaintenanceRequests,
    trendAvailable: false,
  };

  // New block computations
  const cashFlow = computeCashFlow(propertiesResult, unitsResult, leasesResult, paymentsResult, ledgerResult);
  const maintenanceOverview = computeMaintenanceOverview(maintenanceResult, unitsResult, propertiesResult, maintenanceStatsResult);
  const leaseRisk = computeLeaseRisk(leasesResult);
  const vacancyReadiness = computeVacancyReadiness(unitsResult, leasesResult);
  const propertyHealth = buildPropertyHealthRows(
    propertiesResult, unitsResult, leasesResult, paymentsResult, ledgerResult, maintenanceResult
  );

  const propertySummaries = buildPropertySummaries(propertiesResult, unitsResult, leasesResult);
  const setupStage = computeSetupStage(kpis);

  // Live activity feed from real data
  const { events: recentActivity } = buildRecentActivity(paymentsResult, maintenanceResult, leasesResult);

  const domainErrors: DomainErrors = {
    properties: propertiesResult.error,
    units: unitsResult.error,
    leases: leasesResult.error,
    payments: paymentsResult.error,
    ledger: ledgerResult.error,
    maintenance: maintenanceResult.error,
    documents: documentsResult.error,
    activity: null,
  };

  return {
    kpis,
    alerts,
    recentActivity,
    portfolioHealth,
    cashFlow,
    maintenanceOverview,
    leaseRisk,
    vacancyReadiness,
    propertyHealth,
    properties: propertySummaries,
    documentCount: documentsResult.data.length,
    setupStage,
    domainErrors,
  };
}
