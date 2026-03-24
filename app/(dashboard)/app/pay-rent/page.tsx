"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Banknote, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { fetchTenantProfile } from "@/services/tenant/adapters/profileAdapter";
import { fetchTenantLease } from "@/services/tenant/adapters/leaseAdapter";
import {
  createCheckoutSession,
  fetchTenantCharges,
  fetchTenantPayments,
  type TenantChargeRow,
} from "@/services/tenant/adapters/paymentAdapter";
import type { TenantProfileRow, LeaseRow, PaymentRow } from "@/services/tenant/types";

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * Pay Rent — shows current charge from payments-service, with ACH
 * processing awareness and Stripe Checkout redirect.
 */
export default function Page() {
  const [profile, setProfile] = useState<TenantProfileRow | null>(null);
  const [lease, setLease] = useState<LeaseRow | null>(null);
  const [currentCharge, setCurrentCharge] = useState<TenantChargeRow | null>(null);
  const [processingPayment, setProcessingPayment] = useState<PaymentRow | null>(null);
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
          const [leaseResult, chargesResult, paymentsResult] = await Promise.all([
            fetchTenantLease(profileResult.data.lease_id),
            fetchTenantCharges(),
            fetchTenantPayments(),
          ]);
          if (cancelled) return;
          setLease(leaseResult.data);

          // Find the most recent unpaid charge (PENDING or OVERDUE)
          const unpaid = chargesResult.data.find(
            (c) => c.status === "PENDING" || c.status === "OVERDUE",
          );
          setCurrentCharge(unpaid ?? null);

          // Check for any PROCESSING payment (ACH in flight)
          const processing = paymentsResult.data.find((p) => p.status === "PROCESSING");
          setProcessingPayment(processing ?? null);
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

  const chargeAmount = currentCharge?.amount ?? 0;
  const amountFormatted = formatCents(chargeAmount);
  const chargeIsPaid = currentCharge?.status === "PAID";
  const hasProcessing = !!processingPayment;

  return (
    <>
      <PageHeader
        title="Pay Rent"
        description="Make a rent payment securely via Stripe."
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
            description="You need an active lease before you can make a payment. Contact your property owner if you believe this is an error."
          />
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Rent Payment</h2>
            </CardHeader>
            <CardBody>
              {/* ACH Processing banner */}
              {hasProcessing && (
                <div className="mb-4 flex items-start gap-2.5 rounded-md border border-amber-800/40 bg-amber-950/20 px-3 py-2.5">
                  <Clock size={16} className="mt-0.5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-200">Payment is being processed</p>
                    <p className="mt-0.5 text-xs text-amber-400/80">
                      Your bank transfer is in progress. This typically takes 3–5 business days.
                    </p>
                  </div>
                </div>
              )}

              {/* Charge already paid banner */}
              {chargeIsPaid && !hasProcessing && (
                <div className="mb-4 flex items-start gap-2.5 rounded-md border border-emerald-800/40 bg-emerald-950/20 px-3 py-2.5">
                  <CheckCircle size={16} className="mt-0.5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-200">Rent is paid</p>
                    <p className="mt-0.5 text-xs text-emerald-400/80">
                      Your current rent charge has been paid. No action needed.
                    </p>
                  </div>
                </div>
              )}

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Amount Due</dt>
                  <dd className="text-2xl font-bold text-slate-900">{amountFormatted}</dd>
                </div>
                {currentCharge?.billing_period && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Billing Period</dt>
                    <dd className="text-slate-900">
                      {(() => {
                        const raw = currentCharge.billing_period;
                        // Normalize: strip any time/tz suffix so we always parse a plain date
                        const dateOnly = raw.length > 10 ? raw.slice(0, 10) : raw;
                        const d = new Date(dateOnly + "T00:00:00");
                        return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                      })()}
                    </dd>
                  </div>
                )}
                {currentCharge?.due_date && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Due Date</dt>
                    <dd className="text-slate-900">
                      {new Date(currentCharge.due_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-400">Charge Status</dt>
                  <dd>
                    {currentCharge ? (
                      <Badge
                        variant={
                          currentCharge.status === "PAID" ? "success" :
                          currentCharge.status === "OVERDUE" ? "danger" :
                          "neutral"
                        }
                      >
                        {currentCharge.status}
                      </Badge>
                    ) : (
                      <Badge variant="neutral">No charge</Badge>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Lease Period</dt>
                  <dd className="text-slate-900">
                    {new Date(lease.start_date).toLocaleDateString()} – {new Date(lease.end_date).toLocaleDateString()}
                  </dd>
                </div>
              </dl>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                className="mt-6 w-full"
                onClick={handlePayRent}
                loading={isCheckingOut}
                disabled={lease.status !== "ACTIVE" || chargeIsPaid || hasProcessing}
                icon={<Banknote size={16} />}
              >
                {isCheckingOut ? "Redirecting to checkout…" :
                 chargeIsPaid ? "Paid" :
                 hasProcessing ? "Processing…" :
                 `Pay ${amountFormatted}`}
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
