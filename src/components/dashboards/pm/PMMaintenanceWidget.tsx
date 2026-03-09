"use client";

import { Wrench } from "lucide-react";
import type { PMMaintenanceWidgetViewModel } from "@/services/pm/types";

interface PMMaintenanceWidgetProps {
  vm: PMMaintenanceWidgetViewModel;
}

export function PMMaintenanceWidget({ vm }: PMMaintenanceWidgetProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-2">
        <Wrench size={16} className="text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-100">Recent maintenance</h2>
        {vm.openCount > 0 && (
          <span className="ml-auto text-xs text-slate-400">
            {vm.openCount} open
          </span>
        )}
      </div>

      {!vm.hasRequests ? (
        <div className="px-4 py-6 text-center text-sm text-slate-500">
          No maintenance requests yet.
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/50 text-sm">
          {vm.recentRequests.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <span className="text-slate-200 truncate block">{item.title}</span>
                <span className="text-xs text-slate-500">{item.date}</span>
              </div>
              <span className="text-xs text-slate-400 ml-3 whitespace-nowrap">
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
