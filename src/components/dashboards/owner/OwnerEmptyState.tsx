"use client";

import Link from "next/link";
import { Building2, Users, CreditCard, CheckCircle2 } from "lucide-react";
import type { SetupStage } from "@/services/dashboard/types";

interface Step {
  label: string;
  description: string;
  href: string;
  icon: typeof Building2;
  done: boolean;
  skippable?: boolean;
}

function getSteps(stage: SetupStage): Step[] {
  const stages: SetupStage[] = ["no-properties", "no-units", "no-leases", "no-payments", "active"];
  const idx = stages.indexOf(stage);

  return [
    {
      label: "Add your property",
      description: "Enter property details and add at least one unit.",
      href: "/app/properties",
      icon: Building2,
      done: idx > 1, // property + units exist
    },
    {
      label: "Add a tenant",
      description: "Create a lease and invite your first tenant — or skip for now.",
      href: "/app/tenants",
      icon: Users,
      done: idx > 2,
      skippable: true,
    },
    {
      label: "Set your rent amount",
      description: "Record a payment or set a scheduled rent to start tracking cash flow.",
      href: "/app/payments",
      icon: CreditCard,
      done: idx > 3,
    },
  ];
}

interface OwnerEmptyStateProps {
  stage: SetupStage;
}

export function OwnerEmptyState({ stage }: OwnerEmptyStateProps) {
  const steps = getSteps(stage);
  const doneCount = steps.filter((s) => s.done).length;
  const currentStep = doneCount + 1;
  const total = steps.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <Building2 size={48} strokeWidth={1.5} className="mx-auto mb-4 text-brand-500" />
      <h2 className="text-xl font-semibold text-slate-900">Welcome to LeaseBase</h2>
      <p className="mt-1 text-sm text-slate-500">
        {doneCount === 0
          ? "Get your first property set up in three quick steps."
          : `Step ${Math.min(currentStep, total)} of ${total} — you're almost there.`}
      </p>

      {/* Progress bar */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <span>Step {Math.min(currentStep, total)}/{total}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${doneCount} of ${total} steps complete`}
          />
        </div>
      </div>

      {/* 3-step checklist */}
      <ul className="mt-4 space-y-2 text-left">
        {steps.map((step, i) => {
          const IconCmp = step.done ? CheckCircle2 : step.icon;
          const isCurrent = !step.done && i === doneCount;
          return (
            <li key={step.label}>
              <Link
                href={step.href}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  step.done
                    ? "border-slate-200 bg-slate-50 text-slate-400"
                    : isCurrent
                      ? "border-brand-300 bg-brand-50/30 text-slate-700 ring-1 ring-brand-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/30"
                }`}
              >
                <IconCmp
                  size={18}
                  className={`mt-0.5 shrink-0 ${step.done ? "text-emerald-500" : "text-brand-500"}`}
                />
                <div className="flex-1 min-w-0">
                  <span className={step.done ? "line-through" : "font-medium"}>
                    {step.label}
                  </span>
                  {!step.done && (
                    <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                  )}
                </div>
                {!step.done && step.skippable && (
                  <span className="mt-0.5 shrink-0 text-xs text-slate-400">Skip →</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
