"use client";

// Generic dashboard view. For now we don&apos;t enforce auth here; the
// login flow sends users here after a successful sign-in, and later
// we can tighten this up with role-based layouts.

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-50">Leasebase dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          This is a generic dashboard. In a later iteration we&apos;ll tailor this view
          based on your role (tenant, property manager, or owner).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Your leases</h2>
          <p className="mt-1 text-xs text-slate-400">
            Quick entry point for lease details once role-aware dashboards are in place.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Payments</h2>
          <p className="mt-1 text-xs text-slate-400">
            We&apos;ll surface upcoming and recent payments here.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Maintenance</h2>
          <p className="mt-1 text-xs text-slate-400">
            Track open work orders and recent activity from one place.
          </p>
        </div>
      </div>
    </div>
  );
}
