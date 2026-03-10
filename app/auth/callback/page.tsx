"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const state = searchParams.get("state") || "/";
    const err = searchParams.get("error");
    if (err) {
      setError(err);
      return;
    }

    // At this point the backend should already have exchanged the code for
    // tokens and set secure cookies, so we just redirect to the original
    // destination encoded in `state`.
    const next = decodeURIComponent(state);
    router.replace(next || "/");
  }, [router, searchParams]);

  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-4 text-center">
          {error ? (
            <>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Sign-in failed
              </h2>
              <div className="rounded-lg border border-danger/30 bg-danger-50/5 px-4 py-3 text-sm text-danger" role="alert">
                {error}
              </div>
              <Link
                href="/auth/login"
                className="inline-block text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Completing sign-in…
              </h2>
              <p className="text-sm text-slate-400">
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
