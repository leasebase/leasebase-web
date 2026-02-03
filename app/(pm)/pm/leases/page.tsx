"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { api, toApiError } from "@/lib/api/http";
import type { Lease } from "@/lib/api/types";
import { useEffect, useState } from "react";

export default function LeasesPage() {
  const [state, setState] = useState<{
    data: Lease[];
    loading: boolean;
    error: string | null;
  }>({ data: [], loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Lease[]>("/pm/leases");
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
        title="Leases"
        description="Manage leases across your portfolio."
        actions={
          <Link
            href="/pm/leases/new"
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            New lease
          </Link>
        }
      />
      {state.loading && <p className="text-sm text-slate-300">Loading leases…</p>}
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <DataTable<Lease>
        columns={[
          {
            key: "id",
            header: "Lease",
            render: (l) => (
              <Link
                href={`/pm/leases/${l.id}`}
                className="text-emerald-400 hover:underline"
              >
                {l.id}
              </Link>
            )
          },
          { key: "tenantEmail", header: "Tenant" },
          { key: "rentAmount", header: "Rent" },
          { key: "status", header: "Status" }
        ]}
        rows={state.data}
        getRowId={(l) => l.id}
        emptyMessage="No leases yet. Create a lease to get started."
      />
    </div>
  );
}
