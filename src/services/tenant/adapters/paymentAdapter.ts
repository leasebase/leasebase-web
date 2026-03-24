/**
 * Payment adapter — LIVE (Phase 2).
 *
 * SECURITY: Uses GET /api/payments/mine which resolves tenant identity
 * server-side via JWT → tenant_profiles → lease_id. Client never supplies IDs.
 *
 * POST /api/payments/checkout creates a Stripe Checkout Session scoped to
 * the tenant's lease. Duplicate-safe via billing_period dedup.
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, PaymentRow, CheckoutResult } from "../types";

/** Pre-flight readiness check result */
export interface PreflightResult {
  ready: boolean;
  issues: string[];
}

/** Check if payment is possible before showing the form */
export async function checkPaymentReadiness(): Promise<DomainResult<PreflightResult | null>> {
  try {
    const res = await apiRequest<{ data: PreflightResult }>({
      path: "api/payments/checkout/preflight",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to check payment readiness" };
  }
}

/** Response shape from POST /checkout/create-intent */
export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  amount: number; // cents
  currency: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; hasMore: boolean };
}

/** Fetch tenant's own payments — LIVE via GET /api/payments/mine */
export async function fetchTenantPayments(): Promise<DomainResult<PaymentRow[]>> {
  try {
    const res = await apiRequest<PaginatedResponse<PaymentRow>>({
      path: "api/payments/mine",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: [],
      source: "unavailable",
      error: e?.message || "Failed to fetch payments",
    };
  }
}

/** Fetch tenant's own charges — LIVE via GET /api/payments/mine/charges */
export interface TenantChargeRow {
  id: string;
  type: string;
  amount: number; // cents
  currency: string;
  billing_period: string | null;
  due_date: string;
  status: "PENDING" | "OVERDUE" | "PAID" | "PARTIALLY_PAID" | "VOID" | "CREDITED";
  amount_paid: number;
  description: string | null;
  created_at: string;
}

export async function fetchTenantCharges(): Promise<DomainResult<TenantChargeRow[]>> {
  try {
    const res = await apiRequest<PaginatedResponse<TenantChargeRow>>({
      path: "api/payments/mine/charges",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch charges" };
  }
}

/** Create a PaymentIntent for embedded in-app checkout (Phase 1) */
export async function createPaymentIntent(): Promise<CheckoutDomainResult & { intentData: PaymentIntentResult | null }> {
  try {
    const res = await apiRequest<{ data: PaymentIntentResult }>({
      path: "api/payments/checkout/create-intent",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return { data: null, intentData: res.data, source: "live", error: null, errorCode: null };
  } catch (e: any) {
    let errorCode: CheckoutErrorCode = null;
    const msg: string = e?.message || "";
    if (msg.includes("not enabled payments") || msg.includes("not set up payments")) {
      errorCode = "NO_PAYMENT_ACCOUNT";
    } else if (msg.includes("not configured for this lease")) {
      errorCode = "NO_RENT_CONFIGURED";
    } else if (msg.includes("already been paid")) {
      errorCode = "ALREADY_PAID";
    } else if (msg.includes("already in progress")) {
      errorCode = "PAYMENT_IN_PROGRESS";
    }
    return {
      data: null,
      intentData: null,
      source: "unavailable",
      error: e?.message || "Failed to create payment",
      errorCode,
    };
  }
}

/** Error code returned alongside DomainResult for checkout failures. */
export type CheckoutErrorCode = "NO_PAYMENT_ACCOUNT" | "NO_RENT_CONFIGURED" | "ALREADY_PAID" | "PAYMENT_IN_PROGRESS" | "STRIPE_NOT_CONFIGURED" | null;

export interface CheckoutDomainResult extends DomainResult<CheckoutResult | null> {
  errorCode: CheckoutErrorCode;
}

/** Create a Stripe Checkout Session for rent payment */
export async function createCheckoutSession(
  returnUrl: string,
  cancelUrl: string,
): Promise<CheckoutDomainResult> {
  try {
    const res = await apiRequest<{ data: CheckoutResult }>({
      path: "api/payments/checkout",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl, cancelUrl }),
    });
    return { data: res.data, source: "live", error: null, errorCode: null };
  } catch (e: any) {
    // Extract error code from backend response if available.
    // apiRequest throws Error with body.error.message as the message.
    // We parse the error code from a structured checkout error response.
    let errorCode: CheckoutErrorCode = null;
    const msg: string = e?.message || "";
    if (msg.includes("not enabled payments") || msg.includes("not set up payments")) {
      errorCode = "NO_PAYMENT_ACCOUNT";
    } else if (msg.includes("not configured for this lease")) {
      errorCode = "NO_RENT_CONFIGURED";
    } else if (msg.includes("already been paid")) {
      errorCode = "ALREADY_PAID";
    } else if (msg.includes("already in progress")) {
      errorCode = "PAYMENT_IN_PROGRESS";
    }
    return {
      data: null,
      source: "unavailable",
      error: e?.message || "Failed to create checkout session",
      errorCode,
    };
  }
}
