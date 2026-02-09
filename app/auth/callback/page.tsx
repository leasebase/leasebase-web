"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="max-w-md mx-auto space-y-2">
      <h1 className="text-2xl font-semibold">Completing sign-in…</h1>
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <p className="text-sm text-slate-300">
          Please wait while we complete your sign-in and redirect you.
        </p>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto"><p>Loading...</p></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
