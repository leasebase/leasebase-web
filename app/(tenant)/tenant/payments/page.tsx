"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api, toApiError } from "@/lib/api/http";

export default function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const load = async () => {
    try {
      const res = await api.get<any[]>("/tenant/payments");
      setPayments(res.data);
      setError(null);
    } catch (err) {
      const e = toApiError(err);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ clientSecret?: string }>("/tenant/payments/intents", {
        amount: Number(amount || 0)
      });
      // In a full integration, you would now hand off to Stripe.js using clientSecret.
      toast.show(
        res.data.clientSecret
          ? "Payment intent created (integrate Stripe UI)."
          : "Payment recorded."
      );
      setAmount("");
      load();
    } catch (err) {
      const e = toApiError(err);
      toast.show(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Pay rent and view your payment history."
      />
      {loading && <p className="text-sm text-slate-300">Loading payments…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <DataTable
        columns={[
          { key: "createdAt", header: "Date" },
          { key: "amount", header: "Amount" },
          { key: "status", header: "Status" }
        ]}
        rows={payments}
        getRowId={(p, i) => p.id || String(i)}
        emptyMessage="No payments yet."
      />
      <form className="mt-4 flex flex-col gap-2 max-w-xs" onSubmit={pay}>
        <FormField label="Amount to pay">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </FormField>
        <button
          type="submit"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Pay rent
        </button>
      </form>
    </div>
  );
}
