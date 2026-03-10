"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { History } from "lucide-react";
import { fetchTenantPayments } from "@/services/tenant/adapters/paymentAdapter";
import type { PaymentRow } from "@/services/tenant/types";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  SUCCEEDED: "success",
  PENDING: "warning",
  FAILED: "danger",
  CANCELED: "neutral",
};

/** Filter out stale pending payments (> 24h old — likely abandoned). */
const STALE_MS = 24 * 60 * 60 * 1000;
function isActive(p: PaymentRow): boolean {
  if (p.status !== "PENDING") return true;
  return Date.now() - new Date(p.created_at).getTime() < STALE_MS;
}

/**
 * Payment History — LIVE (Phase 2).
 * Fetches via GET /api/payments/mine (tenant-scoped, server-side filtered).
 */
export default function Page() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchTenantPayments();
        if (!cancelled) {
          setPayments(result.data.filter(isActive));
          if (result.source === "unavailable") setError(result.error);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader
        title="Payment History"
        description="View your past payments."
      />

      {isLoading ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<History size={48} strokeWidth={1.5} />}
          title="No payments yet"
          description="Your payment history will appear here once you make your first rent payment."
          className="mt-8"
        />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((p) => (
                <tr key={p.id} className="text-slate-700">
                  <td className="py-3 pr-4">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-3 pr-4 font-medium">
                    ${(p.amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{p.method || "—"}</td>
                  <td className="py-3">
                    <Badge variant={STATUS_VARIANTS[p.status] || "neutral"}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
