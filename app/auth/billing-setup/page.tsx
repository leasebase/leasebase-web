"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { BillingSetupForm } from "@/components/billing/BillingSetupForm";
import { buildSignInRedirect, navigateToSignIn } from "@/lib/hostname";
import { track } from "@/lib/analytics";

function BillingSetupContent() {
  const router = useRouter();
  const tracked = useRef(false);

  // Track page view once.
  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      track("billing_setup_started");
    }
  }, []);

  const handleSuccess = useCallback(() => {
    // Short delay so the user sees the success state.
    setTimeout(() => {
      const url = buildSignInRedirect({ message: "Payment method saved. Please sign in." });
      navigateToSignIn(url, router);
    }, 1500);
  }, [router]);

  const handleSkip = useCallback(() => {
    const url = buildSignInRedirect({ message: "Email confirmed. Please sign in." });
    navigateToSignIn(url, router);
  }, [router]);

  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            Optional step
          </p>
        </div>
        <BillingSetupForm
          onSuccess={handleSuccess}
          onSkip={handleSkip}
          title="Set up billing"
          description="Add a payment method now, or skip and do it later from Settings."
        />
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
