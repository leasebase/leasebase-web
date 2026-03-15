import { render, screen } from "@testing-library/react";
import { MaintenanceOverviewCard } from "@/components/dashboards/owner/MaintenanceOverviewCard";
import { computeMaintenanceOverview } from "@/services/dashboard/ownerDashboardService";
import type { MaintenanceOverviewViewModel, DomainResult } from "@/services/dashboard/types";
import type { MaintenanceStats } from "@/services/maintenance/maintenanceApiService";

/* ── Global polyfills for jsdom ── */

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

/* ── Mocks ── */

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

/* ── Helpers ── */

function liveResult<T>(data: T): DomainResult<T> {
  return { data, source: "live", error: null };
}

function unavailableResult<T>(data: T): DomainResult<T> {
  return { data, source: "unavailable", error: "Failed" };
}

/* ── MaintenanceOverviewCard rendering tests ── */

describe("MaintenanceOverviewCard", () => {
  test("renders live stats counts", () => {
    const vm: MaintenanceOverviewViewModel = {
      open: 5,
      inProgress: 3,
      waiting: 1,
      urgent: 2,
      oldestOpenAgeDays: 12,
      mostAffectedProperty: { id: "p1", name: "Main St", count: 4 },
      source: "live",
    };
    render(<MaintenanceOverviewCard vm={vm} />);

    expect(screen.getByText("5")).toBeInTheDocument(); // open
    expect(screen.getByText("3")).toBeInTheDocument(); // in progress
    expect(screen.getByText("1")).toBeInTheDocument(); // waiting
    expect(screen.getByText("2")).toBeInTheDocument(); // urgent
    expect(screen.getByText("Maintenance Overview")).toBeInTheDocument();
  });

  test("renders zero counts correctly", () => {
    const vm: MaintenanceOverviewViewModel = {
      open: 0,
      inProgress: 0,
      waiting: 0,
      urgent: 0,
      oldestOpenAgeDays: 0,
      mostAffectedProperty: null,
      source: "live",
    };
    render(<MaintenanceOverviewCard vm={vm} />);

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(4); // open, in progress, waiting, urgent
  });

  test("renders unavailable placeholder when source is unavailable", () => {
    const vm: MaintenanceOverviewViewModel = {
      open: 0,
      inProgress: 0,
      waiting: 0,
      urgent: 0,
      oldestOpenAgeDays: 0,
      mostAffectedProperty: null,
      source: "unavailable",
    };
    render(<MaintenanceOverviewCard vm={vm} />);
    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
  });

  test("renders link to /app/maintenance", () => {
    const vm: MaintenanceOverviewViewModel = {
      open: 1,
      inProgress: 0,
      waiting: 0,
      urgent: 0,
      oldestOpenAgeDays: 0,
      mostAffectedProperty: null,
      source: "live",
    };
    render(<MaintenanceOverviewCard vm={vm} />);
    expect(screen.getByText("View all →")).toHaveAttribute("href", "/app/maintenance");
  });

  test("shows oldest open age badge when > 0 days", () => {
    const vm: MaintenanceOverviewViewModel = {
      open: 1,
      inProgress: 0,
      waiting: 0,
      urgent: 0,
      oldestOpenAgeDays: 14,
      mostAffectedProperty: null,
      source: "live",
    };
    render(<MaintenanceOverviewCard vm={vm} />);
    expect(screen.getByText("14 days")).toBeInTheDocument();
  });

  test("shows most affected property when present", () => {
    const vm: MaintenanceOverviewViewModel = {
      open: 3,
      inProgress: 1,
      waiting: 0,
      urgent: 0,
      oldestOpenAgeDays: 0,
      mostAffectedProperty: { id: "p1", name: "Elm Ave", count: 3 },
      source: "live",
    };
    render(<MaintenanceOverviewCard vm={vm} />);
    expect(screen.getByText("Elm Ave")).toBeInTheDocument();
    expect(screen.getByText("3 requests")).toBeInTheDocument();
  });
});

/* ── computeMaintenanceOverview stats integration ── */

describe("computeMaintenanceOverview with stats", () => {
  const workOrders = [
    { id: "wo1", unit_id: "u1", status: "SUBMITTED", priority: "HIGH", description: "Leak", assignee_id: null, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: "wo2", unit_id: "u1", status: "IN_PROGRESS", priority: "MEDIUM", description: "Paint", assignee_id: "pm1", created_at: new Date().toISOString() },
    { id: "wo3", unit_id: "u2", status: "SUBMITTED", priority: "LOW", description: "Bulb", assignee_id: null, created_at: new Date().toISOString() },
  ];
  const units = [
    { id: "u1", property_id: "p1", status: "ACTIVE", rent_amount: 100000 },
    { id: "u2", property_id: "p2", status: "ACTIVE", rent_amount: 80000 },
  ];
  const properties = [
    { id: "p1", name: "Main St", address_line1: "123 Main", city: "NY", state: "NY", postal_code: "10001" },
    { id: "p2", name: "Elm Ave", address_line1: "456 Elm", city: "NY", state: "NY", postal_code: "10002" },
  ];

  test("uses stats endpoint counts when stats are live", () => {
    const statsData: MaintenanceStats = {
      submitted: 10,
      in_review: 0,
      scheduled: 0,
      in_progress: 7,
      completed: 3,
      closed: 1,
      cancelled: 0,
    };

    const result = computeMaintenanceOverview(
      liveResult(workOrders),
      liveResult(units),
      liveResult(properties),
      liveResult(statsData),
    );

    // open/inProgress come from stats, not client-side counting
    expect(result.open.value).toBe(10); // submitted
    expect(result.open.source).toBe("live");
    expect(result.inProgress.value).toBe(7);
    expect(result.inProgress.source).toBe("live");
  });

  test("falls back to client-side counting when stats unavailable", () => {
    const result = computeMaintenanceOverview(
      liveResult(workOrders),
      liveResult(units),
      liveResult(properties),
      unavailableResult({ submitted: 0, in_review: 0, scheduled: 0, in_progress: 0, completed: 0, closed: 0, cancelled: 0 }),
    );

    // Should count from work orders: 2 SUBMITTED, 1 IN_PROGRESS
    expect(result.open.value).toBe(2);
    expect(result.inProgress.value).toBe(1);
    expect(result.open.source).toBe("live"); // from maintenance list
  });

  test("falls back to client-side when stats not provided", () => {
    const result = computeMaintenanceOverview(
      liveResult(workOrders),
      liveResult(units),
      liveResult(properties),
    );

    expect(result.open.value).toBe(2);
    expect(result.inProgress.value).toBe(1);
  });

  test("still computes derived metrics (waiting, urgent) from full list even with stats", () => {
    const statsData: MaintenanceStats = {
      submitted: 10,
      in_review: 0,
      scheduled: 0,
      in_progress: 7,
      completed: 3,
      closed: 1,
      cancelled: 0,
    };

    const result = computeMaintenanceOverview(
      liveResult(workOrders),
      liveResult(units),
      liveResult(properties),
      liveResult(statsData),
    );

    // waiting: SUBMITTED, no assignee, >3 days old → wo1 matches (5 days old, no assignee)
    expect(result.waiting.value).toBe(1);
    // urgent: SUBMITTED or IN_PROGRESS with HIGH priority → wo1 is SUBMITTED + HIGH
    expect(result.urgent.value).toBe(1);
  });

  test("handles stats with missing keys gracefully", () => {
    // Stats might not have all keys if no work orders exist for a status
    const statsData = { submitted: 3 } as MaintenanceStats;

    const result = computeMaintenanceOverview(
      liveResult(workOrders),
      liveResult(units),
      liveResult(properties),
      liveResult(statsData),
    );

    expect(result.open.value).toBe(3); // submitted
    expect(result.inProgress.value).toBe(0); // missing key defaults to 0
  });
});
