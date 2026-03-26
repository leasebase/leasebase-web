"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Bell,
  DollarSign,
  Wrench,
  FileText,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { fetchTenantNotifications, markNotificationRead } from "@/services/tenant/adapters/notificationAdapter";
import type { NotificationRow } from "@/services/tenant/types";
import { notificationWs } from "@/lib/notifications/ws";

/* ── Category helpers ── */

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
  { key: "unread", label: "Unread" },
  { key: "payment", label: "Payment" },
  { key: "maintenance", label: "Maintenance" },
  { key: "lease", label: "Lease" },
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

const ICON_STYLE: Record<string, { style: string; Icon: typeof Bell }> = {
  payment: { style: "bg-green-50 text-green-600", Icon: DollarSign },
  maintenance: { style: "bg-amber-50 text-amber-600", Icon: Wrench },
  lease: { style: "bg-blue-50 text-blue-600", Icon: FileText },
  signature: { style: "bg-violet-50 text-violet-600", Icon: FileText },
};
const DEFAULT_ICON = { style: "bg-slate-50 text-slate-600", Icon: Bell };

const BADGE_STYLE: Record<string, string> = {
  payment: "bg-green-100 text-green-700",
  maintenance: "bg-amber-100 text-amber-700",
  lease: "bg-blue-100 text-blue-700",
  signature: "bg-violet-100 text-violet-700",
};

/**
 * Notifications center — UIUX design with category filters, rich rows, and mark-read.
 */
export default function Page() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [markingAll, setMarkingAll] = useState(false);

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

  // Real-time: prepend new notifications from WebSocket
  useEffect(() => {
    const unsub = notificationWs.on('notification.created', (msg: any) => {
      const n = msg.notification as NotificationRow | undefined;
      if (!n) return;
      setNotifications((prev) => {
        if (prev.some((existing) => existing.id === n.id)) return prev;
        return [n, ...prev];
      });
    });
    return unsub;
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch { /* silent */ }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read_at);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) =>
        prev.map((n) => n.read_at ? n : { ...n, read_at: new Date().toISOString() })
      );
    } catch { /* silent */ }
    setMarkingAll(false);
  }, [notifications]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter((n) => !n.read_at);
    return notifications.filter((n) => categoryOf(n) === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton variant="text" className="h-7 w-48" /><Skeleton variant="text" className="mt-2 h-4 w-72" /></div>
        <div className="bg-white rounded-xl border border-slate-200 p-1.5"><div className="grid grid-cols-3 sm:grid-cols-6 gap-1">{[0,1,2,3,4,5].map(i=><Skeleton key={i} variant="rectangular" className="h-9 rounded-lg" />)}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5">{[0,1,2,3].map(i=><Skeleton key={i} variant="rectangular" className="mt-3 h-20 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[26px] font-semibold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-[12px] font-bold rounded-lg">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-[14px] text-slate-600">Stay updated with important messages and alerts</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 h-10 px-4 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {markingAll ? "Marking\u2026" : "Mark all as read"}
          </button>
        )}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`h-9 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-all ${
                activeFilter === tab.key
                  ? "bg-gradient-to-r from-green-50 to-green-50/50 text-green-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notifications List ── */}
      {error && notifications.length === 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">
                {activeFilter === "all" && "All Notifications"}
                {activeFilter === "unread" && "Unread Notifications"}
                {activeFilter === "payment" && "Payment Notifications"}
                {activeFilter === "maintenance" && "Maintenance Notifications"}
                {activeFilter === "lease" && "Lease Notifications"}
                {activeFilter === "signature" && "Signature Notifications"}
              </h3>
              <span className="text-[13px] text-slate-600">
                {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {filtered.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filtered.map((n) => {
                const isUnread = !n.read_at;
                const link = linkFor(n);
                const cat = categoryOf(n);
                const { style: iconBg, Icon: IconCmp } = ICON_STYLE[cat] ?? DEFAULT_ICON;
                const badgeBg = BADGE_STYLE[cat] ?? "bg-slate-100 text-slate-700";

                return (
                  <div
                    key={n.id}
                    className={`p-5 hover:bg-slate-50 transition-all group ${
                      isUnread ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg}`}>
                        <IconCmp className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[14px] font-semibold text-slate-900">
                              {link ? (
                                <Link href={link} className="hover:text-green-600 transition-colors">{n.title}</Link>
                              ) : n.title}
                            </h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap font-medium">
                            {new Date(n.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-600 mb-3">{n.body}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${badgeBg}`}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </span>
                          {isUnread && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="text-[11px] text-green-600 hover:text-green-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[14px] text-slate-600 mb-1">
                {activeFilter === "unread" ? "You're all caught up!" : "No notifications"}
              </p>
              <p className="text-[12px] text-slate-500">
                {activeFilter === "unread"
                  ? "All notifications have been read."
                  : "Notifications will appear here when you have updates"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Notification Preferences Card ── */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-2xl border border-blue-200 p-6">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Notification Preferences</h3>
        <p className="text-[13px] text-slate-600">
          Manage how you receive notifications in your profile settings. You can customize email, SMS, and in-app notification preferences.
        </p>
      </div>
    </div>
  );
}
