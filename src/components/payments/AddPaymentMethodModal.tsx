"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  createSetupIntent,
  confirmPaymentMethod,
} from "@/services/tenant/adapters/paymentMethodAdapter";
import { STRIPE_BRAND_COLOR } from "@/lib/stripe/theme";

// ── Inner form (must be inside <Elements>) ─────────────────────────────────

function SetupForm({
  setupIntentId,
  onSuccess,
  onError,
}: {
  setupIntentId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

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
        // Persist payment method on our backend
        const result = await confirmPaymentMethod(setupIntentId);
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

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={!stripe || !elements || !ready}
        >
          Save Payment Method
        </Button>
      </div>
    </form>
  );
}

// ── Modal wrapper ───────────────────────────────────────────────────────────

interface AddPaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddPaymentMethodModal({ open, onClose, onSuccess }: AddPaymentMethodModalProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create SetupIntent when modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setClientSecret(null);
      setSetupIntentId(null);

      const result = await createSetupIntent();
      if (cancelled) return;

      if (result.error || !result.data) {
        setError(result.error ?? "Failed to initialize payment setup");
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
  }, [open]);

  const handleSuccess = useCallback(() => {
    setSuccess(true);
    onSuccess?.();
  }, [onSuccess]);

  function handleClose() {
    setError(null);
    setSuccess(false);
    setClientSecret(null);
    setSetupIntentId(null);
    setStripePromise(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Payment Method">
      {success ? (
        <div className="space-y-4 py-4 text-center">
          <CheckCircle size={40} className="mx-auto text-emerald-500" />
          <p className="text-sm font-medium text-slate-900">Payment method saved!</p>
          <p className="text-xs text-slate-500">
            Your card has been securely saved and can be used for future payments.
          </p>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
          <span className="ml-3 text-sm text-slate-500">Setting up secure form…</span>
        </div>
      ) : error && !clientSecret ? (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      ) : stripePromise && clientSecret && setupIntentId ? (
        <div className="space-y-3">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
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
              onSuccess={handleSuccess}
              onError={setError}
            />
          </Elements>
        </div>
      ) : null}
    </Modal>
  );
}
