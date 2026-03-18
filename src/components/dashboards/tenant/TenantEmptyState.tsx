"use client";

import { AlertTriangle, Home, FileText, Clock } from "lucide-react";
import type { TenantSetupStage } from "@/services/tenant/types";

interface TenantEmptyStateProps {
  stage: TenantSetupStage;
}

const stageConfig: Record<
  Exclude<TenantSetupStage, "active">,
  { icon: typeof AlertTriangle; title: string; description: string }
> = {
  "no-profile": {
    icon: AlertTriangle,
    title: "Setting up your account",
    description:
      "We're finishing setting up your tenant profile. This usually completes within a few minutes after you accept your invitation. If this persists, please reach out to your property manager.",
  },
  "no-lease": {
    icon: Home,
    title: "Your lease is being set up",
    description:
      "Your account is ready, and your property manager is finalizing your lease details. Once your lease is active, you'll see your rent, payment history, and more right here.",
  },
  "lease-ended": {
    icon: Clock,
    title: "Your lease has ended",
    description:
      "Your lease is no longer active. If you're expecting a renewal, please contact your property manager. Some features may be limited until a new lease is set up.",
  },
};

export function TenantEmptyState({ stage }: TenantEmptyStateProps) {
  if (stage === "active") return null;

  const config = stageConfig[stage];
  const IconCmp = config.icon;

  return (
    <div className="mx-auto max-w-md py-12 text-center" role="status">
      <IconCmp
        size={48}
        strokeWidth={1.5}
        className="mx-auto mb-4 text-slate-400"
      />
      <h2 className="text-xl font-semibold text-slate-100">{config.title}</h2>
      <p className="mt-2 text-sm text-slate-400">{config.description}</p>

      {stage === "no-profile" && (
        <p className="mt-4 rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-xs text-amber-300">
          If you just accepted an invitation, try refreshing in a moment.
          If this continues, contact your property manager for help.
        </p>
      )}
    </div>
  );
}
