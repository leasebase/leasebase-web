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

  test("does NOT show Property Manager option", () => {
    render(<RegisterPage />);
    expect(screen.queryByText("Property Manager")).not.toBeInTheDocument();
  });

  test("shows Landlord / Owner as the fixed persona", () => {
    render(<RegisterPage />);
    // New single-step form: static label, not a selectable button
    expect(screen.getByText("Landlord / Owner")).toBeInTheDocument();
  });

  test("shows only Owner persona — no PM, no Tenant selectors", () => {
    render(<RegisterPage />);
    // Single-step Owner-only form: PM and Tenant persona options are absent
    expect(screen.queryByText("Property Manager")).not.toBeInTheDocument();
    expect(screen.queryByText("Tenant")).not.toBeInTheDocument();
    expect(screen.queryByText("Rent a property and manage your lease")).not.toBeInTheDocument();
    // Owner label is shown as a static identifier, not a picker
    expect(screen.getByText("Landlord / Owner")).toBeInTheDocument();
  });
});
