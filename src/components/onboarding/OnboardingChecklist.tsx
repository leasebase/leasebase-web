"use client";

import { Building2, DoorOpen, Users, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface OnboardingChecklistProps {
  progress: {
    orgCreated: boolean;
    firstPropertyAdded: boolean;
    unitsConfigured: boolean;
    tenantsInvited: boolean;
    completedAt: string | null;
  };
}

export function OnboardingChecklist({ progress }: OnboardingChecklistProps) {
  if (progress.completedAt) return null;

  const steps = [
    {
      label: "Add your first property",
      done: progress.firstPropertyAdded,
      href: "/app/properties",
      icon: <Building2 size={16} />,
    },
    {
      label: "Configure units",
      done: progress.unitsConfigured,
      href: "/app/properties",
      icon: <DoorOpen size={16} />,
    },
    {
      label: "Add tenants",
      done: progress.tenantsInvited,
      href: "/app/tenants",
      icon: <Users size={16} />,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-100">Setup progress</h3>
        <span className="text-xs text-slate-400">
          {completedCount} of {totalSteps} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${(completedCount / totalSteps) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                step.done
                  ? "text-slate-500"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              {step.done ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-600 shrink-0" />
              )}
              <span className={step.done ? "line-through" : ""}>{step.label}</span>
              {!step.done && (
                <span className="ml-auto text-xs text-emerald-400">Start →</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
