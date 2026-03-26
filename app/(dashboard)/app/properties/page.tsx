"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Building2, Plus, MapPin, TrendingUp } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPropertiesWithUnitCounts } from "@/services/properties/propertyService";
import type { PropertyRow } from "@/services/properties/types";
import { PropertiesTable } from "@/components/properties/PropertiesTable";
import { PropertiesEmptyState } from "@/components/properties/PropertiesEmptyState";
import { PropertiesSkeleton } from "@/components/properties/PropertiesSkeleton";

/* ── Owner Properties ── */

function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [unitCounts, setUnitCounts] = useState<Record<string, { total: number; occupied: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchPropertiesWithUnitCounts();
        if (!cancelled) {
          setProperties(res.data);
          setUnitCounts(res.unitCounts);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load properties");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <PropertiesSkeleton />;

  if (error) {
    return (
      <>
        <PageHeader title="Properties" description="Manage your property portfolio." />
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      </>
    );
  }

  if (properties.length === 0) {
    return (
      <>
        <PageHeader title="Properties" description="Manage your property portfolio." />
        <div className="mt-8">
          <PropertiesEmptyState />
        </div>
      </>
    );
  }

  const totalUnits = Object.values(unitCounts).reduce((sum, c) => sum + c.total, 0);

  return (
    <>
      <PageHeader
        title="Properties"
        description={`${properties.length} properties \u00b7 ${totalUnits} total units`}
        actions={
          <Link href="/app/properties/new">
            <Button variant="primary" icon={<Plus size={16} />}>Add Property</Button>
          </Link>
        }
      />

      {/* Property Cards — UIUX style */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {properties.map((property) => {
          const counts = unitCounts[property.id] ?? { total: 0, occupied: 0 };
          const occupancyRate = counts.total > 0 ? Math.round((counts.occupied / counts.total) * 100) : 0;

          return (
            <Link
              key={property.id}
              href={`/app/properties/${property.id}`}
              className="bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group block"
            >
              {/* Colored header strip */}
              <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-500" />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">{property.name}</h3>
                    <div className="flex items-center gap-2 text-slate-600 text-[13px]">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {property.address_line1}, {property.city}, {property.state} {property.postal_code}
                      </span>
                    </div>
                  </div>
                  <Badge variant={property.status === "ACTIVE" ? "success" : "neutral"}>
                    {property.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-1">Total Units</p>
                    <p className="text-xl font-semibold text-slate-900">{counts.total}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-1">Occupied</p>
                    <p className="text-xl font-semibold text-slate-900">{counts.occupied}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-1">Occupancy</p>
                    <p className={`text-xl font-semibold ${
                      occupancyRate >= 90 ? "text-emerald-600" :
                      occupancyRate >= 70 ? "text-amber-600" :
                      "text-red-600"
                    }`}>{occupancyRate}%</p>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[12px] text-slate-500 font-medium">
                    {counts.total - counts.occupied} vacant unit{counts.total - counts.occupied !== 1 ? "s" : ""}
                  </p>
                  <span className="text-[13px] text-blue-600 font-medium flex items-center gap-1 group-hover:text-blue-700">
                    View Details
                    <TrendingUp className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "owner") return <OwnerPropertiesPage />;

  return (
    <>
      <PageHeader title="Properties" description="Manage your property portfolio." />
      <EmptyState
        icon={<Building2 size={48} strokeWidth={1.5} />}
        title="Not available"
        description="Property management is not available for your account type."
        className="mt-8"
      />
    </>
  );
}
