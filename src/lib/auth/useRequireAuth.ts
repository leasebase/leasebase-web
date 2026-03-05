"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStore, type AuthStatus, type CurrentUser } from "./store";

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
    if (state.status === "idle") {
      authStore.getState().initializeFromStorage();
      return;
    }

    if (state.status === "initializing" && !state.user) {
      authStore
        .getState()
        .loadMe()
        .catch(() => {
          router.replace(`/auth/login?next=${encodeURIComponent(pathname || "/app")}`);
        });
      return;
    }

    if (state.status === "unauthenticated") {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || "/app")}`);
    }
  }, [state.status, state.user, pathname, router]);

  return {
    user: state.user,
    status: state.status,
    isLoading: state.status === "idle" || state.status === "initializing",
  };
}
