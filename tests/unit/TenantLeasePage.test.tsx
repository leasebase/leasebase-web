/**
 * TenantLeasePage — Rendering Tests
 *
 * Validates:
 * - Loading state shown while fetching
 * - Active lease renders property/unit/financial details
 * - Pre-active lease renders with appropriate status messaging
 * - No-lease state shows correct empty state
 * - Owner persona still gets the owner leases list (via page.tsx branching — not tested here)
 */

import { render, screen, waitFor } from "@testing-library/react";

/* ── Mocks ── */

const mockFetchTenantLeases = jest.fn();
jest.mock("@/services/tenant/adapters/leaseAdapter", () => ({
  fetchTenantLeases: () => mockFetchTenantLeases(),
}));

jest.mock("@/lib/auth/store", () => ({
  authStore: {
    getState: () => ({ selectedOrgId: "org1", user: { orgId: "org1" } }),
  },
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

import { TenantLeasePage } from "@/components/tenant/TenantLeasePage";

/* ── Fixtures ── */

const activeLease = {
  id: "l1",
  organization_id: "org1",
  unit_id: "unit1",
  unit_number: "3B",
  property_name: "Oak Terrace Apartments",
  property_address: "123 Oak Ave, Springfield, IL 62701",
  organization_name: "PM Alpha",
  term_type: "TWELVE_MONTH",
  start_date: "2026-01-01",
  end_date: "2027-01-01",
  deposit_amount: 145000,
  rent_amount: 145000,
  status: "ACTIVE" as const,
  created_at: "2026-01-01T00:00:00Z",
};

const assignedLease = {
  ...activeLease,
  id: "l2",
  status: "ASSIGNED" as const,
};

/* ── Tests ── */

beforeEach(() => {
  mockFetchTenantLeases.mockReset();
});

describe("TenantLeasePage", () => {
  test("shows loading skeleton while fetching", () => {
    mockFetchTenantLeases.mockReturnValue(new Promise(() => {}));
    render(<TenantLeasePage />);
    // LeaseDetailSkeleton renders a set of skeleton elements
    // Just verify there is no page content yet
    expect(screen.queryByText("My Lease")).not.toBeInTheDocument();
  });

  test("renders active lease with property and unit context", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [activeLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("My Lease")).toBeInTheDocument();
    });

    expect(screen.getByText("Oak Terrace Apartments")).toBeInTheDocument();
    expect(screen.getByText(/Unit 3B/)).toBeInTheDocument();
    expect(screen.getByText(/123 Oak Ave/)).toBeInTheDocument();
    // Active status appears in badge and in detail row — use getAllBy
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
  });

  test("renders rent and deposit amounts for active lease", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [activeLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("My Lease")).toBeInTheDocument();
    });

    expect(screen.getAllByText("$1,450").length).toBeGreaterThanOrEqual(1);
  });

  test("enables Pay Rent action for active lease", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [activeLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("My Lease")).toBeInTheDocument();
    });

    const payRentLink = screen.getByRole("link", { name: /Pay Rent/i });
    expect(payRentLink).toBeInTheDocument();
    expect(payRentLink).toHaveAttribute("href", "/app/pay-rent");
  });

  test("renders pre-active lease with status label", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [assignedLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("My Lease")).toBeInTheDocument();
    });

    // Assigned appears in badge and detail row
    expect(screen.getAllByText("Assigned").length).toBeGreaterThanOrEqual(1);
    // CTAs for inactive lease are disabled (not links)
    expect(screen.queryByRole("link", { name: /Pay Rent/i })).not.toBeInTheDocument();
    // Note about activation
    expect(screen.getByText(/Pay Rent and Maintenance will be available/i)).toBeInTheDocument();
  });

  test("renders no-lease empty state when tenant has no leases", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("No lease found")).toBeInTheDocument();
    });
  });

  test("shows error state when fetch fails", async () => {
    mockFetchTenantLeases.mockRejectedValue(new Error("Network error"));
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  test("renders multi-lease summary for tenants with multiple leases", async () => {
    const secondLease = {
      ...activeLease,
      id: "l2",
      organization_id: "org2",
      property_name: "Maple Heights",
      unit_number: "101",
      status: "ACTIVE" as const,
    };
    mockFetchTenantLeases.mockResolvedValue({
      data: [activeLease, secondLease],
      source: "live",
      error: null,
    });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("My Lease")).toBeInTheDocument();
    });

    expect(screen.getByText(/Other leases/i)).toBeInTheDocument();
    expect(screen.getByText(/Maple Heights/)).toBeInTheDocument();
  });
});
