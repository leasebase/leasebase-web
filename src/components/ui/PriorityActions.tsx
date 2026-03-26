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

  const hasDanger = actions.some((a) => a.severity === "danger");

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${
        hasDanger
          ? "border-red-200 bg-gradient-to-br from-red-50 via-red-50/80 to-orange-50/60"
          : "border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/80 to-yellow-50/60"
      } ${className}`}
      role="region"
      aria-label="Priority actions"
    >
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${
        hasDanger ? "border-red-100" : "border-amber-100"
      }`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${
          hasDanger ? "bg-red-100" : "bg-amber-100"
        }`}>
          <ShieldAlert size={16} className={hasDanger ? "text-red-600" : "text-amber-600"} />
        </div>
        <div className="flex-1">
          <h2 className={`text-[14px] font-bold ${
            hasDanger ? "text-red-900" : "text-amber-900"
          }`}>Action Required</h2>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold shadow-sm ${
          hasDanger ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        }`}>
          {actions.length} {actions.length === 1 ? "item" : "items"}
        </span>
      </div>
      <ul className={`divide-y ${hasDanger ? "divide-red-100/80" : "divide-amber-100/80"}`}>
        {actions.map((action) => {
          const badge = severityBadge[action.severity];
          const IconCmp = action.icon ?? severityIcon[action.severity];
          const bar = severityBar[action.severity];
          const rowTint =
            action.severity === "danger"
              ? "bg-red-50/40"
              : action.severity === "warning"
                ? "bg-amber-50/30"
                : "";
          const iconGradient =
            action.severity === "danger"
              ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm shadow-red-500/20"
              : action.severity === "warning"
                ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/20"
                : "bg-slate-100 text-slate-500";
          return (
            <li key={action.id} className={`flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-white/50 ${rowTint}`}>
              <div className={`h-10 w-1.5 shrink-0 rounded-full ${bar}`} />
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconGradient}`}>
                <IconCmp size={15} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 truncate">{action.title}</p>
                <p className="mt-0.5 text-xs text-slate-500 truncate">{action.description}</p>
              </div>
              <Badge variant={badge.variant} className="shrink-0">{badge.label}</Badge>
              <Link
                href={action.ctaHref}
                className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  action.severity === "danger"
                    ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
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
