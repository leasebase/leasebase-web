"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
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
        description="View and manage lease agreements — active, upcoming, and expired."
        actions={
          <Link href="/app/leases/new">
            <Button variant="primary" icon={<Plus size={16} />}>Create Lease</Button>
          </Link>
        }
      />

      {/* Summary strip */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {activeCount} active
        </span>
        {draftCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {draftCount} draft{draftCount !== 1 ? "s" : ""}
          </span>
        )}
        {expiringCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {expiringCount} expiring within 90d
          </span>
        )}
        <span className="text-xs text-slate-400">{leases.length} total</span>
      </div>

      <div className="mt-5">
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
