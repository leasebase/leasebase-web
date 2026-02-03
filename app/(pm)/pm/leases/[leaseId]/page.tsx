"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, toApiError } from "@/lib/api/http";
import type { Lease } from "@/lib/api/types";

export default function LeaseDetailPage() {
  const params = useParams<{ leaseId: string }>();
  const [state, setState] = useState<{
    data: Lease | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Lease>(`/pm/leases/${params.leaseId}`);
        setState({ data: res.data, loading: false, error: null });
      } catch (err) {
        const e = toApiError(err);
        setState({ data: null, loading: false, error: e.message });
      }
    })();
  }, [params.leaseId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Lease ${params.leaseId}`}
        description="View lease details and navigate to the ledger."
        actions={
          <Link
            href={`/pm/leases/${params.leaseId}/ledger`}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
          >
            View ledger
          </Link>
        }
      />
      {state.loading && <p className="text-sm text-slate-300">Loading lease…</p>}
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.data && (
        <div className="space-y-1 text-sm text-slate-200">
          <p>Tenant: {state.data.tenantEmail}</p>
          <p>Rent: ${state.data.rentAmount.toFixed(2)}</p>
          <p>Status: {state.data.status}</p>
          <p>
            Term: {state.data.startDate} – {state.data.endDate || "open"}
          </p>
        </div>
      )}
    </div>
  );
}
