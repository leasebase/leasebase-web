"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Users, Plus } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPMTenants } from "@/services/pm/pmApiService";
import type { PMTenantListRow } from "@/services/pm/pmApiService";
import type { PMPaginationMeta } from "@/services/pm/types";

function PMTenantsPage() {
  const [tenants, setTenants] = useState<PMTenantListRow[]>([]);
  const [meta, setMeta] = useState<PMPaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchPMTenants();
        if (!cancelled) { setTenants(res.data); setMeta(res.meta); }
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader title="Tenants" description="Tenants across your assigned properties." />
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" className="h-14 w-full rounded-md" />)}</div>
        ) : error ? (
          <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={<Users size={48} strokeWidth={1.5} />}
            title="No tenants"
            description="No tenants found in your assigned properties."
            action={
              <Link href="/app/tenants">
                <Button variant="primary" icon={<Plus size={16} />}>Invite Tenant</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {tenants.map((t) => (
              <Link key={t.id} href={`/app/tenants/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-100">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.email} · Unit {t.unit_number} · {t.property_name}</p>
                </div>
                {t.phone && <span className="text-xs text-slate-500">{t.phone}</span>}
              </Link>
            ))}
            {meta && meta.total > 0 && <p className="text-xs text-slate-500 text-center pt-2">Showing {tenants.length} of {meta.total}</p>}
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMTenantsPage />;
  return (
    <>
      <PageHeader title="Tenants" description="Manage tenant records, contacts, and lease associations." />
      <EmptyState
        icon={<Users size={48} strokeWidth={1.5} />}
        title="No tenants yet"
        description="Add your first tenant to manage contacts and lease associations."
        action={
          <Button variant="primary" icon={<Plus size={16} />}>Add Tenant</Button>
        }
        className="mt-8"
      />
    </>
  );
}
