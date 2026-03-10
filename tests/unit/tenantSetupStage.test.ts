import { computeTenantSetupStage } from "@/services/tenant/tenantDashboardService";
import type { TenantProfileRow, LeaseRow, DataSource } from "@/services/tenant/types";

function makeProfile(overrides: Partial<TenantProfileRow> = {}): TenantProfileRow {
  return {
    id: "tp-1",
    user_id: "u-1",
    lease_id: null,
    phone: null,
    emergency_contact: null,
    notification_preferences: null,
    email: "t@t.com",
    name: "Test Tenant",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function makeLease(overrides: Partial<LeaseRow> = {}): LeaseRow {
  return {
    id: "lease-1",
    organization_id: "org-1",
    unit_id: "unit-1",
    start_date: "2026-01-01",
    end_date: "2027-01-01",
    rent_amount: 145000,
    deposit_amount: 145000,
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeTenantSetupStage", () => {
  it('returns "active" when profile has lease_id and lease is ACTIVE', () => {
    const result = computeTenantSetupStage(
      makeProfile({ lease_id: "lease-1" }),
      "live",
      makeLease({ status: "ACTIVE" }),
      "live",
    );
    expect(result).toBe("active");
  });

  it('returns "no-profile" when profile is null', () => {
    expect(computeTenantSetupStage(null, "live", null, "live")).toBe("no-profile");
  });

  it('returns "no-profile" when profile source is unavailable', () => {
    expect(
      computeTenantSetupStage(makeProfile(), "unavailable", null, "live"),
    ).toBe("no-profile");
  });

  it('returns "no-lease" when lease_id is null (no ACTIVE lease derived)', () => {
    expect(
      computeTenantSetupStage(makeProfile({ lease_id: null }), "live", null, "live"),
    ).toBe("no-lease");
  });

  it('returns "no-lease" when lease_id exists but lease fetch fails', () => {
    expect(
      computeTenantSetupStage(makeProfile({ lease_id: "lease-1" }), "live", null, "unavailable"),
    ).toBe("no-lease");
  });

  it('returns "lease-ended" when lease status is TERMINATED', () => {
    expect(
      computeTenantSetupStage(
        makeProfile({ lease_id: "lease-1" }),
        "live",
        makeLease({ status: "TERMINATED" }),
        "live",
      ),
    ).toBe("lease-ended");
  });

  it('returns "lease-ended" when lease status is EXPIRED', () => {
    expect(
      computeTenantSetupStage(
        makeProfile({ lease_id: "lease-1" }),
        "live",
        makeLease({ status: "EXPIRED" }),
        "live",
      ),
    ).toBe("lease-ended");
  });

  it('returns "no-lease" for DRAFT lease (not yet started)', () => {
    expect(
      computeTenantSetupStage(
        makeProfile({ lease_id: "lease-1" }),
        "live",
        makeLease({ status: "DRAFT" }),
        "live",
      ),
    ).toBe("no-lease");
  });
});
