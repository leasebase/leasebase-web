/**
 * Tenant Pages — Rendering Tests
 *
 * Validates:
 * - Owner tenant list renders with data
 * - PM tenant list still renders
 * - Tenant detail page renders for owner (with tabs)
 * - Tenant detail page renders for PM
 * - Deactivate/reactivate buttons appear correctly
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";

/* ── Mocks ── */

const mockAuthStore = jest.fn();
jest.mock("@/lib/auth/store", () => ({
  authStore: () => mockAuthStore(),
}));

const mockFetchTenants = jest.fn();
const mockFetchTenant = jest.fn();
const mockDeactivateTenant = jest.fn();
const mockReactivateTenant = jest.fn();
const mockFetchTenantLeases = jest.fn();
const mockFetchTenantPayments = jest.fn();
const mockFetchTenantMaintenance = jest.fn();

jest.mock("@/services/tenants/tenantApiService", () => ({
  fetchTenants: (...args: unknown[]) => mockFetchTenants(...args),
  fetchTenant: (...args: unknown[]) => mockFetchTenant(...args),
  deactivateTenant: (...args: unknown[]) => mockDeactivateTenant(...args),
  reactivateTenant: (...args: unknown[]) => mockReactivateTenant(...args),
  fetchTenantLeases: (...args: unknown[]) => mockFetchTenantLeases(...args),
  fetchTenantPayments: (...args: unknown[]) => mockFetchTenantPayments(...args),
  fetchTenantMaintenance: (...args: unknown[]) => mockFetchTenantMaintenance(...args),
}));

const mockFetchPMTenants = jest.fn();
const mockFetchPMTenant = jest.fn();

jest.mock("@/services/pm/pmApiService", () => ({
  fetchPMTenants: (...args: unknown[]) => mockFetchPMTenants(...args),
  fetchPMTenant: (...args: unknown[]) => mockFetchPMTenant(...args),
}));

jest.mock("@/services/invitations/invitationApiService", () => ({
  createInvitation: jest.fn(),
}));

jest.mock("@/services/properties/propertyService", () => ({
  fetchProperties: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
  fetchUnitsForProperty: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
}));

jest.mock("@/lib/intelligence/deriveActions", () => ({
  deriveTenantDetailInsights: () => [],
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "tp-1" }),
}));

/* ── Fixtures ── */

const ownerUser = { persona: "owner", role: "OWNER", name: "Owner" };
const pmUser = { persona: "propertyManager", role: "PM_STAFF", name: "PM" };

const tenantListData = {
  data: [
    {
      id: "tp-1", user_id: "u1", name: "Jane Doe", email: "jane@test.com",
      phone: "555-1234", status: "ACTIVE", lease_status: "ACTIVE",
      property_name: "Sunset Apt", unit_number: "4B",
      emergency_contact: null, move_in_date: null, move_out_date: null,
      notes: null, lease_id: "l1", property_id: "p1", unit_id: "u1",
      created_at: "2024-01-01", updated_at: "2024-01-01",
    },
  ],
  meta: { page: 1, limit: 20, total: 1, hasMore: false },
};

const tenantDetail = {
  data: {
    ...tenantListData.data[0],
    start_date: "2024-01-01",
    end_date: "2025-12-31",
    monthly_rent: 150000,
  },
};

const deactivatedTenantDetail = {
  data: {
    ...tenantDetail.data,
    status: "DEACTIVATED",
  },
};

const pmTenantList = {
  data: [
    { id: "tp-1", name: "PM Tenant", email: "pm@test.com", phone: null, unit_number: "1A", property_name: "Oak Tower", user_id: "u1", lease_id: "l1" },
  ],
  meta: { page: 1, limit: 20, total: 1, hasMore: false },
};

const pmTenantDetail = {
  data: {
    ...pmTenantList.data[0],
    property_id: "p1", start_date: "2024-01-01", end_date: "2025-12-31",
    rent_amount: 120000, lease_status: "ACTIVE",
  },
};

/* ── Setup ── */

beforeEach(() => {
  mockAuthStore.mockReset();
  mockFetchTenants.mockReset();
  mockFetchTenant.mockReset();
  mockDeactivateTenant.mockReset();
  mockReactivateTenant.mockReset();
  mockFetchTenantLeases.mockReset().mockResolvedValue({ data: [], meta: {} });
  mockFetchTenantPayments.mockReset().mockResolvedValue({ data: [], meta: {} });
  mockFetchTenantMaintenance.mockReset().mockResolvedValue({ data: [], meta: {} });
  mockFetchPMTenants.mockReset();
  mockFetchPMTenant.mockReset();
});

/* ── Tests: Tenant List Page ── */

describe("Tenant List Page", () => {
  let TenantsPage: () => JSX.Element;

  beforeAll(async () => {
    const mod = await import("@/app/(dashboard)/app/tenants/page");
    TenantsPage = mod.default;
  });

  test("renders owner tenant list with data", async () => {
    mockAuthStore.mockReturnValue({ user: ownerUser });
    mockFetchTenants.mockResolvedValue(tenantListData);

    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
    expect(screen.getByText(/Sunset Apt/)).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  test("renders search input for owner", async () => {
    mockAuthStore.mockReturnValue({ user: ownerUser });
    mockFetchTenants.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, hasMore: false } });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    });
  });

  test("renders PM tenant list (existing behavior)", async () => {
    mockAuthStore.mockReturnValue({ user: pmUser });
    mockFetchPMTenants.mockResolvedValue(pmTenantList);

    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText("PM Tenant")).toBeInTheDocument();
    });
  });

  test("shows empty state for owner with no tenants", async () => {
    mockAuthStore.mockReturnValue({ user: ownerUser });
    mockFetchTenants.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, hasMore: false } });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText("No tenants")).toBeInTheDocument();
    });
  });
});

/* ── Tests: Tenant Detail Page ── */

describe("Tenant Detail Page", () => {
  let TenantDetailPage: () => JSX.Element;

  beforeAll(async () => {
    const mod = await import("@/app/(dashboard)/app/tenants/[id]/page");
    TenantDetailPage = mod.default;
  });

  test("renders owner tenant detail with profile tab", async () => {
    mockAuthStore.mockReturnValue({ user: ownerUser });
    mockFetchTenant.mockResolvedValue(tenantDetail);

    render(<TenantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
    // Tabs should be visible
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Leases")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
  });

  test("shows Deactivate button for ACTIVE tenant", async () => {
    mockAuthStore.mockReturnValue({ user: ownerUser });
    mockFetchTenant.mockResolvedValue(tenantDetail);

    render(<TenantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Deactivate")).toBeInTheDocument();
    });
  });

  test("shows Reactivate button for DEACTIVATED tenant", async () => {
    mockAuthStore.mockReturnValue({ user: ownerUser });
    mockFetchTenant.mockResolvedValue(deactivatedTenantDetail);

    render(<TenantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactivate")).toBeInTheDocument();
    });
  });

  test("renders PM tenant detail (existing behavior)", async () => {
    mockAuthStore.mockReturnValue({ user: pmUser });
    mockFetchPMTenant.mockResolvedValue(pmTenantDetail);

    render(<TenantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("PM Tenant")).toBeInTheDocument();
    });
  });

  test("switching to Leases tab fetches lease history", async () => {
    mockAuthStore.mockReturnValue({ user: ownerUser });
    mockFetchTenant.mockResolvedValue(tenantDetail);
    mockFetchTenantLeases.mockResolvedValue({
      data: [{ id: "l-1", status: "ACTIVE", start_date: "2024-01-01", end_date: "2025-12-31", rent_amount: 150000, monthly_rent: 150000, property_name: "Sunset", unit_number: "4B", created_at: "2024-01-01" }],
      meta: { page: 1, limit: 20, total: 1, hasMore: false },
    });

    render(<TenantDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Leases")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Leases"));

    await waitFor(() => {
      expect(mockFetchTenantLeases).toHaveBeenCalledWith("tp-1");
    });
  });
});
