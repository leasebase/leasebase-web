import { toTenantDashboardViewModel, computePaymentStatus } from "@/services/tenant/viewModel";
import type { TenantDashboardData, LeaseRow, PaymentRow } from "@/services/tenant/types";

/* ── Fixtures ── */

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
      ledger_entry_id: null,
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
      ledger_entry_id: null,
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
      ledger_entry_id: null,
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

  test("KPI header formats rent amount", () => {
    const data = makeActiveDashboardData();
    const vm = toTenantDashboardViewModel(data);

    expect(vm.kpiHeader.rentAmount).toBe("$1,450");
    expect(vm.kpiHeader.rentAmountCents).toBe(145000);
  });

  test("KPI header shows dash when no lease", () => {
    const data = makeActiveDashboardData({ lease: null });
    const vm = toTenantDashboardViewModel(data);

    expect(vm.kpiHeader.rentAmount).toBe("—");
    expect(vm.kpiHeader.leaseUnit).toBe("—");
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
