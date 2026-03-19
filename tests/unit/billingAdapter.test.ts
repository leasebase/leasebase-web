/**
 * Tests for src/services/owner/adapters/billingAdapter.ts
 *
 * Validates:
 * - Correct BFF API paths (api/payments/payment-methods/*)
 * - Error handling / graceful degradation
 * - Status derivation from payment-methods list
 */

import {
  createOwnerSetupIntent,
  confirmOwnerPaymentMethod,
  fetchOwnerBillingStatus,
} from "@/services/owner/adapters/billingAdapter";

jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

jest.mock("@/lib/auth/store", () => ({
  authStore: {
    getState: () => ({
      mode: "cognito",
      accessToken: "test-token",
      status: "authenticated",
    }),
  },
}));

jest.mock("@/lib/auth/tokens", () => ({
  getAccessToken: () => "test-token",
}));

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("createOwnerSetupIntent", () => {
  test("calls correct BFF path: api/payments/payment-methods/setup-intent", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            clientSecret: "seti_secret",
            setupIntentId: "seti_123",
            publishableKey: "pk_test_xxx",
          },
        }),
    });

    const result = await createOwnerSetupIntent();

    expect(result.error).toBeNull();
    expect(result.data?.clientSecret).toBe("seti_secret");

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      "http://localhost:4000/api/payments/payment-methods/setup-intent",
    );
  });

  test("returns error on 404 (endpoint not found)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 404,
      ok: false,
      text: async () =>
        JSON.stringify({ message: "Request failed (404)" }),
    });

    const result = await createOwnerSetupIntent();

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  test("returns error on network failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const result = await createOwnerSetupIntent();

    expect(result.data).toBeNull();
    expect(result.error).toBe("Network error");
  });
});

describe("confirmOwnerPaymentMethod", () => {
  test("calls correct BFF path: api/payments/payment-methods/setup-intent/complete", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      text: async () => JSON.stringify({ data: { id: "pm_123" } }),
    });

    const result = await confirmOwnerPaymentMethod("seti_123");

    expect(result.error).toBeNull();

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      "http://localhost:4000/api/payments/payment-methods/setup-intent/complete",
    );
    const body = JSON.parse(options.body);
    expect(body.setupIntentId).toBe("seti_123");
  });

  test("includes couponCode when provided", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      text: async () => JSON.stringify({ data: {} }),
    });

    await confirmOwnerPaymentMethod("seti_123", "SAVE20");

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.couponCode).toBe("SAVE20");
  });
});

describe("fetchOwnerBillingStatus", () => {
  test("calls correct BFF path: api/payments/payment-methods", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () =>
        JSON.stringify({
          data: [{ last4: "4242", brand: "visa", is_default: true }],
        }),
    });

    const result = await fetchOwnerBillingStatus();

    expect(result.error).toBeNull();
    expect(result.data?.hasPaymentMethod).toBe(true);
    expect(result.data?.last4).toBe("4242");
    expect(result.data?.brand).toBe("visa");

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      "http://localhost:4000/api/payments/payment-methods",
    );
  });

  test("returns hasPaymentMethod=false when list is empty", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ data: [] }),
    });

    const result = await fetchOwnerBillingStatus();

    expect(result.data?.hasPaymentMethod).toBe(false);
    expect(result.data?.last4).toBeUndefined();
  });

  test("returns error on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      ok: false,
      text: async () =>
        JSON.stringify({ message: "Internal server error" }),
    });

    const result = await fetchOwnerBillingStatus();

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
