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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
      </div>
      <div className="flex flex-wrap gap-3 px-5 py-5">
        {vm.actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              action.priority === "primary"
                ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/25 hover:shadow-md hover:shadow-brand-500/30"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400"
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
