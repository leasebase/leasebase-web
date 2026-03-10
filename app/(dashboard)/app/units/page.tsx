"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { DoorOpen, Plus } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPMUnits } from "@/services/pm/pmApiService";
import type { PMUnitRow, PMPaginationMeta } from "@/services/pm/types";

function PMUnitsPage() {
  const [units, setUnits] = useState<(PMUnitRow & { property_name: string })[]>([]);
  const [meta, setMeta] = useState<PMPaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchPMUnits();
        if (!cancelled) { setUnits(res.data); setMeta(res.meta); }
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader title="Units" description="View all units across your assigned properties." />
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" className="h-14 w-full rounded-md" />)}</div>
        ) : error ? (
          <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : units.length === 0 ? (
          <EmptyState
            icon={<DoorOpen size={48} strokeWidth={1.5} />}
            title="No units"
            description="No units found in your assigned properties."
            action={
              <Link href="/app/units">
                <Button variant="primary" icon={<Plus size={16} />}>Add Unit</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {units.map((u) => (
              <Link key={u.id} href={`/app/units/${u.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700">
                <div>
                  <span className="text-sm font-medium text-slate-100">Unit {u.unit_number}</span>
                  <span className="ml-2 text-xs text-slate-400">— {u.property_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">${(u.rent_amount / 100).toLocaleString()}/mo</span>
                  <Badge variant={u.status === "OCCUPIED" ? "success" : "info"}>{u.status}</Badge>
                </div>
              </Link>
            ))}
            {meta && meta.total > 0 && <p className="text-xs text-slate-500 text-center pt-2">Showing {units.length} of {meta.total} units</p>}
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMUnitsPage />;
  return (
    <>
      <PageHeader title="Units" description="View all units across properties." />
      <EmptyState
        icon={<DoorOpen size={48} strokeWidth={1.5} />}
        title="No units yet"
        description="Create units for your properties to manage occupancy and rent."
        action={
          <Button variant="primary" icon={<Plus size={16} />}>Add Unit</Button>
        }
        className="mt-8"
      />
    </>
  );
}
