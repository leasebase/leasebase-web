"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import type { TenantActionCardsViewModel } from "@/services/tenant/types";

interface TenantActionCardsProps {
  vm: TenantActionCardsViewModel;
}

export function TenantActionCards({ vm }: TenantActionCardsProps) {
  if (vm.actions.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Quick Actions</h2>
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-4">
        {vm.actions.map((action) => {
          const inner = (
            <span
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                action.disabled
                  ? "cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500"
                  : "border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              }`}
            >
              <Icon name={action.icon} size={16} />
              {action.label}
            </span>
          );

          if (action.disabled) {
            return (
              <Tooltip
                key={action.label}
                content={action.disabledReason ?? "Unavailable"}
              >
                {inner}
              </Tooltip>
            );
          }

          return (
            <Link
              key={action.label}
              href={action.href}
              className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
