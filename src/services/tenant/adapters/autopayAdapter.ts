/**
 * Autopay adapter — Phase 1B.
 *
 * Manages autopay enrollment via the payments-service.
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, AutopayStatus } from "../types";

/** Get autopay enrollment status for tenant's active lease */
export async function fetchAutopayStatus(): Promise<DomainResult<AutopayStatus | null>> {
  try {
    const res = await apiRequest<{ data: AutopayStatus }>({
      path: "api/payments/autopay",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to fetch autopay status" };
  }
}

/** Enable or disable autopay */
export async function updateAutopay(enabled: boolean): Promise<DomainResult<any>> {
  try {
    const res = await apiRequest<{ data: any }>({
      path: "api/payments/autopay",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to update autopay" };
  }
}
