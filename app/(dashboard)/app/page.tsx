"use client";

import { authStore } from "@/lib/auth/store";
import { PMDashboard } from "@/components/dashboards/PMDashboard";
import { OwnerDashboard } from "@/components/dashboards/OwnerDashboard";
import { TenantDashboard } from "@/components/dashboards/TenantDashboard";

export default function AppDashboardPage() {
  const { user } = authStore();
  const persona = user?.persona;

  if (persona === "propertyManager") return <PMDashboard />;
  if (persona === "owner") return <OwnerDashboard />;
  if (persona === "tenant") return <TenantDashboard />;

  // Fallback for unknown personas
  return <TenantDashboard />;
}
