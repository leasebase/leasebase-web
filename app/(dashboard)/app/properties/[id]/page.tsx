"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { authStore } from "@/lib/auth/store";
import { fetchPMProperty, fetchPMUnits } from "@/services/pm/pmApiService";
import type { PMPropertyRow, PMUnitRow } from "@/services/pm/types";
import { RecommendedActions } from "@/components/ui/RecommendedActions";
import { WorkflowChecklist } from "@/components/ui/WorkflowChecklist";
import { derivePropertyInsights } from "@/lib/intelligence/deriveActions";
import { propertySetupSteps } from "@/lib/intelligence/checklists";

/* ── Tab content panels ── */

function OverviewPanel({ property, units }: { property: PMPropertyRow; units: PMUnitRow[] }) {
  const insights = derivePropertyInsights(property, units);
  const setupSteps = propertySetupSteps(property, units, false, false, false);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</h3>
          <p className="text-sm text-slate-700">{property.address_line1}</p>
          <p className="text-sm text-slate-600">{property.city}, {property.state} {property.postal_code}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h3>
          <p className="text-sm text-slate-600">Status: <Badge variant={property.status === "ACTIVE" ? "success" : "neutral"}>{property.status || "—"}</Badge></p>
          <p className="text-sm text-slate-600">Country: <span className="text-slate-900">{property.country || "—"}</span></p>
        </div>
      </div>
      <RecommendedActions insights={insights} title="Property Insights" />
      <WorkflowChecklist
        title="Property setup"
        steps={setupSteps}
        dismissKey={`lb-prop-setup-${property.id}`}
      />
    </div>
  );
}

function UnitsPanel({ units }: { units: (PMUnitRow & { property_name: string })[] }) {
  if (units.length === 0) return <p className="text-sm text-slate-500">No units found for this property.</p>;
  return (
    <div className="space-y-2">
      {units.map((u) => (
        <Link key={u.id} href={`/app/units/${u.id}`}
          className="flex items-center justify-between rounded-md border border-slate-700/50 p-3 transition-colors hover:border-slate-300">
          <div>
            <span className="text-sm font-medium text-slate-900">Unit {u.unit_number}</span>
            <span className="ml-3 text-xs text-slate-400">{u.bedrooms}bd/{u.bathrooms}ba</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">${(u.rent_amount / 100).toLocaleString()}/mo</span>
            <Badge variant={u.status === "OCCUPIED" ? "success" : "info"}>{u.status}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PlaceholderPanel({ label, href }: { label: string; href: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-8 text-center">
      <p className="text-sm text-slate-400 mb-3">No {label.toLowerCase()} data linked to this property yet.</p>
      <Link href={href} className="text-sm text-brand-600 hover:underline">View all {label.toLowerCase()} →</Link>
    </div>
  );
}

/* ── Main detail component ── */

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

  const tabs: TabItem[] = useMemo(() => {
    if (!property) return [];
    return [
      { id: "overview",    label: "Overview",    content: <OverviewPanel property={property} units={units} /> },
      { id: "units",       label: `Units (${units.length})`, content: <UnitsPanel units={units} /> },
      { id: "tenants",     label: "Tenants",     content: <PlaceholderPanel label="Tenants" href="/app/tenants" /> },
      { id: "leases",      label: "Leases",      content: <PlaceholderPanel label="Leases" href="/app/leases" /> },
      { id: "maintenance", label: "Maintenance", content: <PlaceholderPanel label="Maintenance" href="/app/maintenance" /> },
      { id: "documents",   label: "Documents",   content: <PlaceholderPanel label="Documents" href="/app/documents" /> },
      { id: "financials",  label: "Financials",  content: <PlaceholderPanel label="Financial" href="/app/payments" /> },
    ];
  }, [property, units]);

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-40 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!property) return null;

  return (
    <>
      <PageHeader title={property.name} description={`${property.address_line1}, ${property.city}, ${property.state} ${property.postal_code}`} />
      <Tabs items={tabs} defaultActiveId="overview" className="mt-6" />
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMPropertyDetail />;
  return <div className="text-sm text-slate-400">Property detail is not available for your role.</div>;
}
