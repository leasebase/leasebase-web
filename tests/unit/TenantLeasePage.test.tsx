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
const mockFetchTenantProfile = jest.fn();
const mockFetchTenantDocuments = jest.fn();

jest.mock("@/services/tenant/adapters/leaseAdapter", () => ({
  fetchTenantLeases: () => mockFetchTenantLeases(),
}));

jest.mock("@/services/tenant/adapters/profileAdapter", () => ({
  fetchTenantProfile: () => mockFetchTenantProfile(),
}));

jest.mock("@/services/tenant/adapters/documentAdapter", () => ({
  fetchTenantDocuments: () => mockFetchTenantDocuments(),
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

const defaultProfile = { data: { id: "tp1", user_id: "u1", name: "Jane Doe", email: "jane@example.com", phone: null, lease_id: "l1", emergency_contact: null, notification_preferences: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }, source: "live", error: null };
const defaultDocs = { data: [], source: "live", error: null };

beforeEach(() => {
  mockFetchTenantLeases.mockReset();
  mockFetchTenantProfile.mockReset();
  mockFetchTenantDocuments.mockReset();
  mockFetchTenantProfile.mockResolvedValue(defaultProfile);
  mockFetchTenantDocuments.mockResolvedValue(defaultDocs);
});

describe("TenantLeasePage", () => {
  test("shows loading skeleton while fetching", () => {
    mockFetchTenantLeases.mockReturnValue(new Promise(() => {}));
    mockFetchTenantProfile.mockReturnValue(new Promise(() => {}));
    mockFetchTenantDocuments.mockReturnValue(new Promise(() => {}));
    render(<TenantLeasePage />);
    expect(screen.queryByText("Lease Details")).not.toBeInTheDocument();
  });

  test("renders active lease with property and unit context", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [activeLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("Lease Details")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Oak Terrace Apartments/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Unit 3B/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/123 Oak Ave/)).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
  });

  test("renders rent and deposit amounts for active lease", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [activeLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("Lease Details")).toBeInTheDocument();
    });

    expect(screen.getAllByText("$1,450").length).toBeGreaterThanOrEqual(1);
  });

  test("renders lease period and financial sections", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [activeLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("Lease Details")).toBeInTheDocument();
    });

    expect(screen.getByText("Lease Period")).toBeInTheDocument();
    expect(screen.getByText("Financial Terms")).toBeInTheDocument();
    expect(screen.getByText("Property Information")).toBeInTheDocument();
  });

  test("renders pre-active lease with status label", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [assignedLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("Lease Details")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Assigned").length).toBeGreaterThanOrEqual(1);
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

  test("renders lease renewal card when end date is available", async () => {
    mockFetchTenantLeases.mockResolvedValue({ data: [activeLease], source: "live", error: null });
    render(<TenantLeasePage />);

    await waitFor(() => {
      expect(screen.getByText("Lease Details")).toBeInTheDocument();
    });

    expect(screen.getByText("Lease Renewal")).toBeInTheDocument();
  });
});
