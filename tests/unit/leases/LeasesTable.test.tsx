import { render, screen } from "@testing-library/react";
import { LeasesTable } from "@/components/leases/LeasesTable";
import type { LeaseRow } from "@/services/leases/types";

/* ── Mock next/link ── */
jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

/* ── Fixtures ── */

const now = new Date().toISOString();

const makeLease = (overrides: Partial<LeaseRow> = {}): LeaseRow => ({
  id: "l1",
  org_id: "org-1",
  property_id: "p1",
  unit_id: "u1",
  term_type: "TWELVE_MONTH",
  status: "ACTIVE",
  display_status: "ACTIVE",
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
  ...overrides,
});

const leases: LeaseRow[] = [
  makeLease({ id: "l1", status: "ACTIVE", display_status: "ACTIVE", property_name: "Sunset Apartments" }),
  makeLease({ id: "l2", status: "INACTIVE", display_status: "INACTIVE", property_name: "Harbor View", tenants: [] }),
];

/* ── Tests ── */

describe("LeasesTable", () => {
  // ---- Existing behaviour preserved ----

  test("renders property names as links", () => {
    render(<LeasesTable leases={leases} />);
    const link = screen.getByText("Sunset Apartments");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/app/properties/p1");
  });

  test("renders display_status badges (not raw status)", () => {
    render(<LeasesTable leases={leases} />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });

  test("renders tenant names or 'Not assigned'", () => {
    render(<LeasesTable leases={leases} />);
    expect(screen.getByText("J.Doe")).toBeInTheDocument();
    expect(screen.getByText("Not assigned")).toBeInTheDocument();
  });

  test("renders term type", () => {
    render(<LeasesTable leases={leases} />);
    expect(screen.getAllByText("12 Months").length).toBeGreaterThanOrEqual(1);
  });

  test("links to lease detail page", () => {
    render(<LeasesTable leases={leases} />);
    const viewLinks = screen.getAllByText("View");
    expect(viewLinks[0].closest("a")).toHaveAttribute("href", "/app/leases/l1");
  });

  test("renders empty message when no leases", () => {
    render(<LeasesTable leases={[]} />);
    expect(screen.getByText("No leases found")).toBeInTheDocument();
  });

  // ---- Clickable unit links ----

  test("unit column links to /app/units/:id", () => {
    render(<LeasesTable leases={leases} />);
    const unitLinks = screen.getAllByText("Unit 101");
    expect(unitLinks[0].closest("a")).toHaveAttribute("href", "/app/units/u1");
  });

  // ---- Clickable tenant links ----

  test("tenant name links to /app/tenants/:id", () => {
    render(<LeasesTable leases={leases} />);
    const tenantLink = screen.getByText("J.Doe");
    expect(tenantLink.closest("a")).toHaveAttribute("href", "/app/tenants/t1");
  });

  // ---- ASSIGNED lease with tenants shows tenant names (not status leak) ----

  test("ASSIGNED lease shows DRAFT badge and clickable tenant", () => {
    const assignedLease = makeLease({
      id: "l-assigned",
      status: "ASSIGNED",
      display_status: "DRAFT",
      tenants: [{ id: "t2", name: "Jane Smith", role: "PRIMARY" }],
    });
    render(<LeasesTable leases={[assignedLease]} />);
    // Badge should show DRAFT, not ASSIGNED
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.queryByText("ASSIGNED")).not.toBeInTheDocument();
    // Tenant should be clickable
    const tenantLink = screen.getByText("J.Smith");
    expect(tenantLink.closest("a")).toHaveAttribute("href", "/app/tenants/t2");
  });

  // ---- Multiple tenants ----

  test("multiple tenants renders first name + more indicator", () => {
    const multiLease = makeLease({
      id: "l-multi",
      tenants: [
        { id: "t1", name: "John Doe", role: "PRIMARY" },
        { id: "t2", name: "Jane Smith", role: "OCCUPANT" },
      ],
    });
    render(<LeasesTable leases={[multiLease]} />);
    expect(screen.getByText("J.Doe")).toBeInTheDocument();
    expect(screen.getByText("(+1 more)")).toBeInTheDocument();
  });

  // ---- Filter options contain only lease-lifecycle statuses ----

  test("status filter contains only lease-lifecycle statuses", () => {
    render(<LeasesTable leases={leases} />);
    const select = screen.getByLabelText("Status") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    // Expected: "", DRAFT, ACTIVE, INACTIVE, EXTENDED, RENEWED
    expect(optionValues).toContain("DRAFT");
    expect(optionValues).toContain("ACTIVE");
    expect(optionValues).toContain("INACTIVE");
    expect(optionValues).toContain("EXTENDED");
    expect(optionValues).toContain("RENEWED");
    // Must NOT contain tenant-lifecycle statuses
    expect(optionValues).not.toContain("ASSIGNED");
    expect(optionValues).not.toContain("INVITED");
    expect(optionValues).not.toContain("ACKNOWLEDGED");
    expect(optionValues).not.toContain("JOINED");
    expect(optionValues).not.toContain("EXPIRED");
  });
});
