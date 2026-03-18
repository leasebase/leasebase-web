/**
 * Coupon Adapter.
 *
 * Validates promotional / coupon codes against the backend, which checks
 * Stripe promotion codes.  Owner-scoped.
 */

import { apiRequest } from "@/lib/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CouponDiscount {
  type: "percent" | "amount";
  value: number;
}

export interface ValidateCouponResult {
  valid: boolean;
  discount?: CouponDiscount;
  message?: string;
}

// ── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Validate a coupon code via the backend.
 *
 * The backend checks Stripe promotion codes and returns whether the code is
 * valid, the discount details, or an error message.
 */
export async function validateCoupon(
  code: string,
): Promise<{ data: ValidateCouponResult | null; error: string | null }> {
  try {
    const res = await apiRequest<{ data: ValidateCouponResult }>({
      path: "api/billing/coupons/validate",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return { data: res.data, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || "Failed to validate coupon" };
  }
}
