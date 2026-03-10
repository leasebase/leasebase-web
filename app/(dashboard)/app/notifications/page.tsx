"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Bell } from "lucide-react";
import Link from "next/link";
import { fetchTenantNotifications, markNotificationRead } from "@/services/tenant/adapters/notificationAdapter";
import type { NotificationRow } from "@/services/tenant/types";

/**
 * Notifications — LIVE.
 *
 * GET /api/notifications is already user-scoped (by recipient_user_id).
 * PATCH /api/notifications/:id/read marks notifications as read.
 */
export default function Page() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      // Silently fail — user can retry
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="View alerts, reminders, and system notifications."
        actions={
          unreadCount > 0 ? (
            <Badge variant="info">{unreadCount} unread</Badge>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : error && notifications.length === 0 ? (
        <div className="mt-6 rounded-lg border border-red-800/50 bg-red-950/30 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} strokeWidth={1.5} />}
          title="No notifications yet"
          description="You'll receive notifications about maintenance updates, payment reminders, and lease changes."
          className="mt-8"
        />
      ) : (
        <Card className="mt-6">
          <ul className="divide-y divide-slate-200">
            {notifications.map((n) => {
              const isUnread = !n.read_at;
              let link: string | null = null;
              if (n.related_type === "work_order" && n.related_id) {
                link = `/app/maintenance/${n.related_id}`;
              } else if (n.related_type === "payment" && n.related_id) {
                link = "/app/payment-history";
              }

              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 text-sm ${
                    isUnread ? "bg-slate-50" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      isUnread ? "bg-blue-400" : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${isUnread ? "text-slate-900" : "text-slate-600"}`}>
                      {link ? (
                        <Link href={link} className="hover:text-brand-600">
                          {n.title}
                        </Link>
                      ) : (
                        n.title
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{n.body}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 text-xs text-brand-600 hover:text-brand-600"
                    >
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
