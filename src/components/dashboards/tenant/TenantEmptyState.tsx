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
    title: "Tenant context unavailable",
    description:
      "We couldn't load your tenant profile. This may mean the tenant context endpoint is not yet deployed, or your account hasn't been linked to a tenant profile by your property manager. Please contact your property manager for assistance.",
  },
  "no-lease": {
    icon: Home,
    title: "No active lease found",
    description:
      "Your tenant profile doesn't have an active lease linked. Once your property manager assigns a lease to your account, your dashboard will show rent details and more.",
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
          If you believe this is an error, your property manager may need to
          create your tenant profile or deploy the tenant context endpoint.
        </p>
      )}
    </div>
  );
}
