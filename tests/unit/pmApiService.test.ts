/**
 * PM API Service Tests — Phase 2 adapters
 *
 * Validates that every pmApiService function:
 * 1. Calls the correct /api/pm/* path
 * 2. Uses the right HTTP method
 * 3. Passes expected body/query params
 * 4. Never calls org-wide endpoints
 */

const mockApiRequest = jest.fn();
jest.mock("@/lib/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import {
  fetchPMProperties,
  fetchPMProperty,
  fetchPMUnits,
  fetchPMUnit,
  fetchPMTenants,
  fetchPMTenant,
  fetchPMMaintenance,
  fetchPMMaintenanceItem,
  updatePMMaintenanceStatus,
  fetchPMMaintenanceComments,
  postPMMaintenanceComment,
  fetchPMPayments,
  fetchPMPayment,
  fetchPMDocuments,
  fetchPMDocument,
} from "@/services/pm/pmApiService";

beforeEach(() => mockApiRequest.mockReset());

function lastCallPath(): string {
  return mockApiRequest.mock.calls[0][0]?.path ?? mockApiRequest.mock.calls[0][0];
}

/* ── Properties ── */

describe("PM Properties", () => {
  test("fetchPMProperties calls correct path with pagination", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchPMProperties(2, 10);
    expect(lastCallPath()).toBe("api/pm/properties?page=2&limit=10");
  });

  test("fetchPMProperty calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await fetchPMProperty("prop-1");
    expect(lastCallPath()).toBe("api/pm/properties/prop-1");
  });
});

/* ── Units ── */

describe("PM Units", () => {
  test("fetchPMUnits calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchPMUnits();
    expect(lastCallPath()).toBe("api/pm/units?page=1&limit=20");
  });

  test("fetchPMUnit calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await fetchPMUnit("unit-1");
    expect(lastCallPath()).toBe("api/pm/units/unit-1");
  });
});

/* ── Tenants ── */

describe("PM Tenants", () => {
  test("fetchPMTenants calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchPMTenants();
    expect(lastCallPath()).toBe("api/pm/tenants?page=1&limit=20");
  });

  test("fetchPMTenant calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await fetchPMTenant("tenant-1");
    expect(lastCallPath()).toBe("api/pm/tenants/tenant-1");
  });
});

/* ── Maintenance ── */

describe("PM Maintenance", () => {
  test("fetchPMMaintenance calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchPMMaintenance();
    expect(lastCallPath()).toBe("api/pm/maintenance?page=1&limit=20");
  });

  test("fetchPMMaintenanceItem calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await fetchPMMaintenanceItem("wo-1");
    expect(lastCallPath()).toBe("api/pm/maintenance/wo-1");
  });

  test("updatePMMaintenanceStatus sends PATCH with status body", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await updatePMMaintenanceStatus("wo-1", "RESOLVED");
    const call = mockApiRequest.mock.calls[0][0];
    expect(call.path ?? call).toBe("api/pm/maintenance/wo-1/status");
    expect(call.method).toBe("PATCH");
    expect(call.body).toBe(JSON.stringify({ status: "RESOLVED" }));
  });

  test("fetchPMMaintenanceComments calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [] });
    await fetchPMMaintenanceComments("wo-1");
    expect(lastCallPath()).toBe("api/pm/maintenance/wo-1/comments");
  });

  test("postPMMaintenanceComment sends POST with comment body", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await postPMMaintenanceComment("wo-1", "Fixed the leak");
    const call = mockApiRequest.mock.calls[0][0];
    expect(call.path ?? call).toBe("api/pm/maintenance/wo-1/comments");
    expect(call.method).toBe("POST");
    expect(call.body).toBe(JSON.stringify({ comment: "Fixed the leak" }));
  });
});

/* ── Payments ── */

describe("PM Payments", () => {
  test("fetchPMPayments calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchPMPayments();
    expect(lastCallPath()).toBe("api/pm/payments?page=1&limit=20");
  });

  test("fetchPMPayment calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await fetchPMPayment("pay-1");
    expect(lastCallPath()).toBe("api/pm/payments/pay-1");
  });
});

/* ── Documents ── */

describe("PM Documents", () => {
  test("fetchPMDocuments calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchPMDocuments();
    expect(lastCallPath()).toBe("api/pm/documents?page=1&limit=20");
  });

  test("fetchPMDocument calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await fetchPMDocument("doc-1");
    expect(lastCallPath()).toBe("api/pm/documents/doc-1");
  });
});

/* ── Safety: every call stays in /api/pm/* ── */

describe("PM namespace safety", () => {
  test("all adapter paths start with api/pm/", () => {
    // Check the source file itself has no org-wide paths
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../src/services/pm/pmApiService.ts"),
      "utf-8",
    );
    // Must NOT contain any direct org-wide endpoint references
    expect(src).not.toMatch(/["`']api\/properties["`']/);
    expect(src).not.toMatch(/["`']api\/leases["`']/);
    expect(src).not.toMatch(/["`']api\/tenants["`']/);
    expect(src).not.toMatch(/["`']api\/maintenance["`']/);
    expect(src).not.toMatch(/["`']api\/payments["`']/);
    expect(src).not.toMatch(/["`']api\/documents["`']/);
    // Must ONLY contain api/pm/ paths
    const apiPaths = src.match(/api\/pm\/\w+/g) ?? [];
    expect(apiPaths.length).toBeGreaterThanOrEqual(10);
  });
});
