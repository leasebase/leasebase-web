"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, MapPin, DollarSign,
  FileText, Users, Calendar, CheckCircle2,
  User, Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchTenantLeases } from "@/services/tenant/adapters/leaseAdapter";
import { fetchTenantProfile } from "@/services/tenant/adapters/profileAdapter";
import { fetchTenantDocuments } from "@/services/tenant/adapters/documentAdapter";
import { authStore } from "@/lib/auth/store";
import type { LeaseRow, TenantProfileRow, DocumentRow } from "@/services/tenant/types";

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

function fmtMonthYear(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function leaseDurationMonths(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

const LEASE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active", EXTENDED: "Extended", DRAFT: "Being prepared",
  ASSIGNED: "Assigned", INVITED: "Awaiting your review",
  ACKNOWLEDGED: "Finalizing", EXPIRED: "Expired", RENEWED: "Renewed",
  INACTIVE: "Inactive",
};

/* ── Main component ── */

export function TenantLeasePage() {
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [profile, setProfile] = useState<TenantProfileRow | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [leaseResult, profileResult, docsResult] = await Promise.all([
          fetchTenantLeases(),
          fetchTenantProfile(),
          fetchTenantDocuments(),
        ]);
        if (!cancelled) {
          setLeases(leaseResult.data);
          setProfile(profileResult.data);
          setDocuments(docsResult.data);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load lease details");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton variant="text" className="h-7 w-48" /><Skeleton variant="text" className="mt-2 h-4 w-64" /></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6"><Skeleton variant="text" className="h-6 w-40" /><Skeleton variant="text" className="mt-2 h-4 w-64" /><Skeleton variant="text" className="mt-4 h-4 w-48" /></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6"><Skeleton variant="text" className="h-5 w-36" /><div className="mt-4 space-y-3">{[0,1].map(i=><div key={i} className="flex gap-4"><Skeleton variant="rectangular" className="w-11 h-11 rounded-lg" /><div className="flex-1"><Skeleton variant="text" className="h-3 w-24" /><Skeleton variant="text" className="mt-1 h-4 w-48" /></div></div>)}</div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[0,1].map(i=><div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-md p-5"><Skeleton variant="text" className="h-5 w-32" /><div className="mt-4 space-y-3">{[0,1].map(j=><div key={j} className="flex gap-3"><Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" /><div><Skeleton variant="text" className="h-3 w-20" /><Skeleton variant="text" className="mt-1 h-4 w-32" /></div></div>)}</div></div>)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-[26px] font-semibold text-slate-900 mb-1">Lease Details</h1><p className="text-[14px] text-slate-600">Your lease information and terms</p></div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  // Pick the best lease
  const selectedOrgId = authStore.getState().selectedOrgId || authStore.getState().user?.orgId;
  const orgLeases = selectedOrgId ? leases.filter((l) => l.organization_id === selectedOrgId) : leases;
  const lease =
    orgLeases.find((l) => l.status === "ACTIVE" || l.status === "EXTENDED") ??
    orgLeases[0] ?? leases.find((l) => l.status === "ACTIVE" || l.status === "EXTENDED") ??
    leases[0] ?? null;

  if (!lease) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-[26px] font-semibold text-slate-900 mb-1">Lease Details</h1><p className="text-[14px] text-slate-600">Your lease information and terms</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Building2 size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900">No lease found</h2>
          <p className="mt-2 text-sm text-slate-600">Your lease details will appear here once your property owner sets them up.</p>
        </div>
      </div>
    );
  }

  const isActive = lease.status === "ACTIVE" || lease.status === "EXTENDED";
  const statusLabel = LEASE_STATUS_LABEL[lease.status] ?? lease.status;
  const leaseDocuments = documents.filter((d) =>
    d.related_type === "lease" || d.category?.toLowerCase() === "lease" || d.category?.toLowerCase() === "inspection"
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-[26px] font-semibold text-slate-900 mb-1">Lease Details</h1>
        <p className="text-[14px] text-slate-600">Your lease information and terms</p>
      </div>

      {/* ── Lease Status Hero Card ── */}
      <div className="bg-gradient-to-br from-green-50 via-white to-green-50/30 rounded-2xl border border-green-200 shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-[18px] font-semibold text-slate-900">Current Lease</h2>
              <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded-lg ring-1 ${
                isActive
                  ? "bg-green-100 text-green-700 ring-green-200"
                  : "bg-amber-100 text-amber-700 ring-amber-200"
              }`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-[13px] text-slate-600">
              Lease agreement for {lease.property_name ?? "your property"}{lease.unit_number ? `, Unit ${lease.unit_number}` : ""}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <FileText className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
        </div>
        {isActive && lease.start_date && (
          <div className="flex items-center gap-2 text-[13px] text-green-700 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Signed and active since {fmtMonthYear(lease.start_date)}
          </div>
        )}
      </div>

      {/* ── Property Information ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <h3 className="text-[15px] font-semibold text-slate-900">Property Information</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-slate-500 font-medium mb-0.5">Property Address</p>
              <p className="text-[14px] font-semibold text-slate-900">{lease.property_name ?? "\u2014"}</p>
              {lease.property_address && <p className="text-[13px] text-slate-600">{lease.property_address}</p>}
            </div>
          </div>
          {lease.unit_number && (
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-violet-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-[12px] text-slate-500 font-medium mb-0.5">Unit Number</p>
                <p className="text-[14px] font-semibold text-slate-900">Unit {lease.unit_number}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Lease Period + Financial Terms (2-col) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lease Period */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-[15px] font-semibold text-slate-900">Lease Period</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-green-600" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[12px] text-slate-500 font-medium mb-0.5">Start Date</p>
                <p className="text-[14px] font-semibold text-slate-900">{lease.start_date ? fmtDate(lease.start_date) : "\u2014"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[12px] text-slate-500 font-medium mb-0.5">End Date</p>
                <p className="text-[14px] font-semibold text-slate-900">{lease.end_date ? fmtDate(lease.end_date) : "\u2014"}</p>
              </div>
            </div>
            {lease.start_date && lease.end_date && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[12px] text-slate-600">Lease duration: {leaseDurationMonths(lease.start_date, lease.end_date)} months</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Terms */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-[15px] font-semibold text-slate-900">Financial Terms</h3>
          </div>
          <div className="p-5 space-y-4">
            {lease.rent_amount && lease.rent_amount > 0 ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[12px] text-slate-500 font-medium mb-0.5">Monthly Rent</p>
                  <p className="text-[18px] font-bold text-slate-900">{fmtCurrency(lease.rent_amount)}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Due on the 1st of each month</p>
                </div>
              </div>
            ) : null}
            {lease.deposit_amount && lease.deposit_amount > 0 ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[12px] text-slate-500 font-medium mb-0.5">Security Deposit</p>
                  <p className="text-[14px] font-semibold text-slate-900">{fmtCurrency(lease.deposit_amount)}</p>
                </div>
              </div>
            ) : null}
            {!lease.rent_amount && !lease.deposit_amount && (
              <p className="text-[13px] text-slate-500">Financial details will appear once your lease is finalized.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tenant Information ── */}
      {profile && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-[15px] font-semibold text-slate-900">Tenant Information</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-violet-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-[12px] text-slate-500 font-medium mb-0.5">Primary Tenant</p>
                <p className="text-[14px] font-semibold text-slate-900 mb-1">{profile.name}</p>
                <div className="space-y-1 text-[13px] text-slate-600">
                  <p>{profile.email}</p>
                  {profile.phone && <p>{profile.phone}</p>}
                </div>
              </div>
            </div>
            {/* Co-tenants */}
            {lease.tenants && lease.tenants.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[12px] text-slate-500 font-medium mb-2">Co-tenants</p>
                <div className="space-y-2">
                  {lease.tenants.map((t) => (
                    <div key={t.id} className="flex items-center justify-between">
                      <span className="text-[13px] text-slate-700">{t.name}</span>
                      <span className="text-[11px] text-slate-500">{t.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lease Documents ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Lease Documents</h3>
            <Link href="/app/documents" className="text-[12px] text-green-600 hover:text-green-700 font-semibold">
              View All Documents
            </Link>
          </div>
        </div>
        <div className="p-5">
          {leaseDocuments.length > 0 ? (
            <div className="space-y-3">
              {leaseDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 mb-0.5">{doc.title || doc.name || "Document"}</p>
                      <p className="text-[12px] text-slate-600">
                        {doc.category ?? doc.related_type} &bull; {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/app/documents`}
                    className="flex items-center gap-2 h-9 px-3 bg-white text-slate-700 text-[12px] font-semibold rounded-lg border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FileText size={40} strokeWidth={1.5} className="mx-auto mb-3 text-slate-400" />
              <p className="text-[13px] text-slate-600">No lease documents available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Lease Renewal Notice ── */}
      {lease.end_date && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-2xl border border-blue-200 p-6">
          <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Lease Renewal</h3>
          <p className="text-[13px] text-slate-600 mb-4">
            Your lease expires on {fmtDate(lease.end_date)}.
            We&apos;ll reach out about renewal options 60 days before your lease ends.
          </p>
          <div className="flex items-center gap-2 text-[12px] text-blue-700 font-medium">
            <Calendar className="w-4 h-4" />
            Renewal notice expected: {fmtMonthYear(
              new Date(new Date(lease.end_date + "T00:00:00").getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            )}
          </div>
        </div>
      )}
    </div>
  );
}
