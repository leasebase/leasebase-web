/**
 * Tenant API Service Tests
 *
 * Validates that every tenantApiService function:
 * 1. Calls the correct /api/tenants/* path
 * 2. Uses the right HTTP method
 * 3. Passes expected body/query params
 */

const mockApiRequest = jest.fn();
jest.mock("@/lib/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import {
  fetchTenants,
  fetchTenant,
  updateTenant,
  deactivateTenant,
  reactivateTenant,
  fetchTenantLeases,
  fetchTenantPayments,
  fetchTenantMaintenance,
} from "@/services/tenants/tenantApiService";

beforeEach(() => mockApiRequest.mockReset());

function lastCallPath(): string {
  return mockApiRequest.mock.calls[0][0]?.path ?? mockApiRequest.mock.calls[0][0];
}

function lastCallOpts(): Record<string, any> {
  return mockApiRequest.mock.calls[0][0] ?? {};
}

/* ── List / Search ── */

describe("fetchTenants", () => {
  test("calls correct path with default pagination", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchTenants();
    expect(lastCallPath()).toContain("api/tenants?");
    expect(lastCallPath()).toContain("page=1");
    expect(lastCallPath()).toContain("limit=20");
  });

  test("passes search param", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchTenants({ search: "john" });
    expect(lastCallPath()).toContain("search=john");
  });

  test("passes status filter param", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchTenants({ status: "ACTIVE" });
    expect(lastCallPath()).toContain("status=ACTIVE");
  });

  test("passes custom pagination", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchTenants({ page: 3, limit: 50 });
    expect(lastCallPath()).toContain("page=3");
    expect(lastCallPath()).toContain("limit=50");
  });
});

/* ── Detail ── */

describe("fetchTenant", () => {
  test("calls correct path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await fetchTenant("tp-1");
    expect(lastCallPath()).toBe("api/tenants/tp-1");
  });
});

/* ── Update ── */

describe("updateTenant", () => {
  test("sends PUT with body", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await updateTenant("tp-1", { phone: "555-1234", notes: "VIP" });
    const opts = lastCallOpts();
    expect(opts.path).toBe("api/tenants/tp-1");
    expect(opts.method).toBe("PUT");
    expect(JSON.parse(opts.body)).toEqual({ phone: "555-1234", notes: "VIP" });
  });
});

/* ── Lifecycle ── */

describe("deactivateTenant", () => {
  test("sends POST to deactivate path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await deactivateTenant("tp-1");
    const opts = lastCallOpts();
    expect(opts.path).toBe("api/tenants/tp-1/deactivate");
    expect(opts.method).toBe("POST");
  });
});

describe("reactivateTenant", () => {
  test("sends POST to reactivate path", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: {} });
    await reactivateTenant("tp-1");
    const opts = lastCallOpts();
    expect(opts.path).toBe("api/tenants/tp-1/reactivate");
    expect(opts.method).toBe("POST");
  });
});

/* ── History ── */

describe("fetchTenantLeases", () => {
  test("calls correct path with pagination", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchTenantLeases("tp-1", 2, 10);
    expect(lastCallPath()).toBe("api/tenants/tp-1/leases?page=2&limit=10");
  });
});

describe("fetchTenantPayments", () => {
  test("calls correct path with pagination", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchTenantPayments("tp-1");
    expect(lastCallPath()).toBe("api/tenants/tp-1/payments?page=1&limit=20");
  });
});

describe("fetchTenantMaintenance", () => {
  test("calls correct path with pagination", async () => {
    mockApiRequest.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchTenantMaintenance("tp-1");
    expect(lastCallPath()).toBe("api/tenants/tp-1/maintenance?page=1&limit=20");
  });
});

/* ── Namespace safety ── */

describe("Tenant API namespace safety", () => {
  test("all adapter paths use api/tenants/* (not api/pm/tenants)", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../src/services/tenants/tenantApiService.ts"),
      "utf-8",
    );
    // Must NOT use PM paths
    expect(src).not.toMatch(/api\/pm\//);
    // Must use api/tenants paths
    const tenantPaths = src.match(/api\/tenants/g) ?? [];
    expect(tenantPaths.length).toBeGreaterThanOrEqual(8);
  });
});
