"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AddUnitModal } from "@/components/properties/AddUnitModal";
import { apiRequest } from "@/lib/api/client";
import { DoorOpen, Building2, Plus } from "lucide-react";

interface Unit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  rentAmount: number;
  status: string;
  property?: { id: string; name: string };
}

interface Property {
  id: string;
  name: string;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUnitTarget, setAddUnitTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [props] = await Promise.all([
        apiRequest<Property[]>({ path: "api/properties" }),
      ]);
      setProperties(props);

      // Fetch units for each property
      const allUnits: Unit[] = [];
      for (const p of props) {
        try {
          const propertyUnits = await apiRequest<Unit[]>({ path: `api/properties/${p.id}/units` });
          allUnits.push(...propertyUnits.map((u) => ({ ...u, property: { id: p.id, name: p.name } })));
        } catch {
          // skip properties where unit fetch fails
        }
      }
      setUnits(allUnits);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUnitCreated = () => {
    setAddUnitTarget(null);
    fetchData();
  };

  const formatRent = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <>
        <PageHeader title="Units" description="All units across your properties." />
        <div className="mt-8 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-slate-800 bg-slate-950/70" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Units"
        description="View all units across properties — occupancy, rent, and lease status."
        actions={
          properties.length > 0 ? (
            <Button
              icon={<Plus size={16} />}
              onClick={() => setAddUnitTarget({ id: properties[0].id, name: properties[0].name })}
            >
              Add Unit
            </Button>
          ) : undefined
        }
      />

      {units.length === 0 ? (
        <EmptyState
          icon={<DoorOpen size={48} strokeWidth={1.5} />}
          title="No units yet"
          description="Add a property first, then create units for it."
          className="mt-8"
        />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-400">
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Property</th>
                <th className="px-3 py-2">Bed / Bath</th>
                <th className="px-3 py-2">Sq Ft</th>
                <th className="px-3 py-2">Rent</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/50">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <DoorOpen size={14} className="text-slate-500" />
                      <span className="font-medium text-slate-100">{u.unitNumber}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Building2 size={12} className="text-slate-500" />
                      {u.property?.name ?? "—"}
                    </div>
                  </td>
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
