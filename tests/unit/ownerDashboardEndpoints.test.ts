/**
 * Tests that fetchOwnerDashboard calls the correct API endpoints.
 *
 * Regression: the dashboard previously called "api/payments/ledger" which
 * does not exist in payments-service. The correct endpoint is
 * "api/payments/charges" (backed by the charge table, the v2 replacement
 * for the legacy ledger_entries table).
 */

import type { OwnerDashboardData } from "@/services/dashboard/types";

/* ── Mock apiRequest to capture all requested paths ── */

const requestedPaths: string[] = [];

const emptyPage = { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } };

jest.mock("@/lib/api/client", () => ({
  apiRequest: jest.fn(({ path }: { path: string }) => {
    requestedPaths.push(path);
    return Promise.resolve(emptyPage);
  }),
}));

/* ── Mock maintenance stats (separate fetcher) ── */

jest.mock("@/services/maintenance/maintenanceApiService", () => ({
  fetchMaintenanceStats: jest.fn(() =>
    Promise.resolve({
      data: { submitted: 0, in_review: 0, scheduled: 0, in_progress: 0, completed: 0, closed: 0, cancelled: 0 },
    }),
  ),
}));

/* ── Import AFTER mocks are set up ── */

let fetchOwnerDashboard: () => Promise<OwnerDashboardData>;

beforeAll(async () => {
  const mod = await import("@/services/dashboard/ownerDashboardService");
  fetchOwnerDashboard = mod.fetchOwnerDashboard;
});

beforeEach(() => {
  requestedPaths.length = 0;
});

describe("fetchOwnerDashboard endpoint paths", () => {
  test("calls api/payments/charges for ledger data (not api/payments/ledger)", async () => {
    await fetchOwnerDashboard();

    // The charges endpoint should be called (ledger data)
    const chargesCalls = requestedPaths.filter((p) => p.startsWith("api/payments/charges"));
    expect(chargesCalls.length).toBeGreaterThanOrEqual(1);

    // The old /ledger path must NOT be called
    const ledgerCalls = requestedPaths.filter((p) => p.includes("payments/ledger"));
    expect(ledgerCalls).toHaveLength(0);
  });

  test("calls expected domain endpoints", async () => {
    await fetchOwnerDashboard();

    // Extract base paths (before query params)
    const basePaths = requestedPaths.map((p) => p.split("?")[0]);

    expect(basePaths).toContain("api/properties");
    expect(basePaths).toContain("api/leases");
    expect(basePaths).toContain("api/payments");
    expect(basePaths).toContain("api/payments/charges");
    expect(basePaths).toContain("api/maintenance");
    expect(basePaths).toContain("api/documents");
  });

  test("returns valid dashboard data even when all endpoints return empty", async () => {
    const result = await fetchOwnerDashboard();

    expect(result).toBeDefined();
    expect(result.kpis).toBeDefined();
    expect(result.kpis.totalProperties.value).toBe(0);
    expect(result.domainErrors.ledger).toBeNull();
    expect(result.setupStage).toBe("no-properties");
  });

  test("isolates ledger domain failure without breaking other domains", async () => {
    // Override apiRequest to fail only on charges
    const { apiRequest } = require("@/lib/api/client");
    (apiRequest as jest.Mock).mockImplementation(({ path }: { path: string }) => {
      requestedPaths.push(path);
      if (path.includes("payments/charges")) {
        return Promise.reject(new Error("Service unavailable"));
      }
      return Promise.resolve(emptyPage);
    });

    const result = await fetchOwnerDashboard();

    // Ledger domain should be marked unavailable
    expect(result.domainErrors.ledger).toBeTruthy();
    // Other domains should be fine
    expect(result.domainErrors.properties).toBeNull();
    expect(result.domainErrors.payments).toBeNull();
    expect(result.domainErrors.maintenance).toBeNull();
  });
});
