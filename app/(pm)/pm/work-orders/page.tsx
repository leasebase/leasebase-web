"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { api, toApiError } from "@/lib/api/http";
import type { WorkOrder } from "@/lib/api/types";

export default function WorkOrdersPage() {
  const [state, setState] = useState<{
    data: WorkOrder[];
    loading: boolean;
    error: string | null;
  }>({ data: [], loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<WorkOrder[]>("/pm/work-orders");
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
        title="Work orders"
        description="Track maintenance work orders across your properties."
      />
      {state.loading && <p className="text-sm text-slate-300">Loading work orders…</p>}
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <DataTable<WorkOrder>
        columns={[
          {
            key: "title",
            header: "Title",
            render: (w) => (
              <Link
                href={`/pm/work-orders/${w.id}`}
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
        emptyMessage="No work orders yet."
      />
    </div>
  );
}
