/**
 * Profile adapter tests — verifies error handling and response shaping.
 */
import {
  fetchUserProfile,
  updateUserProfile,
  fetchOwnerProfile,
  updateOwnerProfile,
  fetchTenantProfileExtension,
  updateTenantProfileExtension,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/profile/adapters";

// Mock the apiRequest function
jest.mock("@/lib/api/client", () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from "@/lib/api/client";
const mockApiRequest = apiRequest as jest.Mock;

beforeEach(() => {
  mockApiRequest.mockReset();
});

// ── fetchUserProfile ─────────────────────────────────────────────────────────

describe("fetchUserProfile", () => {
  it("returns live data on success", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: { user_id: "u1", first_name: "Alice", timezone: "UTC", language: "en" } });
    const result = await fetchUserProfile();
    expect(result.source).toBe("live");
    expect(result.data?.first_name).toBe("Alice");
    expect(result.error).toBeNull();
  });

  it("returns null data with source=live when backend returns { data: null }", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: null });
    const result = await fetchUserProfile();
    expect(result.source).toBe("live");
    expect(result.data).toBeNull();
  });

  it("returns unavailable on fetch error", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Network error"));
    const result = await fetchUserProfile();
    expect(result.source).toBe("unavailable");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Network error");
  });
});

// ── updateUserProfile ────────────────────────────────────────────────────────

describe("updateUserProfile", () => {
  it("sends PUT with payload", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: { user_id: "u1", first_name: "Bob" } });
    const result = await updateUserProfile({ first_name: "Bob" });
    expect(result.data?.first_name).toBe("Bob");
    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: "api/profile", method: "PUT" }),
    );
  });

  it("returns error on failure", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Validation failed"));
    const result = await updateUserProfile({ first_name: "X" });
    expect(result.data).toBeNull();
    expect(result.error).toBe("Validation failed");
  });
});

// ── fetchNotificationPreferences ─────────────────────────────────────────────

describe("fetchNotificationPreferences", () => {
  it("returns live preferences", async () => {
    mockApiRequest.mockResolvedValueOnce({
      data: { user_id: "u1", email_enabled: true, sms_enabled: false, push_enabled: false, rent_reminder: true, lease_updates: true, maintenance_updates: true, general_announcements: true },
    });
    const result = await fetchNotificationPreferences();
    expect(result.source).toBe("live");
    expect(result.data?.email_enabled).toBe(true);
  });

  it("handles error gracefully", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Service unavailable"));
    const result = await fetchNotificationPreferences();
    expect(result.source).toBe("unavailable");
    expect(result.data).toBeNull();
  });
});

// ── fetchOwnerProfile ────────────────────────────────────────────────────────

describe("fetchOwnerProfile", () => {
  it("returns live data", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: { user_id: "u1", company_name: "Acme" } });
    const result = await fetchOwnerProfile();
    expect(result.data?.company_name).toBe("Acme");
  });

  it("handles error gracefully", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("fail"));
    const result = await fetchOwnerProfile();
    expect(result.source).toBe("unavailable");
  });
});

// ── fetchTenantProfileExtension ──────────────────────────────────────────────

describe("fetchTenantProfileExtension", () => {
  it("returns live data", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: { user_id: "u1", occupation: "Dev" } });
    const result = await fetchTenantProfileExtension();
    expect(result.data?.occupation).toBe("Dev");
  });

  it("handles error gracefully", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("fail"));
    const result = await fetchTenantProfileExtension();
    expect(result.source).toBe("unavailable");
  });
});

// ── update functions pass correct paths ──────────────────────────────────────

describe("update functions use correct API paths", () => {
  it("updateOwnerProfile → api/profile/owner", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await updateOwnerProfile({ company_name: "X" });
    expect(mockApiRequest).toHaveBeenCalledWith(expect.objectContaining({ path: "api/profile/owner" }));
  });

  it("updateTenantProfileExtension → api/tenants/profile", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await updateTenantProfileExtension({ occupation: "X" });
    expect(mockApiRequest).toHaveBeenCalledWith(expect.objectContaining({ path: "api/tenants/profile" }));
  });

  it("updateNotificationPreferences → api/notifications/preferences", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await updateNotificationPreferences({ email_enabled: false });
    expect(mockApiRequest).toHaveBeenCalledWith(expect.objectContaining({ path: "api/notifications/preferences" }));
  });
});
