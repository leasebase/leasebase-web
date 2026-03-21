/**
 * Settings adapter tests — verifies fetch/update and error handling.
 */
import { fetchUserSettings, updateUserSettings } from "@/services/settings/adapters";

jest.mock("@/lib/api/client", () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from "@/lib/api/client";
const mockApiRequest = apiRequest as jest.Mock;

beforeEach(() => { mockApiRequest.mockReset(); });

describe("fetchUserSettings", () => {
  it("returns live data on success", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: { user_id: "u1", theme_mode: "dark", primary_color: null, secondary_color: null, default_dashboard: null } });
    const result = await fetchUserSettings();
    expect(result.source).toBe("live");
    expect(result.data?.theme_mode).toBe("dark");
    expect(result.error).toBeNull();
  });

  it("returns unavailable on fetch error", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Network error"));
    const result = await fetchUserSettings();
    expect(result.source).toBe("unavailable");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Network error");
  });
});

describe("updateUserSettings", () => {
  it("sends PUT with payload to api/settings", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: { user_id: "u1", theme_mode: "light" } });
    const result = await updateUserSettings({ theme_mode: "light" });
    expect(result.data?.theme_mode).toBe("light");
    expect(mockApiRequest).toHaveBeenCalledWith(expect.objectContaining({ path: "api/settings", method: "PUT" }));
  });

  it("returns error on failure", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Server error"));
    const result = await updateUserSettings({ theme_mode: "dark" });
    expect(result.data).toBeNull();
    expect(result.error).toBe("Server error");
  });
});
