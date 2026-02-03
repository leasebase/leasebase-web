"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";
import { api, toApiError } from "@/lib/api/http";
import type { LedgerEntry } from "@/lib/api/types";

export default function LeaseLedgerPage() {
  const params = useParams<{ leaseId: string }>();
  const toast = useToast();
  const [state, setState] = useState<{
    data: LedgerEntry[];
    loading: boolean;
    error: string | null;
  }>({ data: [], loading: true, error: null });

  const load = async () => {
    try {
      const res = await api.get<LedgerEntry[]>(`/pm/leases/${params.leaseId}/ledger`);
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      const e = toApiError(err);
      setState({ data: [], loading: false, error: e.message });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generateMonthlyCharge = async () => {
    try {
      await api.post(`/pm/leases/${params.leaseId}/ledger/generate-monthly-charge`);
      toast.show("Monthly charge generated.");
      load();
    } catch (err) {
      const e = toApiError(err);
      toast.show(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lease ledger"
        description="View charges, payments, and credits for this lease."
        actions={
          <button
            type="button"
            onClick={generateMonthlyCharge}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            Generate monthly charge
          </button>
        }
      />
      {state.loading && <p className="text-sm text-slate-300">Loading ledger…</p>}
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <DataTable<LedgerEntry>
        columns={[
          { key: "date", header: "Date" },
          { key: "type", header: "Type" },
          { key: "description", header: "Description" },
          { key: "amount", header: "Amount" },
          { key: "balanceAfter", header: "Balance" }
        ]}
        rows={state.data}
        getRowId={(e) => e.id}
        emptyMessage="No ledger entries yet."
      />
    </div>
  );
}
