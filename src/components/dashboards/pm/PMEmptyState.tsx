"use client";

import Link from "next/link";
import { Building2, DoorOpen, FileText, CheckCircle2 } from "lucide-react";
import type { PMSetupStage } from "@/services/pm/types";

interface Step {
  label: string;
  href: string;
  icon: typeof Building2;
  done: boolean;
}

function getSteps(stage: PMSetupStage): Step[] {
  const stages: PMSetupStage[] = ["no-assignments", "no-units", "no-leases", "active"];
  const idx = stages.indexOf(stage);

  return [
    {
      label: "Get assigned to properties",
      href: "/app/properties",
      icon: Building2,
      done: idx > 0,
    },
    {
      label: "Set up units for your properties",
      href: "/app/units",
      icon: DoorOpen,
      done: idx > 1,
    },
    {
      label: "Create leases for your tenants",
      href: "/app/leases",
      icon: FileText,
      done: idx > 2,
    },
  ];
}

interface PMEmptyStateProps {
  stage: PMSetupStage;
}

export function PMEmptyState({ stage }: PMEmptyStateProps) {
  const steps = getSteps(stage);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <Building2 size={48} strokeWidth={1.5} className="mx-auto mb-4 text-brand-400" />
      <h2 className="text-xl font-semibold text-slate-100">Welcome to your portfolio</h2>
      <p className="mt-1 text-sm text-slate-400">
        Complete these steps to manage your properties and unlock your dashboard.
      </p>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <span>{doneCount} of {steps.length} complete</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <ul className="mt-4 space-y-2 text-left">
        {steps.map((step) => {
          const IconCmp = step.done ? CheckCircle2 : step.icon;
          return (
            <li key={step.label}>
              <Link
                href={step.href}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  step.done
                    ? "border-slate-800 bg-slate-900/40 text-slate-500"
                    : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-brand-500/50 hover:bg-slate-800/70"
                }`}
              >
                <IconCmp
                  size={18}
                  className={step.done ? "text-emerald-500" : "text-brand-400"}
                />
                <span className={step.done ? "line-through" : ""}>
                  {step.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
