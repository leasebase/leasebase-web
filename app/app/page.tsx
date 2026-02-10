"use client";

import { authStore } from "@/lib/auth/store";

export default function AppDashboardPage() {
  const { user } = authStore();
  const persona = user?.persona;

  let heading = "Dashboard";
  let description = "Overview of your Leasebase workspace.";

  if (persona === "propertyManager") {
    heading = "Portfolio overview";
    description = "See occupancy, leases, and maintenance across your portfolio.";
  } else if (persona === "owner") {
    heading = "Owner dashboard";
    description = "Track income, performance, and expenses for your properties.";
  } else if (persona === "tenant") {
    heading = "Tenant dashboard";
    description = "Check your rent status, lease details, and maintenance requests.";
  }

  return (
    <section aria-labelledby="app-dashboard-heading" className="space-y-6">
      <header>
        <h1 id="app-dashboard-heading" className="text-2xl font-semibold text-slate-50">
          {heading}
        </h1>
        <p className="mt-1 text-sm text-slate-300">{description}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Key metrics</h2>
          <p className="mt-1 text-xs text-slate-400">
            Metrics and charts tailored to this role will appear here.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Todays priorities</h2>
          <p className="mt-1 text-xs text-slate-400">
            Surface upcoming rent, expiring leases, and urgent tasks.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Recent activity</h2>
          <p className="mt-1 text-xs text-slate-400">
            Payments, leases, and maintenance updates will show here.
          </p>
        </div>
      </div>
    </section>
  );
}
