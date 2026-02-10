"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authStore } from "@/lib/auth/store";
import { filterNavForPersona } from "@/lib/appNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const state = authStore();

  useEffect(() => {
    if (state.status === "idle") {
      authStore.getState().initializeFromStorage();
      return;
    }

    if (state.status === "initializing" && !state.user) {
      authStore
        .getState()
        .loadMe()
        .catch(() => {
          router.replace(`/login?next=${encodeURIComponent(pathname || "/app")}`);
        });
      return;
    }

    if (state.status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/app")}`);
    }
  }, [state.status, state.user, pathname, router]);

  const persona = state.user?.persona;
  const navItems = filterNavForPersona(persona);

  const isLoading = state.status === "idle" || state.status === "initializing";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-emerald-600 focus:px-3 focus:py-1"
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-md bg-emerald-500" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide">Leasebase</span>
              <span className="text-xs text-slate-400">Modern lease + property workspace</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <label className="sr-only" htmlFor="global-search">
                Search
              </label>
              <input
                id="global-search"
                type="search"
                className="w-56 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Search (coming soon)"
              />
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Notifications (coming soon)"
            >
              
            </button>
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold">
                  {state.user?.name?.[0]?.toUpperCase() || "?"}
                </span>
                <span className="hidden sm:flex flex-col text-left">
                  <span className="text-xs text-slate-400">Signed in as</span>
                  <span className="text-xs font-medium truncate max-w-[10rem]">
                    {state.user?.email || ""}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex mx-auto w-full max-w-6xl px-4 py-4 gap-4">
        <nav
          className="hidden md:block w-56 flex-shrink-0 border-r border-slate-800 pr-4"
          aria-label="Primary"
        >
          <ul className="space-y-1 text-sm">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      active ? "bg-slate-800 text-emerald-300" : "text-slate-200"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="text-xs uppercase tracking-wide">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="main-content" className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-40 rounded bg-slate-800 animate-pulse" />
              <div className="h-4 w-64 rounded bg-slate-900 animate-pulse" />
              <div className="grid gap-3 md:grid-cols-3">
                <div className="h-24 rounded bg-slate-900 animate-pulse" />
                <div className="h-24 rounded bg-slate-900 animate-pulse" />
                <div className="h-24 rounded bg-slate-900 animate-pulse" />
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
