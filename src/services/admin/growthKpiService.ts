/**
 * Growth KPI Service — lightweight web-side aggregation.
 *
 * Computes platform-level growth metrics from existing owner-scoped endpoints.
 * No backend changes required — uses fetchLeases, fetchOwnerPayments, and
 * fetchPropertiesWithUnitCounts which are already available.
 */

import { fetchLeases } from "@/services/leases/leaseService";
import { fetchOwnerPayments } from "@/services/payments/ownerPaymentAdapter";
import { fetchPropertiesWithUnitCounts } from "@/services/properties/propertyService";

export interface GrowthKpis {
  totalLandlords: number;
  totalUnits: number;
  activeLeases: number;
  paymentVolumeCents: number;
  mrrCents: number; // approximate MRR based on occupied-unit rent
}

export async function fetchGrowthKpis(): Promise<GrowthKpis> {
  const [propertiesResult, leasesResult, paymentsResult] = await Promise.all([
    fetchPropertiesWithUnitCounts(1, 200),
    fetchLeases(1, 200, { status: "ACTIVE" }),
    fetchOwnerPayments(1, 500),
  ]);

  // Total units across all properties
  const totalUnits = Object.values(propertiesResult.unitCounts).reduce(
    (sum, c) => sum + c.total,
    0,
  );

  // Active leases count
  const activeLeases = leasesResult.meta.total;

  // Payment volume (sum of SUCCEEDED payment amounts)
  const paymentVolumeCents = paymentsResult.data
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0);

  // Approximate MRR = sum of rent_amount for occupied units
  const mrrCents = Object.values(propertiesResult.unitCounts).reduce(
    (sum, c) => sum,
    0,
  );
  // We don't have per-unit rent in the unit counts — derive from occupied units.
  // For now, use total payment volume / months of data as approximation,
  // or fall back to a simpler heuristic: avg payment × active leases.
  // Better approach: compute from the actual unit rent amounts.
  // Since fetchPropertiesWithUnitCounts doesn't return rent, we'll compute
  // MRR from the payment data: succeeded payments this month.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthPayments = paymentsResult.data
    .filter((p) => p.status === "SUCCEEDED" && p.created_at >= monthStart);
  const computedMrr = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalLandlords: 1, // single-org MVP
    totalUnits,
    activeLeases,
    paymentVolumeCents,
    mrrCents: computedMrr,
  };
}
