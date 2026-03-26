"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/Button";
import { Banknote, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { STRIPE_BRAND_COLOR } from "@/lib/stripe/theme";

// ── Inner form (must be inside <Elements>) ─────────────────────────────────

function PayForm({
  amount,
  onSuccess,
  onError,
}: {
  amount: string;
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
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/app/payment-history?status=success`,
        },
      });

      if (error) {
        onError(error.message ?? "Payment failed. Please try again.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess();
      } else if (paymentIntent?.status === "processing") {
        // ACH / bank debit — takes 3-5 days
        onSuccess();
      } else if (paymentIntent?.status === "requires_action") {
        // 3D Secure or other authentication — Stripe handles this automatically
        // If we reach here after confirmPayment, the action failed
        onError("Additional authentication was required but could not be completed.");
      } else {
        onError(`Payment status: ${paymentIntent?.status ?? "unknown"}. Please try again.`);
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
        icon={<Banknote size={16} />}
      >
        {submitting ? "Processing…" : `Pay ${amount}`}
      </Button>
    </form>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export interface RentPaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  amount: string; // formatted, e.g. "$1,800.00"
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function RentPaymentForm({
  clientSecret,
  publishableKey,
  amount,
  onSuccess,
  onError,
}: RentPaymentFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    setStripePromise(loadStripe(publishableKey));
  }, [publishableKey]);

  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-brand-500" />
        <span className="ml-2 text-sm text-slate-500">Loading payment form…</span>
      </div>
    );
  }

  return (
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
      <PayForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
