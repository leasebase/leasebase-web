"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { api, toApiError } from "@/lib/api/http";
import type { Property, Unit } from "@/lib/api/types";

interface Combined {
  property: Property;
  units: Unit[];
}

export default function PropertyDetailPage() {
  const params = useParams<{ propertyId: string }>();
  const [state, setState] = useState<{
    data: Combined | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Combined>(`/pm/properties/${params.propertyId}`);
        setState({ data: res.data, loading: false, error: null });
      } catch (err) {
        const e = toApiError(err);
        setState({ data: null, loading: false, error: e.message });
      }
    })();
  }, [params.propertyId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={state.data?.property.name || "Property"}
        description="View property details and units."
      />
      {state.loading && <p className="text-sm text-slate-300">Loading property…</p>}
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.data && (
        <>
          <div className="text-sm text-slate-200">
            {state.data.property.address && <p>{state.data.property.address}</p>}
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-200">Units</h2>
            <DataTable<Unit>
              columns={[
                { key: "name", header: "Unit" },
                { key: "bedrooms", header: "Beds" },
                { key: "bathrooms", header: "Baths" },
                { key: "rent", header: "Rent" }
              ]}
              rows={state.data.units}
              getRowId={(u) => u.id}
              emptyMessage="No units yet."
            />
          </div>
        </>
      )}
    </div>
  );
}
