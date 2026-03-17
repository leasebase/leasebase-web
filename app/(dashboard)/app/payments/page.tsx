"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard, DollarSign, AlertCircle, ExternalLink } from "lucide-react";
import {
  fetchOwnerPayments,
  fetchOwnerCharges,
  fetchConnectStatus,
  getDashboardLink,
  type PaymentTransactionRow,
  type ChargeRow,
  type ConnectStatus,
} from "@/services/payments/ownerPaymentAdapter";

type Tab = "charges" | "payments";

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

const chargeStatusVariant: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  PENDING: "neutral",
  OVERDUE: "danger",
  PAID: "success",
  PARTIALLY_PAID: "warning",
  VOID: "neutral",
  CREDITED: "info",
};

const paymentStatusVariant: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  PENDING: "neutral",
  PROCESSING: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  CANCELED: "neutral",
  REFUNDED: "info",
};

export default function Page() {
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [payments, setPayments] = useState<PaymentTransactionRow[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("charges");
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [chargesRes, paymentsRes, connectRes] = await Promise.all([
        fetchOwnerCharges(),
        fetchOwnerPayments(),
        fetchConnectStatus(),
      ]);
      if (cancelled) return;
      setCharges(chargesRes.data);
      setPayments(paymentsRes.data);
      setConnectStatus(connectRes.data);
      setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleStripeDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const result = await getDashboardLink();
      if (result.data?.url) {
        window.open(result.data.url, "_blank");
      }
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Summary KPIs
  const totalPending = charges
    .filter((c) => c.status === "PENDING" || c.status === "OVERDUE")
    .reduce((sum, c) => sum + (c.amount - c.amount_paid), 0);
  const totalOverdue = charges
    .filter((c) => c.status === "OVERDUE")
    .reduce((sum, c) => sum + (c.amount - c.amount_paid), 0);
  const totalCollected = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Payments"
        description="View charges, payment transactions, and collection status."
        actions={
          connectStatus?.charges_enabled ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStripeDashboard}
              loading={dashboardLoading}
              icon={<ExternalLink size={14} />}
            >
              Stripe Dashboard
            </Button>
          ) : undefined
        }
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
          {/* Connect status banner */}
          {connectStatus && !connectStatus.charges_enabled && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-3">
              <AlertCircle size={18} className="mt-0.5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-200">Stripe account not fully set up</p>
                <p className="mt-1 text-xs text-amber-400/80">
                  Complete your Stripe onboarding in Settings to start accepting payments.
                </p>
              </div>
            </div>
          )}

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

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200">
            {(["charges", "payments"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-brand-500 text-brand-600"
                    : "text-slate-400 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table content */}
          {activeTab === "charges" ? (
            charges.length === 0 ? (
              <EmptyState
                icon={<CreditCard size={48} strokeWidth={1.5} />}
                title="No charges yet"
                description="Charges will appear here once rent billing is active."
                className="mt-4"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Period</th>
                      <th className="pb-2 pr-4">Due Date</th>
                      <th className="pb-2 pr-4 text-right">Amount</th>
                      <th className="pb-2 pr-4 text-right">Paid</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100">
                        <td className="py-2.5 pr-4 text-slate-900">{c.type}</td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {c.billing_period
                            ? new Date(c.billing_period + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {new Date(c.due_date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium text-slate-900">
                          {formatCents(c.amount, c.currency)}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-slate-600">
                          {formatCents(c.amount_paid, c.currency)}
                        </td>
                        <td className="py-2.5">
                          <Badge variant={chargeStatusVariant[c.status] ?? "neutral"}>{c.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={48} strokeWidth={1.5} />}
              title="No payments yet"
              description="Payment transactions will appear here once tenants start paying."
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
                  {payments.map((p) => (
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
