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
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <DollarSign size={14} /> Collected
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCents(totalCollected)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CreditCard size={14} /> Outstanding
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCents(totalPending)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <AlertCircle size={14} /> Overdue
                </div>
                <p className="mt-1 text-2xl font-bold text-red-600">{formatCents(totalOverdue)}</p>
              </CardBody>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
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
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
              placeholder="Start date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
              placeholder="End date"
            />
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by tenant ID…"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Period</th>
                    <th className="pb-2 pr-4">Method</th>
                    <th className="pb-2 pr-4">Source</th>
                    <th className="pb-2 pr-4 text-right">Amount</th>
                    <th className="pb-2 pr-4 text-right">Fee</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 text-slate-600">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {p.billing_period
                          ? new Date(p.billing_period + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{p.method ?? "—"}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={p.source === "AUTOPAY" ? "info" : "neutral"}>
                          {p.source ?? "MANUAL"}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-slate-900">
                        {formatCents(p.amount, p.currency)}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-400">
                        {p.application_fee_amount ? formatCents(p.application_fee_amount, p.currency) : "—"}
                      </td>
                      <td className="py-2.5">
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
