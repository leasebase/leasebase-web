"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAppConfig } from "@/lib/config";
import type { UserRole } from "@/lib/config";

const DEV_ENABLED =
  typeof process !== "undefined" &&
  (process.env.NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH === "true" ||
    process.env.DEV_ONLY_MOCK_AUTH === "true");

const ROLES: UserRole[] = ["ORG_ADMIN", "PM_STAFF", "OWNER", "TENANT"];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<UserRole>("ORG_ADMIN");
  const [orgId, setOrgId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next") || "/";
  const config = getAppConfig();

  const loginWithCognito = () => {
    if (!config.cognito.domain || !config.cognito.clientId) {
      setError("Cognito is not configured. Set NEXT_PUBLIC_COGNITO_* env vars.");
      return;
    }
    const redirectUri = `${window.location.origin}/auth/callback`;
    const url = new URL(`https://${config.cognito.domain}/oauth2/authorize`);
    url.searchParams.set("client_id", config.cognito.clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", encodeURIComponent(next));
    window.location.href = url.toString();
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, orgId, email })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Dev login failed");
      }
      if (role === "TENANT") {
        router.push("/tenant");
      } else {
        router.push("/pm");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold">Sign in to Leasebase</h1>
      <p className="text-sm text-slate-300">
        Use your organization credentials via Cognito. In development, you can
        optionally use mock auth if enabled.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={loginWithCognito}
        className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
      >
        Continue with Cognito
      </button>

      {DEV_ENABLED && (
        <div className="mt-8 border-t border-slate-800 pt-6">
          <h2 className="text-sm font-semibold mb-2">Dev-only mock login</h2>
          <p className="text-xs text-slate-400 mb-3">
            Enabled because DEV_ONLY_MOCK_AUTH is true. Do not use in
            production.
          </p>
          <form className="space-y-3" onSubmit={handleDevLogin}>
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Organization ID</label>
              <input
                value={orgId}
                onChange={e => setOrgId(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                required
              />
            </div>
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">User email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-slate-600"
            >
              Sign in (dev mock)
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
