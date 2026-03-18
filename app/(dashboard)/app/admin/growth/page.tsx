"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardSkeleton } from "@/components/dashboards/StatCard";
import { authStore } from "@/lib/auth/store";
import { fetchGrowthKpis, type GrowthKpis } from "@/services/admin/growthKpiService";
import { Users, Building2, FileText, DollarSign, TrendingUp } from "lucide-react";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function GrowthPage() {
  const { user } = authStore();
  const [kpis, setKpis] = useState<GrowthKpis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGrowthKpis()
      .then((data) => { if (!cancelled) setKpis(data); })
      .catch((e: any) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (user?.persona !== "owner") {
    return (
      <div className="text-sm text-slate-400">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Growth"
        description="Platform-level KPIs and growth metrics."
      />

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : kpis ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total Landlords"
            value={kpis.totalLandlords}
            icon={<Users size={20} />}
          />
          <StatCard
            label="Total Units"
            value={kpis.totalUnits}
            icon={<Building2 size={20} />}
          />
          <StatCard
            label="Active Leases"
            value={kpis.activeLeases}
            icon={<FileText size={20} />}
          />
          <StatCard
            label="Payment Volume"
            value={formatCurrency(kpis.paymentVolumeCents)}
            icon={<DollarSign size={20} />}
          />
          <StatCard
            label="MRR (approx)"
            value={formatCurrency(kpis.mrrCents)}
            change="Based on this month's payments"
            icon={<TrendingUp size={20} />}
          />
        </div>
      ) : null}
    </>
  );
}
