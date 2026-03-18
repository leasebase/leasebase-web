/**
 * Owner Dashboard — Recommended BFF Aggregation Contract
 *
 * This file defines the **recommended response shape** for a future
 * `GET /api/dashboard/owner` BFF endpoint that would replace the current
 * frontend orchestration pattern (see `ownerDashboardService.ts`).
 *
 * ## Why this endpoint is needed
 *   The current dashboard makes 6 parallel API calls + N unit fan-out
 *   sub-requests. This works for <50 properties but becomes expensive
 *   at scale. A single BFF endpoint would:
 *   1. Reduce round-trips to 1
 *   2. Move derived computations (occupancy, cash flow, health status) server-side
 *   3. Allow the backend to use DB queries instead of fetching full entity lists
 *   4. Enable server-side caching with a known TTL
 *
 * ## Migration path
 *   1. Implement this endpoint in the backend API (`services/api`)
 *   2. Replace `fetchOwnerDashboard()` in `ownerDashboardService.ts` with a
 *      single `apiRequest<OwnerDashboardAggregationResponse>(...)` call
 *   3. Map the response to the existing `OwnerDashboardData` type
 *   4. Remove individual domain fetchers (properties, units, leases, etc.)
 *
 * ## What should stay frontend-only
 *   - `deriveActions.ts` (priority actions / insights) — depends on user context
 *   - `checklists.ts` (onboarding steps) — depends on user context + dismissed state
 *   - `viewModel.ts` (formatting, CTA generation) — presentation layer
 *
 * The types below are NOT imported anywhere yet. They exist as a contract
 * specification for the backend team.
 */

/* ── KPIs (pre-computed server-side) ── */

export interface OwnerKpiPayload {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacancyRate: number;             // 0-100
  monthlyScheduledRentCents: number;
  collectedThisMonthCents: number;
  overdueAmountCents: number;
  openMaintenanceRequests: number;
}

/* ── Cash Flow ── */

export interface OwnerCashFlowPayload {
  billedThisMonthCents: number;
  collectedThisMonthCents: number;
  overdueAmountCents: number;
  upcomingDueCents: number;        // next 30 days
  perProperty: {
    propertyId: string;
    propertyName: string;
    billedCents: number;
    collectedCents: number;
    overdueCents: number;
  }[];
}

/* ── Maintenance Overview ── */

export interface OwnerMaintenancePayload {
  open: number;
  inProgress: number;
  /** Open >3 days with no assignee. Backend should expose as a real status or computed field. */
  needsReview: number;
  urgent: number;                  // priority = HIGH
  oldestOpenAgeDays: number;
  mostAffectedProperty: {
    id: string;
    name: string;
    count: number;
  } | null;
}

/* ── Lease Risk ── */

export interface OwnerLeaseRiskPayload {
  expiring30: number;
  expiring60: number;
  /**
   * Backend should add explicit MONTH_TO_MONTH lease status.
   * Until then, this is: ACTIVE leases past end_date.
   */
  monthToMonth: number;
  topExpirations: {
    leaseId: string;
    unitId: string;
    endDate: string;               // ISO 8601
    daysLeft: number;
    rentAmountCents: number;
  }[];
}

/* ── Vacancy / Readiness ── */

export interface OwnerVacancyPayload {
  vacantUnits: number;
  readyToLease: number;            // vacant + rent > 0
  missingRentConfig: number;
  missingSetup: number;
}

/* ── Property Health (per-property row) ── */

export interface OwnerPropertyHealthRow {
  id: string;
  name: string;
  totalUnits: number;
  occupancyPercent: number;        // 0-100
  collectedCents: number;
  billedCents: number;
  overdueCents: number;
  openMaintenance: number;
  expiringLeases60d: number;
  /**
   * Backend-computed status. Recommended thresholds:
   *   "needs_attention": overdue > 0 OR openMaintenance > 3
   *   "review_suggested": occupancy < 80 OR expiringLeases > 0 OR openMaintenance > 0
   *   "on_track": everything else
   */
  status: "on_track" | "review_suggested" | "needs_attention";
}

/* ── Recent Activity ── */

export interface OwnerActivityItem {
  id: string;
  type: "PAYMENT_RECEIVED" | "MAINTENANCE_CREATED" | "MAINTENANCE_COMPLETED"
      | "LEASE_RENEWED" | "LEASE_DEACTIVATED" | "DOCUMENT_UPLOADED" | "TENANT_INVITED";
  title: string;
  description: string;
  timestamp: string;               // ISO 8601
  link?: string;
}

/* ── Alerts ── */

export interface OwnerAlertPayload {
  type: "LATE_RENT" | "LEASE_EXPIRING" | "MAINTENANCE_AGING" | "SETUP_INCOMPLETE";
  severity: "danger" | "warning" | "info";
  count: number;
  message: string;
  link: string;
}

/* ── Portfolio Health (summary) ── */

export interface OwnerPortfolioHealthPayload {
  occupancyRatePercent: number;    // 0-100
  collectionRatePercent: number;   // 0-100
  openWorkOrders: number;
}

/* ══════════════════════════════════════════════
   Top-level response: GET /api/dashboard/owner
   ══════════════════════════════════════════════ */

export interface OwnerDashboardAggregationResponse {
  kpis: OwnerKpiPayload;
  cashFlow: OwnerCashFlowPayload;
  maintenance: OwnerMaintenancePayload;
  leaseRisk: OwnerLeaseRiskPayload;
  vacancy: OwnerVacancyPayload;
  propertyHealth: OwnerPropertyHealthRow[];
  portfolioHealth: OwnerPortfolioHealthPayload;
  alerts: OwnerAlertPayload[];
  recentActivity: OwnerActivityItem[];
  documentCount: number;
  /** "no-properties" | "no-units" | "no-leases" | "no-payments" | "active" */
  setupStage: string;
}
