"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard, DollarSign, AlertCircle, Search, ShieldAlert, ArrowRight, TrendingUp, Calendar, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  const overdueChargeCount = charges.filter((c) => c.status === "OVERDUE").length;
  const pendingChargeCount = charges.filter((c) => c.status === "PENDING").length;

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
        description="Track rent collection and payment status."
        actions={
          <Button variant="secondary" size="sm" icon={<Download size={14} />}>Export</Button>
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="mt-4 h-10 w-28 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-32 rounded bg-slate-200" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
            <div className="h-48 w-full rounded bg-slate-100" />
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
                    {formatCents(totalCollected)}
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
                <span className="text-emerald-600">succeeded</span>
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200/80 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium text-red-700 mb-2">Outstanding / Overdue</p>
                  <p className="text-4xl font-semibold text-red-900 tracking-tight">
                    {formatCents(totalOverdue)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
                  <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                {overdueChargeCount > 0 && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                <span className="font-medium text-red-700">
                  {overdueChargeCount} charge{overdueChargeCount !== 1 ? "s" : ""}
                </span>
                <span className="text-red-600">overdue</span>
              </div>
            </div>

            {/* Pending / Scheduled */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/80 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium text-blue-700 mb-2">Pending Charges</p>
                  <p className="text-4xl font-semibold text-blue-900 tracking-tight">
                    {formatCents(totalPending)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-700">{pendingChargeCount} pending</span>
                <span className="text-blue-600">this period</span>
              </div>
            </div>
          </div>

          {/* Overdue Alert Banner — UIUX style */}
          {totalOverdue > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[15px] font-semibold text-red-900">Urgent: Overdue Payments</h3>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[11px] font-medium rounded-md">
                      {overdueChargeCount} charge{overdueChargeCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-[13px] text-red-800 mb-4">
                    Total {formatCents(totalOverdue)} in overdue charges. Immediate collection action required.
                  </p>
                  <div className="flex gap-3">
                    <button className="h-9 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 text-[12px] font-medium transition-all shadow-sm flex items-center gap-2">
                      <Send className="w-3.5 h-3.5" />
                      Send All Reminders
                    </button>
                    <a
                      href="#payments-table"
                      className="h-9 px-4 bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50 text-[12px] font-medium transition-all inline-flex items-center gap-1.5"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters — UIUX style */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
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
              className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
            />
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by tenant ID…"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
              />
            </div>
          </div>

          {/* Payments table — UIUX style */}
          <div id="payments-table">
            {filteredPayments.length === 0 ? (
              <EmptyState
                icon={<CreditCard size={48} strokeWidth={1.5} />}
                title="No payments found"
                description={
                  statusFilter || startDate || endDate || tenantSearch
                    ? "No payments match your current filters."
                    : "Payment transactions will appear here once tenants start paying."
                }
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80">
                        <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Date</th>
                        <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Period</th>
                        <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Type</th>
                        <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Method</th>
                        <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Source</th>
                        <th className="text-right py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Amount</th>
                        <th className="text-right py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Fee</th>
                        <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Status</th>
                        <th className="text-right py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPayments.map((p) => (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            p.status === "FAILED" ? "bg-red-50/30" : ""
                          }`}
                        >
                          <td className="py-4 px-6 text-[13px] text-slate-600 font-medium">
                            {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="py-4 px-6 text-[13px] text-slate-600">
                            {p.billing_period
                              ? new Date(p.billing_period + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="py-4 px-6">
                            {p.charge_type ? (
                              <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md">
                                {p.charge_type}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-[13px] text-slate-600">{p.method ?? "—"}</td>
                          <td className="py-4 px-6">
                            <Badge variant={p.source === "AUTOPAY" ? "info" : "neutral"}>
                              {p.source ?? "MANUAL"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`text-[15px] font-semibold ${
                              p.status === "SUCCEEDED" ? "text-emerald-700" :
                              p.status === "FAILED" ? "text-red-600" :
                              "text-slate-900"
                            }`}>
                              {formatCents(p.amount, p.currency)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-[13px] text-slate-400">
                            {p.application_fee_amount ? formatCents(p.application_fee_amount, p.currency) : "—"}
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant={paymentStatusVariant[p.status] ?? "neutral"}>{p.status}</Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {p.status === "SUCCEEDED" && (
                              <button className="text-[12px] text-slate-600 hover:text-slate-700 font-medium hover:underline">
                                Receipt
                              </button>
                            )}
                            {p.status === "FAILED" && (
                              <button className="text-[12px] text-red-600 hover:text-red-700 font-medium hover:underline">
                                Retry
                              </button>
                            )}
                            {(p.status === "PENDING" || p.status === "PROCESSING") && (
                              <button className="text-[12px] text-blue-600 hover:text-blue-700 font-medium hover:underline">
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
