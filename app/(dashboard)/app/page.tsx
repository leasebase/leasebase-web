"use client";

import { authStore } from "@/lib/auth/store";
import { PMDashboard } from "@/components/dashboards/PMDashboard";
import { OwnerDashboard } from "@/components/dashboards/OwnerDashboard";
import { TenantDashboard } from "@/components/dashboards/TenantDashboard";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";

export default function AppDashboardPage() {
  const { user } = authStore();

  // No user yet — bootstrap or redirect is in progress.
  // Return nothing and let the layout auth guard handle navigation.
  if (!user) return null;

  const persona = user.persona;

  if (persona === "propertyManager") return <PMDashboard />;
  if (persona === "owner") return <OwnerDashboard />;
  if (persona === "tenant") return <TenantDashboard />;

  // Fail closed: authenticated user whose role cannot be mapped.
  // The wrong-portal guard in useRequireAuth will redirect or logout
  // before this is reached in normal operation.
  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Unable to determine your account type
          </h2>
          <p className="text-sm text-slate-500">
            Your account role could not be resolved. Please contact support or
            try signing in again.
          </p>
          <button
            onClick={() => authStore.getState().logout("unauthorized")}
            className="text-sm font-medium text-brand-600 hover:text-brand-500"
          >
            Sign out
          </button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
