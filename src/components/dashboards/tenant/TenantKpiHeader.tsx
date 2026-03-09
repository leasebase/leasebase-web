"use client";

import { CreditCard, FileText, Calendar } from "lucide-react";
import { StatCard } from "@/components/dashboards/StatCard";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { TenantKpiHeaderViewModel, PaymentStatus } from "@/services/tenant/types";

const provenanceLabel: Record<string, string> = {
  live: "Live data",
  stub: "Sample data",
  unavailable: "Data unavailable",
};

const statusVariant: Record<PaymentStatus, BadgeVariant> = {
  due: "neutral",
  "due-soon": "warning",
  overdue: "danger",
  paid: "success",
  pending: "info",
  failed: "danger",
};

interface TenantKpiHeaderProps {
  vm: TenantKpiHeaderViewModel;
}

export function TenantKpiHeader({ vm }: TenantKpiHeaderProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Tooltip content={provenanceLabel[vm.source] ?? vm.source}>
        <StatCard
          label="Rent due"
          value={vm.rentAmount}
          change={vm.dueDate !== "—" ? `Due ${vm.dueDate}` : undefined}
          icon={<CreditCard size={20} />}
        />
      </Tooltip>

      <Tooltip content={provenanceLabel[vm.source] ?? vm.source}>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Payment status
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={statusVariant[vm.paymentStatus]}>
                  {vm.paymentStatusLabel}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {vm.leaseStatus !== "—" ? vm.leaseStatus : "No lease"}
              </p>
            </div>
            <span className="rounded-md bg-slate-800 p-2 text-brand-400" aria-hidden="true">
              <FileText size={20} />
            </span>
          </div>
        </div>
      </Tooltip>

      <Tooltip content={provenanceLabel[vm.source] ?? vm.source}>
        <StatCard
          label="Lease period"
          value={vm.leaseDates}
          change={vm.leaseUnit !== "—" ? `Unit ${vm.leaseUnit}` : undefined}
          icon={<Calendar size={20} />}
        />
      </Tooltip>
    </div>
  );
}
