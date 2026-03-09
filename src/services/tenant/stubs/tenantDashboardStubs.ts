/**
 * Stub data for the Tenant Dashboard.
 *
 * Used when backend endpoints are missing or TENANT role is forbidden.
 * Each stub is clearly marked for easy replacement.
 */

import type { TenantProfileRow } from "../types";

/**
 * TODO: Replace when tenant-service adds a "find my profile" endpoint.
 *
 * Currently there's no way for a TENANT to discover their own profile ID
 * without it being passed from the PM flow. This stub provides a fallback
 * when the profile lookup fails.
 */
export function getStubTenantProfile(
  userId: string,
  email: string,
  name: string
): TenantProfileRow {
  return {
    id: "stub_profile",
    user_id: userId,
    lease_id: null,
    phone: null,
    emergency_contact: null,
    notification_preferences: null,
    email,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
