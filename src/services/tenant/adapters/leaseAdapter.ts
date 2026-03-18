/**
 * Lease adapter — fetches the tenant's lease(s).
 *
 * Multi-lease strategy: uses GET /tenants/me/leases which returns all leases
 * for the authenticated tenant across all orgs. The dashboard picks the first
 * active lease for the current org context. Falls back to fetching a single
 * lease by ID for backward compatibility (deprecated path).
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, LeaseRow } from "../types";

interface SingleResponse<T> {
  data: T;
}

interface ListResponse<T> {
  data: T[];
}

/**
 * Fetch all leases for the authenticated tenant via /tenants/me/leases.
 * The dashboard uses this to find the active lease for the selected org.
 */
export async function fetchTenantLeases(): Promise<DomainResult<LeaseRow[]>> {
  try {
    const res = await apiRequest<ListResponse<LeaseRow>>({
      path: "api/tenants/me/leases",
    });
    return { data: res.data ?? [], source: "live", error: null };
  } catch (e: any) {
    return {
      data: [],
      source: "unavailable",
      error: e?.message || "Failed to fetch leases",
    };
  }
}

/**
 * @deprecated Use fetchTenantLeases() instead. Kept for backward compatibility
 * during migration from single-lease to multi-lease dashboard.
 */
export async function fetchTenantLease(
  leaseId: string | null
): Promise<DomainResult<LeaseRow | null>> {
  if (!leaseId) {
    return { data: null, source: "live", error: null };
  }

  try {
    const res = await apiRequest<SingleResponse<LeaseRow>>({
      path: `api/leases/${leaseId}`,
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: null,
      source: "unavailable",
      error: e?.message || "Failed to fetch lease",
    };
  }
}
