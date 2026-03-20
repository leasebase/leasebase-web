"use client";

import { AlertTriangle, Home, Clock, CheckCircle2, Building2, KeyRound, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { TenantSetupStage, LeaseRow } from "@/services/tenant/types";

interface TenantEmptyStateProps {
  stage: TenantSetupStage;
  /** Pass the lease when available so contextual info can be shown in pre-active states. */
  lease?: LeaseRow | null;
}

/** Human-readable lease status labels for tenant-facing copy. */
const LEASE_STATUS_LABELS: Record<string, string> = {
  DRAFT:        "Being prepared",
  ASSIGNED:     "Assigned to you",
  INVITED:      "Invitation sent",
  ACKNOWLEDGED: "Acknowledged — finalizing",
  INACTIVE:     "Inactive",
  EXPIRED:      "Expired",
  RENEWED:      "Renewed",
};

/** Next-step guidance per pre-active status. */
const NEXT_STEP_BY_STATUS: Record<string, string> = {
  DRAFT:        "Your property manager is finishing preparing your lease. No action needed from you yet.",
  ASSIGNED:     "Your property manager is reviewing the lease details. You'll receive an invitation to review and sign soon.",
  INVITED:      "Your property manager has sent the lease for your review. Check your email for next steps, or contact them directly.",
  ACKNOWLEDGED: "You've acknowledged the lease. Your property manager is finalizing activation. You'll see your full dashboard once it's active.",
};

export function TenantEmptyState({ stage, lease }: TenantEmptyStateProps) {
  if (stage === "active") return null;

  // ── Pending-activation: rich contextual card ────────────────────────────
  if (stage === "pending-activation" && lease) {
    const propertyName = lease.property_name;
    const unitNumber   = lease.unit_number;
    const statusLabel  = LEASE_STATUS_LABELS[lease.status] ?? lease.status;
    const nextStep     = NEXT_STEP_BY_STATUS[lease.status] ?? "Your property manager is finalizing the details.";
    const hasAddress   = lease.property_address;

    return (
      <div className="space-y-4" role="status">
        {/* Home assignment card */}
        <div className="rounded-xl border border-brand-800/40 bg-gradient-to-br from-brand-950/60 via-slate-900 to-slate-900 p-6">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex-shrink-0 rounded-lg bg-brand-900/60 p-2.5 text-brand-400">
              <Building2 size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">Your Home</p>
              {propertyName ? (
                <p className="mt-1 text-xl font-semibold text-slate-50">{propertyName}</p>
              ) : (
                <p className="mt-1 text-base text-slate-400">Property assignment pending</p>
              )}
              {unitNumber && (
                <p className="mt-0.5 text-sm text-slate-300">Unit {unitNumber}</p>
              )}
              {hasAddress && (
                <p className="mt-0.5 text-xs text-slate-400">{lease.property_address}</p>
              )}
            </div>
            <Badge variant="warning" className="flex-shrink-0">
              {statusLabel}
            </Badge>
          </div>
        </div>

        {/* What happens next */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-brand-400" />
            <div>
              <p className="text-sm font-semibold text-slate-100">What happens next</p>
              <p className="mt-1 text-sm text-slate-400">{nextStep}</p>
            </div>
          </div>
        </div>

        {/* Available now row */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Available now</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/documents"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
            >
              <FileText size={15} /> Documents
            </Link>
            <Link
              href="/app/leases"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
            >
              <KeyRound size={15} /> My Lease
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending-activation: no lease context yet (fallback) ─────────────────
  if (stage === "pending-activation") {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center" role="status">
        <Home size={44} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold text-slate-100">Your lease is being finalized</h2>
        <p className="mt-2 text-sm text-slate-400">
          Your property manager is setting up your lease. Once it&apos;s active, you&apos;ll see your full dashboard here.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Questions? Reach out to your property manager directly.
        </p>
      </div>
    );
  }

  // ── Other non-active stages ─────────────────────────────────────────────
  if (stage === "no-profile") {
    return (
      <div className="mx-auto max-w-md py-12 text-center" role="status">
        <AlertTriangle size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold text-slate-100">Setting up your account</h2>
        <p className="mt-2 text-sm text-slate-400">
          We&apos;re finishing setting up your tenant profile. This usually completes within a few minutes after
          you accept your invitation.
        </p>
        <p className="mt-4 rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-xs text-amber-300">
          If you just accepted an invitation, try refreshing in a moment.
          If this continues, contact your property manager for help.
        </p>
      </div>
    );
  }

  if (stage === "no-lease") {
    return (
      <div className="mx-auto max-w-md py-12 text-center" role="status">
        <Home size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold text-slate-100">Your lease is being set up</h2>
        <p className="mt-2 text-sm text-slate-400">
          Your account is ready, and your property manager is finalizing your lease details.
          Once your lease is active, you&apos;ll see your rent, payment history, and more right here.
        </p>
      </div>
    );
  }

  // lease-ended
  return (
    <div className="mx-auto max-w-md py-12 text-center" role="status">
      <Clock size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
      <h2 className="text-xl font-semibold text-slate-100">Your lease has ended</h2>
      <p className="mt-2 text-sm text-slate-400">
        Your lease is no longer active. If you&apos;re expecting a renewal, please contact your
        property manager. Some features may be limited until a new lease is set up.
      </p>
      {lease && (lease.property_name || lease.unit_number) && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-left text-sm">
          <p className="font-medium text-slate-300">Prior lease</p>
          {lease.property_name && <p className="mt-1 text-slate-400">{lease.property_name}</p>}
          {lease.unit_number && <p className="text-slate-400">Unit {lease.unit_number}</p>}
        </div>
      )}
    </div>
  );
}
