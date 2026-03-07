"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AddUnitModal } from "@/components/properties/AddUnitModal";
import { apiRequest } from "@/lib/api/client";
import { Building2, DoorOpen, MapPin, Plus } from "lucide-react";
import { use } from "react";

interface Property {
  id: string;
  name: string;
  propertyType: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  numberOfUnits: number;
}

interface Unit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  rentAmount: number;
  status: string;
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUnit, setShowAddUnit] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [prop, propUnits] = await Promise.all([
        apiRequest<Property>({ path: `api/properties/${id}` }),
        apiRequest<Unit[]>({ path: `api/properties/${id}/units` }).catch(() => []),
      ]);
      setProperty(prop);
      setUnits(propUnits);
    } catch {
      // property not found
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUnitCreated = () => {
    setShowAddUnit(false);
    fetchData();
  };

  const formatRent = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <>
        <PageHeader title="Property Details" />
        <div className="mt-8 h-40 animate-pulse rounded-lg border border-slate-800 bg-slate-950/70" />
      </>
    );
  }

  if (!property) {
    return (
      <>
        <PageHeader title="Property Details" />
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1.5} />}
          title="Property not found"
          description="This property may have been deleted or you don't have access."
          className="mt-8"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={property.name}
        description={`${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setShowAddUnit(true)}>
            Add Unit
          </Button>
        }
      />

      {/* Property info */}
      <div className="mt-4 flex flex-wrap gap-3">
        <Badge variant="info">{property.propertyType?.replace("_", " ") ?? "Property"}</Badge>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <DoorOpen size={12} /> {units.length} / {property.numberOfUnits} units configured
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin size={12} /> {property.city}, {property.state}
        </span>
      </div>

      {/* Units list */}
      <h2 className="mt-6 text-sm font-semibold text-slate-100">Units</h2>
      {units.length === 0 ? (
        <EmptyState
          icon={<DoorOpen size={48} strokeWidth={1.5} />}
          title="No units yet"
          description="Add units to this property to start tracking occupancy and rent."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setShowAddUnit(true)}>
              Add Unit
            </Button>
          }
          className="mt-4"
        />
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-400">
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Bed / Bath</th>
                <th className="px-3 py-2">Sq Ft</th>
                <th className="px-3 py-2">Rent</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/50">
                  <td className="px-3 py-2.5 font-medium text-slate-100">{u.unitNumber}</td>
                  <td className="px-3 py-2.5 text-slate-300">{u.bedrooms} / {u.bathrooms}</td>
                  <td className="px-3 py-2.5 text-slate-300">{u.squareFeet ?? "—"}</td>
                  <td className="px-3 py-2.5 text-slate-100 font-medium">{formatRent(u.rentAmount)}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={u.status === "OCCUPIED" ? "success" : "info"}>
                      {u.status ?? "Vacant"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddUnit && (
        <AddUnitModal
          propertyId={property.id}
          propertyName={property.name}
          onClose={() => setShowAddUnit(false)}
          onCreated={handleUnitCreated}
        />
      )}
    </>
  );
}
