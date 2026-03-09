"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { TenantNotificationsWidgetViewModel } from "@/services/tenant/types";

const provenanceLabel: Record<string, string> = {
  live: "Live data",
  stub: "Sample data",
  unavailable: "Data unavailable",
};

interface TenantNotificationsWidgetProps {
  vm: TenantNotificationsWidgetViewModel;
}

export function TenantNotificationsWidget({ vm }: TenantNotificationsWidgetProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Notifications</h2>
          {vm.unreadCount > 0 && (
            <Badge variant="info">{vm.unreadCount} new</Badge>
          )}
        </div>
        {vm.source !== "live" && (
          <Badge variant="neutral">{provenanceLabel[vm.source]}</Badge>
        )}
      </div>

      {vm.items.length > 0 ? (
        <ul className="divide-y divide-slate-800/50">
          {vm.items.map((n) => {
            const inner = (
              <div className="flex items-start gap-3 px-4 py-3 text-sm">
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    n.isUnread ? "bg-blue-400" : "bg-transparent"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${n.isUnread ? "text-slate-100" : "text-slate-300"}`}>
                    {n.title}
                  </p>
                  <p className="truncate text-xs text-slate-400">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{n.time}</span>
              </div>
            );

            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block transition-colors hover:bg-slate-900/50">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-4 py-4">
          <p className="text-xs text-slate-400">
            {vm.source === "unavailable"
              ? "Could not load notifications."
              : "No notifications yet."}
          </p>
        </div>
      )}

      {vm.items.length > 0 && (
        <div className="border-t border-slate-800 px-4 py-2">
          <Link
            href="/app/notifications"
            className="text-xs font-medium text-brand-400 hover:text-brand-300"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
