"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Home } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPMUnit } from "@/services/pm/pmApiService";
import type { PMUnitRow } from "@/services/pm/types";

const OCCUPANCY_VARIANTS: Record<string, "success" | "danger" | "neutral"> = {
  OCCUPIED: "success", VACANT: "danger",
};

function PMUnitDetail() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<(PMUnitRow & { property_name: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchPMUnit(id);
        if (!cancelled) setUnit(res.data);
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-32 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>;
  if (!unit) return null;

  return (
    <>
      <PageHeader title={`Unit ${unit.unit_number}`} description={unit.property_name} />
      <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={OCCUPANCY_VARIANTS[unit.status] || "neutral"}>{unit.status}</Badge>
          {unit.bedrooms != null && <span className="text-xs text-slate-400">{unit.bedrooms} bed · {unit.bathrooms} bath</span>}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-500">Rent</dt><dd className="text-slate-200">${(unit.rent_amount / 100).toLocaleString()}/mo</dd></div>
          <div><dt className="text-slate-500">Sq Ft</dt><dd className="text-slate-200">{unit.sq_ft ?? "—"}</dd></div>
          <div>
            <dt className="text-slate-500">Property</dt>
            <dd className="text-slate-200">
              <Link href={`/app/properties/${unit.property_id}`} className="text-brand-400 hover:underline">{unit.property_name}</Link>
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMUnitDetail />;
  return (
    <>
      <PageHeader title="Unit" description="View unit details." />
      <EmptyState icon={<Home size={48} strokeWidth={1.5} />} title="Coming soon" description="This section is under development." className="mt-8" />
    </>
  );
}
