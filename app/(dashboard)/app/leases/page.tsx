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
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
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
