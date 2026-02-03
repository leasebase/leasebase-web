import { render, screen } from "@testing-library/react";
import PmDashboardPage from "@/app/(pm)/pm/page";

jest.mock("@/lib/api/hooks", () => ({
  usePmDashboard: () => ({ data: null, loading: true, error: null })
}));

describe("PmDashboardPage", () => {
  test("shows loading state", () => {
    render(<PmDashboardPage />);
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
  });
});
