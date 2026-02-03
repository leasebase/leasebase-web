"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "/";

    if (!code) {
      setError("Missing authorization code from Cognito.");
      return;
    }

    // In a full implementation, this is where you would call a backend
    // endpoint to exchange the code for tokens and establish a session.
    // For now we just redirect the user back to the requested page and
    // assume the backend handled session cookies.

    router.replace(decodeURIComponent(state));
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
