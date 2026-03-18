"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { setTokens } from "@/lib/auth/tokens";
import { authStore } from "@/lib/auth/store";
import { getPortalUrlForRole } from "@/lib/hostname";
import { track } from "@/lib/analytics";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const state = searchParams.get("state") || "/";
    const err = searchParams.get("error");

    if (err) {
      setError(err);
      track("login_failed", { method: "google", reason: err });
      return;
    }

    // Check for OAuth tokens in query params (backend passes them after code exchange).
    const accessToken = searchParams.get("access_token");
    const idToken = searchParams.get("id_token");
    const expiresInRaw = searchParams.get("expires_in");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken) {
      // Store tokens, clear them from the URL immediately, then load user.
      const expiresIn = expiresInRaw ? Number(expiresInRaw) : 3600;
      setTokens({
        accessToken,
        idToken: idToken ?? undefined,
        refreshToken: refreshToken ?? undefined,
        expiresIn,
      });

      // Clear tokens from the visible URL for security.
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }

      // Load user profile, then redirect.
      authStore
        .getState()
        .loadMe()
        .then(() => {
          track("login_completed", { method: "google" });
          const user = authStore.getState().user;
          const portalUrl = user ? getPortalUrlForRole(user.role) : null;
          const next = decodeURIComponent(state);
          router.replace(portalUrl || next || "/");
        })
        .catch((loadErr: any) => {
          const reason = loadErr?.message || "Failed to load user profile";
          setError(reason);
          track("login_failed", { method: "google", reason });
        });
      return;
    }

    // No tokens — existing behavior: backend set cookies, just redirect.
    const next = decodeURIComponent(state);
    router.replace(next || "/");
  }, [router, searchParams]);

  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-4 text-center">
          {error ? (
            <>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Sign-in failed
              </h2>
              <div className="rounded-lg border border-danger/30 bg-danger-50/5 px-4 py-3 text-sm text-danger" role="alert">
                {error}
              </div>
              <Link
                href="/auth/login"
                className="inline-block text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Completing sign-in…
              </h2>
              <p className="text-sm text-slate-500">
                Please wait while we complete your sign-in and redirect you.
              </p>
            </>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthCard>
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          </AuthCard>
        </AuthShell>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
