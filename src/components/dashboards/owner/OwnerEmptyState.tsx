"use client";

import Link from "next/link";
import { Building2, DoorOpen, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import type { SetupStage } from "@/services/dashboard/types";

interface Step {
  label: string;
  href: string;
  icon: typeof Building2;
  done: boolean;
}

function getSteps(stage: SetupStage): Step[] {
  const stages: SetupStage[] = ["no-properties", "no-units", "no-leases", "no-payments", "active"];
  const idx = stages.indexOf(stage);

  return [
    {
      label: "Add your first property",
      href: "/app/properties",
      icon: Building2,
      done: idx > 0,
    },
    {
      label: "Create units for your property",
      href: "/app/units",
      icon: DoorOpen,
      done: idx > 1,
    },
    {
      label: "Set up a lease",
      href: "/app/leases",
      icon: FileText,
      done: idx > 2,
    },
    {
      label: "Record your first payment",
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

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <Building2 size={48} strokeWidth={1.5} className="mx-auto mb-4 text-brand-500" />
      <h2 className="text-xl font-semibold text-slate-900">Welcome to LeaseBase</h2>
      <p className="mt-1 text-sm text-slate-500">
        Complete these steps to set up your portfolio and unlock your dashboard.
      </p>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <span>{doneCount} of {steps.length} complete</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
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
                    ? "border-slate-200 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/30"
                }`}
              >
                <IconCmp
                  size={18}
                  className={step.done ? "text-emerald-500" : "text-brand-500"}
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
