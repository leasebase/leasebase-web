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

  return (
    <>
      <PageHeader
        title="Properties"
        description="Manage your property portfolio — buildings, addresses, and unit counts."
        actions={
          <Link href="/app/properties/new">
            <Button variant="primary" icon={<Plus size={16} />}>Add Property</Button>
          </Link>
        }
      />
      <div className="mt-6">
        <PropertiesTable
          properties={properties}
          unitCounts={unitCounts}
        />
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
