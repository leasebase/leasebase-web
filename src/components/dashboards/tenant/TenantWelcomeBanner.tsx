"use client";

import { useState } from "react";
import { X, FileText, UserCircle, Wrench } from "lucide-react";

interface TenantWelcomeBannerProps {
  /** Tenant user ID — used to scope the localStorage dismissal key. */
  userId: string;
  /** Profile created_at (ISO string) — banner shows only within 7 days. */
  profileCreatedAt: string;
}

const DISMISS_KEY_PREFIX = "lb_tenant_welcome_dismissed_";

function isDismissed(userId: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(`${DISMISS_KEY_PREFIX}${userId}`) === "1";
}

function isWithinDays(isoDate: string, days: number): boolean {
  const created = new Date(isoDate).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < days * 24 * 60 * 60 * 1000;
}

const quickStarts = [
  {
    icon: FileText,
    label: "Review your lease",
    href: "/app/leases",
    description: "Check your lease dates, rent amount, and terms.",
  },
  {
    icon: UserCircle,
    label: "Complete your profile",
    href: "/app/profile",
    description: "Add your phone number and emergency contact.",
  },
  {
    icon: Wrench,
    label: "Submit a maintenance request",
    href: "/app/maintenance",
    description: "Report any issues with your unit.",
  },
];

/**
 * Welcome banner shown to newly-invited tenants on their first dashboard visit.
 *
 * Visibility rules:
 * - profile.created_at is within the last 7 days
 * - setupStage === "active" (caller is responsible for this check)
 * - not previously dismissed (persisted per-user in localStorage)
 */
export function TenantWelcomeBanner({ userId, profileCreatedAt }: TenantWelcomeBannerProps) {
  const [visible, setVisible] = useState(() => {
    if (isDismissed(userId)) return false;
    if (!isWithinDays(profileCreatedAt, 7)) return false;
    return true;
  });

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(`${DISMISS_KEY_PREFIX}${userId}`, "1");
    setVisible(false);
  }

  return (
    <div className="relative rounded-xl border border-brand-700/40 bg-gradient-to-r from-brand-950/60 via-slate-900 to-slate-900 p-5">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        aria-label="Dismiss welcome banner"
      >
        <X size={16} />
      </button>

      <h3 className="text-lg font-semibold text-slate-50">
        Welcome to LeaseBase!
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        Your account is all set up. Here are a few things to get started:
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {quickStarts.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="group flex gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 transition-colors hover:border-brand-700/50 hover:bg-slate-800/60"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
