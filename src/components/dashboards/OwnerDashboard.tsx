"use client";

import { useState, useEffect } from "react";
import { Building2, DoorOpen, Users, Plus } from "lucide-react";
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

interface Property {
  id: string;
  name: string;
  numberOfUnits: number;
  _count?: { units: number };
}

export function OwnerDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, onboardingData, propsData] = await Promise.all([
          apiRequest<Summary>({ path: "api/properties/summary" }).catch(() => ({ totalProperties: 0, totalUnits: 0, totalTenants: 0 })),
          apiRequest<OnboardingProgress>({ path: "api/onboarding/progress" }).catch(() => null),
          apiRequest<Property[]>({ path: "api/properties" }).catch(() => []),
        ]);
        setSummary(summaryData);
        setOnboarding(onboardingData);
        setProperties(propsData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section aria-labelledby="owner-heading" className="space-y-6">
      <PageHeader
        title="Owner dashboard"
        description="Track income, performance, and expenses for your properties."
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Properties" value={summary?.totalProperties ?? 0} icon={<Building2 size={20} />} />
          <StatCard label="Units" value={summary?.totalUnits ?? 0} icon={<DoorOpen size={20} />} />
          <StatCard label="Tenants" value={summary?.totalTenants ?? 0} icon={<Users size={20} />} />
        </div>
      )}

      {/* Properties summary */}
      {properties.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-100">Properties summary</h2>
          </div>
          <ul className="divide-y divide-slate-800/50 text-sm">
            {properties.map((p) => (
              <li key={p.id}>
                <Link href={`/app/properties/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-900/50">
                  <div>
                    <span className="text-slate-200">{p.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{p._count?.units ?? 0} / {p.numberOfUnits} units</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

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
