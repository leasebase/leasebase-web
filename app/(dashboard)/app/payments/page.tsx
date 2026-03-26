"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  Search,
  TrendingUp,
  Calendar,
} from "lucide-react";
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

/** Friendly compact format: $12.3k for large values, full for small. */
function formatCentsCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return formatCents(cents);
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

const CHARGE_TYPE_LABELS: Record<string, string> = {
  RENT: "Rent",
  SECURITY_DEPOSIT: "Deposit",
  LATE_FEE: "Late Fee",
  OTHER: "Other",
};

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
  const overdueCharges = charges.filter((c) => c.status === "OVERDUE");
  const totalOverdue = overdueCharges.reduce((sum, c) => sum + (c.amount - c.amount_paid), 0);
  const totalCollected = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0);
  const scheduledPayments = payments.filter((p) => p.status === "PENDING");
  const totalScheduled = scheduledPayments.reduce((sum, p) => sum + p.amount, 0);

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
        description="Track rent collection and payment status"
      />

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
                <Skeleton variant="text" className="h-4 w-32" />
                <Skeleton variant="text" className="mt-3 h-10 w-24" />
                <Skeleton variant="text" className="mt-3 h-3 w-40" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Skeleton variant="text" className="h-48 w-full" />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Financial Summary Cards — UIUX gradient style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Collected */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/80 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium text-emerald-700 mb-2">Collected This Month</p>
                  <p className="text-4xl font-semibold text-emerald-900 tracking-tight">
                    {formatCentsCompact(totalCollected)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
                  <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">
                  {payments.filter((p) => p.status === "SUCCEEDED").length} payment{payments.filter((p) => p.status === "SUCCEEDED").length !== 1 ? "s" : ""}
                </span>
                <span className="text-emerald-600">received</span>
              </div>
            </div>

            {/* Outstanding / Overdue */}
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200/80 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium text-red-700 mb-2">Outstanding / Overdue</p>
                  <p className="text-4xl font-semibold text-red-900 tracking-tight">
                    {formatCentsCompact(totalOverdue || totalPending)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
                  <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                {overdueCharges.length > 0 && (
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                <span className="font-medium text-red-700">
                  {overdueCharges.length} charge{overdueCharges.length !== 1 ? "s" : ""}
                </span>
                <span className="text-red-600">overdue</span>
              </div>
            </div>

            {/* Scheduled */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/80 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium text-blue-700 mb-2">Pending Payments</p>
                  <p className="text-4xl font-semibold text-blue-900 tracking-tight">
                    {formatCentsCompact(totalScheduled)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-700">{scheduledPayments.length} upcoming</span>
                <span className="text-blue-600">this month</span>
              </div>
            </div>
          </div>

          {/* Overdue Alert Banner */}
          {overdueCharges.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[15px] font-semibold text-red-900">Overdue Payments</h3>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[11px] font-medium rounded-md">
                      {overdueCharges.length} charge{overdueCharges.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-[13px] text-red-800 mb-3">
                    {formatCents(totalOverdue)} in overdue charges require attention.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setStatusFilter("FAILED"); }}
                    className="h-9 px-4 bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50 text-[12px] font-medium transition-all"
                  >
                    Review Failed Payments
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters — UIUX style */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
            >
              <option value="">All Statuses</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
            />
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by tenant ID…"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
              />
            </div>
          </div>

          {/* Payments table — UIUX style */}
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
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80">
                      <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Date</th>
                      <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Type</th>
                      <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Due Date</th>
                      <th className="text-right py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Amount</th>
                      <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Status</th>
                      <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Method</th>
                      <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Source</th>
                      <th className="text-right py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => {
                      const isDue = p.charge_due_date && new Date(p.charge_due_date) < new Date() && p.status !== "SUCCEEDED";
                      return (
                        <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${p.status === "FAILED" ? "bg-red-50/30" : ""}`}>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-[13px] font-medium text-slate-900">
                                {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                              {p.billing_period && (
                                <p className="text-[12px] text-slate-500">
                                  {new Date(p.billing_period + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {p.charge_type ? (
                              <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md">
                                {CHARGE_TYPE_LABELS[p.charge_type] ?? p.charge_type}
                              </span>
                            ) : (
                              <span className="text-[13px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {p.charge_due_date ? (
                              <span className={`text-[13px] font-medium ${isDue ? "text-red-600" : "text-slate-600"}`}>
                                {new Date(p.charge_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            ) : (
                              <span className="text-[13px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-[15px] font-semibold text-slate-900">
                              {formatCents(p.amount, p.currency)}
                            </span>
                            {p.application_fee_amount > 0 && (
                              <p className="text-[11px] text-slate-400">
                                Fee: {formatCents(p.application_fee_amount, p.currency)}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant={paymentStatusVariant[p.status] ?? "neutral"}>{p.status}</Badge>
                          </td>
                          <td className="py-4 px-6">
                            {p.method ? (
                              <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md">
                                {p.method}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant={p.source === "AUTOPAY" ? "info" : "neutral"}>
                              {p.source ?? "MANUAL"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Link
                              href={`/app/payments/${p.id}`}
                              className="text-[12px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
