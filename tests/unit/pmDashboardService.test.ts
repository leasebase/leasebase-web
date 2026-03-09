import {
  computePMSetupStage,
  fetchPMDashboard,
  pmApiRequest,
  type PMDashboardApiResponse,
} from "@/services/pm/pmDashboardService";
import type { PMPropertyRow, PMUnitRow, PMLeaseRow } from "@/services/pm/types";

/* ── Mock apiRequest ── */

const mockApiRequest = jest.fn();
jest.mock("@/lib/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

beforeEach(() => {
  mockApiRequest.mockReset();
});

/* ── Test fixtures ── */

const validApiResponse: PMDashboardApiResponse = {
  kpis: {
    totalProperties: 2,
    totalUnits: 5,
    occupiedUnits: 4,
    vacancyRate: 20,
    monthlyScheduledRent: 500000,
    collectedThisMonth: 400000,
    overdueAmount: 50000,
    openMaintenanceRequests: 2,
  },
  properties: [
    { id: "p1", name: "Prop A", address_line1: "123 Main", city: "Austin", state: "TX", postal_code: "78701", country: "US", status: "ACTIVE", created_at: "2025-01-01", updated_at: "2025-01-01" },
  ],
  units: [
    { id: "u1", property_id: "p1", unit_number: "1A", bedrooms: 2, bathrooms: 1, square_feet: 800, rent_amount: 150000, status: "OCCUPIED" },
  ],
  leases: [
    { id: "l1", unit_id: "u1", start_date: "2025-01-01", end_date: "2026-01-01", rent_amount: 150000, deposit_amount: 150000, status: "ACTIVE" },
  ],
  tenants: [],
  maintenanceRequests: [],
  recentPayments: [],
  tasks: [],
};

/* ── computePMSetupStage ── */

describe("computePMSetupStage", () => {
  test("returns no-assignments when properties empty", () => {
    expect(computePMSetupStage([], [], [])).toBe("no-assignments");
  });

  test("returns no-units when properties exist but no units", () => {
    const props = [{ id: "p1" }] as PMPropertyRow[];
    expect(computePMSetupStage(props, [], [])).toBe("no-units");
  });

  test("returns no-leases when units exist but no active leases", () => {
    const props = [{ id: "p1" }] as PMPropertyRow[];
    const units = [{ id: "u1", property_id: "p1" }] as PMUnitRow[];
    const leases = [{ id: "l1", status: "EXPIRED" as const }] as PMLeaseRow[];
    expect(computePMSetupStage(props, units, leases)).toBe("no-leases");
  });

  test("returns active when active lease exists", () => {
    const props = [{ id: "p1" }] as PMPropertyRow[];
    const units = [{ id: "u1", property_id: "p1" }] as PMUnitRow[];
    const leases = [{ id: "l1", status: "ACTIVE" as const }] as PMLeaseRow[];
    expect(computePMSetupStage(props, units, leases)).toBe("active");
  });
});

/* ── fetchPMDashboard ── */

describe("fetchPMDashboard", () => {
  test("returns live data on successful response", async () => {
    mockApiRequest.mockResolvedValueOnce(validApiResponse);

    const result = await fetchPMDashboard();
    expect(result.status).toBe("live");
    if (result.status === "live") {
      expect(result.data.kpis.totalProperties.value).toBe(2);
      expect(result.data.kpis.totalProperties.source).toBe("live");
      expect(result.data.setupStage).toBe("active");
    }
  });

  test("returns stub data when backend is unavailable (network error)", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("fetch failed"));

    const result = await fetchPMDashboard();
    expect(result.status).toBe("stub");
    if (result.status === "stub") {
      expect(result.data.kpis.totalProperties.source).toBe("stub");
      expect(result.reason).toContain("not available yet");
    }
  });

  test("returns error on auth failure (Unauthorized)", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Unauthorized"));

    const result = await fetchPMDashboard();
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toContain("Unauthorized");
    }
  });

  test("returns error on auth failure (Forbidden)", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Forbidden"));

    const result = await fetchPMDashboard();
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toContain("Forbidden");
    }
  });

  test("returns stub data when response shape is invalid", async () => {
    mockApiRequest.mockResolvedValueOnce({ unexpected: "shape" });

    const result = await fetchPMDashboard();
    expect(result.status).toBe("stub");
    if (result.status === "stub") {
      expect(result.reason).toContain("invalid response shape");
    }
  });

  test("returns stub when response is null", async () => {
    mockApiRequest.mockResolvedValueOnce(null);

    const result = await fetchPMDashboard();
    expect(result.status).toBe("stub");
  });

  test("calls /api/pm/dashboard path", async () => {
    mockApiRequest.mockResolvedValueOnce(validApiResponse);

    await fetchPMDashboard();

    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    const callArg = mockApiRequest.mock.calls[0][0];
    expect(callArg.path).toBe("api/pm/dashboard");
  });
});

/* ── pmApiRequest path enforcement ── */

describe("pmApiRequest", () => {
  test("rejects non-PM paths", async () => {
    await expect(pmApiRequest("api/properties")).rejects.toThrow(
      "PM safety violation",
    );
  });

  test("rejects absolute non-PM paths", async () => {
    await expect(pmApiRequest("/api/leases")).rejects.toThrow(
      "PM safety violation",
    );
  });

  test("allows /api/pm/* paths", async () => {
    mockApiRequest.mockResolvedValueOnce({});
    await expect(pmApiRequest("api/pm/dashboard")).resolves.toBeDefined();
  });

  test("allows paths with leading slash", async () => {
    mockApiRequest.mockResolvedValueOnce({});
    await expect(pmApiRequest("/api/pm/properties")).resolves.toBeDefined();
  });
});
