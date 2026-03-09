/**
 * Tenant Dashboard — Service Layer Orchestrator
 *
 * Security-first approach (all endpoints tenant-scoped, Phase 2):
 *   1. GET /api/tenants/me → tenant profile (the anchor). If this fails,
 *      the ENTIRE dashboard shows "context unavailable" — no guessing.
 *   2. GET /api/leases/:id → single lease from profile's lease_id (safe).
 *   3. GET /api/payments/mine → tenant's payments (LIVE, server-side filtered).
 *   4. GET /api/maintenance/mine → tenant's work orders (LIVE, server-side filtered).
 *   5. GET /api/notifications → tenant's notifications (LIVE, already user-scoped).
 *   6. GET /api/documents/mine → tenant's documents (LIVE, server-side filtered).
 *
 * MUST NOT call: GET /api/leases, GET /api/payments, GET /api/maintenance,
 *                GET /api/documents.
 */

import { fetchTenantProfile } from "./adapters/profileAdapter";
import { fetchTenantLease } from "./adapters/leaseAdapter";
import { fetchTenantPayments } from "./adapters/paymentAdapter";
import { fetchTenantMaintenance } from "./adapters/maintenanceAdapter";
import { fetchTenantNotifications } from "./adapters/notificationAdapter";
import { fetchTenantDocuments } from "./adapters/documentAdapter";
import type {
  TenantDashboardData,
  TenantSetupStage,
  TenantDomainErrors,
  TenantProfileRow,
  LeaseRow,
  DataSource,
} from "./types";

/* ── Setup stage computation (exported for testing) ── */

export function computeTenantSetupStage(
  profile: TenantProfileRow | null,
  profileSource: DataSource,
  lease: LeaseRow | null,
  leaseSource: DataSource
): TenantSetupStage {
  // If the profile endpoint is unavailable, we cannot determine context
  if (profileSource === "unavailable" || !profile) return "no-profile";
  // Profile exists but no lease linked
  if (!profile.lease_id) return "no-lease";
  // Lease fetch failed
  if (leaseSource === "unavailable" || !lease) return "no-lease";
  if (lease.status === "TERMINATED" || lease.status === "EXPIRED") return "lease-ended";
  if (lease.status === "ACTIVE") return "active";
  // DRAFT leases — treat as no-lease (not yet started)
  return "no-lease";
}

/* ── Main orchestrator ── */

export async function fetchTenantDashboard(): Promise<TenantDashboardData> {
  // Step 1: Fetch tenant profile via /tenants/me (the anchor)
  const profileResult = await fetchTenantProfile();
  const profile = profileResult.data;
  const leaseId = profile?.lease_id ?? null;

  // Step 2: Fetch lease (only if we have a lease_id from the profile)
  const leaseResult = await fetchTenantLease(leaseId);

  const setupStage = computeTenantSetupStage(
    profile,
    profileResult.source,
    leaseResult.data,
    leaseResult.source
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
  const openMaintenanceCount = maintenanceResult.data.filter(
    (w) => w.status === "OPEN" || w.status === "IN_PROGRESS",
  ).length;

  // Notification stats
  const unreadNotificationCount = notificationsResult.data.filter(
    (n) => !n.read_at,
  ).length;

  const domainErrors: TenantDomainErrors = {
    profile: profileResult.error,
    lease: leaseResult.error,
    payments: paymentsResult.error,
    maintenance: maintenanceResult.error,
    documents: documentsResult.error,
    notifications: notificationsResult.error,
  };

  return {
    profile,
    lease: leaseResult.data,
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
      lease: leaseResult.source,
      payments: paymentsResult.source,
      maintenance: maintenanceResult.source,
      documents: documentsResult.source,
      notifications: notificationsResult.source,
    },
  };
}
