"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  MessageSquare,
  Search,
  LogOut,
  Command,
  Settings,
  User,
} from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { Avatar } from "@/components/ui/Avatar";
import { DropdownMenu, type DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { Logo } from "@/components/Logo";
import { useAppShell } from "./AppShell";
import { apiRequest } from "@/lib/api/client";
import { notificationWs } from "@/lib/notifications/ws";
import { useToast } from "@/components/ui/Toast";
import { getAccessToken } from "@/lib/auth/tokens";

/* ─── AppHeader ─── */

export interface AppHeaderProps {
  onOpenCommandPalette?: () => void;
}

const POLL_INTERVAL = 60_000; // 60 seconds (fallback when WS disconnected)

export function AppHeader({ onOpenCommandPalette }: AppHeaderProps) {
  const router = useRouter();
  const { user } = authStore();
  const { mobileOpen, setMobileOpen, hamburgerRef } = useAppShell();
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const wsConnected = useRef(false);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await apiRequest<{ data: { count: number } }>({
        path: "api/notifications/unread-count",
      });
      setUnreadCount(res.data?.count ?? 0);
    } catch { /* silent */ }
  }, []);

  // ── WebSocket: connect only after session is confirmed (user set) ────
  // The unread-count fetch and WS connection must NOT fire until the
  // session bootstrap has completed.  A 401 from unread-count must
  // never destroy the session — apiRequest already handles this via
  // the non-destructive default, but gating on `user` prevents
  // unnecessary failed requests during bootstrap.
  useEffect(() => {
    if (!user) return; // session not yet confirmed

    const token = getAccessToken();
    if (token) {
      notificationWs.connect(token);
    }

    const unsubs: (() => void)[] = [];

    unsubs.push(notificationWs.on('connected', () => {
      wsConnected.current = true;
    }));

    unsubs.push(notificationWs.on('disconnected', () => {
      wsConnected.current = false;
    }));

    unsubs.push(notificationWs.on('notification.unread_count_updated', (msg: any) => {
      if (typeof msg.count === 'number') {
        setUnreadCount(msg.count);
      }
    }));

    unsubs.push(notificationWs.on('notification.created', (msg: any) => {
      const n = msg.notification;
      if (n?.title) {
        toast('info', n.title);
      }
    }));

    return () => {
      unsubs.forEach((fn) => fn());
      notificationWs.disconnect();
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling fallback: only when WS is not connected AND session ready ─
  useEffect(() => {
    if (!user) return; // don't poll until session is confirmed

    fetchUnread(); // initial fetch after session confirmed
    const id = setInterval(() => {
      if (!wsConnected.current) {
        fetchUnread();
      }
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchUnread, user]);

  const handleLogout = () => {
    authStore.getState().logout("manual");
  };

  const userMenuItems: DropdownMenuItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: <User size={14} />,
      onClick: () => router.push("/app/profile"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={14} />,
      onClick: () => router.push("/app/settings"),
    },
    {
      id: "sign-out",
      label: "Sign out",
      icon: <LogOut size={14} />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 px-6 py-2.5">
        {/* Mobile hamburger (hidden on desktop) */}
        <div className="flex items-center md:hidden">
          <button
            ref={hamburgerRef}
            type="button"
            className="rounded p-1.5 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Welcome text for tenant / Search bar for owner */}
        <div className="flex-1 max-w-lg">
          {user?.persona === "tenant" ? (
            <h2 className="text-[15px] font-semibold text-slate-900">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h2>
          ) : (
            <>
          <label className="sr-only" htmlFor="global-search">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400" aria-hidden="true" />
            <input
              id="global-search"
              type="search"
              className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 focus:bg-white transition-all"
              placeholder="Search properties, tenants, leases..."
            />
          </div>
            </>
          )}
        </div>

        {/* Right: notification bell only */}
        <div className="flex items-center gap-2 ml-4">
          <Link
            href="/app/notifications"
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
