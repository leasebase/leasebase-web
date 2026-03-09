/**
 * Lease adapter — fetches the tenant's lease(s).
 *
 * Strategy: The lease-service returns ALL org leases. We fetch the specific
 * lease ID from the tenant profile, then fetch that lease directly.
 * This avoids downloading all org leases.
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, LeaseRow } from "../types";

interface SingleResponse<T> {
  data: T;
}

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
