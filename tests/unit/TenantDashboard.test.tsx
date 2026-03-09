import { render, screen, waitFor } from "@testing-library/react";
import { TenantDashboard } from "@/components/dashboards/TenantDashboard";
import type { TenantDashboardData } from "@/services/tenant/types";

/* ── Mock the service module ── */

const mockFetchTenantDashboard = jest.fn<Promise<TenantDashboardData>, []>();

jest.mock("@/services/tenant/tenantDashboardService", () => ({
  fetchTenantDashboard: () => mockFetchTenantDashboard(),
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

const activeDashboard: TenantDashboardData = {
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
  lease: {
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
  },
  payments: [],
  recentPayments: [],
  maintenanceRequests: [],
  openMaintenanceCount: 0,
  documents: [],
  notifications: [
    {
      id: "n1",
      organization_id: "org1",
      recipient_user_id: "u1",
      sender_user_id: "admin1",
      title: "Maintenance update",
      body: "Your faucet repair is scheduled",
      type: "maintenance",
      related_type: "work_order",
      related_id: "wo1",
      read_at: null,
      created_at: new Date().toISOString(),
    },
  ],
  unreadNotificationCount: 1,
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
};

const noProfileDashboard: TenantDashboardData = {
  ...activeDashboard,
  profile: null,
  lease: null,
  setupStage: "no-profile",
  sources: {
    ...activeDashboard.sources,
    profile: "unavailable",
    lease: "live",
  },
  domainErrors: {
    ...activeDashboard.domainErrors,
    profile: "Failed to fetch tenant profile",
  },
};

const noLeaseDashboard: TenantDashboardData = {
  ...activeDashboard,
  lease: null,
  setupStage: "no-lease",
  sources: {
    ...activeDashboard.sources,
    lease: "unavailable",
  },
};

/* ── Tests ── */

beforeEach(() => {
  mockFetchTenantDashboard.mockReset();
});

describe("TenantDashboard", () => {
  test("shows loading skeleton initially", () => {
    mockFetchTenantDashboard.mockReturnValue(new Promise(() => {})); // never resolves
    render(<TenantDashboard />);
    expect(screen.getByLabelText("Loading dashboard")).toBeInTheDocument();
  });

  test('renders "no-profile" empty state when profile is unavailable', async () => {
    mockFetchTenantDashboard.mockResolvedValue(noProfileDashboard);
    render(<TenantDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Tenant context unavailable")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/tenant context endpoint/i).length).toBeGreaterThanOrEqual(1);
  });

  test('renders "no-lease" empty state', async () => {
    mockFetchTenantDashboard.mockResolvedValue(noLeaseDashboard);
    render(<TenantDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No active lease found")).toBeInTheDocument();
    });
  });

  test("renders active dashboard with KPIs and widgets", async () => {
    mockFetchTenantDashboard.mockResolvedValue(activeDashboard);
    render(<TenantDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Tenant dashboard")).toBeInTheDocument();
    });

    // KPI header
    expect(screen.getByText("$1,450")).toBeInTheDocument();

    // Quick actions
    expect(screen.getByText("Pay Rent")).toBeInTheDocument();

    // Stubbed widgets show provenance labels
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getAllByText("Maintenance").length).toBeGreaterThanOrEqual(1);

    // Notification rendered
    expect(screen.getByText("Maintenance update")).toBeInTheDocument();
  });

  test("shows error when service completely fails", async () => {
    mockFetchTenantDashboard.mockRejectedValue(new Error("Network error"));
    render(<TenantDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
