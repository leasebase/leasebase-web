/**
 * Tenant Dashboard — Service Layer Orchestrator
 *
 * Security-first approach (all endpoints tenant-scoped, Phase 2):
 *   1. GET /api/tenants/me → tenant profile (the anchor). If this fails,
 *      the ENTIRE dashboard shows "context unavailable" — no guessing.
 *   2. GET /api/tenants/me/leases → all leases for the tenant (multi-lease).
 *      Dashboard picks the first active lease for the selected org context.
 *   3. GET /api/payments/mine → tenant's payments (LIVE, server-side filtered).
 *   4. GET /api/maintenance/mine → tenant's work orders (LIVE, server-side filtered).
 *   5. GET /api/notifications → tenant's notifications (LIVE, already user-scoped).
 *   6. GET /api/documents/mine → tenant's documents (LIVE, server-side filtered).
 *
 * MUST NOT call: GET /api/leases, GET /api/payments, GET /api/maintenance,
 *                GET /api/documents.
 */

import { fetchTenantProfile } from "./adapters/profileAdapter";
import { fetchTenantLeases } from "./adapters/leaseAdapter";
import { fetchTenantPayments } from "./adapters/paymentAdapter";
import { fetchTenantMaintenance } from "./adapters/maintenanceAdapter";
import { fetchTenantNotifications } from "./adapters/notificationAdapter";
import { fetchTenantDocuments } from "./adapters/documentAdapter";
import { authStore } from "@/lib/auth/store";
import type {
  TenantDashboardData,
  TenantSetupStage,
  TenantDomainErrors,
  TenantProfileRow,
  LeaseRow,
  DataSource,
} from "./types";

/** Active lease statuses in priority order. */
const ACTIVE_STATUSES: LeaseRow["status"][] = ["ACTIVE", "EXTENDED"];

/**
 * Pick the best lease for the current org context from the /me/leases list.
 * Prefers ACTIVE/EXTENDED, then falls back to any lease in the org.
 */
function pickLeaseForOrg(leases: LeaseRow[], orgId: string | undefined): LeaseRow | null {
  const orgLeases = orgId ? leases.filter((l) => l.organization_id === orgId) : leases;
  // Prefer an active lease
  const active = orgLeases.find((l) => ACTIVE_STATUSES.includes(l.status));
  if (active) return active;
  // Fall back to the first lease in this org (any status)
  return orgLeases[0] ?? null;
}

/* ── Setup stage computation (exported for testing) ── */

export function computeTenantSetupStage(
  profile: TenantProfileRow | null,
  profileSource: DataSource,
  lease: LeaseRow | null,
  leaseSource: DataSource
): TenantSetupStage {
  // If the profile endpoint is unavailable, we cannot determine context
  if (profileSource === "unavailable" || !profile) return "no-profile";
  // Lease fetch failed or no lease found for this org
  if (leaseSource === "unavailable" || !lease) return "no-lease";
  if (lease.status === "INACTIVE" || lease.status === "EXPIRED" || lease.status === "RENEWED") return "lease-ended";
  if (lease.status === "ACTIVE" || lease.status === "EXTENDED") return "active";
  // DRAFT / ASSIGNED / INVITED / ACKNOWLEDGED — treat as no-lease (not yet started)
  return "no-lease";
}

/* ── Main orchestrator ── */

export async function fetchTenantDashboard(): Promise<TenantDashboardData> {
  // Step 1: Fetch tenant profile via /tenants/me (the anchor)
  const profileResult = await fetchTenantProfile();
  const profile = profileResult.data;

  // Step 2: Fetch all leases via /tenants/me/leases (multi-lease)
  const leasesResult = await fetchTenantLeases();
  const selectedOrgId = authStore.getState().selectedOrgId || authStore.getState().user?.orgId;
  const lease = pickLeaseForOrg(leasesResult.data, selectedOrgId);
  const leaseSource = leasesResult.source;

  const setupStage = computeTenantSetupStage(
    profile,
    profileResult.source,
    lease,
    leaseSource
  );

  // Step 3: Fetch remaining domains in parallel (all LIVE in Phase 2)
  const [paymentsResult, maintenanceResult, notificationsResult, documentsResult] =
    await Promise.all([
      fetchTenantPayments(),
      fetchTenantMaintenance(),
      fetchTenantNotifications(),
      fetchTenantDocuments(),
    ]);

  // Payment stats: recent 3, filter out stale PENDING (> 24h old)
  const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const activePayments = paymentsResult.data.filter(
    (p) =>
      p.status !== "PENDING" ||
      nowMs - new Date(p.created_at).getTime() < STALE_THRESHOLD_MS,
  );
  const recentPayments = activePayments.slice(0, 3);

  // Maintenance stats
  const activeStatuses = ["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS"];
  const openMaintenanceCount = maintenanceResult.data.filter(
    (w) => activeStatuses.includes(w.status),
  ).length;

  // Notification stats
  const unreadNotificationCount = notificationsResult.data.filter(
    (n) => !n.read_at,
  ).length;

  const domainErrors: TenantDomainErrors = {
    profile: profileResult.error,
    lease: leasesResult.error,
    payments: paymentsResult.error,
    maintenance: maintenanceResult.error,
    documents: documentsResult.error,
    notifications: notificationsResult.error,
  };

  return {
    profile,
    lease,
    payments: activePayments,
    recentPayments,
    maintenanceRequests: maintenanceResult.data,
    openMaintenanceCount,
    documents: documentsResult.data,
    notifications: notificationsResult.data,
    unreadNotificationCount,
    setupStage,
    domainErrors,
    sources: {
      profile: profileResult.source,
      lease: leaseSource,
      payments: paymentsResult.source,
      maintenance: maintenanceResult.source,
      documents: documentsResult.source,
      notifications: notificationsResult.source,
    },
  };
}
