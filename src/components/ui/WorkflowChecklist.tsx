"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";

/* ── Types ── */

export interface ChecklistStep {
  key: string;
  label: string;
  done: boolean;
  href?: string;
  ctaLabel?: string;
}

export interface WorkflowChecklistProps {
  title: string;
  steps: ChecklistStep[];
  /** localStorage key to persist dismissal. Omit to prevent dismissal. */
  dismissKey?: string;
  className?: string;
}

/* ── Component ── */

export function WorkflowChecklist({
  title,
  steps,
  dismissKey,
  className = "",
}: WorkflowChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!dismissKey) return;
    try {
      if (localStorage.getItem(dismissKey) === "true") setDismissed(true);
    } catch {}
  }, [dismissKey]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    if (dismissKey) {
      try { localStorage.setItem(dismissKey, "true"); } catch {}
    }
  }, [dismissKey]);

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  // Don't render if dismissed or all steps complete
  if (dismissed || allDone || steps.length === 0) return null;

  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {doneCount} of {steps.length}
          </span>
          {dismissKey && (
            <button
              type="button"
              onClick={dismiss}
              className="rounded p-1 text-slate-500 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Dismiss checklist"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-label={`${doneCount} of ${steps.length} steps complete`}
          />
        </div>
      </div>

      {/* Steps */}
      <ul className="px-4 py-3 space-y-1.5">
        {steps.map((step) => {
          const content = (
            <span
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                step.done
                  ? "text-slate-500"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {step.done ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              ) : (
                <Circle size={16} className="shrink-0 text-slate-600" />
              )}
              <span className={`flex-1 ${step.done ? "line-through" : ""}`}>
                {step.label}
              </span>
              {!step.done && step.ctaLabel && (
                <span className="shrink-0 text-xs font-medium text-brand-600">
                  {step.ctaLabel} →
                </span>
              )}
            </span>
          );

          return (
            <li key={step.key}>
              {!step.done && step.href ? (
                <Link href={step.href} className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
