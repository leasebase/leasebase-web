"use client";

import { useState, useEffect, useCallback } from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from "@stripe/react-connect-js";
import { Button } from "@/components/ui/Button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import {
  createOnboardingSession,
  fetchConnectStatus,
  type OnboardingSessionResult,
  type ConnectStatus,
} from "@/services/payments/ownerPaymentAdapter";

export interface OwnerOnboardingProps {
  /** Called when onboarding reaches a terminal state (completed or updated) */
  onStatusChange?: (status: ConnectStatus) => void;
}

export function OwnerOnboarding({ onStatusChange }: OwnerOnboardingProps) {
  const [sessionData, setSessionData] = useState<OnboardingSessionResult | null>(null);
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingStarted, setOnboardingStarted] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await createOnboardingSession();
      if (result.data) {
        setSessionData(result.data);

        const instance = loadConnectAndInitialize({
          publishableKey: result.data.publishableKey,
          fetchClientSecret: async () => {
            // For session refresh, create a new session
            const refresh = await createOnboardingSession();
            return refresh.data?.clientSecret ?? "";
          },
          appearance: {
            overlays: "dialog",
            variables: {
              colorPrimary: "#18D7F0",
              borderRadius: "8px",
            },
          },
        });

        setStripeConnectInstance(instance);
        setOnboardingStarted(true);
      } else {
        setError(result.error || "Failed to start payment setup");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExit = useCallback(async () => {
    // Onboarding component was closed/completed — refresh status
    const statusResult = await fetchConnectStatus();
    if (statusResult.data) {
      onStatusChange?.(statusResult.data);
      if (statusResult.data.status === "ACTIVE") {
        setOnboardingComplete(true);
      }
    }
  }, [onStatusChange]);

  if (onboardingComplete) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CheckCircle size={40} className="text-emerald-500 mb-3" />
        <p className="text-sm font-medium text-slate-900">Payments enabled</p>
        <p className="mt-1 text-xs text-slate-500">
          Your payment setup is complete. Tenants can now pay rent through LeaseBase.
        </p>
      </div>
    );
  }

  if (!onboardingStarted) {
    return (
      <div>
        <p className="text-sm text-slate-500">
          Enable payments to let tenants pay rent directly through LeaseBase. Setup takes just a few minutes.
        </p>
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        <Button
          variant="primary"
          size="sm"
          className="mt-3"
          onClick={initSession}
          loading={loading}
        >
          Enable payments
        </Button>
      </div>
    );
  }

  if (!stripeConnectInstance) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-brand-500" />
        <span className="ml-2 text-sm text-slate-500">Loading payment setup…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectAccountOnboarding
          onExit={handleExit}
        />
      </ConnectComponentsProvider>
    </div>
  );
}
