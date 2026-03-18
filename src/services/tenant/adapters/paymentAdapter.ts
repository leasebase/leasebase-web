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

/** Create a Stripe Checkout Session for rent payment */
export async function createCheckoutSession(
  returnUrl: string,
  cancelUrl: string,
): Promise<DomainResult<CheckoutResult | null>> {
  try {
    const res = await apiRequest<{ data: CheckoutResult }>({
      path: "api/payments/checkout",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl, cancelUrl }),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: null,
      source: "unavailable",
      error: e?.message || "Failed to create checkout session",
    };
  }
}
