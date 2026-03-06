import { render, screen } from "@testing-library/react";
import { PMDashboard } from "@/components/dashboards/PMDashboard";

describe("PMDashboard", () => {
  test("renders portfolio overview heading", () => {
    render(<PMDashboard />);
    expect(screen.getByText(/Portfolio overview/)).toBeInTheDocument();
  });

  test("renders KPI stat cards", () => {
    render(<PMDashboard />);
    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("Units")).toBeInTheDocument();
    expect(screen.getByText("Occupancy")).toBeInTheDocument();
  });
});
