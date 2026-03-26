"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Plus, FileText, Clock, AlertTriangle } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchLeases } from "@/services/leases/leaseService";
import type { LeaseRow } from "@/services/leases/types";
import { LeasesTable } from "@/components/leases/LeasesTable";
import { LeasesEmptyState } from "@/components/leases/LeasesEmptyState";
import { LeasesSkeleton } from "@/components/leases/LeasesSkeleton";
import { TenantLeasePage } from "@/components/tenant/TenantLeasePage";

/* ── Owner Leases Page ── */

function LeasesListPage() {
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchLeases();
        if (!cancelled) setLeases(res.data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load leases");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <LeasesSkeleton />;

  if (error) {
    return (
      <>
        <PageHeader title="Leases" description="View and manage lease agreements." />
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      </>
    );
  }

  if (leases.length === 0) {
    return (
      <>
        <PageHeader title="Leases" description="View and manage lease agreements." />
        <div className="mt-8">
          <LeasesEmptyState />
        </div>
      </>
    );
  }

  const activeCount = leases.filter((l) => (l.display_status ?? l.status) === "ACTIVE" || (l.display_status ?? l.status) === "EXTENDED").length;
  const draftCount = leases.filter((l) => (l.display_status ?? l.status) === "DRAFT").length;
  const pendingCount = leases.filter((l) => (l.display_status ?? l.status) === "ACKNOWLEDGED").length;
  const expiringCount = leases.filter((l) => {
    if ((l.display_status ?? l.status) !== "ACTIVE") return false;
    const end = new Date(l.end_date);
    const now = new Date();
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 90 && diff > 0;
  }).length;

  return (
    <>
      <PageHeader
        title="Leases"
        description={`${activeCount} active \u00b7 ${pendingCount > 0 ? `${pendingCount} pending signature` : `${leases.length} total`}`}
        actions={
          <Link href="/app/leases/new">
            <Button variant="primary" icon={<Plus size={16} />}>Create Lease</Button>
          </Link>
        }
      />

      {/* Summary Cards — UIUX style */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-medium text-slate-600">Active Leases</h3>
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-semibold text-slate-900 tracking-tight">{activeCount}</p>
          {expiringCount > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-amber-600 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {expiringCount} expiring within 90 days
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-medium text-slate-600">Pending Signature</h3>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-semibold text-slate-900 tracking-tight">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-medium text-slate-600">Drafts</h3>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-semibold text-slate-900 tracking-tight">{draftCount}</p>
        </div>
      </div>

      <div className="mt-6">
        <LeasesTable leases={leases} />
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();

  // Tenant persona: show tenant-specific lease details
  if (user?.persona === "tenant") {
    return <TenantLeasePage />;
  }

  // Owner/manager: full lease management view
  return <LeasesListPage />;
}
