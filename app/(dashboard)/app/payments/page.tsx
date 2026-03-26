"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard, DollarSign, AlertCircle, Search } from "lucide-react";
import {
  fetchOwnerPayments,
  fetchOwnerCharges,
  type PaymentTransactionRow,
  type ChargeRow,
} from "@/services/payments/ownerPaymentAdapter";

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

const paymentStatusVariant: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  PENDING: "neutral",
  PROCESSING: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  CANCELED: "neutral",
  REFUNDED: "info",
};

const PAYMENT_STATUSES = ["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELED", "REFUNDED"] as const;

export default function Page() {
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [payments, setPayments] = useState<PaymentTransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [chargesRes, paymentsRes] = await Promise.all([
        fetchOwnerCharges(),
        fetchOwnerPayments(),
      ]);
      if (cancelled) return;
      setCharges(chargesRes.data);
      setPayments(paymentsRes.data);
      setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Summary KPIs (computed from charges + payments)
  const totalPending = charges
    .filter((c) => c.status === "PENDING" || c.status === "OVERDUE")
    .reduce((sum, c) => sum + (c.amount - c.amount_paid), 0);
  const totalOverdue = charges
    .filter((c) => c.status === "OVERDUE")
    .reduce((sum, c) => sum + (c.amount - c.amount_paid), 0);
  const totalCollected = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0);

  // Client-side filtered payments
  const filteredPayments = useMemo(() => {
    let result = payments;
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (startDate) {
      const start = new Date(startDate + "T00:00:00");
      result = result.filter((p) => new Date(p.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate + "T23:59:59");
      result = result.filter((p) => new Date(p.created_at) <= end);
    }
    if (tenantSearch.trim()) {
      const q = tenantSearch.trim().toLowerCase();
      result = result.filter((p) => p.tenant_user_id?.toLowerCase().includes(q));
    }
    return result;
  }, [payments, statusFilter, startDate, endDate, tenantSearch]);

  return (
    <>
      <PageHeader
        title="Payments"
        description="View payment transactions and collection status."
      />

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardBody><Skeleton variant="text" className="h-10 w-32" /></CardBody></Card>
            ))}
          </div>
          <Card><CardBody><Skeleton variant="text" className="h-48 w-full" /></CardBody></Card>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Collected</p>
                    <p className="mt-1.5 text-2xl font-bold text-slate-900">{formatCents(totalCollected)}</p>
                  </div>
                  <span className="rounded-xl bg-green-50 p-2.5 text-green-500 shadow-sm"><DollarSign size={20} /></span>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Outstanding</p>
                    <p className="mt-1.5 text-2xl font-bold text-slate-900">{formatCents(totalPending)}</p>
                  </div>
                  <span className="rounded-xl bg-amber-50 p-2.5 text-amber-500 shadow-sm"><CreditCard size={20} /></span>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overdue</p>
                    <p className="mt-1.5 text-2xl font-bold text-red-600">{formatCents(totalOverdue)}</p>
                  </div>
                  <span className="rounded-xl bg-red-50 p-2.5 text-red-500 shadow-sm"><AlertCircle size={20} /></span>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All statuses</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Start date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="End date"
            />
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by tenant ID…"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Payments table */}
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={48} strokeWidth={1.5} />}
              title="No payments found"
              description={
                statusFilter || startDate || endDate || tenantSearch
                  ? "No payments match your current filters."
                  : "Payment transactions will appear here once tenants start paying."
              }
              className="mt-4"
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Period</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Method</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Source</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Amount</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Fee</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.billing_period
                          ? new Date(p.billing_period + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.method ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.source === "AUTOPAY" ? "info" : "neutral"}>
                          {p.source ?? "MANUAL"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCents(p.amount, p.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {p.application_fee_amount ? formatCents(p.application_fee_amount, p.currency) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={paymentStatusVariant[p.status] ?? "neutral"}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
