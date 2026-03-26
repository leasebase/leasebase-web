"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/Button";
import { CouponInput } from "@/components/billing/CouponInput";
import {
  createOwnerSetupIntent,
  confirmOwnerPaymentMethod,
} from "@/services/owner/adapters/billingAdapter";
import { track } from "@/lib/analytics";
import { STRIPE_BRAND_COLOR } from "@/lib/stripe/theme";

// ── Inner form (must be inside <Elements>) ─────────────────────────────────

function SetupForm({
  setupIntentId,
  couponCode,
  onSuccess,
  onError,
}: {
  setupIntentId: string;
  couponCode: string | null;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (error) {
        onError(error.message ?? "Card setup failed");
        return;
      }

      if (setupIntent?.status === "succeeded") {
        const result = await confirmOwnerPaymentMethod(setupIntentId, couponCode ?? undefined);
        if (result.error) {
          onError(result.error);
        } else {
          onSuccess();
        }
      } else {
        onError(`Unexpected status: ${setupIntent?.status}`);
      }
    } catch (err: any) {
      onError(err?.message ?? "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        onReady={() => setReady(true)}
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card"],
        }}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={submitting}
        disabled={!stripe || !elements || !ready || submitting}
      >
        Save payment method
      </Button>
    </form>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export interface BillingSetupFormProps {
  /** Called after payment method is saved successfully. */
  onSuccess: () => void;
  /** Called when the user clicks "skip". Pass `null` to hide the skip button. */
  onSkip: (() => void) | null;
  /** Contextual title override (e.g. different for onboarding vs settings). */
  title?: string;
  /** Contextual description override. */
  description?: string;
}

export function BillingSetupForm({
  onSuccess,
  onSkip,
  title = "Set up billing",
  description = "Add a payment method to your account. You can always do this later from Settings.",
}: BillingSetupFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize SetupIntent on mount.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      const result = await createOwnerSetupIntent();
      if (cancelled) return;

      if (result.error || !result.data) {
        setError(result.error ?? "Failed to initialize billing setup");
        setLoading(false);
        return;
      }

      const { clientSecret: cs, setupIntentId: sid, publishableKey } = result.data;
      setClientSecret(cs);
      setSetupIntentId(sid);
      setStripePromise(loadStripe(publishableKey));
      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleSuccess = useCallback(() => {
    setSuccess(true);
    track("billing_setup_completed");
    onSuccess();
  }, [onSuccess]);

  const handleError = useCallback((msg: string) => {
    setError(msg);
    track("billing_setup_failed", { reason: msg });
  }, []);

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="space-y-4 text-center py-4">
        <CheckCircle size={40} className="mx-auto text-emerald-500" />
        <p className="text-sm font-medium text-slate-900">Payment method saved!</p>
        <p className="text-xs text-slate-500">
          Your card has been securely saved to your account.
        </p>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
          <span className="ml-3 text-sm text-slate-500">Setting up secure form…</span>
        </div>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    );
  }

  // ── Fatal error (no Stripe form) ──────────────────────────────────────
  // Show a non-blocking, user-friendly message when billing backend is
  // unavailable (404, 503, network error) instead of a raw error.

  if (error && !clientSecret) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Billing is not required for your current plan.</p>
          <p className="mt-1 text-xs text-amber-600">
            You&apos;re on the Free plan. You can upgrade and add billing later from Settings.
          </p>
        </div>
        {onSkip && (
          <button
            type="button"
            onClick={() => {
              track("billing_setup_skipped", { reason: "backend_unavailable" });
              onSkip();
            }}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    );
  }

  // ── Stripe Elements form ──────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-brand-600" />
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {/* Inline error (non-fatal — Stripe form still shown) */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-50/5 px-3 py-2 text-xs text-danger">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {stripePromise && clientSecret && setupIntentId && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: STRIPE_BRAND_COLOR,
                  borderRadius: "8px",
                },
              },
          }}
        >
          <SetupForm
            setupIntentId={setupIntentId}
            couponCode={couponCode}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </Elements>
      )}

      {/* Coupon input */}
      <CouponInput
        onCouponApplied={(c) => setCouponCode(c)}
        onCouponCleared={() => setCouponCode(null)}
        disabled={success}
      />

      {/* Skip button */}
      {onSkip && (
        <button
          type="button"
          onClick={() => {
            track("billing_setup_skipped");
            onSkip();
          }}
          className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
