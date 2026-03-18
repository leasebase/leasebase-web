"use client";

import Link from "next/link";
import { AlertTriangle, ShieldAlert, Info, type LucideIcon } from "lucide-react";
import { Badge, type BadgeVariant } from "./Badge";
import { Skeleton } from "./Skeleton";

/* ── Types ── */

export type ActionSeverity = "danger" | "warning" | "info";

export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  severity: ActionSeverity;
  ctaLabel: string;
  ctaHref: string;
  icon?: LucideIcon;
}

export interface PriorityActionsProps {
  actions: PriorityAction[];
  loading?: boolean;
  className?: string;
}

/* ── Severity config ── */

const severityBadge: Record<ActionSeverity, { variant: BadgeVariant; label: string }> = {
  danger:  { variant: "danger",  label: "Urgent" },
  warning: { variant: "warning", label: "Attention" },
  info:    { variant: "info",    label: "Review" },
};

const severityIcon: Record<ActionSeverity, LucideIcon> = {
  danger:  ShieldAlert,
  warning: AlertTriangle,
  info:    Info,
};

const severityBar: Record<ActionSeverity, string> = {
  danger:  "bg-red-500",
  warning: "bg-amber-500",
  info:    "bg-blue-500",
};

/* ── Component ── */

export function PriorityActions({ actions, loading = false, className = "" }: PriorityActionsProps) {
  if (loading) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>
        <div className="border-b border-slate-200 px-4 py-3">
          <Skeleton variant="text" className="h-4 w-32" />
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton variant="text" className="h-8 w-1 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" className="h-4 w-48" />
                <Skeleton variant="text" className="h-3 w-64" />
              </div>
              <Skeleton variant="text" className="h-7 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${className}`} role="region" aria-label="Priority actions">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Next Actions</h2>
      </div>
      <ul className="divide-y divide-slate-200">
        {actions.map((action) => {
          const badge = severityBadge[action.severity];
          const IconCmp = action.icon ?? severityIcon[action.severity];
          const bar = severityBar[action.severity];
          return (
            <li key={action.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`h-8 w-1 shrink-0 rounded-full ${bar}`} />
              <IconCmp size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{action.title}</p>
                <p className="text-xs text-slate-400 truncate">{action.description}</p>
              </div>
              <Badge variant={badge.variant} className="shrink-0">{badge.label}</Badge>
              <Link
                href={action.ctaHref}
                className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {action.ctaLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
