"use client";

import { useState, useEffect } from "react";
import { Building2, DoorOpen, TrendingUp, Users, Plus } from "lucide-react";
import { StatCard, StatCardSkeleton } from "./StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { AddPropertyModal } from "@/components/properties/AddPropertyModal";
import { apiRequest } from "@/lib/api/client";
import Link from "next/link";

interface Summary {
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
}

interface OnboardingProgress {
  orgCreated: boolean;
  firstPropertyAdded: boolean;
  unitsConfigured: boolean;
  tenantsInvited: boolean;
  completedAt: string | null;
}

export function PMDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, onboardingData] = await Promise.all([
          apiRequest<Summary>({ path: "api/properties/summary" }).catch(() => ({ totalProperties: 0, totalUnits: 0, totalTenants: 0 })),
          apiRequest<OnboardingProgress>({ path: "api/onboarding/progress" }).catch(() => null),
        ]);
        setSummary(summaryData);
        setOnboarding(onboardingData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section aria-labelledby="pm-heading" className="space-y-6">
      <PageHeader
        title="Portfolio overview"
        description="See occupancy, leases, and maintenance across your portfolio."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setShowAddProperty(true)}>
            Add Property
          </Button>
        }
      />

      {/* Onboarding checklist for new users */}
      {onboarding && !onboarding.completedAt && (
        <OnboardingChecklist progress={onboarding} />
      )}

      {/* KPI grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Properties" value={summary?.totalProperties ?? 0} icon={<Building2 size={20} />} />
          <StatCard label="Units" value={summary?.totalUnits ?? 0} icon={<DoorOpen size={20} />} />
          <StatCard label="Tenants" value={summary?.totalTenants ?? 0} icon={<Users size={20} />} />
          <StatCard label="Occupancy" value="—" change="Coming soon" icon={<TrendingUp size={20} />} />
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/app/properties" className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-center transition-colors hover:border-slate-700">
          <Building2 size={20} className="mx-auto mb-1 text-brand-400" />
          <span className="text-sm text-slate-200">Manage Properties</span>
        </Link>
        <Link href="/app/units" className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-center transition-colors hover:border-slate-700">
          <DoorOpen size={20} className="mx-auto mb-1 text-blue-400" />
          <span className="text-sm text-slate-200">View Units</span>
        </Link>
        <Link href="/app/tenants" className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-center transition-colors hover:border-slate-700">
          <Users size={20} className="mx-auto mb-1 text-purple-400" />
          <span className="text-sm text-slate-200">Manage Tenants</span>
        </Link>
      </div>

      {showAddProperty && (
        <AddPropertyModal
          onClose={() => setShowAddProperty(false)}
          onCreated={() => {
            setShowAddProperty(false);
            window.location.href = "/app/properties";
          }}
        />
      )}
    </section>
  );
}
