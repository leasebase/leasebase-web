"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { api, toApiError } from "@/lib/api/http";
import type { BillingSummary } from "@/lib/api/types";

export default function BillingPage() {
  const toast = useToast();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<BillingSummary>("/pm/billing/summary");
        setSummary(res.data);
        setError(null);
      } catch (err) {
        const e = toApiError(err);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openPortal = async () => {
    if (summary?.billingPortalUrl) {
      window.location.href = summary.billingPortalUrl;
      return;
    }
    try {
      const res = await api.post<{ url: string }>("/pm/billing/portal", {});
      window.location.href = res.data.url;
    } catch (err) {
      const e = toApiError(err);
      toast.show(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Billing"
        description="View your plan, unit count, and open the Stripe billing portal."
      />
      {loading && <p className="text-sm text-slate-300">Loading billing summary…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {summary && (
        <div className="space-y-1 text-sm text-slate-200">
          <p>Plan: {summary.planName}</p>
          <p>Units: {summary.unitCount}</p>
        </div>
      )}
      <button
        type="button"
        onClick={openPortal}
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
      >
        Open billing portal
      </button>
    </div>
  );
}
