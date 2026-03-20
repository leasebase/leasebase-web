import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/auth/login/page";
import ConfirmEmailPage from "@/app/auth/confirm-email/page";

jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: mockPush }),
  useSearchParams: () => new URLSearchParams("email=test@example.com"),
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

  test("successful confirmation redirects to sign-in, not billing-setup", async () => {
    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Email confirmed" }),
    });

    render(<ConfirmEmailPage />);

    // Fill in confirmation code
    const codeInput = screen.getByPlaceholderText("123456");
    await userEvent.type(codeInput, "123456");

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /Confirm email/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
      );
    });

    // Must NOT redirect to billing-setup
    expect(mockPush).not.toHaveBeenCalledWith("/auth/billing-setup");
  });
});
