"use client";

import { CreditCard, Wrench, MessageSquare } from "lucide-react";
import { StatCard } from "./StatCard";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

export function TenantDashboard() {
  return (
    <section aria-labelledby="tenant-heading" className="space-y-6">
      <PageHeader
        title="Tenant dashboard"
        description="Check your rent status, lease details, and maintenance requests."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Next rent due" value="$1,450" change="Due Mar 1, 2026" icon={<CreditCard size={20} />} />
        <StatCard label="Lease ends" value="Aug 2026" change="7 months remaining" icon={<CreditCard size={20} />} />
        <StatCard label="Open requests" value={1} change="1 in progress" icon={<Wrench size={20} />} />
      </div>

      {/* Rent status */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <CreditCard size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Rent status</h2>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-200">March 2026</span>
            <Badge variant="warning">Due soon</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">$1,450.00 · Due March 1, 2026</p>
        </div>
      </div>

      {/* Maintenance requests */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <Wrench size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Maintenance requests</h2>
        </div>
        <ul className="divide-y divide-slate-800/50 text-sm">
          {[
            { title: "Leaking kitchen faucet", date: "Feb 20", status: "In progress" },
            { title: "Broken blinds — living room", date: "Jan 15", status: "Completed" },
          ].map((r) => (
            <li key={r.title} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-slate-200">{r.title}</span>
                <span className="ml-2 text-xs text-slate-400">Submitted {r.date}</span>
              </div>
              <Badge variant={r.status === "Completed" ? "success" : "info"}>{r.status}</Badge>
            </li>
          ))}
        </ul>
      </div>

      {/* Messages */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Messages</h2>
        </div>
        <ul className="divide-y divide-slate-800/50 text-sm">
          <li className="px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-slate-200">Property Management</span>
              <p className="text-xs text-slate-400">Maintenance update — faucet repair scheduled for Tue</p>
            </div>
            <span className="text-xs text-slate-500">2h ago</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
