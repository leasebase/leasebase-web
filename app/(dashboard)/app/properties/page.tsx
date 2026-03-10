"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Building2, Plus } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPMProperties } from "@/services/pm/pmApiService";
import type { PMPropertyRow, PMPaginationMeta } from "@/services/pm/types";

function PMPropertiesPage() {
  const [properties, setProperties] = useState<PMPropertyRow[]>([]);
  const [meta, setMeta] = useState<PMPaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchPMProperties();
        if (!cancelled) { setProperties(res.data); setMeta(res.meta); }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load properties");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader title="Properties" description="Manage your assigned properties." />
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="text" className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={<Building2 size={48} strokeWidth={1.5} />}
            title="No properties"
            description="You have no properties assigned to your account."
            action={
              <Link href="/app/properties">
                <Button variant="primary" icon={<Plus size={16} />}>Add Property</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {properties.map((p) => (
              <Link
                key={p.id}
                href={`/app/properties/${p.id}`}
                className="block rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100">{p.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {p.address_line1}, {p.city}, {p.state} {p.postal_code}
                    </p>
                  </div>
                  <Badge variant={p.status === "ACTIVE" ? "success" : "neutral"}>
                    {p.status}
                  </Badge>
                </div>
              </Link>
            ))}
            {meta && meta.total > 0 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                Showing {properties.length} of {meta.total} properties
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMPropertiesPage />;

  return (
    <>
      <PageHeader title="Properties" description="Manage your property portfolio — buildings, addresses, and unit counts." />
      <EmptyState
        icon={<Building2 size={48} strokeWidth={1.5} />}
        title="No properties yet"
        description="Add your first property to start managing your portfolio."
        action={
          <Button variant="primary" icon={<Plus size={16} />}>Add Property</Button>
        }
        className="mt-8"
      />
    </>
  );
}
