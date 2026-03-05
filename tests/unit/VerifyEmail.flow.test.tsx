import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";
import VerifyEmailPage from "@/app/auth/verify-email/page";

// Minimal shim for getApiBaseUrl in tests
jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000/api",
}));

// Mock next/navigation hooks used in the pages
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/headers — headers() is called in page components to force dynamic
// rendering, but it throws outside a real Next.js request context.
jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({ get: jest.fn() })),
}));

describe("Email verification flow UI", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("login page shows helper link to verify email", () => {
    render(<LoginPage />);
    expect(
      screen.getByText(/Verify your email or resend the code/i)
    ).toBeInTheDocument();
  });

  test("verify email page renders form fields and resend button", () => {
    render(<VerifyEmailPage />);
    expect(screen.getByText(/Verify your email/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Email/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Verification code/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /Verify email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend code/i })).toBeInTheDocument();
  });

  test("verify email page renders submit button", () => {
    render(<VerifyEmailPage />);
    const btn = screen.getByRole("button", { name: /Verify email/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });
});
