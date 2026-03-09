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
} from "./types";
import { getStubActivityFeed, getStubSetupAlerts } from "./stubs/ownerDashboardStubs";

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
  rent_amount: number;
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
  amount: number;
  status: string;
  created_at: string;
}

interface LedgerRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  due_date: string;
}

interface WorkOrderRow {
  id: string;
  status: string;
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

  // Open maintenance
  const openCount = workOrders.filter(
    (w) => w.status === "OPEN" || w.status === "IN_PROGRESS"
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
        (w.status === "OPEN" || w.status === "IN_PROGRESS") &&
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

export async function fetchOwnerDashboard(): Promise<OwnerDashboardData> {
  // Fetch all domains in parallel (except units which depend on property IDs)
  const [propertiesResult, leasesResult, paymentsResult, ledgerResult, maintenanceResult] =
    await Promise.all([
      fetchPropertiesDomain(),
      fetchLeasesDomain(),
      fetchPaymentsDomain(),
      fetchLedgerDomain(),
      fetchMaintenanceDomain(),
    ]);

  // Fan-out: fetch units for all properties (concurrency-capped)
  const propertyIds = propertiesResult.data.map((p) => p.id);
  const unitsResult = await fetchUnitsDomain(propertyIds);

  // Compute
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
    trendAvailable: false, // TODO: Enable when backend provides time-series data
  };

  const propertySummaries = buildPropertySummaries(propertiesResult, unitsResult, leasesResult);
  const setupStage = computeSetupStage(kpis);
  const recentActivity = getStubActivityFeed();

  const domainErrors: DomainErrors = {
    properties: propertiesResult.error,
    units: unitsResult.error,
    leases: leasesResult.error,
    payments: paymentsResult.error,
    ledger: ledgerResult.error,
    maintenance: maintenanceResult.error,
    activity: null, // stub — no real fetch
  };

  return {
    kpis,
    alerts,
    recentActivity,
    portfolioHealth,
    properties: propertySummaries,
    setupStage,
    domainErrors,
  };
}
