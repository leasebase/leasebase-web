"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AddPropertyModal } from "@/components/properties/AddPropertyModal";
import { AddUnitModal } from "@/components/properties/AddUnitModal";
import { apiRequest } from "@/lib/api/client";
import { Building2, Plus, DoorOpen, MapPin } from "lucide-react";
import Link from "next/link";

interface Property {
  id: string;
  name: string;
  propertyType: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  numberOfUnits: number;
  _count?: { units: number };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [addUnitTarget, setAddUnitTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      const data = await apiRequest<Property[]>({ path: "api/properties" });
      setProperties(data);
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handlePropertyCreated = (property: Property) => {
    setShowAddProperty(false);
    setProperties((prev) => [property, ...prev]);
    // Prompt to add units for the new property
    setAddUnitTarget({ id: property.id, name: property.name });
  };

  const handleUnitCreated = () => {
    setAddUnitTarget(null);
    fetchProperties(); // refresh counts
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Properties" description="Manage your property portfolio." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-slate-800 bg-slate-950/70" />
          ))}
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
          <Button icon={<Plus size={16} />} onClick={() => setShowAddProperty(true)}>
            Add Property
          </Button>
        }
      />

      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1.5} />}
          title="No properties yet"
          description="Add your first property to start managing units and tenants."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setShowAddProperty(true)}>
              Add Property
            </Button>
          }
          className="mt-8"
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/app/properties/${p.id}`}
              className="group rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition-colors hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-brand-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white">{p.name}</h3>
                </div>
                <Badge variant="info">{p.propertyType?.replace("_", " ") ?? "Property"}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={12} />
                <span>{p.addressLine1}, {p.city}, {p.state} {p.postalCode}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <DoorOpen size={12} />
                  <span>{p._count?.units ?? 0} / {p.numberOfUnits} units</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setAddUnitTarget({ id: p.id, name: p.name });
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  + Add Unit
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showAddProperty && (
        <AddPropertyModal onClose={() => setShowAddProperty(false)} onCreated={handlePropertyCreated} />
      )}
      {addUnitTarget && (
        <AddUnitModal
          propertyId={addUnitTarget.id}
          propertyName={addUnitTarget.name}
          onClose={() => setAddUnitTarget(null)}
          onCreated={handleUnitCreated}
        />
      )}
    </>
  );
}
