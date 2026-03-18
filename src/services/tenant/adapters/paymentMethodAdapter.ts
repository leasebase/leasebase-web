/**
 * Payment Method adapter — Phase 1B.
 *
 * Manages saved payment methods via the payments-service.
 * All endpoints are tenant-scoped (user from JWT).
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, PaymentMethodRow, SetupIntentResult } from "../types";

/** List tenant's saved payment methods */
export async function fetchPaymentMethods(): Promise<DomainResult<PaymentMethodRow[]>> {
  try {
    const res = await apiRequest<{ data: PaymentMethodRow[] }>({
      path: "api/payments/payment-methods",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch payment methods" };
  }
}

/** Create a SetupIntent for adding a new payment method */
export async function createSetupIntent(): Promise<DomainResult<SetupIntentResult | null>> {
  try {
    const res = await apiRequest<{ data: SetupIntentResult }>({
      path: "api/payments/payment-methods/setup-intent",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to create setup intent" };
  }
}

/** Confirm a completed SetupIntent and persist the payment method */
export async function confirmPaymentMethod(setupIntentId: string): Promise<DomainResult<PaymentMethodRow | null>> {
  try {
    const res = await apiRequest<{ data: PaymentMethodRow }>({
      path: "api/payments/payment-methods/setup-intent/complete",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupIntentId }),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to confirm payment method" };
  }
}

/** Set a payment method as default */
export async function setDefaultPaymentMethod(id: string): Promise<DomainResult<PaymentMethodRow | null>> {
  try {
    const res = await apiRequest<{ data: PaymentMethodRow }>({
      path: `api/payments/payment-methods/${id}/default`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to set default" };
  }
}

/** Remove (detach) a payment method */
export async function removePaymentMethod(id: string): Promise<DomainResult<PaymentMethodRow | null>> {
  try {
    const res = await apiRequest<{ data: PaymentMethodRow }>({
      path: `api/payments/payment-methods/${id}`,
      method: "DELETE",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to remove payment method" };
  }
}
