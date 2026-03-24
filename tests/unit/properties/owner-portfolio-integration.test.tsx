/**
 * Owner Portfolio Integration Test
 *
 * Higher-level test covering the owner portfolio flow:
 * 1. Owner properties list page loads and displays properties
 * 2. Property detail page shows Overview/Units/Edit tabs
 * 3. Units tab shows units table
 * 4. 403 (Forbidden) error is surfaced correctly
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
const mockParams = { id: "p1" };
jest.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

// Mock lucide-react icons — must cover all icons used in the component tree
jest.mock("lucide-react", () => {
  const icon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    __esModule: true,
    Building2: icon("Building2"),
    Plus: icon("Plus"),
    DoorOpen: icon("DoorOpen"),
    ArrowUp: icon("ArrowUp"),
    ArrowDown: icon("ArrowDown"),
    ArrowUpDown: icon("ArrowUpDown"),
    Search: icon("Search"),
    ChevronRight: icon("ChevronRight"),
    ChevronLeft: icon("ChevronLeft"),
    ChevronsLeft: icon("ChevronsLeft"),
    ChevronsRight: icon("ChevronsRight"),
    AlertTriangle: icon("AlertTriangle"),
    CheckCircle: icon("CheckCircle"),
    Info: icon("Info"),
    X: icon("X"),
    MoreVertical: icon("MoreVertical"),
    Pencil: icon("Pencil"),
    ArrowLeft: icon("ArrowLeft"),
  };
});

// Mock auth store
const mockUser = { persona: "owner" as const, role: "OWNER", name: "Test Owner" };
jest.mock("@/lib/auth/store", () => ({
  authStore: () => ({ user: mockUser }),
}));

// Mock property service
const mockFetchPropertiesWithUnitCounts = jest.fn();
const mockFetchProperty = jest.fn();
const mockFetchUnitsForProperty = jest.fn();
const mockUpdateProperty = jest.fn();
const mockCreateUnit = jest.fn();

jest.mock("@/services/properties/propertyService", () => ({
  fetchPropertiesWithUnitCounts: () => mockFetchPropertiesWithUnitCounts(),
  fetchProperty: (id: string) => mockFetchProperty(id),
  fetchUnitsForProperty: (id: string) => mockFetchUnitsForProperty(id),
  updateProperty: (id: string, dto: any) => mockUpdateProperty(id, dto),
  createUnit: (propertyId: string, dto: any) => mockCreateUnit(propertyId, dto),
}));

// Mock intelligence modules
jest.mock("@/lib/intelligence/deriveActions", () => ({
  derivePropertyInsights: jest.fn(() => []),
}));
jest.mock("@/lib/intelligence/checklists", () => ({
  propertySetupSteps: jest.fn(() => []),
}));

/* ── Fixtures ── */

const now = new Date().toISOString();

const property1 = {
  id: "p1",
  organization_id: "org-1",
  name: "Sunset Apartments",
  address_line1: "123 Main St",
  address_line2: null,
  city: "Los Angeles",
  state: "CA",
  postal_code: "90001",
  country: "US",
  status: "ACTIVE",
  created_at: now,
  updated_at: now,
};

const unit1 = {
  id: "u1",
  organization_id: "org-1",
  property_id: "p1",
  unit_number: "101",
  bedrooms: 2,
  bathrooms: 1,
  square_feet: 850,
  rent_amount: 150000,
  status: "OCCUPIED",
  created_at: now,
  updated_at: now,
};

const unit2 = {
  id: "u2",
  organization_id: "org-1",
  property_id: "p1",
  unit_number: "202",
  bedrooms: 1,
  bathrooms: 1,
  square_feet: null,
  rent_amount: 120000,
  status: "AVAILABLE",
  created_at: now,
  updated_at: now,
};

/* ── Tests ── */

beforeEach(() => {
  mockFetchPropertiesWithUnitCounts.mockReset();
  mockFetchProperty.mockReset();
  mockFetchUnitsForProperty.mockReset();
  mockUpdateProperty.mockReset();
  mockCreateUnit.mockReset();
});

describe("Owner Portfolio Integration", () => {
  describe("Properties list page", () => {
    let PropertiesPage: any;

    beforeAll(async () => {
      const mod = await import("@/app/(dashboard)/app/properties/page");
      PropertiesPage = mod.default;
    });

    test("loads and displays properties with unit counts", async () => {
      mockFetchPropertiesWithUnitCounts.mockResolvedValueOnce({
        data: [property1],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
        unitCounts: { p1: { total: 2, occupied: 1 } },
      });

      render(<PropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText("Sunset Apartments")).toBeInTheDocument();
      });
      // Property links to detail page
      expect(screen.getByText("Sunset Apartments").closest("a")).toHaveAttribute(
        "href",
        "/app/properties/p1",
      );
    });

    test("shows empty state when no properties exist", async () => {
      mockFetchPropertiesWithUnitCounts.mockResolvedValueOnce({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
        unitCounts: {},
      });

      render(<PropertiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/add your first property/i)).toBeInTheDocument();
      });
    });

    test("shows error on 403 Forbidden", async () => {
      mockFetchPropertiesWithUnitCounts.mockRejectedValueOnce(new Error("Forbidden"));

      render(<PropertiesPage />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Forbidden");
      });
    });

    test("shows generic error on network failure", async () => {
      mockFetchPropertiesWithUnitCounts.mockRejectedValueOnce(new Error("Network error"));

      render(<PropertiesPage />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Network error");
      });
    });
  });

  describe("Property detail page", () => {
    let PropertyDetailPage: any;

    beforeAll(async () => {
      const mod = await import("@/app/(dashboard)/app/properties/[id]/page");
      PropertyDetailPage = mod.default;
    });

    test("loads property detail with Overview/Units tabs and overflow menu", async () => {
      mockFetchProperty.mockResolvedValueOnce({ data: property1 });
      mockFetchUnitsForProperty.mockResolvedValueOnce({
        data: [unit1, unit2],
        meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
      });

      render(<PropertyDetailPage />);

      await waitFor(() => {
        // PageHeader title + Breadcrumb may both contain the property name
        expect(screen.getAllByText("Sunset Apartments").length).toBeGreaterThanOrEqual(1);
      });

      // Breadcrumb
      expect(screen.getByText("Properties")).toBeInTheDocument();

      // Content tabs present (Edit is no longer a tab)
      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Units (2)")).toBeInTheDocument();

      // Edit moved to overflow menu
      expect(screen.getByLabelText("Property actions")).toBeInTheDocument();
    });

    test("Units tab shows units table with data", async () => {
      mockFetchProperty.mockResolvedValueOnce({ data: property1 });
      mockFetchUnitsForProperty.mockResolvedValueOnce({
        data: [unit1, unit2],
        meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
      });

      const user = userEvent.setup();
      render(<PropertyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Units (2)")).toBeInTheDocument();
      });

      // Click on Units tab
      await user.click(screen.getByText("Units (2)"));

      await waitFor(() => {
        expect(screen.getByText("Unit 101")).toBeInTheDocument();
        expect(screen.getByText("Unit 202")).toBeInTheDocument();
      });
    });

    test("shows error on 403 Forbidden for property detail", async () => {
      mockFetchProperty.mockRejectedValueOnce(new Error("Forbidden"));
      mockFetchUnitsForProperty.mockRejectedValueOnce(new Error("Forbidden"));

      render(<PropertyDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Forbidden");
      });
    });
  });
});
