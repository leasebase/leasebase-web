import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";
import ConfirmEmailPage from "@/app/auth/confirm-email/page";

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

describe("Email confirmation flow UI", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("login page shows 'Forgot password?' link", () => {
    render(<LoginPage />);
    expect(screen.getByText(/Forgot password\?/)).toBeInTheDocument();
  });

  test("confirm-email page renders form fields and resend button", () => {
    render(<ConfirmEmailPage />);
    expect(screen.getByText(/Confirm your email/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Email/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Confirmation code/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /Confirm email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend code/i })).toBeInTheDocument();
  });

  test("confirm-email page renders submit button", () => {
    render(<ConfirmEmailPage />);
    const btn = screen.getByRole("button", { name: /Confirm email/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });
});
