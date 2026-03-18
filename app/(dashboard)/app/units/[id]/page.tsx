"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Home } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchUnit, fetchProperty, updateUnit } from "@/services/properties/propertyService";
import type { UnitRow, PropertyRow, CreateUnitDTO } from "@/services/properties/types";
import { UnitForm } from "@/components/properties/UnitForm";

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  OCCUPIED: "success",
  AVAILABLE: "info",
  MAINTENANCE: "warning",
  OFFLINE: "neutral",
};

/* ── Owner Unit Detail ── */

function OwnerUnitDetail() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<UnitRow | null>(null);
  const [propertyName, setPropertyName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const unitRes = await fetchUnit(id);
        if (cancelled) return;
        setUnit(unitRes.data);
        // Fetch property name for breadcrumb
        try {
          const propRes = await fetchProperty(unitRes.data.property_id);
          if (!cancelled) setPropertyName(propRes.data.name);
        } catch {
          // Non-critical — just show ID in breadcrumb
          if (!cancelled) setPropertyName(unitRes.data.property_id);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load unit");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleEdit = async (data: CreateUnitDTO) => {
    const result = await updateUnit(id, data);
    setUnit(result.data);
    setShowEdit(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-4 w-48" /><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-40 w-full rounded-lg" /></div>;
  if (error) return (
    <>
      <Breadcrumb items={[{ label: "Properties", href: "/app/properties" }, { label: "Error" }]} className="mb-4" />
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>
    </>
  );
  if (!unit) return null;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Properties", href: "/app/properties" },
          { label: propertyName, href: `/app/properties/${unit.property_id}` },
          { label: `Unit ${unit.unit_number}` },
        ]}
        className="mb-4"
      />
      <PageHeader
        title={`Unit ${unit.unit_number}`}
        description={propertyName}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>Edit Unit</Button>
        }
      />

      {saved && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Unit updated successfully.
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANTS[unit.status] ?? "neutral"}>{unit.status}</Badge>
          <span className="text-xs text-slate-400">{unit.bedrooms} bed · {unit.bathrooms} bath</span>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Rent</dt>
            <dd className="text-slate-900 font-medium">${(unit.rent_amount / 100).toLocaleString()}/mo</dd>
          </div>
          <div>
            <dt className="text-slate-500">Square Feet</dt>
            <dd className="text-slate-700">{unit.square_feet ? unit.square_feet.toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Property</dt>
            <dd>
              <Link href={`/app/properties/${unit.property_id}`} className="text-brand-600 hover:underline">{propertyName}</Link>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Created</dt>
            <dd className="text-slate-700">{new Date(unit.created_at).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Updated</dt>
            <dd className="text-slate-700">{new Date(unit.updated_at).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Unit">
        <UnitForm
          initial={unit}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          submitLabel="Save Changes"
        />
      </Modal>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "owner") return <OwnerUnitDetail />;
  return (
    <>
      <PageHeader title="Unit" description="View unit details." />
      <EmptyState icon={<Home size={48} strokeWidth={1.5} />} title="Not available" description="Unit detail is not available for your account type." className="mt-8" />
    </>
  );
}
