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
 * Auth guard hook for protected routes.
 *
 * - On first mount (`idle`), calls `bootstrapSession()` which handles
 *   rehydration, token validation, and /me in one shot.
 * - Redirects to `/auth/login` when status settles to `unauthenticated`.
 * - Never surfaces bootstrap errors — a stale token is silently cleared.
 */
export function useRequireAuth(): UseRequireAuthResult {
  const router = useRouter();
  const pathname = usePathname();
  const state = authStore();

  useEffect(() => {
    devLog("auth", "useRequireAuth status =", state.status);

    if (state.status === "idle") {
      // bootstrapSession handles rehydrate + token check + /me validation
      // in one atomic flow.  It never throws.
      authStore.getState().bootstrapSession();
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
