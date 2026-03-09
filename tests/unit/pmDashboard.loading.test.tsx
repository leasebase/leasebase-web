import { render, screen, waitFor } from "@testing-library/react";
import { PMDashboard } from "@/components/dashboards/PMDashboard";

// Mock the service layer — returns stub data by default
jest.mock("@/services/pm/pmDashboardService", () => ({
  fetchPMDashboard: jest.fn().mockResolvedValue({
    status: "stub",
    data: require("@/services/pm/stubs/pmDashboardStubs").getStubPMDashboardData(),
    reason: "test stub",
  }),
}));

describe("PMDashboard", () => {
  test("renders loading skeleton initially", () => {
    render(<PMDashboard />);
    expect(screen.getByLabelText(/Loading dashboard/)).toBeInTheDocument();
  });

  test("renders portfolio overview heading after load", async () => {
    render(<PMDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Portfolio overview/)).toBeInTheDocument();
    });
  });

  test("renders KPI stat cards after load", async () => {
    render(<PMDashboard />);
    await waitFor(() => {
      expect(screen.getByText("Properties")).toBeInTheDocument();
      expect(screen.getByText("Units")).toBeInTheDocument();
      expect(screen.getByText("Occupancy")).toBeInTheDocument();
    });
  });

  test("shows stub/degraded banner when backend unavailable", async () => {
    render(<PMDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/sample data/i)).toBeInTheDocument();
    });
  });
});
