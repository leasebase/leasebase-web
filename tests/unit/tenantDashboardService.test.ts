import { computeTenantSetupStage } from "@/services/tenant/tenantDashboardService";
import type { TenantProfileRow, LeaseRow, DataSource } from "@/services/tenant/types";

/* ── Fixtures ── */

const profile: TenantProfileRow = {
  id: "tp1",
  user_id: "u1",
  lease_id: "l1",
  phone: "+1234567890",
  emergency_contact: null,
  notification_preferences: null,
  email: "tenant@example.com",
  name: "Jane Doe",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const activeLease: LeaseRow = {
  id: "l1",
  organization_id: "org1",
  unit_id: "unit1",
  start_date: "2024-01-01",
  end_date: "2026-12-31",
  rent_amount: 145000,
  deposit_amount: 145000,
  status: "ACTIVE",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const terminatedLease: LeaseRow = {
  ...activeLease,
  status: "TERMINATED",
};

const expiredLease: LeaseRow = {
  ...activeLease,
  status: "EXPIRED",
};

const draftLease: LeaseRow = {
  ...activeLease,
  status: "DRAFT",
};

/* ── computeTenantSetupStage ── */

describe("computeTenantSetupStage", () => {
  test('returns "no-profile" when profile source is unavailable', () => {
    expect(computeTenantSetupStage(null, "unavailable", null, "live")).toBe("no-profile");
  });

  test('returns "no-profile" when profile is null (even with live source)', () => {
    expect(computeTenantSetupStage(null, "live", null, "live")).toBe("no-profile");
  });

  test('returns "no-lease" when profile has no lease_id', () => {
    const noLeaseProfile = { ...profile, lease_id: null };
    expect(computeTenantSetupStage(noLeaseProfile, "live", null, "live")).toBe("no-lease");
  });

  test('returns "no-lease" when lease fetch fails', () => {
    expect(computeTenantSetupStage(profile, "live", null, "unavailable")).toBe("no-lease");
  });

  test('returns "active" when profile and lease are live and ACTIVE', () => {
    expect(computeTenantSetupStage(profile, "live", activeLease, "live")).toBe("active");
  });

  test('returns "lease-ended" for TERMINATED lease', () => {
    expect(computeTenantSetupStage(profile, "live", terminatedLease, "live")).toBe("lease-ended");
  });

  test('returns "lease-ended" for EXPIRED lease', () => {
    expect(computeTenantSetupStage(profile, "live", expiredLease, "live")).toBe("lease-ended");
  });

  test('returns "no-lease" for DRAFT lease', () => {
    expect(computeTenantSetupStage(profile, "live", draftLease, "live")).toBe("no-lease");
  });
});

/* ── Security invariant: adapters use tenant-scoped endpoints (Phase 2) ── */

// Mock apiRequest to verify correct endpoint paths
const mockApiRequest = jest.fn();
jest.mock("@/lib/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

describe("Security: adapters call tenant-scoped endpoints only", () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  test("paymentAdapter calls /api/payments/mine (not /api/payments)", async () => {
    mockApiRequest.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, hasMore: false } });
    const { fetchTenantPayments } = await import(
      "@/services/tenant/adapters/paymentAdapter"
    );
    const result = await fetchTenantPayments();
    expect(result.source).toBe("live");
    expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/payments/mine" });
    // Verify no tenant_id/lease_id in the call
    const callArg = mockApiRequest.mock.calls[0][0];
    expect(callArg.body).toBeUndefined();
  });

  test("maintenanceAdapter calls /api/maintenance/mine (not /api/maintenance)", async () => {
    mockApiRequest.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, hasMore: false } });
    const { fetchTenantMaintenance } = await import(
      "@/services/tenant/adapters/maintenanceAdapter"
    );
    const result = await fetchTenantMaintenance();
    expect(result.source).toBe("live");
    expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/maintenance/mine" });
  });

  test("documentAdapter calls /api/documents/mine (not /api/documents)", async () => {
    mockApiRequest.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, hasMore: false } });
    const { fetchTenantDocuments } = await import(
      "@/services/tenant/adapters/documentAdapter"
    );
    const result = await fetchTenantDocuments();
    expect(result.source).toBe("live");
    expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/documents/mine" });
  });

  test("paymentAdapter returns unavailable on API error", async () => {
    mockApiRequest.mockRejectedValue(new Error("Network error"));
    const { fetchTenantPayments } = await import(
      "@/services/tenant/adapters/paymentAdapter"
    );
    const result = await fetchTenantPayments();
    expect(result.source).toBe("unavailable");
    expect(result.data).toEqual([]);
    expect(result.error).toBe("Network error");
  });

  test("checkoutSession sends returnUrl/cancelUrl only (no IDs)", async () => {
    mockApiRequest.mockResolvedValue({ data: { checkoutUrl: "https://stripe.com/session", sessionId: "sess_1" } });
    const { createCheckoutSession } = await import(
      "@/services/tenant/adapters/paymentAdapter"
    );
    await createCheckoutSession("https://app.example.com/success", "https://app.example.com/cancel");
    const callArg = mockApiRequest.mock.calls[0][0];
    const body = JSON.parse(callArg.body);
    expect(body).toEqual({ returnUrl: "https://app.example.com/success", cancelUrl: "https://app.example.com/cancel" });
    // No tenant_id, lease_id, or org_id
    expect(body.tenant_id).toBeUndefined();
    expect(body.lease_id).toBeUndefined();
    expect(body.org_id).toBeUndefined();
  });

  test("updateTenantProfile calls PATCH /api/tenants/me (no ID in path)", async () => {
    mockApiRequest.mockResolvedValue({ data: { id: "tp1", phone: "+1234567890" } });
    const { updateTenantProfile } = await import(
      "@/services/tenant/adapters/profileAdapter"
    );
    await updateTenantProfile({ phone: "+1234567890" });
    const callArg = mockApiRequest.mock.calls[0][0];
    expect(callArg.path).toBe("api/tenants/me");
    expect(callArg.method).toBe("PATCH");
    const body = JSON.parse(callArg.body);
    expect(body.tenant_id).toBeUndefined();
    expect(body.lease_id).toBeUndefined();
  });
});
