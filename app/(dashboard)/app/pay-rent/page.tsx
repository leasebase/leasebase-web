"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  createPaymentIntent,
  fetchTenantCharges,
  fetchTenantPayments,
  type TenantChargeRow,
  type PaymentIntentResult,
} from "@/services/tenant/adapters/paymentAdapter";
import { RentPaymentForm } from "@/components/payments/RentPaymentForm";
import type { LeaseRow, PaymentRow } from "@/services/tenant/types";

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

type PageState = "loading" | "no-lease" | "summary" | "paying" | "success";

/**
 * Pay Rent — embedded payment flow (Phase 1).
 * Tenant stays inside LeaseBase for the entire payment experience.
 */
export default function Page() {
  const router = useRouter();
  const [lease, setLease] = useState<LeaseRow | null>(null);
  const [currentCharge, setCurrentCharge] = useState<TenantChargeRow | null>(null);
  const [processingPayment, setProcessingPayment] = useState<PaymentRow | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [paymentUnavailable, setPaymentUnavailable] = useState(false);

  // PaymentIntent state for embedded form
  const [intentData, setIntentData] = useState<PaymentIntentResult | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profileResult = await fetchTenantProfile();
        if (cancelled) return;
        if (profileResult.data?.lease_id) {
          const [leaseResult, chargesResult, paymentsResult] = await Promise.all([
            fetchTenantLease(profileResult.data.lease_id),
            fetchTenantCharges(),
            fetchTenantPayments(),
          ]);
          if (cancelled) return;
          setLease(leaseResult.data);

          const unpaid = chargesResult.data.find(
            (c) => c.status === "PENDING" || c.status === "OVERDUE",
          );
          setCurrentCharge(unpaid ?? null);

          const processing = paymentsResult.data.find((p) => p.status === "PROCESSING");
          setProcessingPayment(processing ?? null);

          setPageState(leaseResult.data ? "summary" : "no-lease");
        } else {
          setPageState("no-lease");
        }
      } catch {
        if (!cancelled) setPageState("no-lease");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handlePayRent = useCallback(async () => {
    setIsCreatingIntent(true);
    setError(null);
    try {
      const result = await createPaymentIntent();
      if (result.intentData) {
        setIntentData(result.intentData);
        setPageState("paying");
      } else {
        setError(result.error || "Failed to start payment");
        if (result.errorCode === "NO_PAYMENT_ACCOUNT" || result.errorCode === "NO_RENT_CONFIGURED") {
          setPaymentUnavailable(true);
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsCreatingIntent(false);
    }
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setPageState("success");
  }, []);

  const handlePaymentError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const chargeAmount = currentCharge?.amount ?? 0;
  const amountFormatted = formatCents(chargeAmount);
  const chargeIsPaid = currentCharge?.status === "PAID";
  const hasProcessing = !!processingPayment;

  return (
    <>
      <PageHeader
        title="Pay Rent"
        description="Make a rent payment securely."
      />

      <div className="mt-6 max-w-lg">
        {pageState === "loading" ? (
          <Card>
            <CardBody>
              <Skeleton variant="text" className="h-6 w-32" />
              <Skeleton variant="text" className="mt-3 h-10 w-48" />
              <Skeleton variant="text" className="mt-4 h-10 w-full" />
            </CardBody>
          </Card>

        ) : pageState === "no-lease" || !lease ? (
          <EmptyState
            icon={<Banknote size={48} strokeWidth={1.5} />}
            title="No active lease found"
            description="You need an active lease before you can make a payment. Contact your property owner if you believe this is an error."
          />

        ) : pageState === "success" ? (
          <Card>
            <CardBody>
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle size={44} className="text-emerald-500 mb-3" />
                <p className="text-lg font-semibold text-slate-900">Payment submitted</p>
                <p className="mt-1.5 text-sm text-slate-500">
                  Your rent payment of {amountFormatted} has been submitted successfully.
                  You&apos;ll receive a receipt once the payment is confirmed.
                </p>
                <Button
                  variant="primary"
                  className="mt-5"
                  onClick={() => router.push("/app/payment-history")}
                >
                  View payment history
                </Button>
              </div>
            </CardBody>
          </Card>

        ) : pageState === "paying" && intentData ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Complete Payment</h2>
            </CardHeader>
            <CardBody>
              <dl className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Amount</dt>
                  <dd className="text-lg font-bold text-slate-900">{amountFormatted}</dd>
                </div>
                {currentCharge?.billing_period && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Period</dt>
                    <dd className="text-slate-900">
                      {(() => {
                        const raw = currentCharge.billing_period;
                        const dateOnly = raw.length > 10 ? raw.slice(0, 10) : raw;
                        const d = new Date(dateOnly + "T00:00:00");
                        return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                      })()}
                    </dd>
                  </div>
                )}
              </dl>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <RentPaymentForm
                clientSecret={intentData.clientSecret}
                publishableKey={intentData.publishableKey}
                amount={amountFormatted}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />

              <button
                type="button"
                className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => { setPageState("summary"); setIntentData(null); setError(null); }}
              >
                Cancel
              </button>
            </CardBody>
          </Card>

        ) : (
          /* \u2500\u2500 Summary state (default) \u2500\u2500 */
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Rent Payment</h2>
            </CardHeader>
            <CardBody>
              {hasProcessing && (
                <div className="mb-4 flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <Clock size={16} className="mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Payment is being processed</p>
                    <p className="mt-0.5 text-xs text-amber-600">
                      Your bank transfer is in progress. This typically takes 3\u20135 business days.
                    </p>
                  </div>
                </div>
              )}

              {chargeIsPaid && !hasProcessing && (
                <div className="mb-4 flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <CheckCircle size={16} className="mt-0.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Rent is paid</p>
                    <p className="mt-0.5 text-xs text-emerald-600">
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
                        const dateOnly = raw.length > 10 ? raw.slice(0, 10) : raw;
                        const d = new Date(dateOnly + "T00:00:00");
                        return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
                    {new Date(lease.start_date).toLocaleDateString()} \u2013 {new Date(lease.end_date).toLocaleDateString()}
                  </dd>
                </div>
              </dl>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                className="mt-6 w-full"
                onClick={handlePayRent}
                loading={isCreatingIntent}
                disabled={lease.status !== "ACTIVE" || chargeIsPaid || hasProcessing || paymentUnavailable}
                icon={<Banknote size={16} />}
              >
                {isCreatingIntent ? "Setting up payment\u2026" :
                 chargeIsPaid ? "Paid" :
                 hasProcessing ? "Processing\u2026" :
                 paymentUnavailable ? "Payments unavailable" :
                 `Pay ${amountFormatted}`}
              </Button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Payment is processed securely. You won&apos;t leave this page.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
