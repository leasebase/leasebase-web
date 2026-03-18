import { render, screen } from "@testing-library/react";
import { UnitsTable } from "@/components/properties/UnitsTable";
import type { UnitRow } from "@/services/properties/types";

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

const makeUnit = (overrides: Partial<UnitRow> = {}): UnitRow => ({
  id: "u1",
  organization_id: "org-1",
  property_id: "p1",
  unit_number: "101",
  bedrooms: 2,
  bathrooms: 1,
  square_feet: 850,
  status: "AVAILABLE",
  created_at: now,
  updated_at: now,
  ...overrides,
});

const units: UnitRow[] = [
  makeUnit({ id: "u1", unit_number: "101", status: "AVAILABLE" }),
  makeUnit({ id: "u2", unit_number: "202", status: "OCCUPIED", square_feet: null }),
];

/* ── Tests ── */

describe("UnitsTable", () => {
  test("renders unit numbers as links", () => {
    render(<UnitsTable units={units} />);
    const link = screen.getByText("Unit 101");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/app/units/u1");
  });

  test("renders bed/bath info", () => {
    render(<UnitsTable units={units} />);
    expect(screen.getAllByText("2bd / 1ba").length).toBeGreaterThanOrEqual(1);
  });

  test("renders square feet or dash for null", () => {
    render(<UnitsTable units={units} />);
    expect(screen.getByText("850")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument(); // u2 has null square_feet
  });

  test("renders status badges", () => {
    render(<UnitsTable units={units} />);
    expect(screen.getByText("AVAILABLE")).toBeInTheDocument();
    expect(screen.getByText("OCCUPIED")).toBeInTheDocument();
  });

  test("renders empty message when no units", () => {
    render(<UnitsTable units={[]} />);
    expect(screen.getByText("No units found")).toBeInTheDocument();
  });
});
