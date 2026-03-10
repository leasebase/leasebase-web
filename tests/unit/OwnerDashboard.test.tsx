import { render, screen, waitFor } from "@testing-library/react";
import { OwnerDashboard } from "@/components/dashboards/OwnerDashboard";
import type { OwnerDashboardData } from "@/services/dashboard/types";

/* ── Mock the service module ── */

const mockFetchOwnerDashboard = jest.fn<Promise<OwnerDashboardData>, []>();

jest.mock("@/services/dashboard/ownerDashboardService", () => ({
  fetchOwnerDashboard: () => mockFetchOwnerDashboard(),
}));

/* ── Mock next/link to avoid router context issues in tests ── */

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

/* ── Fixtures ── */

function sourced(value: number, source: "live" | "stub" | "unavailable" = "live") {
  return { value, source };
}

const activeDashboard: OwnerDashboardData = {
  kpis: {
    totalProperties: sourced(3),
    totalUnits: sourced(10),
    occupiedUnits: sourced(8),
    vacancyRate: sourced(20),
    monthlyScheduledRent: sourced(500000),
    collectedThisMonth: sourced(400000),
    overdueAmount: sourced(50000),
    openMaintenanceRequests: sourced(2),
  },
  alerts: [
    { type: "LATE_RENT", severity: "danger", count: 1, message: "1 rent payment overdue", link: "/app/payments" },
  ],
  recentActivity: [
    { id: "e1", type: "PAYMENT_RECEIVED", title: "Payment received", description: "$1,450 from Alice", timestamp: new Date().toISOString(), link: "/app/payments" },
  ],
  portfolioHealth: {
    occupancyRate: sourced(80),
    collectionRate: sourced(80),
    openWorkOrders: sourced(2),
    trendAvailable: false,
  },
  properties: [
    { id: "p1", name: "Main St", address: "123 Main", totalUnits: 5, occupiedUnits: 4, occupancyRate: 80 },
  ],
  setupStage: "active",
  domainErrors: {
    properties: null, units: null, leases: null,
    payments: null, ledger: null, maintenance: null, activity: null,
  },
};

const noPropertiesDashboard: OwnerDashboardData = {
  ...activeDashboard,
  kpis: {
    totalProperties: sourced(0),
    totalUnits: sourced(0),
    occupiedUnits: sourced(0),
    vacancyRate: sourced(0),
    monthlyScheduledRent: sourced(0),
    collectedThisMonth: sourced(0),
    overdueAmount: sourced(0),
    openMaintenanceRequests: sourced(0),
  },
  alerts: [],
  properties: [],
  setupStage: "no-properties",
};

const partialFailureDashboard: OwnerDashboardData = {
  ...activeDashboard,
  kpis: {
    ...activeDashboard.kpis,
    totalUnits: sourced(0, "unavailable"),
    occupiedUnits: sourced(0, "unavailable"),
    vacancyRate: sourced(0, "unavailable"),
  },
  domainErrors: {
    ...activeDashboard.domainErrors,
    units: "Could not fetch units",
  },
};

/* ── Tests ── */

beforeEach(() => {
  mockFetchOwnerDashboard.mockReset();
});

describe("OwnerDashboard", () => {
  test("shows loading skeleton initially", () => {
    mockFetchOwnerDashboard.mockReturnValue(new Promise(() => {})); // never resolves
    render(<OwnerDashboard />);
    expect(screen.getByLabelText("Loading dashboard")).toBeInTheDocument();
  });

  test("renders empty state for no-properties stage", async () => {
    mockFetchOwnerDashboard.mockResolvedValue(noPropertiesDashboard);
    render(<OwnerDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Welcome to LeaseBase")).toBeInTheDocument();
    });
    expect(screen.getByText("Add your first property")).toBeInTheDocument();
  });

  test("renders active dashboard with KPIs and alerts", async () => {
    mockFetchOwnerDashboard.mockResolvedValue(activeDashboard);
    render(<OwnerDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Owner dashboard")).toBeInTheDocument();
    });

    // KPIs rendered — use getAllByText since "Properties" appears in both KPI label and summary heading
    expect(screen.getAllByText("Properties").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3")).toBeInTheDocument();

    // Alert rendered
    expect(screen.getByText("1 rent payment overdue")).toBeInTheDocument();

    // Properties summary
    expect(screen.getByText("Main St")).toBeInTheDocument();
  });

  test("renders gracefully with partial domain failure", async () => {
    mockFetchOwnerDashboard.mockResolvedValue(partialFailureDashboard);
    render(<OwnerDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Owner dashboard")).toBeInTheDocument();
    });

    // Properties KPI is still live
    expect(screen.getByText("3")).toBeInTheDocument();

    // Unavailable KPIs show "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  test("shows error when service completely fails", async () => {
    mockFetchOwnerDashboard.mockRejectedValue(new Error("Network error"));
    render(<OwnerDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
