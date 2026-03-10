"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStore, type AuthStatus, type CurrentUser } from "./store";
import { getPortalUrlForRole, resolvePersonaFromHostname, getSignInUrl } from "@/lib/hostname";
import { devLog } from "@/lib/debug";

export interface UseRequireAuthResult {
  user: CurrentUser | undefined;
  status: AuthStatus;
  isLoading: boolean;
}

/**
 * Auth guard hook for protected routes.
 *
 * - On first mount (`idle`), calls `bootstrapSession()`.
 * - Redirects to `/auth/login` when status settles to `unauthenticated`.
 * - After authentication, detects wrong-portal access and redirects to
 *   the correct persona portal.
 */
export function useRequireAuth(): UseRequireAuthResult {
  const router = useRouter();
  const pathname = usePathname();
  const state = authStore();

  useEffect(() => {
    devLog("auth", "useRequireAuth status =", state.status);

    if (state.status === "idle") {
      authStore.getState().bootstrapSession();
      return;
    }

    if (state.status === "unauthenticated") {
      devLog("auth", "unauthenticated, redirecting to login");
      const signInUrl = getSignInUrl();
      if (signInUrl.startsWith("http")) {
        // Subdomain portal — full URL redirect
        window.location.href = signInUrl;
      } else {
        router.replace(`${signInUrl}?next=${encodeURIComponent(pathname || "/app")}`);
      }
      return;
    }

    // ── Wrong-portal guard ─────────────────────────────────────────────
    if (state.status === "authenticated" && state.user && typeof window !== "undefined") {
      const portalUrl = getPortalUrlForRole(state.user.role);

      // Fail closed: if role cannot be mapped, log out.
      if (!portalUrl) {
        devLog("auth", "unknown role, failing closed", state.user.role);
        authStore.getState().logout("unauthorized");
        return;
      }

      // If hostname implies a specific persona, verify it matches.
      const hostnameContext = resolvePersonaFromHostname(window.location.hostname);
      if (hostnameContext && hostnameContext !== "SIGNUP" && hostnameContext !== "PORTAL_SELECTOR") {
        // Current hostname is a persona portal — check if user belongs here.
        const correctOrigin = portalUrl.replace(/\/app$/, "");
        if (!window.location.origin.startsWith(correctOrigin)) {
          devLog("auth", "wrong portal, redirecting to", portalUrl);
          window.location.href = portalUrl;
          return;
        }
      }
    }
  }, [state.status, state.user, pathname, router]);

  return {
    user: state.user,
    status: state.status,
    isLoading: state.status === "idle" || state.status === "initializing",
  };
}
