"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { BillingSetupForm } from "@/components/billing/BillingSetupForm";
import { Button } from "@/components/ui/Button";
import { buildSignInRedirect, navigateToSignIn } from "@/lib/hostname";
import { track } from "@/lib/analytics";

function BillingSetupContent() {
  const router = useRouter();
  const tracked = useRef(false);
  const [showBillingForm, setShowBillingForm] = useState(false);

  // Track page view once.
  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      track("billing_setup_viewed");
    }
  }, []);

  const handleContinue = useCallback(() => {
    const url = buildSignInRedirect({ message: "Email confirmed. Please sign in." });
    navigateToSignIn(url, router);
  }, [router]);

  const handleBillingSuccess = useCallback(() => {
    // Short delay so the user sees the success state.
    setTimeout(() => {
      const url = buildSignInRedirect({ message: "Payment method saved. Please sign in." });
      navigateToSignIn(url, router);
    }, 1500);
  }, [router]);

  // ── Billing form view (user explicitly opted in) ──────────────────────
  if (showBillingForm) {
    return (
      <AuthShell>
        <AuthCard>
          <BillingSetupForm
            onSuccess={handleBillingSuccess}
            onSkip={handleContinue}
            title="Set up billing"
            description="Add a payment method now, or skip and do it later from Settings."
          />
        </AuthCard>
      </AuthShell>
    );
  }

  // ── Default: FREE plan confirmation ───────────────────────────────────
  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center text-center space-y-3">
            <CheckCircle size={40} className="text-emerald-500" />
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              You&apos;re on the Free plan
            </h2>
            <p className="text-sm text-slate-500">
              Your account is ready. You can add billing details later from Settings.
            </p>
          </div>

          <Button
            variant="primary"
            className="w-full"
            size="lg"
            onClick={handleContinue}
          >
            Continue to Sign In
          </Button>

          <button
            type="button"
            onClick={() => {
              track("billing_setup_started");
              setShowBillingForm(true);
            }}
            className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Add billing now
          </button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

export default function BillingSetupPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthCard>
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          </AuthCard>
        </AuthShell>
      }
    >
      <BillingSetupContent />
    </Suspense>
  );
}
