"use client";

import Link from "next/link";
import { DollarSign, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { CashFlowViewModel } from "@/services/dashboard/types";

interface CashFlowCardProps {
  vm: CashFlowViewModel;
}

export function CashFlowCard({ vm }: CashFlowCardProps) {
  if (vm.source === "unavailable") return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Cash Flow &amp; Receivables</h2>
          <Link href="/app/payments" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Billed" value={vm.billedThisMonth} />
          <Metric label="Collected" value={vm.collectedThisMonth} accent="text-emerald-600" />
          <Metric label="Overdue" value={vm.overdueAmount} accent="text-red-600" />
          <Metric label="Upcoming (30d)" value={vm.upcomingDue} />
        </div>

        {/* Collection progress */}
        <ProgressBar
          label="Collection Rate"
          value={vm.collectionPercent}
          variant={vm.collectionPercent >= 90 ? "success" : vm.collectionPercent >= 70 ? "warning" : "danger"}
        />

        {/* Per-property breakdown */}
        {vm.perProperty.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">By Property</p>
            <ul className="divide-y divide-slate-100">
              {vm.perProperty.slice(0, 5).map((p) => (
                <li key={p.propertyId} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/app/properties/${p.propertyId}`} className="truncate font-medium text-slate-700 hover:text-brand-600">
                    {p.propertyName}
                  </Link>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>{p.collected} / {p.billed}</span>
                    {p.overdue !== "$0" && (
                      <span className="text-red-600">{p.overdue} overdue</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
