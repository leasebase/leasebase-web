/**
 * Owner Billing Adapter.
 *
 * Manages owner payment-method capture for the subscription billing flow.
 * All endpoints are owner-scoped (org_id from JWT).
 *
 * Paths are relative to the BFF gateway proxy which routes:
 *   /api/payments/* → payments-service /internal/payments/*
 */

import { apiRequest } from "@/lib/api/client";

// ── Response types ───────────────────────────────────────────────────────────

export interface SetupIntentResult {
  clientSecret: string;
  setupIntentId: string;
  publishableKey: string;
}

export interface BillingStatus {
  hasPaymentMethod: boolean;
  last4?: string;
  brand?: string;
}

// ── Adapters ─────────────────────────────────────────────────────────────────

/**
 * Create a Stripe SetupIntent for the owner's subscription billing.
 * The backend creates / reuses a Stripe Customer idempotently.
 */
export async function createOwnerSetupIntent(
  couponCode?: string,
): Promise<{ data: SetupIntentResult | null; error: string | null }> {
  try {
    const body: Record<string, unknown> = {};
    if (couponCode) body.couponCode = couponCode;

    const res = await apiRequest<{ data: SetupIntentResult }>({
      path: "api/payments/payment-methods/setup-intent",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { data: res.data, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || "Failed to create setup intent" };
  }
}

/**
 * Confirm the payment method after Stripe Elements succeeds client-side.
 *
 * Backend endpoint: POST /internal/payments/payment-methods/setup-intent/complete
 * Body: { setupIntentId }
 */
export async function confirmOwnerPaymentMethod(
  setupIntentId: string,
  couponCode?: string,
): Promise<{ data: unknown; error: string | null }> {
  try {
    const body: Record<string, unknown> = { setupIntentId };
    if (couponCode) body.couponCode = couponCode;

    const res = await apiRequest<{ data: unknown }>({
      path: "api/payments/payment-methods/setup-intent/complete",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { data: res.data, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || "Failed to confirm payment method" };
  }
}

/**
 * Fetch the owner's current billing status (payment method on file).
 *
 * Derives status from the payment-methods list endpoint
 * (GET /internal/payments/payment-methods).
 */
export async function fetchOwnerBillingStatus(): Promise<{
  data: BillingStatus | null;
  error: string | null;
}> {
  try {
    const res = await apiRequest<{ data: Array<{ last4?: string; brand?: string }> }>({
      path: "api/payments/payment-methods",
    });
    const methods = res.data ?? [];
    if (methods.length === 0) {
      return { data: { hasPaymentMethod: false }, error: null };
    }
    const first = methods[0];
    return {
      data: {
        hasPaymentMethod: true,
        last4: first.last4,
        brand: first.brand,
      },
      error: null,
    };
  } catch (e: any) {
    return { data: null, error: e?.message || "Failed to fetch billing status" };
  }
}
