"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Bell } from "lucide-react";
import Link from "next/link";
import { fetchTenantNotifications, markNotificationRead } from "@/services/tenant/adapters/notificationAdapter";
import type { NotificationRow } from "@/services/tenant/types";

/* ── Category filter helpers ────────────────────────────────────────────── */

const CATEGORY_FROM_EVENT: Record<string, string> = {
  work_order_created: "maintenance",
  work_order_status_changed: "maintenance",
  work_order_comment_added: "maintenance",
  lease_activation_completed: "lease",
  lease_activation_partial_failure: "lease",
  signature_request_created: "signature",
  signer_signed: "signature",
  document_fully_executed: "signature",
  payment_succeeded: "payment",
  payment_failed: "payment",
  autopay_failure: "payment",
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "maintenance", label: "Maintenance" },
  { key: "lease", label: "Lease" },
  { key: "payment", label: "Payment" },
  { key: "signature", label: "Signature" },
] as const;

function categoryOf(n: NotificationRow): string {
  return CATEGORY_FROM_EVENT[(n as any).event_type ?? n.type ?? ""] ?? "other";
}

function linkFor(n: NotificationRow): string | null {
  if (n.related_type === "work_order" && n.related_id) return `/app/maintenance/${n.related_id}`;
  if (n.related_type === "payment") return "/app/payment-history";
  if (n.related_type === "lease" && n.related_id) return `/app/leases/${n.related_id}`;
  if (n.related_type === "signature_request" && n.related_id) return `/app/documents`;
  return null;
}

/**
 * Notifications center — with category filter tabs and deep links.
 */
export default function Page() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const result = await fetchTenantNotifications();
        if (!cancelled) {
          setNotifications(result.data);
          if (result.error) setError(result.error);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load notifications");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch { /* silent */ }
  }, []);

  const filtered = useMemo(
    () => activeFilter === "all" ? notifications : notifications.filter((n) => categoryOf(n) === activeFilter),
    [notifications, activeFilter],
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="View alerts, reminders, and system notifications."
        actions={unreadCount > 0 ? <Badge variant="info">{unreadCount} unread</Badge> : undefined}
      />

      {/* Category filter tabs */}
      <div className="mt-4 flex gap-1 border-b border-slate-200 pb-px overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
              activeFilter === tab.key
                ? "text-brand-700 border-b-2 border-brand-600 bg-brand-50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : error && notifications.length === 0 ? (
        <div className="mt-6 rounded-lg border border-red-800/50 bg-red-950/30 p-6 text-center text-sm text-red-700">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} strokeWidth={1.5} />}
          title={activeFilter === "all" ? "No notifications yet" : `No ${activeFilter} notifications`}
          description="You'll receive notifications about maintenance updates, payment reminders, and lease changes."
          className="mt-8"
        />
      ) : (
        <Card className="mt-6">
          <ul className="divide-y divide-slate-200">
            {filtered.map((n) => {
              const isUnread = !n.read_at;
              const link = linkFor(n);
              const cat = categoryOf(n);

              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 text-sm ${isUnread ? "bg-slate-50" : ""}`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? "bg-blue-400" : "bg-transparent"}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${isUnread ? "text-slate-900" : "text-slate-600"}`}>
                        {link ? (
                          <Link href={link} className="hover:text-brand-600">{n.title}</Link>
                        ) : n.title}
                      </p>
                      <Badge variant="neutral" className="text-[10px] px-1.5 py-0">{cat}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{n.body}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {isUnread && (
                    <button onClick={() => handleMarkRead(n.id)} className="shrink-0 text-xs text-brand-600 hover:text-brand-700">
                      Mark read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
