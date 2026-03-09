/**
 * PM Dashboard — Service Layer
 *
 * Prefers a single GET /api/pm/dashboard call as the canonical data source.
 * If the backend endpoint is unavailable, falls back to stub data with
 * explicit `source: "stub"` provenance on every KPI.
 *
 * GUARDRAILS:
 * - All API calls go through assertPMPath() — only /api/pm/* is allowed.
 * - No fan-out to multiple PM endpoints; the aggregate payload drives every
 *   widget on the dashboard.
 * - Frontend never passes property_id, lease_id, tenant_id as auth hints.
 * - Stub fallback is clearly labeled; never presented as live data.
 */

import { apiRequest } from "@/lib/api/client";
import { assertPMPath } from "./permissions";
import { getStubPMDashboardData } from "./stubs/pmDashboardStubs";
import type {
  PMDashboardData,
  PMDashboardKpis,
  PMSetupStage,
  PMDomainErrors,
  PMPropertyRow,
  PMUnitRow,
  PMLeaseRow,
  PMTenantRow,
  PMWorkOrderRow,
  PMPaymentRow,
  PMTaskItem,
  Sourced,
} from "./types";

/* ─── Types for the /api/pm/dashboard response ─── */

/**
 * Expected response shape from GET /api/pm/dashboard.
 *
 * This is the contract the backend must implement.
 * See docs/pm-backend-contract.md for full specification.
 */
export interface PMDashboardApiResponse {
  kpis: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    vacancyRate: number;
    monthlyScheduledRent: number;
    collectedThisMonth: number;
    overdueAmount: number;
    openMaintenanceRequests: number;
  };
  properties: PMPropertyRow[];
  units: PMUnitRow[];
  leases: PMLeaseRow[];
  tenants: PMTenantRow[];
  maintenanceRequests: PMWorkOrderRow[];
  recentPayments: PMPaymentRow[];
  tasks: PMTaskItem[];
}

/* ─── Fetch result type ─── */

export type PMDashboardFetchResult =
  | { status: "live"; data: PMDashboardData }
  | { status: "stub"; data: PMDashboardData; reason: string }
  | { status: "error"; error: string };

/* ─── Helpers ─── */

function liveSourced<T>(value: T): Sourced<T> {
  return { value, source: "live" };
}

/** Safely call apiRequest with PM path assertion. Exported for testing. */
export async function pmApiRequest<T>(path: string): Promise<T> {
  assertPMPath(path);
  return apiRequest<T>({ path });
}

/* ─── Setup stage computation (exported for testing) ─── */

export function computePMSetupStage(
  properties: PMPropertyRow[],
  units: PMUnitRow[],
  leases: PMLeaseRow[],
): PMSetupStage {
  if (properties.length === 0) return "no-assignments";
  if (units.length === 0) return "no-units";
  const hasActiveLease = leases.some((l) => l.status === "ACTIVE");
  if (!hasActiveLease) return "no-leases";
  return "active";
}

/* ─── Transform API response → PMDashboardData ─── */

function apiResponseToData(res: PMDashboardApiResponse): PMDashboardData {
  const kpis: PMDashboardKpis = {
    totalProperties: liveSourced(res.kpis.totalProperties),
    totalUnits: liveSourced(res.kpis.totalUnits),
    occupiedUnits: liveSourced(res.kpis.occupiedUnits),
    vacancyRate: liveSourced(res.kpis.vacancyRate),
    monthlyScheduledRent: liveSourced(res.kpis.monthlyScheduledRent),
    collectedThisMonth: liveSourced(res.kpis.collectedThisMonth),
    overdueAmount: liveSourced(res.kpis.overdueAmount),
    openMaintenanceRequests: liveSourced(res.kpis.openMaintenanceRequests),
  };

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

  const setupStage = computePMSetupStage(
    res.properties,
    res.units,
    res.leases,
  );

  return {
    kpis,
    properties: res.properties,
    units: res.units,
    leases: res.leases,
    tenants: res.tenants,
    maintenanceRequests: res.maintenanceRequests,
    recentPayments: res.recentPayments,
    tasks: res.tasks,
    setupStage,
    domainErrors: noDomainErrors,
  };
}

/* ─── Validate response shape ─── */

function isValidDashboardResponse(res: unknown): res is PMDashboardApiResponse {
  if (!res || typeof res !== "object") return false;
  const r = res as Record<string, unknown>;
  if (!r.kpis || typeof r.kpis !== "object") return false;
  if (!Array.isArray(r.properties)) return false;
  return true;
}

/* ─── Main orchestrator ─── */

/**
 * Fetch the PM dashboard.
 *
 * 1. Try GET /api/pm/dashboard (single canonical call).
 * 2. If unavailable or invalid, fall back to stub data with provenance.
 * 3. Never fans out to multiple PM endpoints for the dashboard.
 */
export async function fetchPMDashboard(): Promise<PMDashboardFetchResult> {
  try {
    const res = await pmApiRequest<unknown>("api/pm/dashboard");

    if (!isValidDashboardResponse(res)) {
      return {
        status: "stub",
        data: getStubPMDashboardData(),
        reason: "Backend returned an invalid response shape for /api/pm/dashboard.",
      };
    }

    return {
      status: "live",
      data: apiResponseToData(res),
    };
  } catch (e: any) {
    // Distinguish "not implemented yet" (404/502) from auth errors (401/403)
    const message = e?.message || "Unknown error";
    const isAuthError =
      message.includes("Unauthorized") || message.includes("Forbidden");

    if (isAuthError) {
      // Auth errors should bubble up — don't mask with stubs
      return { status: "error", error: message };
    }

    // Backend unavailable — use stubs with clear provenance
    return {
      status: "stub",
      data: getStubPMDashboardData(),
      reason:
        `GET /api/pm/dashboard is not available yet. ` +
        `Showing placeholder data. (${message})`,
    };
  }
}
