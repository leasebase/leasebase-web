/**
 * Profile adapters — fetch and update user, owner, tenant, and notification profiles.
 *
 * All adapters follow the DomainResult pattern: { data, source, error }.
 */

import { apiRequest } from "@/lib/api/client";
import type {
  DomainResult,
  UserProfile,
  UserProfileUpdatePayload,
  OwnerProfile,
  OwnerProfileUpdatePayload,
  TenantProfileExtension,
  TenantProfileExtensionUpdatePayload,
  NotificationPreferences,
  NotificationPreferencesUpdatePayload,
} from "./types";

interface SingleResponse<T> {
  data: T;
}

// ── Base User Profile ────────────────────────────────────────────────────────

export async function fetchUserProfile(): Promise<DomainResult<UserProfile | null>> {
  try {
    const res = await apiRequest<SingleResponse<UserProfile | null>>({
      path: "api/profile",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to fetch profile" };
  }
}

export async function updateUserProfile(
  payload: UserProfileUpdatePayload,
): Promise<DomainResult<UserProfile | null>> {
  try {
    const res = await apiRequest<SingleResponse<UserProfile>>({
      path: "api/profile",
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to update profile" };
  }
}

// ── Owner Profile ────────────────────────────────────────────────────────────

export async function fetchOwnerProfile(): Promise<DomainResult<OwnerProfile | null>> {
  try {
    const res = await apiRequest<SingleResponse<OwnerProfile | null>>({
      path: "api/profile/owner",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to fetch owner profile" };
  }
}

export async function updateOwnerProfile(
  payload: OwnerProfileUpdatePayload,
): Promise<DomainResult<OwnerProfile | null>> {
  try {
    const res = await apiRequest<SingleResponse<OwnerProfile>>({
      path: "api/profile/owner",
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to update owner profile" };
  }
}

// ── Tenant Profile Extensions ────────────────────────────────────────────────

export async function fetchTenantProfileExtension(): Promise<
  DomainResult<TenantProfileExtension | null>
> {
  try {
    const res = await apiRequest<SingleResponse<TenantProfileExtension | null>>({
      path: "api/tenants/profile",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to fetch tenant profile" };
  }
}

export async function updateTenantProfileExtension(
  payload: TenantProfileExtensionUpdatePayload,
): Promise<DomainResult<TenantProfileExtension | null>> {
  try {
    const res = await apiRequest<SingleResponse<TenantProfileExtension>>({
      path: "api/tenants/profile",
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to update tenant profile" };
  }
}

// ── Notification Preferences ─────────────────────────────────────────────────

export async function fetchNotificationPreferences(): Promise<
  DomainResult<NotificationPreferences | null>
> {
  try {
    const res = await apiRequest<SingleResponse<NotificationPreferences>>({
      path: "api/notifications/preferences",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to fetch notification preferences" };
  }
}

export async function updateNotificationPreferences(
  payload: NotificationPreferencesUpdatePayload,
): Promise<DomainResult<NotificationPreferences | null>> {
  try {
    const res = await apiRequest<SingleResponse<NotificationPreferences>>({
      path: "api/notifications/preferences",
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to update notification preferences" };
  }
}
