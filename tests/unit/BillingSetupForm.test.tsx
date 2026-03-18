/**
 * Tests for src/components/billing/BillingSetupForm.tsx
 *
 * Validates:
 * - Graceful degradation when billing backend is unavailable
 * - Skip path is always available
 * - Success state renders correctly
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BillingSetupForm } from "@/components/billing/BillingSetupForm";

// Mock billing adapter
const mockCreateSetupIntent = jest.fn();
jest.mock("@/services/owner/adapters/billingAdapter", () => ({
  createOwnerSetupIntent: (...args: unknown[]) => mockCreateSetupIntent(...args),
  confirmOwnerPaymentMethod: jest.fn(),
}));

// Mock analytics
jest.mock("@/lib/analytics", () => ({
  track: jest.fn(),
}));

// Mock Stripe (not loading real Stripe in tests)
jest.mock("@stripe/stripe-js", () => ({
  loadStripe: jest.fn().mockReturnValue(Promise.resolve({ fake: true })),
}));

jest.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div data-testid="stripe-payment-element" />,
  useStripe: () => null,
  useElements: () => null,
}));

// Mock CouponInput
jest.mock("@/components/billing/CouponInput", () => ({
  CouponInput: () => <div data-testid="coupon-input" />,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("BillingSetupForm — backend unavailable (graceful degradation)", () => {
  test("shows friendly unavailable message when setup intent fails", async () => {
    mockCreateSetupIntent.mockResolvedValue({
      data: null,
      error: "Request failed (404)",
    });

    render(
      <BillingSetupForm
        onSuccess={jest.fn()}
        onSkip={jest.fn()}
        title="Set up billing"
        description="Add a payment method."
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Billing setup is temporarily unavailable."),
      ).toBeInTheDocument();
    });
  });

  test("shows Continue button when backend is unavailable", async () => {
    mockCreateSetupIntent.mockResolvedValue({
      data: null,
      error: "Request failed (503)",
    });

    render(
      <BillingSetupForm
        onSuccess={jest.fn()}
        onSkip={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Continue")).toBeInTheDocument();
    });
  });

  test("Continue button calls onSkip when backend unavailable", async () => {
    const onSkip = jest.fn();
    mockCreateSetupIntent.mockResolvedValue({
      data: null,
      error: "Network error",
    });

    render(
      <BillingSetupForm
        onSuccess={jest.fn()}
        onSkip={onSkip}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Continue")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Continue"));
    expect(onSkip).toHaveBeenCalled();
  });

  test("shows skip button during loading state", () => {
    // Setup intent never resolves (simulates loading)
    mockCreateSetupIntent.mockReturnValue(new Promise(() => {}));

    render(
      <BillingSetupForm
        onSuccess={jest.fn()}
        onSkip={jest.fn()}
      />,
    );

    expect(screen.getByText("Skip for now")).toBeInTheDocument();
  });
});

describe("BillingSetupForm — successful setup intent", () => {
  test("renders Stripe Elements when setup intent succeeds", async () => {
    mockCreateSetupIntent.mockResolvedValue({
      data: {
        clientSecret: "seti_secret_123",
        setupIntentId: "seti_123",
        publishableKey: "pk_test_xxx",
      },
      error: null,
    });

    render(
      <BillingSetupForm
        onSuccess={jest.fn()}
        onSkip={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("stripe-payment-element"),
      ).toBeInTheDocument();
    });
  });

  test("shows skip button when setup intent succeeds", async () => {
    mockCreateSetupIntent.mockResolvedValue({
      data: {
        clientSecret: "seti_secret_123",
        setupIntentId: "seti_123",
        publishableKey: "pk_test_xxx",
      },
      error: null,
    });

    render(
      <BillingSetupForm
        onSuccess={jest.fn()}
        onSkip={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Skip for now")).toBeInTheDocument();
    });
  });
});
