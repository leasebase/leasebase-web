"use client";

import { AlertTriangle, Home, Clock, CheckCircle2, Building2, KeyRound, FileText } from "lucide-react";
import Link from "next/link";
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
  ACKNOWLEDGED: "Acknowledged \u2014 finalizing",
  INACTIVE:     "Inactive",
  EXPIRED:      "Expired",
  RENEWED:      "Renewed",
};

/** Next-step guidance per pre-active status. */
const NEXT_STEP_BY_STATUS: Record<string, string> = {
  DRAFT:        "Your property owner is finishing preparing your lease. No action needed from you yet.",
  ASSIGNED:     "Your property owner is reviewing the lease details. You\u2019ll receive an invitation to review and sign soon.",
  INVITED:      "Your property owner has sent the lease for your review. Check your email for next steps, or contact them directly.",
  ACKNOWLEDGED: "You\u2019ve acknowledged the lease. Your property owner is finalizing activation. You\u2019ll see your full dashboard once it\u2019s active.",
};

export function TenantEmptyState({ stage, lease }: TenantEmptyStateProps) {
  if (stage === "active") return null;

  // \u2500\u2500 Pending-activation: rich contextual card \u2500\u2500\u2500\u2500\u2500\u2500\u2500
  if (stage === "pending-activation" && lease) {
    const propertyName = lease.property_name;
    const unitNumber   = lease.unit_number;
    const statusLabel  = LEASE_STATUS_LABELS[lease.status] ?? lease.status;
    const nextStep     = NEXT_STEP_BY_STATUS[lease.status] ?? "Your property owner is finalizing the details.";
    const hasAddress   = lease.property_address;

    return (
      <div className="space-y-4" role="status">
        {/* Home assignment card */}
        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/30 p-6 shadow-md">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex-shrink-0 rounded-xl bg-green-100 p-2.5 text-green-600">
              <Building2 size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-green-700">Your Home</p>
              {propertyName ? (
                <p className="mt-1 text-xl font-semibold text-slate-900">{propertyName}</p>
              ) : (
                <p className="mt-1 text-base text-slate-500">Property assignment pending</p>
              )}
              {unitNumber && (
                <p className="mt-0.5 text-sm text-slate-600">Unit {unitNumber}</p>
              )}
              {hasAddress && (
                <p className="mt-0.5 text-[12px] text-slate-500">{lease.property_address}</p>
              )}
            </div>
            <span className="flex-shrink-0 px-3 py-1 bg-amber-100 text-amber-700 text-[11px] font-bold uppercase rounded-lg ring-1 ring-amber-200">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* What happens next */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">What happens next</p>
              <p className="mt-1 text-sm text-slate-600">{nextStep}</p>
            </div>
          </div>
        </div>

        {/* Available now row */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Available now</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/documents"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <FileText size={15} /> Documents
            </Link>
            <Link
              href="/app/leases"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <KeyRound size={15} /> Lease Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // \u2500\u2500 Pending-activation: no lease context yet (fallback) \u2500\u2500\u2500\u2500\u2500
  if (stage === "pending-activation") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm" role="status">
        <Home size={44} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold text-slate-900">Your lease is being finalized</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your property owner is setting up your lease. Once it&apos;s active, you&apos;ll see your full dashboard here.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Questions? Reach out to your property owner directly.
        </p>
      </div>
    );
  }

  // \u2500\u2500 Other non-active stages \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  if (stage === "no-profile") {
    return (
      <div className="mx-auto max-w-md py-12 text-center" role="status">
        <AlertTriangle size={48} strokeWidth={1.5} className="mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-semibold text-slate-900">Setting up your account</h2>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re finishing setting up your tenant profile. This usually completes within a few minutes after
          you accept your invitation.
        </p>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          If you just accepted an invitation, try refreshing in a moment.
          If this continues, contact your property owner for help.
        </p>
      </div>
    );
  }

  if (stage === "no-lease") {
    return (
      <div className="mx-auto max-w-md py-12 text-center" role="status">
        <Home size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold text-slate-900">Your lease is being set up</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your account is ready, and your property owner is finalizing your lease details.
          Once your lease is active, you&apos;ll see your rent, payment history, and more right here.
        </p>
      </div>
    );
  }

  // lease-ended
  return (
    <div className="mx-auto max-w-md py-12 text-center" role="status">
      <Clock size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
      <h2 className="text-xl font-semibold text-slate-900">Your lease has ended</h2>
      <p className="mt-2 text-sm text-slate-600">
        Your lease is no longer active. If you&apos;re expecting a renewal, please contact your
        property owner. Some features may be limited until a new lease is set up.
      </p>
      {lease && (lease.property_name || lease.unit_number) && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
          <p className="font-medium text-slate-700">Prior lease</p>
          {lease.property_name && <p className="mt-1 text-slate-600">{lease.property_name}</p>}
          {lease.unit_number && <p className="text-slate-600">Unit {lease.unit_number}</p>}
        </div>
      )}
    </div>
  );
}
