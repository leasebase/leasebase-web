"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CreditCard } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPMPayments } from "@/services/pm/pmApiService";
import type { PMPaymentListRow } from "@/services/pm/pmApiService";

const PAY_VARIANTS: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  SUCCEEDED: "success", PENDING: "warning", FAILED: "danger", CANCELED: "neutral",
};

function PMPaymentsPage() {
  const [payments, setPayments] = useState<PMPaymentListRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchPMPayments();
        if (!cancelled) setPayments(res.data);
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader title="Payments" description="Payments across your assigned properties." />
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" className="h-14 w-full rounded-md" />)}</div>
        ) : error ? (
          <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : payments.length === 0 ? (
          <EmptyState icon={<CreditCard size={48} strokeWidth={1.5} />} title="No payments" description="No payments found for your assigned properties." />
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <Link key={p.id} href={`/app/payments/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-100">${(p.amount / 100).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{p.property_name} · Unit {p.unit_number} · {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={PAY_VARIANTS[p.status] || "neutral"}>{p.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMPaymentsPage />;
  return (
    <>
      <PageHeader title="Payments" description="View payment history, pending charges, and financial ledger." />
      <EmptyState icon={<CreditCard size={48} strokeWidth={1.5} />} title="Coming soon" description="This section is under development." className="mt-8" />
    </>
  );
}
