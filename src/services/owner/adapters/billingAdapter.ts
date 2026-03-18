/**
 * Owner Billing Adapter.
 *
 * Manages owner payment-method capture for the subscription billing flow.
 * All endpoints are owner-scoped (org_id from JWT).
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
      path: "api/billing/setup-intent",
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
 */
export async function confirmOwnerPaymentMethod(
  setupIntentId: string,
  couponCode?: string,
): Promise<{ data: unknown; error: string | null }> {
  try {
    const body: Record<string, unknown> = { setupIntentId };
    if (couponCode) body.couponCode = couponCode;

    const res = await apiRequest<{ data: unknown }>({
      path: "api/billing/confirm-payment-method",
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
 */
export async function fetchOwnerBillingStatus(): Promise<{
  data: BillingStatus | null;
  error: string | null;
}> {
  try {
    const res = await apiRequest<{ data: BillingStatus }>({
      path: "api/billing/status",
    });
    return { data: res.data, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || "Failed to fetch billing status" };
  }
}
