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
  tenant_id: "t1",
  lease_type: "FIXED_TERM",
  status: "ACTIVE",
  start_date: "2026-01-01T00:00:00Z",
  end_date: "2026-12-31T00:00:00Z",
  monthly_rent: 150000,
  security_deposit: 300000,
  lease_terms: null,
  signed_at: null,
  created_at: now,
  updated_at: now,
  property_name: "Sunset Apartments",
  unit_number: "101",
  ...overrides,
});

const leases: LeaseRow[] = [
  makeLease({ id: "l1", status: "ACTIVE", property_name: "Sunset Apartments" }),
  makeLease({ id: "l2", status: "TERMINATED", property_name: "Harbor View", tenant_id: null }),
];

/* ── Tests ── */

describe("LeasesTable", () => {
  test("renders property names as links", () => {
    render(<LeasesTable leases={leases} />);
    const link = screen.getByText("Sunset Apartments");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/app/properties/p1");
  });

  test("renders status badges with correct text", () => {
    render(<LeasesTable leases={leases} />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("TERMINATED")).toBeInTheDocument();
  });

  test("renders tenant_id or 'Not assigned'", () => {
    render(<LeasesTable leases={leases} />);
    expect(screen.getByText("t1")).toBeInTheDocument();
    expect(screen.getByText("Not assigned")).toBeInTheDocument();
  });

  test("renders rent formatted as dollars", () => {
    render(<LeasesTable leases={leases} />);
    // $1,500.00/mo
    expect(screen.getAllByText(/\$1,500\.00\/mo/).length).toBeGreaterThanOrEqual(1);
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

  test("renders unit number", () => {
    render(<LeasesTable leases={leases} />);
    expect(screen.getAllByText("Unit 101").length).toBeGreaterThanOrEqual(1);
  });
});
