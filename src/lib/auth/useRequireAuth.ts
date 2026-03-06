"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStore, type AuthStatus, type CurrentUser } from "./store";
import { devLog } from "@/lib/debug";

export interface UseRequireAuthResult {
  user: CurrentUser | undefined;
  status: AuthStatus;
  isLoading: boolean;
}

/**
 * Auth guard hook. Reads authStore, initialises the session from persisted
 * storage when idle, calls loadMe when needed, and redirects to login when
 * the session is determined to be unauthenticated.
 */
export function useRequireAuth(): UseRequireAuthResult {
  const router = useRouter();
  const pathname = usePathname();
  const state = authStore();

  useEffect(() => {
    devLog("auth", "useRequireAuth status =", state.status);

    if (state.status === "idle") {
      // Rehydrate persisted state from localStorage first.  The store uses
      // skipHydration: true so this is the earliest safe moment (after React
      // hydration).  rehydrate() is synchronous for localStorage so the
      // subsequent initializeFromStorage() call sees the restored tokens.
      devLog("auth", "rehydrating + initializeFromStorage");
      authStore.persist.rehydrate();
      authStore.getState().initializeFromStorage();
      return;
    }

    if (state.status === "initializing" && !state.user) {
      devLog("auth", "loading /api/auth/me");
      authStore
        .getState()
        .loadMe()
        .catch(() => {
          devLog("auth", "loadMe failed, redirecting to login");
          router.replace(`/auth/login?next=${encodeURIComponent(pathname || "/app")}`);
        });
      return;
    }

    if (state.status === "unauthenticated") {
      devLog("auth", "unauthenticated, redirecting to login");
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || "/app")}`);
    }
  }, [state.status, state.user, pathname, router]);

  return {
    user: state.user,
    status: state.status,
    isLoading: state.status === "idle" || state.status === "initializing",
  };
}
