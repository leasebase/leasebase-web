import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaseForm } from "@/components/leases/LeaseForm";
import type { LeaseRow } from "@/services/leases/types";

/* ── Mocks ── */

const mockFetchProperties = jest.fn();
const mockFetchUnitsForProperty = jest.fn();

jest.mock("@/services/properties/propertyService", () => ({
  fetchProperties: (...args: any[]) => mockFetchProperties(...args),
  fetchUnitsForProperty: (...args: any[]) => mockFetchUnitsForProperty(...args),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

/* ── Fixtures ── */

const now = new Date().toISOString();

const property = { id: "p1", name: "Sunset", organization_id: "org-1", address_line1: "123", address_line2: null, city: "LA", state: "CA", postal_code: "90001", country: "US", status: "ACTIVE", created_at: now, updated_at: now };
const unit = { id: "u1", organization_id: "org-1", property_id: "p1", unit_number: "101", bedrooms: 2, bathrooms: 1, square_feet: 850, status: "AVAILABLE", created_at: now, updated_at: now };

const initialLease: LeaseRow = {
  id: "l1", org_id: "org-1", property_id: "p1", unit_id: "u1",
  term_type: "TWELVE_MONTH", status: "ACTIVE",
  start_date: "2026-01-01T00:00:00Z", end_date: "2026-12-31T00:00:00Z",
  rent_amount: 150000,
  security_deposit: 300000, lease_terms: null,
  created_at: now, updated_at: now, property_name: "Sunset", unit_number: "101",
};

/* ── Tests ── */

beforeEach(() => {
  mockFetchProperties.mockReset();
  mockFetchUnitsForProperty.mockReset();
  mockFetchProperties.mockResolvedValue({ data: [property], meta: { page: 1, limit: 200, total: 1, totalPages: 1 } });
  mockFetchUnitsForProperty.mockResolvedValue({ data: [unit], meta: { page: 1, limit: 200, total: 1, totalPages: 1 } });
});

describe("LeaseForm", () => {
  test("renders all form fields including rent", async () => {
    render(<LeaseForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());
    expect(screen.getByLabelText(/property/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/term/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument();
  });

  test("shows validation errors for required fields", async () => {
    const user = userEvent.setup();
    render(<LeaseForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());

    await user.click(screen.getByText("Create Lease"));

    await waitFor(() => {
      expect(screen.getByText("Property is required")).toBeInTheDocument();
    });
  });

  test("edit mode pre-fills values from initial prop", async () => {
    render(<LeaseForm initial={initialLease} onSubmit={jest.fn()} onCancel={jest.fn()} />);

    await waitFor(() => {
      const termSelect = screen.getByLabelText(/term/i) as HTMLSelectElement;
      expect(termSelect.value).toBe("TWELVE_MONTH");
    });
  });

  test("disables unit selector until property selected", async () => {
    render(<LeaseForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());

    const unitSelect = screen.getByLabelText(/unit/i) as HTMLSelectElement;
    expect(unitSelect.disabled).toBe(true);
  });

  test("submits with correct DTO shape (dollars to cents)", async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LeaseForm onSubmit={handleSubmit} onCancel={jest.fn()} />);
    await waitFor(() => expect(screen.getByText("Sunset")).toBeInTheDocument());

    // Select property
    await user.selectOptions(screen.getByLabelText(/property/i), "p1");
    // Wait for units to load
    await waitFor(() => expect(screen.getByText("Unit 101")).toBeInTheDocument());
    // Select unit
    await user.selectOptions(screen.getByLabelText(/unit/i), "u1");
    // Fill start date
    await user.type(screen.getByLabelText(/start date/i), "2026-01-01");

    // Fill rent
    await user.type(screen.getByLabelText(/monthly rent/i), "1500");

    await user.click(screen.getByText("Create Lease"));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      const dto = handleSubmit.mock.calls[0][0];
      expect(dto.propertyId).toBe("p1");
      expect(dto.unitId).toBe("u1");
      expect(dto.termType).toBe("TWELVE_MONTH");
      expect(dto.rentAmount).toBe(150000); // $1,500 → 150000 cents
    });
  });
});
