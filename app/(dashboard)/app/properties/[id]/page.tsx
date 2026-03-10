"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DoorOpen, Plus } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPMProperty, fetchPMUnits } from "@/services/pm/pmApiService";
import type { PMPropertyRow, PMUnitRow } from "@/services/pm/types";
import { RecommendedActions } from "@/components/ui/RecommendedActions";
import { WorkflowChecklist } from "@/components/ui/WorkflowChecklist";
import { derivePropertyInsights } from "@/lib/intelligence/deriveActions";
import { propertySetupSteps } from "@/lib/intelligence/checklists";
import { fetchProperty, fetchUnitsForProperty, updateProperty, createUnit } from "@/services/properties/propertyService";
import type { PropertyRow, UnitRow, CreatePropertyDTO, CreateUnitDTO } from "@/services/properties/types";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { UnitForm } from "@/components/properties/UnitForm";
import { UnitsTable } from "@/components/properties/UnitsTable";
import { PropertyDetailSkeleton } from "@/components/properties/PropertyDetailSkeleton";

/* ── PM Tab content panels (unchanged) ── */

function PMOverviewPanel({ property, units }: { property: PMPropertyRow; units: PMUnitRow[] }) {
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

function PMUnitsPanel({ units }: { units: (PMUnitRow & { property_name: string })[] }) {
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

/* ── PM detail component (unchanged) ── */

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
      { id: "overview",    label: "Overview",    content: <PMOverviewPanel property={property} units={units} /> },
      { id: "units",       label: `Units (${units.length})`, content: <PMUnitsPanel units={units} /> },
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

/* ── Owner tab panels ── */

function OwnerOverviewPanel({ property, units }: { property: PropertyRow; units: UnitRow[] }) {
  const occupied = units.filter((u) => u.status === "OCCUPIED").length;
  const vacant = units.filter((u) => u.status === "AVAILABLE").length;
  const scheduledRent = units.reduce((sum, u) => sum + u.rent_amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</h3>
          <p className="text-sm text-slate-700">{property.address_line1}</p>
          {property.address_line2 && <p className="text-sm text-slate-600">{property.address_line2}</p>}
          <p className="text-sm text-slate-600">{property.city}, {property.state} {property.postal_code}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Occupancy</h3>
          <p className="text-2xl font-semibold text-slate-900">
            {units.length > 0 ? Math.round((occupied / units.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500">{occupied} occupied · {vacant} vacant · {units.length} total</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled Rent</h3>
          <p className="text-2xl font-semibold text-slate-900">
            ${(scheduledRent / 100).toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span>
          </p>
          <p className="text-xs text-slate-500">{units.length} unit{units.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-500">Status</dt><dd><Badge variant={property.status === "ACTIVE" ? "success" : "neutral"}>{property.status}</Badge></dd></div>
          <div><dt className="text-slate-500">Country</dt><dd className="text-slate-700">{property.country}</dd></div>
          <div><dt className="text-slate-500">Created</dt><dd className="text-slate-700">{new Date(property.created_at).toLocaleDateString()}</dd></div>
          <div><dt className="text-slate-500">Updated</dt><dd className="text-slate-700">{new Date(property.updated_at).toLocaleDateString()}</dd></div>
        </dl>
      </div>
    </div>
  );
}

function OwnerUnitsPanel({
  units,
  propertyId,
  onUnitCreated,
}: {
  units: UnitRow[];
  propertyId: string;
  onUnitCreated: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async (data: CreateUnitDTO) => {
    await createUnit(propertyId, data);
    setShowCreate(false);
    onUnitCreated();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{units.length} unit{units.length !== 1 ? "s" : ""}</p>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          Add Unit
        </Button>
      </div>

      {units.length === 0 ? (
        <EmptyState
          icon={<DoorOpen size={40} strokeWidth={1.5} />}
          title="No units yet"
          description="Add units to this property to track occupancy and rent."
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
              Add Unit
            </Button>
          }
        />
      ) : (
        <UnitsTable units={units} />
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Unit">
        <UnitForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}

function OwnerEditPanel({
  property,
  onSaved,
}: {
  property: PropertyRow;
  onSaved: (updated: PropertyRow) => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (data: CreatePropertyDTO) => {
    const result = await updateProperty(property.id, data);
    onSaved(result.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl">
      {saved && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Property updated successfully.
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <PropertyForm
          initial={property}
          onSubmit={handleSubmit}
          onCancel={() => {}}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}

/* ── Owner Property Detail ── */

function OwnerPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [propRes, unitsRes] = await Promise.all([
        fetchProperty(id),
        fetchUnitsForProperty(id),
      ]);
      setProperty(propRes.data);
      setUnits(unitsRes.data);
    } catch (e: any) {
      setError(e.message || "Failed to load property");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadData().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [id]);

  const handleUnitCreated = () => {
    // Refresh units list
    fetchUnitsForProperty(id).then((res) => setUnits(res.data)).catch(() => {});
  };

  const handlePropertySaved = (updated: PropertyRow) => {
    setProperty(updated);
  };

  const tabs: TabItem[] = useMemo(() => {
    if (!property) return [];
    return [
      {
        id: "overview",
        label: "Overview",
        content: <OwnerOverviewPanel property={property} units={units} />,
      },
      {
        id: "units",
        label: `Units (${units.length})`,
        content: (
          <OwnerUnitsPanel
            units={units}
            propertyId={property.id}
            onUnitCreated={handleUnitCreated}
          />
        ),
      },
      {
        id: "edit",
        label: "Edit",
        content: <OwnerEditPanel property={property} onSaved={handlePropertySaved} />,
      },
    ];
  }, [property, units]);

  if (isLoading) return <PropertyDetailSkeleton />;

  if (error) {
    return (
      <>
        <Breadcrumb items={[{ label: "Properties", href: "/app/properties" }, { label: "Error" }]} className="mb-4" />
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      </>
    );
  }

  if (!property) return null;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Properties", href: "/app/properties" },
          { label: property.name },
        ]}
        className="mb-4"
      />
      <PageHeader
        title={property.name}
        description={`${property.address_line1}, ${property.city}, ${property.state} ${property.postal_code}`}
      />
      <Tabs items={tabs} defaultActiveId="overview" className="mt-6" />
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMPropertyDetail />;
  if (user?.persona === "owner") return <OwnerPropertyDetail />;
  return <div className="text-sm text-slate-400">Property detail is not available for your role.</div>;
}
