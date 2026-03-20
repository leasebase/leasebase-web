/**
 * Tests for app/auth/billing-setup/page.tsx
 *
 * Validates:
 * - Default view shows FREE plan messaging (no Stripe init)
 * - CTA reads "Continue to Sign In" and navigates correctly
 * - "Add billing now" toggles to BillingSetupForm
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BillingSetupPage from "@/app/auth/billing-setup/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

jest.mock("@/lib/analytics", () => ({
  track: jest.fn(),
}));

// Mock BillingSetupForm to avoid Stripe dependency
const mockOnSkip = jest.fn();
jest.mock("@/components/billing/BillingSetupForm", () => ({
  BillingSetupForm: ({
    onSkip,
    title,
  }: {
    onSuccess: () => void;
    onSkip: (() => void) | null;
    title?: string;
    description?: string;
  }) => (
    <div data-testid="billing-setup-form">
      <p>{title}</p>
      {onSkip && (
        <button onClick={onSkip} data-testid="billing-form-skip">
          Skip for now
        </button>
      )}
    </div>
  ),
}));

describe("BillingSetupPage — FREE plan default view", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders FREE plan heading", async () => {
    render(<BillingSetupPage />);

    await waitFor(() => {
      expect(
        screen.getByText("You're on the Free plan"),
      ).toBeInTheDocument();
    });
  });

  test("renders 'Continue to Sign In' CTA button", async () => {
    render(<BillingSetupPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Continue to Sign In/i }),
      ).toBeInTheDocument();
    });
  });

  test("'Continue to Sign In' navigates to login page", async () => {
    render(<BillingSetupPage />);

    const cta = await screen.findByRole("button", {
      name: /Continue to Sign In/i,
    });
    await userEvent.click(cta);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
    );
  });

  test("renders 'Add billing now' secondary action", async () => {
    render(<BillingSetupPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Add billing now/i }),
      ).toBeInTheDocument();
    });
  });

  test("does NOT render BillingSetupForm by default", async () => {
    render(<BillingSetupPage />);

    await waitFor(() => {
      expect(
        screen.getByText("You're on the Free plan"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId("billing-setup-form")).not.toBeInTheDocument();
  });

  test("'Add billing now' toggles to show BillingSetupForm", async () => {
    render(<BillingSetupPage />);

    const addBillingBtn = await screen.findByRole("button", {
      name: /Add billing now/i,
    });
    await userEvent.click(addBillingBtn);

    await waitFor(() => {
      expect(screen.getByTestId("billing-setup-form")).toBeInTheDocument();
    });

    // FREE plan heading should no longer be visible
    expect(
      screen.queryByText("You're on the Free plan"),
    ).not.toBeInTheDocument();
  });

  test("shows account-ready description text", async () => {
    render(<BillingSetupPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Your account is ready. You can add billing details later from Settings.",
        ),
      ).toBeInTheDocument();
    });
  });
});
