/**
 * Tests that the login page shows confirm-email / resend-code CTAs when the
 * backend returns the structured USER_NOT_CONFIRMED response.
 *
 * The UI must key off `err.code === "USER_NOT_CONFIRMED"`, NOT message text.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({ get: jest.fn() })),
}));

// Mock the auth store. The mock fn lives inside the factory to avoid
// jest.mock hoisting issues with `const` declarations.
jest.mock("@/lib/auth/store", () => {
  const mockLoginFn = jest.fn();
  const state = {
    user: undefined,
    status: "unauthenticated" as const,
    bootstrapSession: jest.fn().mockResolvedValue(undefined),
    loginWithPassword: mockLoginFn,
    loginDevBypass: jest.fn(),
    loadMe: jest.fn(),
    logout: jest.fn(),
  };

  const authStore = Object.assign(
    () => state,
    {
      getState: () => state,
      setState: jest.fn(),
      subscribe: jest.fn(() => jest.fn()),
      persist: { rehydrate: jest.fn() },
    },
  );

  return { authStore, __mockLoginFn: mockLoginFn };
});

import LoginPageClient from "@/app/auth/login/LoginPageClient";

// Access the mock fn created inside the factory.
const { __mockLoginFn: mockLoginWithPassword } = jest.requireMock<{
  __mockLoginFn: jest.Mock;
}>("@/lib/auth/store");

describe("Login — USER_NOT_CONFIRMED handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows confirm/resend CTAs when loginWithPassword throws code=USER_NOT_CONFIRMED", async () => {
    // Simulate backend 403: { code: "USER_NOT_CONFIRMED", message: "...", nextStep: "CONFIRM_SIGN_UP" }
    // The auth store propagates this as an Error with code property.
    const err = new Error("Your email address has not been confirmed.");
    (err as any).code = "USER_NOT_CONFIRMED";
    mockLoginWithPassword.mockRejectedValueOnce(err);

    render(<LoginPageClient next="/app" />);

    const user = userEvent.setup();

    // Fill and submit the login form.
    await user.type(screen.getByRole("textbox", { name: /Email/i }), "test@example.com");
    // Password input is type="password" so not a textbox role — find by label.
    await user.type(screen.getByLabelText(/Password/i), "SomePass1!");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    // Wait for the error state to render.
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // The error message is displayed.
    expect(screen.getByText(/not been confirmed/i)).toBeInTheDocument();

    // CTA buttons appear.
    expect(screen.getByText("Confirm email")).toBeInTheDocument();
    expect(screen.getByText("Resend confirmation code")).toBeInTheDocument();
  });

  it("does NOT show confirm/resend CTAs for a generic login error (no code)", async () => {
    // Regular auth failure — no code property.
    mockLoginWithPassword.mockRejectedValueOnce(new Error("Invalid email or password"));

    render(<LoginPageClient next="/app" />);

    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: /Email/i }), "test@example.com");
    await user.type(screen.getByLabelText(/Password/i), "SomePass1!");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // Error message is shown.
    expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();

    // Confirm/resend CTAs must NOT appear for a generic error.
    expect(screen.queryByText("Confirm email")).not.toBeInTheDocument();
    expect(screen.queryByText("Resend confirmation code")).not.toBeInTheDocument();
  });

  it("keys off err.code, not message text — different message still triggers CTAs", async () => {
    // The message text is completely different, but code is USER_NOT_CONFIRMED.
    // This proves the UI branches on code, not message wording.
    const err = new Error("Completely unrelated message wording");
    (err as any).code = "USER_NOT_CONFIRMED";
    mockLoginWithPassword.mockRejectedValueOnce(err);

    render(<LoginPageClient next="/app" />);

    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: /Email/i }), "alt@example.com");
    await user.type(screen.getByLabelText(/Password/i), "Pass123!");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // CTAs still appear because code matches — message text is irrelevant.
    expect(screen.getByText("Confirm email")).toBeInTheDocument();
    expect(screen.getByText("Resend confirmation code")).toBeInTheDocument();
  });
});
