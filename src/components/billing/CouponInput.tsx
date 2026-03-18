"use client";

import { useState, useCallback } from "react";
import { CheckCircle, XCircle, X, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { validateCoupon, type CouponDiscount } from "@/services/owner/adapters/couponAdapter";
import { track } from "@/lib/analytics";

interface CouponInputProps {
  /** Called when a valid coupon is applied. */
  onCouponApplied: (code: string) => void;
  /** Called when the coupon is cleared. */
  onCouponCleared: () => void;
  /** Disable interaction (e.g. while parent form is submitting). */
  disabled?: boolean;
}

type CouponState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "valid"; code: string; discount: CouponDiscount }
  | { status: "invalid"; message: string };

function formatDiscount(d: CouponDiscount): string {
  if (d.type === "percent") return `${d.value}% off`;
  // Amount discounts are in cents.
  return `$${(d.value / 100).toFixed(2)} off`;
}

export function CouponInput({
  onCouponApplied,
  onCouponCleared,
  disabled = false,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<CouponState>({ status: "idle" });

  const handleApply = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setState({ status: "validating" });
    track("coupon_entered", { code: trimmed });

    const result = await validateCoupon(trimmed);

    if (result.error || !result.data) {
      const reason = result.error || "Validation failed";
      setState({ status: "invalid", message: reason });
      track("coupon_rejected", { code: trimmed, reason });
      return;
    }

    if (result.data.valid && result.data.discount) {
      setState({ status: "valid", code: trimmed, discount: result.data.discount });
      track("coupon_applied", {
        code: trimmed,
        discount_type: result.data.discount.type,
        discount_value: result.data.discount.value,
      });
      onCouponApplied(trimmed);
    } else {
      const reason = result.data.message || "Invalid coupon code";
      setState({ status: "invalid", message: reason });
      track("coupon_rejected", { code: trimmed, reason });
    }
  }, [code, onCouponApplied]);

  const handleClear = useCallback(() => {
    setCode("");
    setState({ status: "idle" });
    onCouponCleared();
  }, [onCouponCleared]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleApply();
      }
    },
    [handleApply],
  );

  // Applied state — show badge with clear button.
  if (state.status === "valid") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
        <CheckCircle size={16} className="shrink-0 text-emerald-600" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-emerald-800">{state.code}</span>
          <span className="ml-2 text-xs text-emerald-600">{formatDiscount(state.discount)}</span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="rounded p-0.5 text-emerald-400 hover:text-emerald-700 transition-colors disabled:opacity-50"
          aria-label="Remove coupon"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Tag size={12} />
        <span>Have a coupon code?</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (state.status === "invalid") setState({ status: "idle" });
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter code"
          disabled={disabled || state.status === "validating"}
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 uppercase tracking-wider transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleApply}
          disabled={disabled || !code.trim() || state.status === "validating"}
          loading={state.status === "validating"}
        >
          Apply
        </Button>
      </div>

      {/* Invalid feedback */}
      {state.status === "invalid" && (
        <div className="flex items-center gap-1.5 text-xs text-danger">
          <XCircle size={12} className="shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
    </div>
  );
}
