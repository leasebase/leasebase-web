"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import type { TenantActionCardsViewModel } from "@/services/tenant/types";

interface TenantActionCardsProps {
  vm: TenantActionCardsViewModel;
}

/** Check if an action is the "Pay Rent" primary CTA */
function isPayRent(label: string): boolean {
  return /pay\s*rent/i.test(label);
}

export function TenantActionCards({ vm }: TenantActionCardsProps) {
  if (vm.actions.length === 0) return null;

  // Pull pay-rent to the front so it renders first
  const sorted = [...vm.actions].sort((a, b) => {
    if (isPayRent(a.label) && !isPayRent(b.label)) return -1;
    if (!isPayRent(a.label) && isPayRent(b.label)) return 1;
    return 0;
  });

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Quick Actions</h2>
      </div>
      <div className="flex flex-wrap gap-3 px-4 py-4">
        {sorted.map((action) => {
          const primary = isPayRent(action.label) && !action.disabled;

          const inner = (
            <span
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                action.disabled
                  ? "cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500"
                  : primary
                    ? "bg-brand-500 text-white shadow-sm hover:bg-brand-600"
                    : "border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              }`}
            >
              <Icon name={action.icon} size={primary ? 18 : 16} />
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
              className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
