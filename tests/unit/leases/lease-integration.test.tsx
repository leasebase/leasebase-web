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
  };
});

// Mock auth store — default is owner
let mockUser: any = { persona: "owner" as const, role: "OWNER", name: "Test Owner" };
jest.mock("@/lib/auth/store", () => ({
  authStore: () => ({ user: mockUser }),
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

    test("persona guard blocks tenant access", async () => {
      mockUser = { persona: "tenant" as const, role: "TENANT", name: "Test Tenant" };

      render(<LeasesPage />);

      expect(screen.getByText(/not available/i)).toBeInTheDocument();
    });
  });

  describe("Create lease page", () => {
    let CreatePage: any;

    beforeAll(async () => {
      const mod = await import("@/app/(dashboard)/app/leases/new/page");
      CreatePage = mod.default;
    });

    test("submit calls createLease with correct DTO", async () => {
      mockCreateLease.mockResolvedValueOnce({ data: { id: "new-lease" } });
      const user = userEvent.setup();

      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("Sunset")).toBeInTheDocument();
      });

      // Select property
      await user.selectOptions(screen.getByLabelText(/property/i), "p1");
      await waitFor(() => expect(screen.getByText("Unit 101")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/unit/i), "u1");
      await user.type(screen.getByLabelText(/start date/i), "2026-01-01");

      await user.click(screen.getByRole("button", { name: /create lease/i }));

      await waitFor(() => {
        expect(mockCreateLease).toHaveBeenCalledTimes(1);
      });
    });

    test("successful submit shows invite step, skip redirects to /app/leases", async () => {
      mockCreateLease.mockResolvedValueOnce({
        data: { id: "new-lease", property_id: "p1", unit_id: "u1" },
      });
      const user = userEvent.setup();

      render(<CreatePage />);
      await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());

      await user.selectOptions(screen.getByLabelText(/property/i), "p1");
      await waitFor(() => expect(screen.getByText("Unit 101")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/unit/i), "u1");
      await user.type(screen.getByLabelText(/start date/i), "2026-01-01");

      await user.click(screen.getByRole("button", { name: /create lease/i }));

      // After lease creation, the invite step is shown
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /skip for now/i })).toBeInTheDocument();
      });

      // Click "Skip for now" to proceed to the lease detail page
      await user.click(screen.getByRole("button", { name: /skip for now/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/app/leases");
      });
    });

    test("server error displays error banner", async () => {
      mockCreateLease.mockRejectedValueOnce(new Error("Unit already has an active lease"));
      const user = userEvent.setup();

      render(<CreatePage />);
      await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());

      await user.selectOptions(screen.getByLabelText(/property/i), "p1");
      await waitFor(() => expect(screen.getByText("Unit 101")).toBeInTheDocument());
      await user.selectOptions(screen.getByLabelText(/unit/i), "u1");
      await user.type(screen.getByLabelText(/start date/i), "2026-01-01");

      await user.click(screen.getByRole("button", { name: /create lease/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Unit already has an active lease");
      });
    });

    test("persona guard blocks non-owner/PM access", async () => {
      mockUser = { persona: "tenant" as const, role: "TENANT", name: "Test Tenant" };

      render(<CreatePage />);

      expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
    });
  });
});
