"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { authStore } from "@/lib/auth/store";
import { fetchPMTenant } from "@/services/pm/pmApiService";
import type { PMTenantDetailRow } from "@/services/pm/pmApiService";
import { RecommendedActions } from "@/components/ui/RecommendedActions";
import { deriveTenantDetailInsights } from "@/lib/intelligence/deriveActions";

function PMTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<PMTenantDetailRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchPMTenant(id);
        if (!cancelled) setTenant(res.data);
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-8 w-48" /><Skeleton variant="text" className="h-32 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>;
  if (!tenant) return null;

  const insights = deriveTenantDetailInsights(tenant);

  return (
    <>
      <PageHeader title={tenant.name} description={`${tenant.email} · Unit ${tenant.unit_number} · ${tenant.property_name}`} />
      <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Lease status:</span>
          <Badge variant={tenant.lease_status === "ACTIVE" ? "success" : "neutral"}>{tenant.lease_status}</Badge>
        </div>
        {tenant.phone && <p className="text-sm text-slate-300">Phone: {tenant.phone}</p>}
        <p className="text-sm text-slate-300">Rent: ${(tenant.rent_amount / 100).toLocaleString()}/mo</p>
        <p className="text-sm text-slate-300">Lease: {new Date(tenant.start_date).toLocaleDateString()} — {new Date(tenant.end_date).toLocaleDateString()}</p>
      </div>
      <RecommendedActions insights={insights} title="Tenant Insights" className="mt-6" />
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMTenantDetail />;
  return <div className="text-sm text-slate-400">Tenant detail is not available for your role.</div>;
}
