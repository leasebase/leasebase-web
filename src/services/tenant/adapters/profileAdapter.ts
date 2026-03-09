/**
 * Profile adapter — fetches and updates the tenant's own profile.
 *
 * GET  /api/tenants/me  — anchor endpoint for tenant UX
 * PATCH /api/tenants/me — self-update (phone, emergency_contact, notification_preferences)
 *
 * Field clearing semantics (PATCH):
 *   - Omitted field = no change
 *   - Explicit null = clear to NULL
 *   - Value = set
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, TenantProfileRow } from "../types";

interface SingleResponse<T> {
  data: T;
}

export async function fetchTenantProfile(): Promise<
  DomainResult<TenantProfileRow | null>
> {
  try {
    const res = await apiRequest<SingleResponse<TenantProfileRow>>({
      path: "api/tenants/me",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: null,
      source: "unavailable",
      error: e?.message || "Failed to fetch tenant profile",
    };
  }
}

export interface TenantProfileUpdatePayload {
  phone?: string | null;
  emergency_contact?: string | null;
  notification_preferences?: Record<string, boolean> | null;
}

/** Update tenant's own profile — LIVE via PATCH /api/tenants/me */
export async function updateTenantProfile(
  data: TenantProfileUpdatePayload,
): Promise<DomainResult<TenantProfileRow | null>> {
  try {
    const res = await apiRequest<SingleResponse<TenantProfileRow>>({
      path: "api/tenants/me",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: null,
      source: "unavailable",
      error: e?.message || "Failed to update tenant profile",
    };
  }
}
