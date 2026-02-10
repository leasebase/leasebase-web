"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Generic dashboard view with a simple auth guard based only on the
// Cognito token expiry returned by the backend.

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const accessToken = window.localStorage.getItem("lb_access_token");
    const idToken = window.localStorage.getItem("lb_id_token");
    const expiresRaw = window.localStorage.getItem("lb_token_expires_at");
    const expiresAt = expiresRaw ? parseInt(expiresRaw, 10) : NaN;
    const now = Date.now();

    const hasValidTokens =
      !!accessToken &&
      !!idToken &&
      Number.isFinite(expiresAt) &&
      expiresAt > now;

    if (!hasValidTokens) {
      // Clear any stale tokens and send the user back to login.
      window.localStorage.removeItem("lb_access_token");
      window.localStorage.removeItem("lb_id_token");
      window.localStorage.removeItem("lb_refresh_token");
      window.localStorage.removeItem("lb_token_expires_at");
      router.replace("/auth/login?next=%2Fdashboard");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="max-w-3xl mx-auto py-16">
        <p className="text-slate-300">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-50">Leasebase dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          This is a generic dashboard. In a later iteration we&apos;ll tailor this view
          based on your role (tenant, property manager, or owner).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Your leases</h2>
          <p className="mt-1 text-xs text-slate-400">
            Quick entry point for lease details once role-aware dashboards are in place.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Payments</h2>
          <p className="mt-1 text-xs text-slate-400">
            We&apos;ll surface upcoming and recent payments here.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Maintenance</h2>
          <p className="mt-1 text-xs text-slate-400">
            Track open work orders and recent activity from one place.
          </p>
        </div>
      </div>
    </div>
  );
}
