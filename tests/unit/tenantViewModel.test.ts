import { toTenantDashboardViewModel, computePaymentStatus } from "@/services/tenant/viewModel";
import type { TenantDashboardData, LeaseRow, PaymentRow } from "@/services/tenant/types";

/* ── Fixtures ── */

const activeLease: LeaseRow = {
  id: "l1",
  organization_id: "org1",
  unit_id: "unit1",
  term_type: "TWELVE_MONTH",
  start_date: "2024-01-01",
  end_date: "2026-12-31",
  deposit_amount: 145000,
  rent_amount: 145000,
  status: "ACTIVE",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  property_name: "Oak Terrace Apartments",
  unit_number: "3B",
};

function makeActiveDashboardData(overrides?: Partial<TenantDashboardData>): TenantDashboardData {
  return {
    profile: {
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
    },
    lease: activeLease,
    payments: [],
    recentPayments: [],
    maintenanceRequests: [],
    openMaintenanceCount: 0,
    documents: [],
    notifications: [],
    unreadNotificationCount: 0,
    setupStage: "active",
    domainErrors: {
      profile: null,
      lease: null,
      payments: "Stub — no endpoint",
      maintenance: "Stub — no endpoint",
      documents: "Stub — 403",
      notifications: null,
    },
    sources: {
      profile: "live",
      lease: "live",
      payments: "stub",
      maintenance: "stub",
      documents: "stub",
      notifications: "live",
    },
    ...overrides,
  };
}

/* ── computePaymentStatus ── */

describe("computePaymentStatus", () => {
  test('returns "due" when no lease', () => {
    expect(computePaymentStatus(null, [])).toBe("due");
  });

  test('returns "due" when lease present but no payments', () => {
    // Will be "overdue" or "due-soon" or "due" depending on current date vs 1st of month
    const status = computePaymentStatus(activeLease, []);
    expect(["due", "due-soon", "overdue"]).toContain(status);
  });

  test('returns "paid" when this month has a SUCCEEDED payment', () => {
    const now = new Date();
    const payment: PaymentRow = {
      id: "p1",
      organization_id: "org1",
      lease_id: "l1",
      amount: 145000,
      currency: "usd",
      method: "card",
      status: "SUCCEEDED",
      charge_id: null, billing_period: null, charge_type: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    expect(computePaymentStatus(activeLease, [payment])).toBe("paid");
  });

  test('returns "pending" when this month has a PENDING payment', () => {
    const now = new Date();
    const payment: PaymentRow = {
      id: "p1",
      organization_id: "org1",
      lease_id: "l1",
      amount: 145000,
      currency: "usd",
      method: "card",
      status: "PENDING",
      charge_id: null, billing_period: null, charge_type: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    expect(computePaymentStatus(activeLease, [payment])).toBe("pending");
  });

  test('returns "failed" when this month has a FAILED payment', () => {
    const now = new Date();
    const payment: PaymentRow = {
      id: "p1",
      organization_id: "org1",
      lease_id: "l1",
      amount: 145000,
      currency: "usd",
      method: "card",
      status: "FAILED",
      charge_id: null, billing_period: null, charge_type: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    expect(computePaymentStatus(activeLease, [payment])).toBe("failed");
  });
});

/* ── toTenantDashboardViewModel ── */

describe("toTenantDashboardViewModel", () => {
  test("produces all widget view models", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.kpiHeader).toBeDefined();
    expect(vm.actionCards).toBeDefined();
    expect(vm.payments).toBeDefined();
    expect(vm.maintenance).toBeDefined();
    expect(vm.documents).toBeDefined();
    expect(vm.notifications).toBeDefined();
    expect(vm.setupStage).toBe("active");
  });

  test("KPI header formats rent amount when rent_amount is present", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.kpiHeader.rentAmount).toBe("$1,450");
    expect(vm.kpiHeader.rentAmountCents).toBe(145000);
  });

  test("KPI header shows dash for rent when rent_amount is null", () => {
    const data = makeActiveDashboardData({
      lease: { ...activeLease, rent_amount: null },
    });
    const vm = toTenantDashboardViewModel(data);
    expect(vm.kpiHeader.rentAmount).toBe("—");
  });

  test("KPI header shows dash when no lease", () => {
    const data = makeActiveDashboardData({ lease: null });
    const vm = toTenantDashboardViewModel(data);

    expect(vm.kpiHeader.rentAmount).toBe("—");
    expect(vm.kpiHeader.leaseUnit).toBe("—");
    expect(vm.kpiHeader.propertyName).toBe("—");
  });

  test("KPI header uses enriched unit_number and property_name", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.kpiHeader.leaseUnit).toBe("3B");
    expect(vm.kpiHeader.propertyName).toBe("Oak Terrace Apartments");
    expect(vm.kpiHeader.leaseAddress).toContain("Unit 3B");
    expect(vm.kpiHeader.leaseAddress).toContain("Oak Terrace Apartments");
  });

  test("KPI header falls back to unit_id when unit_number is absent", () => {
    const data = makeActiveDashboardData({
      lease: { ...activeLease, unit_number: undefined, property_name: undefined },
    });
    const vm = toTenantDashboardViewModel(data);

    expect(vm.kpiHeader.leaseUnit).toBe("unit1");
    expect(vm.kpiHeader.propertyName).toBe("—");
  });

  test("action cards include 4 quick actions", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.actionCards.actions).toHaveLength(4);
    expect(vm.actionCards.actions[0].label).toBe("Pay Rent");
  });

  test("payments widget source is stub", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.payments.source).toBe("stub");
    expect(vm.payments.recentPayments).toEqual([]);
  });

  test("maintenance widget source is stub", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.maintenance.source).toBe("stub");
    expect(vm.maintenance.recentRequests).toEqual([]);
  });

  test("documents widget source matches data", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.documents.source).toBe("stub");
    expect(vm.documents.hasDocuments).toBe(false);
  });

  test("notifications widget source is live", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.notifications.source).toBe("live");
  });

  test("lease dates are formatted", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.kpiHeader.leaseDates).toContain("Jan 2024");
    expect(vm.kpiHeader.leaseDates).toContain("Dec 2026");
  });
});
