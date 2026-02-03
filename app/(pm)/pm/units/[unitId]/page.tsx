"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, toApiError } from "@/lib/api/http";
import type { Unit, Lease } from "@/lib/api/types";

interface Combined {
  unit: Unit;
  currentLease?: Lease;
}

export default function UnitDetailPage() {
  const params = useParams<{ unitId: string }>();
  const [state, setState] = useState<{
    data: Combined | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Combined>(`/pm/units/${params.unitId}`);
        setState({ data: res.data, loading: false, error: null });
      } catch (err) {
        const e = toApiError(err);
        setState({ data: null, loading: false, error: e.message });
      }
    })();
  }, [params.unitId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={state.data?.unit.name || "Unit"}
        description="View unit details and current lease."
      />
      {state.loading && <p className="text-sm text-slate-300">Loading unit…</p>}
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.data && (
        <div className="space-y-2 text-sm text-slate-200">
          <p>Rent: ${state.data.unit.rent?.toFixed(2) ?? "—"}</p>
          {state.data.currentLease ? (
            <p>
              Current lease: {state.data.currentLease.status} from {" "}
              {state.data.currentLease.startDate} to {state.data.currentLease.endDate || "open"}
            </p>
          ) : (
            <p>No active lease.</p>
          )}
        </div>
      )}
    </div>
  );
}
