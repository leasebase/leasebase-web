/**
 * Lease Management Integration Test
 *
 * Higher-level tests covering:
 * 1. Lease list page loads and displays leases
 * 2. List page shows skeleton, empty state, and error banner
 * 3. Create page submits and redirects to detail
 * 4. Persona guard blocks non-owner/PM access
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ── Mocks ── */

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "l1" }),
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => {
  const icon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    __esModule: true,
    FileText: icon("FileText"),
    Plus: icon("Plus"),
    ChevronRight: icon("ChevronRight"),
    ArrowUp: icon("ArrowUp"),
    ArrowDown: icon("ArrowDown"),
    ArrowUpDown: icon("ArrowUpDown"),
    Search: icon("Search"),
    ChevronLeft: icon("ChevronLeft"),
    ChevronsLeft: icon("ChevronsLeft"),
    ChevronsRight: icon("ChevronsRight"),
    X: icon("X"),
    FilePlus: icon("FilePlus"),
    CheckCircle: icon("CheckCircle"),
    Mail: icon("Mail"),
    Upload: icon("Upload"),
    FileCheck: icon("FileCheck"),
    AlertTriangle: icon("AlertTriangle"),
    Clock: icon("Clock"),
    Calendar: icon("Calendar"),
    DollarSign: icon("DollarSign"),
  };
});

// Mock auth store — default is owner
// authStore() is used as a hook in pages; authStore.getState() is used in TenantLeasePage
let mockUser: any = { persona: "owner" as const, role: "OWNER", name: "Test Owner" };
jest.mock("@/lib/auth/store", () => ({
  authStore: Object.assign(
    () => ({ user: mockUser }),
    { getState: () => ({ user: mockUser, selectedOrgId: mockUser?.orgId ?? null }) },
  ),
}));

// Mock TenantLeasePage to avoid icon/adapter dependency issues in this integration test
// The TenantLeasePage itself is exercised in TenantLeasePage.test.tsx
jest.mock("@/components/tenant/TenantLeasePage", () => ({
  TenantLeasePage: () => <div>My Lease</div>,
}));

// Also keep fetchTenantLeases mock stub (used by TenantLeasePage before our mock takes effect)
const mockFetchTenantLeases = jest.fn();
jest.mock("@/services/tenant/adapters/leaseAdapter", () => ({
  fetchTenantLeases: () => mockFetchTenantLeases(),
}));

// Mock lease service
const mockFetchLeases = jest.fn();
const mockCreateLease = jest.fn();

jest.mock("@/services/leases/leaseService", () => ({
  fetchLeases: () => mockFetchLeases(),
  fetchLease: jest.fn(),
  createLease: (dto: any) => mockCreateLease(dto),
  updateLease: jest.fn(),
  terminateLease: jest.fn(),
  renewLease: jest.fn(),
}));

// Mock invitation service (used by InviteStep in create-lease flow)
const mockCreateInvitation = jest.fn();
jest.mock("@/services/invitations/invitationApiService", () => ({
  createInvitation: (dto: any) => mockCreateInvitation(dto),
  InvitationApiError: class InvitationApiError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  },
}));

// Mock property service (for LeaseForm)
jest.mock("@/services/properties/propertyService", () => ({
  fetchProperties: jest.fn().mockResolvedValue({
    data: [{ id: "p1", name: "Sunset" }],
    meta: { page: 1, limit: 200, total: 1, totalPages: 1 },
  }),
  fetchUnitsForProperty: jest.fn().mockResolvedValue({
    data: [{ id: "u1", unit_number: "101" }],
    meta: { page: 1, limit: 200, total: 1, totalPages: 1 },
  }),
}));

/* ── Fixtures ── */

const now = new Date().toISOString();

const lease1 = {
  id: "l1",
  org_id: "org-1",
  property_id: "p1",
  unit_id: "u1",
  term_type: "TWELVE_MONTH",
  status: "ACTIVE",
  start_date: "2026-01-01T00:00:00Z",
  end_date: "2026-12-31T00:00:00Z",
  rent_amount: 150000,
  security_deposit: 300000,
  lease_terms: null,
  created_at: now,
  updated_at: now,
  property_name: "Sunset Apartments",
  unit_number: "101",
  tenants: [{ id: "t1", name: "John Doe", role: "PRIMARY" }],
};

/* ── Tests ── */

beforeEach(() => {
  mockFetchLeases.mockReset();
  mockCreateLease.mockReset();
  mockCreateInvitation.mockReset();
  mockPush.mockReset();
  mockFetchTenantLeases.mockReset().mockResolvedValue({ data: [], source: "live", error: null });
  mockUser = { persona: "owner" as const, role: "OWNER", name: "Test Owner" };
});

describe("Lease Management Integration", () => {
  describe("Leases list page", () => {
    let LeasesPage: any;

    beforeAll(async () => {
      const mod = await import("@/app/(dashboard)/app/leases/page");
      LeasesPage = mod.default;
    });

    test("loads and displays leases", async () => {
      mockFetchLeases.mockResolvedValueOnce({
        data: [lease1],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });

      render(<LeasesPage />);

      await waitFor(() => {
        expect(screen.getByText("Sunset Apartments")).toBeInTheDocument();
      });
    });

    test("shows empty state when no leases", async () => {
      mockFetchLeases.mockResolvedValueOnce({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });

      render(<LeasesPage />);

      await waitFor(() => {
        expect(screen.getByText(/no leases yet/i)).toBeInTheDocument();
      });
    });

    test("shows error banner on API failure", async () => {
      mockFetchLeases.mockRejectedValueOnce(new Error("Network error"));

      render(<LeasesPage />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Network error");
      });
    });

    test("tenant persona sees TenantLeasePage (not owner block message)", async () => {
      mockUser = { persona: "tenant" as const, role: "TENANT", name: "Test Tenant" };
      // Tenant gets TenantLeasePage which fetches asynchronously — stub returns empty
      mockFetchTenantLeases.mockResolvedValue({ data: [], source: "live", error: null });

      render(<LeasesPage />);

      // Owner "not available" block should NOT appear
      expect(screen.queryByText(/not available/i)).not.toBeInTheDocument();

      // Tenant eventually sees the "My Lease" page heading
      await waitFor(() => {
        expect(screen.getByText("My Lease")).toBeInTheDocument();
      });
    });
  });

  describe("Create lease page", () => {
    let CreatePage: any;

    beforeAll(async () => {
      const mod = await import("@/app/(dashboard)/app/leases/new/page");
      CreatePage = mod.default;
    });

    test("existing lease track calls createLease with EXISTING_LEASE mode", async () => {
      mockCreateLease.mockResolvedValueOnce({ data: { id: "new-lease", property_id: "p1", unit_id: "u1" } });
      const user = userEvent.setup();

      render(<CreatePage />);

      // Step 0: Choose track
      // Wait for the choose-track step to render
      await user.click(screen.getByRole('button', { name: /existing lease/i }));

      // Step 1: Fill lease form
      await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/property/i), "p1");
      await waitFor(() => expect(screen.getByText("Unit 101")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/unit/i), "u1");
      await user.type(screen.getByLabelText(/start date/i), "2026-01-01");
      await user.click(screen.getByRole("button", { name: /create lease/i }));

      await waitFor(() => {
        expect(mockCreateLease).toHaveBeenCalledTimes(1);
        expect(mockCreateLease).toHaveBeenCalledWith(
          expect.objectContaining({ activationMode: "EXISTING_LEASE" }),
        );
      });
    });

    test("existing lease track: upload step then invite, skip redirects to /app/leases", async () => {
      mockCreateLease.mockResolvedValueOnce({
        data: { id: "new-lease", property_id: "p1", unit_id: "u1" },
      });
      const user = userEvent.setup();

      render(<CreatePage />);

      // Choose existing
      // Wait for the choose-track step to render
      await user.click(screen.getByRole('button', { name: /existing lease/i }));

      // Fill lease form
      await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/property/i), "p1");
      await waitFor(() => expect(screen.getByText("Unit 101")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/unit/i), "u1");
      await user.type(screen.getByLabelText(/start date/i), "2026-01-01");
      await user.click(screen.getByRole("button", { name: /create lease/i }));

      // Upload step: skip
      await waitFor(() => expect(screen.getByText(/skip & continue/i)).toBeInTheDocument());
      await user.click(screen.getByText(/skip & continue/i));

      // Invite step: skip
      await waitFor(() => expect(screen.getByRole("button", { name: /skip for now/i })).toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: /skip for now/i }));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/app/leases"));
    });

    test("server error on lease creation displays error banner", async () => {
      mockCreateLease.mockRejectedValueOnce(new Error("Unit already has an active lease"));
      const user = userEvent.setup();

      render(<CreatePage />);

      // Choose existing
      // Wait for the choose-track step to render
      await user.click(screen.getByRole('button', { name: /existing lease/i }));

      // Fill lease form
      await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/property/i), "p1");
      await waitFor(() => expect(screen.getByText("Unit 101")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/unit/i), "u1");
      await user.type(screen.getByLabelText(/start date/i), "2026-01-01");
      await user.click(screen.getByRole("button", { name: /create lease/i }));

      await waitFor(() => {
        expect(screen.getByText(/unit already has an active lease/i)).toBeInTheDocument();
      });
    });

    test("persona guard blocks non-owner/PM access", async () => {
      mockUser = { persona: "tenant" as const, role: "TENANT", name: "Test Tenant" };

      render(<CreatePage />);

      expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
    });
  });
});
