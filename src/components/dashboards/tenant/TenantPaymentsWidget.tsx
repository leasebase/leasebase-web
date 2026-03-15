"use client";

import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DonutChart, CHART_COLORS } from "@/components/dashboards/charts";
import type { TenantPaymentsWidgetViewModel, PaymentStatus } from "@/services/tenant/types";

const statusBadgeVariant: Record<PaymentStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  due: "neutral",
  "due-soon": "warning",
  overdue: "danger",
  paid: "success",
  pending: "info",
  failed: "danger",
};

const provenanceLabel: Record<string, string> = {
  live: "Live data",
  stub: "Sample data",
  unavailable: "Data unavailable",
};

interface TenantPaymentsWidgetProps {
  vm: TenantPaymentsWidgetViewModel;
}

export function TenantPaymentsWidget({ vm }: TenantPaymentsWidgetProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Payments</h2>
        </div>
        {vm.source !== "live" && (
          <Badge variant="neutral">{provenanceLabel[vm.source]}</Badge>
        )}
      </div>

      <div className="px-4 py-4">
        {/* Next payment section (derived from lease data, not from payments endpoint) */}
        {vm.nextPayment && (
          <div className="mb-4 flex items-center justify-between rounded-md bg-slate-900/50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-200">
                Next payment: {vm.nextPayment.amount}
              </p>
              <p className="text-xs text-slate-400">Due {vm.nextPayment.dueDate}</p>
            </div>
            <Badge variant={statusBadgeVariant[vm.nextPayment.status]}>
              {vm.nextPayment.status === "paid" ? "Paid" : vm.nextPayment.status.replace("-", " ")}
            </Badge>
          </div>
        )}

        {/* Payment status donut (only when live data with payments) */}
        {vm.source === "live" && vm.recentPayments.length > 0 && (() => {
          const counts: Record<string, number> = {};
          for (const p of vm.recentPayments) {
            counts[p.status] = (counts[p.status] || 0) + 1;
          }
          const segments = Object.entries(counts).map(([status, count]) => ({
            label: status,
            value: count,
            color:
              status === "Succeeded" || status === "Paid" ? CHART_COLORS.success :
              status === "Pending" ? CHART_COLORS.warning :
              status === "Failed" ? CHART_COLORS.danger :
              CHART_COLORS.info,
          }));
          return segments.length > 0 ? (
            <div className="mb-4">
              <DonutChart
                segments={segments}
                centerLabel={`${vm.recentPayments.length}`}
                centerSub="payments"
                height={100}
                innerRadius={28}
                outerRadius={44}
              />
            </div>
          ) : null;
        })()}

        {/* Payment history section — always stub */}
        {vm.source === "stub" ? (
          <p className="text-xs text-slate-400">
            Payment history is not yet available for tenants. A tenant-scoped
            payments endpoint is required before this data can be shown securely.
          </p>
        ) : vm.recentPayments.length > 0 ? (
          <ul className="divide-y divide-slate-800/50 text-sm">
            {vm.recentPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-slate-200">{p.amount}</span>
                  <span className="ml-2 text-xs text-slate-400">{p.date}</span>
                </div>
                <Badge variant={p.statusVariant}>{p.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">No payment data available.</p>
        )}
      </div>
    </div>
  );
}
