"use client";

import Link from "next/link";
import {
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeVariant } from "./Badge";
import { Skeleton } from "./Skeleton";

/* ── Types ── */

export type InsightSeverity = "danger" | "warning" | "info";

export interface Insight {
  id: string;
  message: string;
  explanation?: string;
  severity: InsightSeverity;
  ctaLabel: string;
  ctaHref: string;
  icon?: LucideIcon;
}

export interface RecommendedActionsProps {
  insights: Insight[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/* ── Severity config ── */

const sevBadge: Record<InsightSeverity, { variant: BadgeVariant; label: string }> = {
  danger:  { variant: "danger",  label: "Urgent" },
  warning: { variant: "warning", label: "Suggested" },
  info:    { variant: "info",    label: "Tip" },
};

const sevIcon: Record<InsightSeverity, LucideIcon> = {
  danger:  ShieldAlert,
  warning: AlertTriangle,
  info:    Info,
};

/* ── Component ── */

export function RecommendedActions({
  insights,
  title = "Recommended Actions",
  loading = false,
  error = null,
  className = "",
}: RecommendedActionsProps) {
  /* Loading */
  if (loading) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>
        <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-400" />
          <Skeleton variant="text" className="h-4 w-40" />
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" className="h-4 w-56" />
                <Skeleton variant="text" className="h-3 w-40" />
              </div>
              <Skeleton variant="text" className="h-7 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className}`}
        role="alert"
      >
        {error}
      </div>
    );
  }

  /* Empty — intentional positive messaging */
  if (insights.length === 0) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-white ${className}`} role="region" aria-label={title}>
        <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          Everything looks good — no actions needed right now.
        </p>
      </div>
    );
  }

  /* Normal */
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <Lightbulb size={14} className="text-amber-400" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <ul className="divide-y divide-slate-200">
        {insights.map((item) => {
          const badge = sevBadge[item.severity];
          const IconCmp = item.icon ?? sevIcon[item.severity];
          return (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <IconCmp size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{item.message}</p>
                {item.explanation && (
                  <p className="text-xs text-slate-500 mt-0.5">{item.explanation}</p>
                )}
              </div>
              <Badge variant={badge.variant} className="shrink-0">{badge.label}</Badge>
              <Link
                href={item.ctaHref}
                className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {item.ctaLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
