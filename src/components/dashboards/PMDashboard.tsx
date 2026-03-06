"use client";

import { Building2, DoorOpen, TrendingUp, Wrench } from "lucide-react";
import { StatCard } from "./StatCard";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

export function PMDashboard() {
  return (
    <section aria-labelledby="pm-heading" className="space-y-6">
      <PageHeader
        title="Portfolio overview"
        description="See occupancy, leases, and maintenance across your portfolio."
      />

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value={12} change="+2 this month" icon={<Building2 size={20} />} />
        <StatCard label="Units" value={48} change="3 vacant" icon={<DoorOpen size={20} />} />
        <StatCard label="Occupancy" value="93%" change="+1.5% vs last month" icon={<TrendingUp size={20} />} />
        <StatCard label="Revenue (MTD)" value="$34,200" change="On track" icon={<TrendingUp size={20} />} />
      </div>

      {/* Tasks */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Tasks &amp; follow-ups</h2>
        </div>
        <ul className="divide-y divide-slate-800/50 text-sm">
          {[
            { task: "Review lease renewal — Unit 4B", badge: "warning" as const, badgeText: "Due in 3 days" },
            { task: "Approve vendor invoice — ABC Plumbing", badge: "info" as const, badgeText: "New" },
            { task: "Follow up on tenant complaint — Unit 2A", badge: "danger" as const, badgeText: "Overdue" },
          ].map((item) => (
            <li key={item.task} className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-200">{item.task}</span>
              <Badge variant={item.badge}>{item.badgeText}</Badge>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent maintenance */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <Wrench size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Recent maintenance</h2>
        </div>
        <ul className="divide-y divide-slate-800/50 text-sm">
          {[
            { title: "Fix leaking faucet — Unit 3C", status: "In progress" },
            { title: "Replace HVAC filter — Building A", status: "Scheduled" },
            { title: "Paint touch-up — Unit 1A", status: "Completed" },
          ].map((item) => (
            <li key={item.title} className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-200">{item.title}</span>
              <span className="text-xs text-slate-400">{item.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
