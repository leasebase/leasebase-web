"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authStore } from "@/lib/auth/store";
import { devLog } from "@/lib/debug";

type LoginPageClientProps = {
  next?: string;
  registered?: string;
  registrationMessage?: string;
};

export default function LoginPageClient({
  next = "/app",
  registered,
  registrationMessage,
}: LoginPageClientProps) {
  const router = useRouter();
  const { user, status } = authStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const [devRole, setDevRole] = useState("ORG_ADMIN");
  const [devOrgId, setDevOrgId] = useState("dev-org-1");
  const [hydrated, setHydrated] = useState(false);

  const devBypassEnabled =
    process.env.NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH === "true" ||
    process.env.NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH === "1";

  // Rehydrate the persisted auth store *after* React hydration completes.
  // The store uses skipHydration: true so the first client render matches
  // the server render (both see default/idle state).  Calling rehydrate()
  // here merges localStorage data back into the store without causing a
  // hydration mismatch (React #418 / #423).
  useEffect(() => {
    devLog("login", "rehydrating auth store");
    authStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  // If already authenticated, skip login and go to the dashboard.
  useEffect(() => {
    if (!hydrated) return;
    devLog("login", "auth status =", status, "user =", user?.email ?? "(none)");
    if (status === "idle") {
      authStore.getState().initializeFromStorage();
    }
    if (status === "authenticated" && user) {
      devLog("login", "already authenticated, redirecting to", next);
      router.replace(next);
    }
  }, [hydrated, status, user, next, router]);

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

  const handleDevBypass = async () => {
    setLoading(true);
    setError(null);
    try {
      const emailToUse = devEmail || email || "pm@example.com";
      await authStore.getState().loginDevBypass({
        email: emailToUse,
        role: devRole,
        orgId: devOrgId || "dev-org-1",
      });
      router.replace(next || "/app");
    } catch (err: any) {
      setError(err.message || "Dev bypass login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 mb-2">
          <span className="h-10 w-10 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-lg">LB</span>
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
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              required
            />
          </div>
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {devBypassEnabled && (
          <div className="mt-6 border-t border-dashed border-slate-800 pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
              Developer bypass (local/dev only)
            </p>
            <p className="text-xs text-slate-400">
              When the backend is running with DEV_AUTH_BYPASS enabled, you can
              sign in without Cognito by choosing a role. Do not enable this in
              production.
            </p>
            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-200" htmlFor="dev-email">
                  Dev email
                </label>
                <input
                  id="dev-email"
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                  placeholder="pm@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-200" htmlFor="dev-org">
                  Dev org ID
                </label>
                <input
                  id="dev-org"
                  type="text"
                  value={devOrgId}
                  onChange={(e) => setDevOrgId(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                  placeholder="dev-org-1"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-200" htmlFor="dev-role">
                  Role
                </label>
                <select
                  id="dev-role"
                  value={devRole}
                  onChange={(e) => setDevRole(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                >
                  <option value="ORG_ADMIN">Property Manager (ORG_ADMIN)</option>
                  <option value="PM_STAFF">Property Manager Staff (PM_STAFF)</option>
                  <option value="OWNER">Owner</option>
                  <option value="TENANT">Tenant</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDevBypass}
              disabled={loading}
              className="w-full rounded-md border border-emerald-600 bg-slate-900 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Signing in (dev bypass)…" : "Sign in with dev bypass"}
            </button>
          </div>
        )}

        <div className="border-t border-slate-800 pt-4">
          <p className="text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-emerald-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
