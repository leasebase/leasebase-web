"use client";

import { CreditCard, FileText, Calendar } from "lucide-react";
import { StatCard } from "@/components/dashboards/StatCard";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Lease period
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{vm.leaseDates}</p>
              {vm.leaseUnit !== "—" && (
                <p className="mt-0.5 text-xs text-slate-400">Unit {vm.leaseUnit}</p>
              )}
            </div>
            <span className="rounded-md bg-slate-800 p-2 text-brand-400" aria-hidden="true">
              <Calendar size={20} />
            </span>
          </div>
          {/* Lease timeline progress */}
          <LeaseProgress vm={vm} />
        </div>
      </Tooltip>
    </div>
  );
}

/** Visual lease timeline showing how far through the term the tenant is. */
function LeaseProgress({ vm }: { vm: TenantKpiHeaderViewModel }) {
  // If dueDateRaw or leaseDates is missing, we can't compute progress
  if (vm.source === "unavailable" || vm.leaseDates === "—") return null;

  // Parse start from leaseDates (format: "Jan 2024 – Dec 2026")
  const parts = vm.leaseDates.split("–").map((s) => s.trim());
  if (parts.length !== 2) return null;

  const start = new Date(parts[0] + " 1");
  const end = new Date(parts[1] + " 28"); // approximate end of month
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const totalMs = end.getTime() - start.getTime();
  if (totalMs <= 0) return null;

  const elapsedMs = now.getTime() - start.getTime();
  const pct = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));

  return (
    <div className="mt-3">
      <ProgressBar
        label="Lease progress"
        value={pct}
        variant={pct >= 90 ? "warning" : "brand"}
      />
    </div>
  );
}
