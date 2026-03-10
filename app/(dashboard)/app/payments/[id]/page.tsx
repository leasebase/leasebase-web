"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPMPayment } from "@/services/pm/pmApiService";
import type { PMPaymentListRow } from "@/services/pm/pmApiService";

const PAY_VARIANTS: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  SUCCEEDED: "success", PENDING: "warning", FAILED: "danger", CANCELED: "neutral",
};

function PMPaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<(PMPaymentListRow & { property_id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchPMPayment(id);
        if (!cancelled) setPayment(res.data);
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-32 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!payment) return null;

  return (
    <>
      <PageHeader title="Payment" description={`${payment.property_name} · Unit ${payment.unit_number}`} />
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-semibold text-slate-900">${(payment.amount / 100).toLocaleString()}</span>
          <Badge variant={PAY_VARIANTS[payment.status] || "neutral"}>{payment.status}</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-500">Type</dt><dd className="text-slate-700">{payment.type}</dd></div>
          <div><dt className="text-slate-500">Date</dt><dd className="text-slate-700">{new Date(payment.created_at).toLocaleDateString()}</dd></div>
          <div><dt className="text-slate-500">Property</dt><dd className="text-slate-700">{payment.property_name}</dd></div>
          <div><dt className="text-slate-500">Unit</dt><dd className="text-slate-700">{payment.unit_number}</dd></div>
        </dl>
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMPaymentDetail />;
  return (
    <>
      <PageHeader title="Payment" description="View payment details." />
      <EmptyState icon={<CreditCard size={48} strokeWidth={1.5} />} title="Coming soon" description="This section is under development." className="mt-8" />
    </>
  );
}
