"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Banknote } from "lucide-react";
import { fetchTenantProfile } from "@/services/tenant/adapters/profileAdapter";
import { fetchTenantLease } from "@/services/tenant/adapters/leaseAdapter";
import { createCheckoutSession } from "@/services/tenant/adapters/paymentAdapter";
import type { TenantProfileRow, LeaseRow } from "@/services/tenant/types";

/**
 * Pay Rent — LIVE (Phase 2).
 *
 * Fetches tenant's lease to show rent amount, then creates a Stripe
 * Checkout Session via POST /api/payments/checkout on click.
 */
export default function Page() {
  const [profile, setProfile] = useState<TenantProfileRow | null>(null);
  const [lease, setLease] = useState<LeaseRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profileResult = await fetchTenantProfile();
        if (cancelled) return;
        setProfile(profileResult.data);
        if (profileResult.data?.lease_id) {
          const leaseResult = await fetchTenantLease(profileResult.data.lease_id);
          if (!cancelled) setLease(leaseResult.data);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handlePayRent() {
    setIsCheckingOut(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const result = await createCheckoutSession(
        `${origin}/app/payment-history?status=success`,
        `${origin}/app/pay-rent?status=canceled`,
      );
      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        setError(result.error || "Failed to create checkout session");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsCheckingOut(false);
    }
  }

  const rentFormatted = lease
    ? `$${(lease.rent_amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : null;

  return (
    <>
      <PageHeader
        title="Pay Rent"
        description="Make a rent payment — select payment method and amount."
      />

      <div className="mt-6 max-w-lg">
        {isLoading ? (
          <Card>
            <CardBody>
              <Skeleton variant="text" className="h-6 w-32" />
              <Skeleton variant="text" className="mt-3 h-10 w-48" />
              <Skeleton variant="text" className="mt-4 h-10 w-full" />
            </CardBody>
          </Card>
        ) : !lease ? (
          <EmptyState
            icon={<Banknote size={48} strokeWidth={1.5} />}
            title="No active lease found"
            description="You need an active lease before you can make a payment. Contact your property manager if you believe this is an error."
          />
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Rent Payment</h2>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Amount Due</dt>
                  <dd className="text-2xl font-bold text-slate-900">{rentFormatted}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Lease Period</dt>
                  <dd className="text-slate-900">
                    {new Date(lease.start_date).toLocaleDateString()} – {new Date(lease.end_date).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Status</dt>
                  <dd>
                    <Badge variant={lease.status === "ACTIVE" ? "success" : "neutral"}>
                      {lease.status}
                    </Badge>
                  </dd>
                </div>
              </dl>

              {error && (
                <div className="mt-4 rounded-md border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                className="mt-6 w-full"
                onClick={handlePayRent}
                loading={isCheckingOut}
                disabled={lease.status !== "ACTIVE"}
                icon={<Banknote size={16} />}
              >
                {isCheckingOut ? "Redirecting to checkout…" : `Pay ${rentFormatted}`}
              </Button>

              <p className="mt-3 text-center text-xs text-slate-500">
                You will be redirected to Stripe to complete your payment securely.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
