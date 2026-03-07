"use client";

import { useState, useEffect } from "react";
import { authStore } from "@/lib/auth/store";
import { PMDashboard } from "@/components/dashboards/PMDashboard";
import { OwnerDashboard } from "@/components/dashboards/OwnerDashboard";
import { TenantDashboard } from "@/components/dashboards/TenantDashboard";
import { OnboardingWalkthrough } from "@/components/onboarding/OnboardingWalkthrough";
import { apiRequest } from "@/lib/api/client";
import { useRouter } from "next/navigation";

export default function AppDashboardPage() {
  const { user } = authStore();
  const persona = user?.persona;
  const router = useRouter();
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    // Only show walkthrough for PM/owner personas
    if (persona !== "propertyManager" && persona !== "owner") return;

    apiRequest<{ walkthroughDismissed: boolean; completedAt: string | null }>({
      path: "api/onboarding/progress",
    })
      .then((data) => {
        if (!data.walkthroughDismissed && !data.completedAt) {
          setShowWalkthrough(true);
        }
      })
      .catch(() => {
        // If onboarding endpoint fails, don't show walkthrough
      });
  }, [persona]);

  const handleDismissWalkthrough = async () => {
    setShowWalkthrough(false);
    try {
      await apiRequest({ path: "api/onboarding/dismiss", method: "POST" });
    } catch {
      // non-critical
    }
  };

  const handleStartSetup = () => {
    setShowWalkthrough(false);
    router.push("/app/properties");
  };

  const dashboard = (() => {
    if (persona === "propertyManager") return <PMDashboard />;
    if (persona === "owner") return <OwnerDashboard />;
    if (persona === "tenant") return <TenantDashboard />;
    return <TenantDashboard />;
  })();

  return (
    <>
      {showWalkthrough && (
        <OnboardingWalkthrough
          onDismiss={handleDismissWalkthrough}
          onStartSetup={handleStartSetup}
        />
      )}
      {dashboard}
    </>
  );
}
