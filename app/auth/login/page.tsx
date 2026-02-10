"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authStore } from "@/lib/auth/store";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const [devRole, setDevRole] = useState("ORG_ADMIN");
  const [devOrgId, setDevOrgId] = useState("dev-org-1");

  const next = searchParams.get("next") || "/dashboard";
  const registered = searchParams.get("registered");
  const registrationMessage = searchParams.get("message");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authStore.getState().loginWithPassword(email, password);
      router.replace(next);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const startOidcLogin = () => {
    // Placeholder: Hosted UI / social login flows can be wired here later.
    setError("Social login is not configured for this environment.");
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sign in to Leasebase</h1>
        <p className="mt-1 text-sm text-slate-300">
          Use your email and password, or continue with a connected identity
          provider like Google.
        </p>
      </div>

      {registered && registrationMessage && (
        <p className="text-sm text-emerald-400">{decodeURIComponent(registrationMessage)}</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <p className="text-xs text-slate-400">
        Just created an account but don&apos;t see a verification screen?{" "}
        <button
          type="button"
          onClick={() => router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)}
          className="text-emerald-400 hover:underline"
        >
          Verify your email or resend the code
        </button>
        .
      </p>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </div>
        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="border-t border-slate-800 pt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Or continue with
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={startOidcLogin}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          >
            Social login (coming soon)
          </button>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-4">
        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-emerald-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto"><p>Loading...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
