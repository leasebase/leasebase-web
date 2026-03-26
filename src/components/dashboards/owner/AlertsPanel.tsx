"use client";

import Link from "next/link";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { AlertsViewModel, AlertSeverity } from "@/services/dashboard/types";

const severityConfig: Record<AlertSeverity, { bar: string; icon: typeof AlertTriangle }> = {
  danger: { bar: "bg-red-500", icon: ShieldAlert },
  warning: { bar: "bg-amber-500", icon: AlertTriangle },
  info: { bar: "bg-blue-500", icon: Info },
};

interface AlertsPanelProps {
  vm: AlertsViewModel;
}

export function AlertsPanel({ vm }: AlertsPanelProps) {
  if (!vm.hasAlerts) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
        </div>
        <p className="px-5 py-6 text-center text-sm text-slate-400">No active alerts.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {vm.alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          const IconCmp = cfg.icon;
          return (
            <li key={`${alert.type}-${i}`}>
              <Link
                href={alert.link}
                className="flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-slate-50/60"
              >
                <div className={`h-8 w-1 shrink-0 rounded-full ${cfg.bar}`} />
                <IconCmp size={16} className="shrink-0 text-slate-400" />
                <span className="text-slate-700">{alert.message}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
