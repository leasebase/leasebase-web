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
  start_date: "2026-01-01T00:00:00Z",
  end_date: "2026-12-31T00:00:00Z",
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
  makeLease({ id: "l1", status: "ACTIVE", property_name: "Sunset Apartments" }),
  makeLease({ id: "l2", status: "INACTIVE", property_name: "Harbor View", tenants: [] }),
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
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });

  test("renders tenant names or 'Not assigned'", () => {
    render(<LeasesTable leases={leases} />);
    expect(screen.getByText("J. Doe")).toBeInTheDocument();
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

  test("renders unit number", () => {
    render(<LeasesTable leases={leases} />);
    expect(screen.getAllByText("Unit 101").length).toBeGreaterThanOrEqual(1);
  });
});
