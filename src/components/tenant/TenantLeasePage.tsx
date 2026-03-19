"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, MapPin, DollarSign,
  FileText, Users, Wrench, CreditCard, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { LeaseDetailSkeleton } from "@/components/leases/LeaseDetailSkeleton";
import { fetchTenantLeases } from "@/services/tenant/adapters/leaseAdapter";
import { authStore } from "@/lib/auth/store";
import type { LeaseRow } from "@/services/tenant/types";

/* ── Helpers ── */

function fmtCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTermType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const LEASE_STATUS_BADGE: Record<string, BadgeVariant> = {
  ACTIVE:       "success",
  EXTENDED:     "success",
  DRAFT:        "neutral",
  ASSIGNED:     "warning",
  INVITED:      "warning",
  ACKNOWLEDGED: "warning",
  EXPIRED:      "neutral",
  RENEWED:      "neutral",
  INACTIVE:     "neutral",
};

const LEASE_STATUS_LABEL: Record<string, string> = {
  ACTIVE:       "Active",
  EXTENDED:     "Extended",
  DRAFT:        "Being prepared",
  ASSIGNED:     "Assigned",
  INVITED:      "Awaiting your review",
  ACKNOWLEDGED: "Finalizing",
  EXPIRED:      "Expired",
  RENEWED:      "Renewed",
  INACTIVE:     "Inactive",
};

/* ── Detail row primitive ── */

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800 py-3 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-100">{value}</span>
    </div>
  );
}

/* ── Section card ── */

function SectionCard({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-brand-400">{icon}</span>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
      </div>
      {children}
    </div>
  );
}

/* ── Action button ── */

function ActionButton({ href, icon, label, disabled }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-500">
        {icon} {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
    >
      {icon} {label} <ArrowRight size={14} className="ml-auto text-slate-400" />
    </Link>
  );
}

/* ── No-lease empty state ── */

function NoLeaseState() {
  return (
    <div className="py-16 text-center">
      <Building2 size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-500" />
      <p className="text-lg font-semibold text-slate-200">No lease found</p>
      <p className="mt-2 text-sm text-slate-400">
        Your lease details will appear here once your property manager sets them up.
      </p>
    </div>
  );
}

/* ── Main component ── */

export function TenantLeasePage() {
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchTenantLeases();
        if (!cancelled) setLeases(result.data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load lease details");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <LeaseDetailSkeleton />;

  if (error) {
    return (
      <>
        <PageHeader title="My Lease" description="Your lease details and home assignment." />
        <div className="mt-6 rounded-lg border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      </>
    );
  }

  // Pick the best lease: active/extended first, then most recent
  const selectedOrgId = authStore.getState().selectedOrgId || authStore.getState().user?.orgId;
  const orgLeases = selectedOrgId ? leases.filter((l) => l.organization_id === selectedOrgId) : leases;
  const lease =
    orgLeases.find((l) => l.status === "ACTIVE" || l.status === "EXTENDED") ??
    orgLeases[0] ??
    leases.find((l) => l.status === "ACTIVE" || l.status === "EXTENDED") ??
    leases[0] ??
    null;

  const isActive = lease?.status === "ACTIVE" || lease?.status === "EXTENDED";
  const statusLabel = lease ? (LEASE_STATUS_LABEL[lease.status] ?? lease.status) : "";
  const statusVariant: BadgeVariant = lease ? (LEASE_STATUS_BADGE[lease.status] ?? "neutral") : "neutral";

  return (
    <section aria-labelledby="my-lease-heading" className="space-y-6">
      <PageHeader
        title="My Lease"
        description="Your lease details and home assignment."
        actions={
          lease && (
            <Badge variant={statusVariant} className="text-sm px-3 py-1">
              {statusLabel}
            </Badge>
          )
        }
      />

      {!lease && <NoLeaseState />}

      {lease && (
        <div className="space-y-4">
          {/* Home / property card */}
          <div className="rounded-xl border border-brand-800/40 bg-gradient-to-br from-brand-950/60 via-slate-900 to-slate-900 p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">Your Home</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-50">
                  {lease.property_name ?? "Property details pending"}
                </p>
                {lease.unit_number && (
                  <p className="mt-1 text-base text-slate-300">Unit {lease.unit_number}</p>
                )}
                {lease.property_address && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                    <MapPin size={13} /> {lease.property_address}
                  </p>
                )}
              </div>
              {lease.organization_name && (
                <p className="mt-2 text-xs text-slate-500 sm:mt-0 sm:text-right">
                  Managed by<br />
                  <span className="text-slate-400">{lease.organization_name}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Lease details */}
            <SectionCard title="Lease details" icon={<FileText size={16} />}>
              <div>
                <DetailRow label="Status" value={statusLabel} />
                <DetailRow label="Term" value={fmtTermType(lease.term_type)} />
                <DetailRow
                  label="Start date"
                  value={lease.start_date ? fmtDate(lease.start_date) : null}
                />
                <DetailRow
                  label="End date"
                  value={lease.end_date ? fmtDate(lease.end_date) : null}
                />
              </div>
            </SectionCard>

            {/* Financial details */}
            <SectionCard title="Financial details" icon={<DollarSign size={16} />}>
              <div>
                <DetailRow
                  label="Monthly rent"
                  value={
                    lease.rent_amount && lease.rent_amount > 0
                      ? fmtCurrency(lease.rent_amount)
                      : null
                  }
                />
                <DetailRow
                  label="Security deposit"
                  value={
                    lease.deposit_amount && lease.deposit_amount > 0
                      ? fmtCurrency(lease.deposit_amount)
                      : null
                  }
                />
                {!lease.rent_amount && !lease.deposit_amount && (
                  <p className="text-sm text-slate-500">
                    Financial details will appear once your lease is finalized.
                  </p>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Co-tenants */}
          {lease.tenants && lease.tenants.length > 0 && (
            <SectionCard title="Co-tenants" icon={<Users size={16} />}>
              <div className="space-y-2">
                {lease.tenants.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{t.name}</span>
                    <Badge variant="neutral">{t.role}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Quick actions */}
          <SectionCard title="Quick actions" icon={<ArrowRight size={16} />}>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <ActionButton
                href="/app/pay-rent"
                icon={<CreditCard size={15} />}
                label="Pay Rent"
                disabled={!isActive}
              />
              <ActionButton
                href="/app/maintenance/new"
                icon={<Wrench size={15} />}
                label="Submit Maintenance Request"
                disabled={!isActive}
              />
              <ActionButton
                href="/app/documents"
                icon={<FileText size={15} />}
                label="View Documents"
              />
            </div>
            {!isActive && (
              <p className="mt-3 text-xs text-slate-500">
                Pay Rent and Maintenance will be available once your lease is active.
              </p>
            )}
          </SectionCard>

          {/* Multi-lease: show other leases if present */}
          {leases.length > 1 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Other leases
              </p>
              <div className="space-y-2">
                {leases
                  .filter((l) => l.id !== lease.id)
                  .map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {l.property_name ?? "Property"}
                          {l.unit_number ? ` — Unit ${l.unit_number}` : ""}
                        </p>
                        {l.organization_name && (
                          <p className="text-xs text-slate-500">{l.organization_name}</p>
                        )}
                      </div>
                      <Badge variant={LEASE_STATUS_BADGE[l.status] ?? "neutral"}>
                        {LEASE_STATUS_LABEL[l.status] ?? l.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
