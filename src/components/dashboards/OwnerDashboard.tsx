"use client";

import { DollarSign, Building2, FileText } from "lucide-react";
import { StatCard } from "./StatCard";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

export function OwnerDashboard() {
  return (
    <section aria-labelledby="owner-heading" className="space-y-6">
      <PageHeader
        title="Owner dashboard"
        description="Track income, performance, and expenses for your properties."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Monthly income" value="$8,450" change="+$200 vs last month" icon={<DollarSign size={20} />} />
        <StatCard label="YTD income" value="$25,350" change="On pace" icon={<DollarSign size={20} />} />
        <StatCard label="Properties" value={3} change="All occupied" icon={<Building2 size={20} />} />
      </div>

      {/* Properties summary */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Properties summary</h2>
        </div>
        <ul className="divide-y divide-slate-800/50 text-sm">
          {[
            { name: "123 Main St", units: 4, occupancy: "100%" },
            { name: "456 Elm Ave", units: 2, occupancy: "100%" },
            { name: "789 Oak Blvd", units: 1, occupancy: "100%" },
          ].map((p) => (
            <li key={p.name} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-slate-200">{p.name}</span>
                <span className="ml-2 text-xs text-slate-400">{p.units} units</span>
              </div>
              <Badge variant="success">{p.occupancy}</Badge>
            </li>
          ))}
        </ul>
      </div>

      {/* Lease status */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Lease status</h2>
        </div>
        <ul className="divide-y divide-slate-800/50 text-sm">
          {[
            { tenant: "Alice Johnson", property: "123 Main St #1A", expires: "Aug 2026", status: "Active" },
            { tenant: "Bob Smith", property: "456 Elm Ave #1", expires: "Mar 2026", status: "Renewing" },
          ].map((l) => (
            <li key={l.tenant} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-slate-200">{l.tenant}</span>
                <span className="ml-2 text-xs text-slate-400">{l.property} · Expires {l.expires}</span>
              </div>
              <Badge variant={l.status === "Active" ? "success" : "info"}>{l.status}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
