/**
 * Settings adapters — fetch and update user application settings.
 * Follows the DomainResult pattern: { data, source, error }.
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, UserSettings, UserSettingsUpdatePayload } from "./types";

interface SingleResponse<T> {
  data: T;
}

export async function fetchUserSettings(): Promise<DomainResult<UserSettings | null>> {
  try {
    const res = await apiRequest<SingleResponse<UserSettings>>({
      path: "api/settings",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to fetch settings" };
  }
}

export async function updateUserSettings(
  payload: UserSettingsUpdatePayload,
): Promise<DomainResult<UserSettings | null>> {
  try {
    const res = await apiRequest<SingleResponse<UserSettings>>({
      path: "api/settings",
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to update settings" };
  }
}
