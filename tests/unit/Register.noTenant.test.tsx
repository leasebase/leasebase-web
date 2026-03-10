import { render, screen } from "@testing-library/react";
import RegisterPage from "@/app/auth/register/page";

jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({ get: jest.fn() })),
}));

describe("Register page — tenant removal", () => {
  test("does NOT show Tenant option", () => {
    render(<RegisterPage />);
    expect(screen.queryByText("Tenant")).not.toBeInTheDocument();
  });

  test("shows Property Manager option", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Property Manager")).toBeInTheDocument();
  });

  test("shows Landlord / Owner option", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Landlord / Owner")).toBeInTheDocument();
  });

  test("shows exactly 2 user type options", () => {
    render(<RegisterPage />);
    // Each option is a button with role-selection behavior
    const pm = screen.getByText("Property Manager");
    const owner = screen.getByText("Landlord / Owner");
    expect(pm).toBeInTheDocument();
    expect(owner).toBeInTheDocument();
    // Ensure no third option (Tenant) exists
    expect(screen.queryByText("Tenant")).not.toBeInTheDocument();
    expect(screen.queryByText("Rent a property and manage your lease")).not.toBeInTheDocument();
  });
});
