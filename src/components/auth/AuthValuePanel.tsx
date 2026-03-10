"use client";

import { Building2, Users, Zap } from "lucide-react";

const VALUE_POINTS = [
  {
    icon: Building2,
    text: "Track leases, rent, and maintenance in one place",
  },
  {
    icon: Users,
    text: "Keep owners, managers, and tenants aligned",
  },
  {
    icon: Zap,
    text: "Move faster with a clean operational workspace",
  },
];

/**
 * Left-side branding / value-proposition panel for the auth shell.
 * Hidden on mobile; visible on md+ screens.
 */
export function AuthValuePanel() {
  return (
    <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-brand-950 p-10 lg:p-14">
      {/* Subtle dot-grid background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col gap-10">
        {/* Logo wordmark */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white shadow-lg">
            LB
          </span>
          <span className="text-xl font-semibold tracking-wide text-slate-100">
            Leasebase
          </span>
        </div>

        {/* Headline + supporting copy */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-4xl">
            Property operations,
            <br />
            <span className="text-brand-400">simplified.</span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            The modern platform for landlords, property managers, and tenants to
            manage leases, payments, and maintenance — all in one place.
          </p>
        </div>

        {/* Value bullets */}
        <ul className="space-y-4">
          {VALUE_POINTS.map(({ icon: IconCmp, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                <IconCmp size={16} />
              </span>
              <span className="text-sm leading-snug text-slate-300">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom gradient accent */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to top, var(--lb-color-brand-primary-950) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Footer */}
      <p className="relative z-10 mt-12 text-xs text-slate-600">
        © {new Date().getFullYear()} Leasebase Inc.
      </p>
    </div>
  );
}
