"use client";

import Link from "next/link";
import { CreditCard, FileText, Wrench, Users, Clock, ArrowUpRight } from "lucide-react";
import type { ActivityFeedViewModel, ActivityEventType } from "@/services/dashboard/types";

const eventIcons: Record<ActivityEventType, typeof CreditCard> = {
  PAYMENT_RECEIVED: CreditCard,
  TENANT_INVITED: Users,
  MAINTENANCE_CREATED: Wrench,
  MAINTENANCE_COMPLETED: Wrench,
  LEASE_RENEWED: FileText,
  LEASE_DEACTIVATED: FileText,
};

/** Gradient color per event type for timeline icons */
const eventIconGradient: Record<string, string> = {
  PAYMENT_RECEIVED: "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/20",
  TENANT_INVITED: "bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/20",
  MAINTENANCE_CREATED: "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20",
  MAINTENANCE_COMPLETED: "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20",
  LEASE_RENEWED: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20",
  LEASE_DEACTIVATED: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActivityFeedProps {
  vm: ActivityFeedViewModel;
}

export function ActivityFeed({ vm }: ActivityFeedProps) {
  if (vm.events.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="border-b border-gray-100 p-4 bg-gradient-to-br from-gray-50 to-white">
          <h2 className="text-[14px] font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <p className="px-4 py-6 text-center text-sm text-slate-400">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-md">
      <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-gradient-to-br from-gray-50 to-white">
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-[12px] text-gray-600 mt-0.5">Latest updates across your portfolio</p>
        </div>
        <Link
          href="/app/notifications"
          className="text-[12px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
        >
          View All <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="p-4">
        <div className="space-y-0">
          {vm.events.map((evt, index) => {
            const IconCmp = eventIcons[evt.type] ?? Clock;
            const gradient = eventIconGradient[evt.type] ?? "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/20";
            const isLast = index === vm.events.length - 1;

            const inner = (
              <div className="flex gap-3.5 group">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${gradient}`}>
                    <IconCmp className="w-[15px] h-[15px] text-white" strokeWidth={2.5} />
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 bg-slate-200 mt-1.5" />
                  )}
                </div>
                <div className="flex-1 pb-4 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 mb-0.5">{evt.title}</p>
                      <p className="text-[12px] text-gray-600 truncate">{evt.description}</p>
                    </div>
                    <span className="text-[11px] text-gray-500 whitespace-nowrap font-medium shrink-0">
                      {timeAgo(evt.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={evt.id}>
                {evt.link ? (
                  <Link href={evt.link} className="block transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-lg">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
