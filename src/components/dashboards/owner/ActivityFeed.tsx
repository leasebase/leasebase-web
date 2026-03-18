"use client";

import Link from "next/link";
import { CreditCard, FileText, Wrench, Users, Clock } from "lucide-react";
import type { ActivityFeedViewModel, ActivityEventType } from "@/services/dashboard/types";
import { Badge } from "@/components/ui/Badge";

const eventIcons: Record<ActivityEventType, typeof CreditCard> = {
  PAYMENT_RECEIVED: CreditCard,
  TENANT_INVITED: Users,
  MAINTENANCE_CREATED: Wrench,
  MAINTENANCE_COMPLETED: Wrench,
  LEASE_RENEWED: FileText,
  LEASE_DEACTIVATED: FileText,
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
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <p className="px-4 py-6 text-center text-sm text-slate-400">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
      </div>
      <ul className="divide-y divide-slate-200">
        {vm.events.map((evt) => {
          const IconCmp = eventIcons[evt.type] ?? Clock;
          const inner = (
            <div className="flex items-start gap-3 px-4 py-3 text-sm">
              <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 p-1.5 text-slate-500">
                <IconCmp size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-700">{evt.title}</p>
                <p className="truncate text-xs text-slate-500">{evt.description}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{timeAgo(evt.timestamp)}</span>
            </div>
          );

          return (
            <li key={evt.id}>
              {evt.link ? (
                <Link href={evt.link} className="block transition-colors hover:bg-slate-50">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
