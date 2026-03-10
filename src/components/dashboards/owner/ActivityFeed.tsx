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
  LEASE_TERMINATED: FileText,
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
  if (vm.events.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Recent Activity</h2>
        {vm.isStub && <Badge variant="neutral">Sample</Badge>}
      </div>
      <ul className="divide-y divide-slate-800/50">
        {vm.events.map((evt) => {
          const IconCmp = eventIcons[evt.type] ?? Clock;
          const inner = (
            <div className="flex items-start gap-3 px-4 py-3 text-sm">
              <span className="mt-0.5 shrink-0 rounded-md bg-slate-800 p-1.5 text-slate-400">
                <IconCmp size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-200">{evt.title}</p>
                <p className="truncate text-xs text-slate-400">{evt.description}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">{timeAgo(evt.timestamp)}</span>
            </div>
          );

          return (
            <li key={evt.id}>
              {evt.link ? (
                <Link href={evt.link} className="block transition-colors hover:bg-slate-900/50">
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
