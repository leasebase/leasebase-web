"use client";

import Link from "next/link";
import type { QuickActionsViewModel } from "@/services/dashboard/types";
import { Icon } from "@/components/ui/Icon";

interface QuickActionsProps {
  vm: QuickActionsViewModel;
}

export function QuickActions({ vm }: QuickActionsProps) {
  if (vm.actions.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Quick Actions</h2>
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-4">
        {vm.actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              action.priority === "primary"
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
            }`}
          >
            <Icon name={action.icon} size={16} />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
