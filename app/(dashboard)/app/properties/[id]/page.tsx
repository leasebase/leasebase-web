"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { authStore } from "@/lib/auth/store";
import { fetchPMProperty, fetchPMUnits } from "@/services/pm/pmApiService";
import type { PMPropertyRow, PMUnitRow } from "@/services/pm/types";

function PMPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PMPropertyRow | null>(null);
  const [units, setUnits] = useState<(PMUnitRow & { property_name: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [propRes, unitsRes] = await Promise.all([fetchPMProperty(id), fetchPMUnits(1, 100)]);
        if (!cancelled) { setProperty(propRes.data); setUnits(unitsRes.data.filter((u) => u.property_id === id)); }
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-40 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>;
  if (!property) return null;

  return (
    <>
      <PageHeader title={property.name} description={`${property.address_line1}, ${property.city}, ${property.state} ${property.postal_code}`} />
      <div className="mt-6 space-y-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Units ({units.length})</h2>
          {units.length === 0 ? <p className="text-xs text-slate-500">No units found.</p> : (
            <div className="space-y-2">
              {units.map((u) => (
                <Link key={u.id} href={`/app/units/${u.id}`}
                  className="flex items-center justify-between rounded-md border border-slate-700/50 p-3 transition-colors hover:border-slate-600">
                  <div>
                    <span className="text-sm font-medium text-slate-100">Unit {u.unit_number}</span>
                    <span className="ml-3 text-xs text-slate-400">{u.bedrooms}bd/{u.bathrooms}ba</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">${(u.rent_amount / 100).toLocaleString()}/mo</span>
                    <Badge variant={u.status === "OCCUPIED" ? "success" : "info"}>{u.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/app/tenants" className="text-xs text-brand-400 hover:underline">View tenants →</Link>
          <Link href="/app/maintenance" className="text-xs text-brand-400 hover:underline">View maintenance →</Link>
          <Link href="/app/documents" className="text-xs text-brand-400 hover:underline">View documents →</Link>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMPropertyDetail />;
  return <div className="text-sm text-slate-400">Property detail is not available for your role.</div>;
}
