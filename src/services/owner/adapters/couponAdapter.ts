/**
 * Coupon Adapter.
 *
 * Validates promotional / coupon codes against the backend, which checks
 * Stripe promotion codes.  Owner-scoped.
 *
 * NOTE: The coupon validation endpoint is not yet implemented in the
 * payments-service.  Until it is, this adapter returns a graceful
 * "unavailable" response so the UI degrades cleanly.
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
 *
 * When the backend endpoint is unavailable (404 / 502), returns a user-friendly
 * message instead of a raw error.
 */
export async function validateCoupon(
  code: string,
): Promise<{ data: ValidateCouponResult | null; error: string | null }> {
  try {
    const res = await apiRequest<{ data: ValidateCouponResult }>({
      path: "api/payments/coupons/validate",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return { data: res.data, error: null };
  } catch (e: any) {
    const msg = e?.message || "";
    // Backend endpoint not yet implemented — degrade gracefully.
    if (msg.includes("404") || msg.includes("502") || msg.includes("503")) {
      return {
        data: { valid: false, message: "Coupon validation is temporarily unavailable. Please try again later." },
        error: null,
      };
    }
    return { data: null, error: msg || "Failed to validate coupon" };
  }
}
