import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";

// Mock next/navigation for useRouter / useSearchParams
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginPage", () => {
  test("renders sign-in heading", () => {
    render(<LoginPage />);
    expect(screen.getByText(/Sign in to Leasebase/)).toBeInTheDocument();
  });

  test("renders email and password fields", () => {
    render(<LoginPage />);
    // Login form uses <label> + <input> in the same container (no explicit htmlFor)
    expect(screen.getByRole("textbox", { name: "" })).toBeTruthy(); // email input
    expect(screen.getByText(/Email/)).toBeInTheDocument();
    expect(screen.getByText(/Password/)).toBeInTheDocument();
  });
});
