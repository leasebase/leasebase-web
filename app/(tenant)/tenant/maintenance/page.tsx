"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { api, toApiError } from "@/lib/api/http";
import type { WorkOrder } from "@/lib/api/types";

export default function TenantMaintenancePage() {
  const [state, setState] = useState<{
    data: WorkOrder[];
    loading: boolean;
    error: string | null;
  }>({ data: [], loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<WorkOrder[]>("/tenant/maintenance");
        setState({ data: res.data, loading: false, error: null });
      } catch (err) {
        const e = toApiError(err);
        setState({ data: [], loading: false, error: e.message });
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Maintenance"
        description="View and track your maintenance requests."
        actions={
          <Link
            href="/tenant/maintenance/new"
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            New request
          </Link>
        }
      />
      {state.loading && <p className="text-sm text-slate-300">Loading maintenance…</p>}
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <DataTable<WorkOrder>
        columns={[
          {
            key: "title",
            header: "Title",
            render: (w) => (
              <Link
                href={`/tenant/maintenance/${w.id}`}
                className="text-emerald-400 hover:underline"
              >
                {w.title}
              </Link>
            )
          },
          { key: "status", header: "Status" },
          { key: "createdAt", header: "Created" }
        ]}
        rows={state.data}
        getRowId={(w) => w.id}
        emptyMessage="No maintenance requests yet."
      />
    </div>
  );
}
