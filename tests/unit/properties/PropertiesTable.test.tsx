import { render, screen } from "@testing-library/react";
import { PropertiesTable } from "@/components/properties/PropertiesTable";
import type { PropertyRow } from "@/services/properties/types";

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

const makeProperty = (overrides: Partial<PropertyRow> = {}): PropertyRow => ({
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
  ...overrides,
});

const properties: PropertyRow[] = [
  makeProperty({ id: "p1", name: "Sunset Apartments" }),
  makeProperty({ id: "p2", name: "Harbor View", address_line1: "456 Harbor Blvd", city: "San Francisco", status: "INACTIVE" }),
];

const unitCounts = {
  p1: { total: 10, occupied: 8 },
  p2: { total: 5, occupied: 2 },
};

/* ── Tests ── */

describe("PropertiesTable", () => {
  test("renders property names as links", () => {
    render(<PropertiesTable properties={properties} unitCounts={unitCounts} />);
    const link = screen.getByText("Sunset Apartments");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/app/properties/p1");
  });

  test("renders address columns", () => {
    render(<PropertiesTable properties={properties} unitCounts={unitCounts} />);
    expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
  });

  test("renders unit counts from unitCounts map", () => {
    render(<PropertiesTable properties={properties} unitCounts={unitCounts} />);
    // p1 has 10 total
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  test("renders occupancy badge", () => {
    render(<PropertiesTable properties={properties} unitCounts={unitCounts} />);
    // p1: 8/10 (80%)
    expect(screen.getByText("8/10 (80%)")).toBeInTheDocument();
  });

  test("renders status badge", () => {
    render(<PropertiesTable properties={properties} unitCounts={unitCounts} />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });

  test("renders empty message when no properties", () => {
    render(<PropertiesTable properties={[]} unitCounts={{}} />);
    expect(screen.getByText("No properties found")).toBeInTheDocument();
  });

  test("handles missing unitCounts gracefully", () => {
    render(<PropertiesTable properties={properties} unitCounts={{}} />);
    // Should default to 0 — renders 0/0 (0%)
    expect(screen.getAllByText("0/0 (0%)").length).toBeGreaterThanOrEqual(1);
  });
});
