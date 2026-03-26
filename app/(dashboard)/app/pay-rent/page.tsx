"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  AlertCircle,
  Plus,
  Banknote,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchTenantProfile } from "@/services/tenant/adapters/profileAdapter";
import { fetchTenantLease } from "@/services/tenant/adapters/leaseAdapter";
import {
  createPaymentIntent,
  fetchTenantCharges,
  fetchTenantPayments,
  type TenantChargeRow,
} from "@/services/tenant/adapters/paymentAdapter";
import {
  fetchPaymentMethods,
} from "@/services/tenant/adapters/paymentMethodAdapter";
import { AddPaymentMethodModal } from "@/components/payments/AddPaymentMethodModal";
import type { TenantProfileRow, LeaseRow, PaymentRow, PaymentMethodRow } from "@/services/tenant/types";

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

const BRAND_DISPLAY: Record<string, string> = {
  visa: "Visa", mastercard: "Mastercard", amex: "American Express",
  discover: "Discover", jcb: "JCB", unionpay: "UnionPay",
};

function brandLabel(brand: string | null): string {
  if (!brand) return "Card";
  return BRAND_DISPLAY[brand.toLowerCase()] ?? brand;
}

const STATUS_VARIANTS: Record<string, string> = {
  SUCCEEDED: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELED: "bg-slate-100 text-slate-600",
};

/** Filter out stale pending payments (> 24h old). */
const STALE_MS = 24 * 60 * 60 * 1000;
function isActive(p: PaymentRow): boolean {
  if (p.status !== "PENDING") return true;
  return Date.now() - new Date(p.created_at).getTime() < STALE_MS;
}

/**
 * Rent & Payments — consolidated tenant payments page.
 * Matches the UIUX TenantPayments design while preserving all production behavior.
 */
export default function Page() {
  const [profile, setProfile] = useState<TenantProfileRow | null>(null);
  const [lease, setLease] = useState<LeaseRow | null>(null);
  const [currentCharge, setCurrentCharge] = useState<TenantChargeRow | null>(null);
  const [processingPayment, setProcessingPayment] = useState<PaymentRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addMethodOpen, setAddMethodOpen] = useState(false);

  const load = useCallback(async () => {
    let cancelled = false;
    try {
      const profileResult = await fetchTenantProfile();
      if (cancelled) return;
      setProfile(profileResult.data);
      if (profileResult.data?.lease_id) {
        const [leaseResult, chargesResult, paymentsResult, methodsResult] = await Promise.all([
          fetchTenantLease(profileResult.data.lease_id),
          fetchTenantCharges(),
          fetchTenantPayments(),
          fetchPaymentMethods(),
        ]);
        if (cancelled) return;
        setLease(leaseResult.data);
        const unpaid = chargesResult.data.find(
          (c) => c.status === "PENDING" || c.status === "OVERDUE",
        );
        setCurrentCharge(unpaid ?? null);
        const processing = paymentsResult.data.find((p) => p.status === "PROCESSING");
        setProcessingPayment(processing ?? null);
        setPayments(paymentsResult.data.filter(isActive));
        setMethods(methodsResult.data.filter((m) => m.status === "ACTIVE"));
      }
    } finally {
      if (!cancelled) setIsLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handlePayRent() {
    setIsCheckingOut(true);
    setError(null);
    try {
      const result = await createPaymentIntent();
      if (result.intentData?.clientSecret) {
        setError("Payment is being processed. Please check your payment history shortly.");
      } else {
        setError(result.error || "Failed to create payment");
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
  const chargeIsOverdue = currentCharge?.status === "OVERDUE";
  const hasProcessing = !!processingPayment;
  const isPaid = chargeIsPaid || false;
  const isOverdue = chargeIsOverdue || false;
  const canPay = lease?.status === "ACTIVE" && !chargeIsPaid && !hasProcessing;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton variant="text" className="h-7 w-48" /><Skeleton variant="text" className="mt-2 h-4 w-72" /></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4"><Skeleton variant="rectangular" className="w-12 h-12 rounded-xl" /><div><Skeleton variant="text" className="h-5 w-40" /><Skeleton variant="text" className="mt-1 h-4 w-56" /></div></div>
          <Skeleton variant="text" className="h-12 w-40" />
          <Skeleton variant="rectangular" className="mt-6 h-12 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5"><Skeleton variant="text" className="h-5 w-36" /><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">{[0,1].map(i=><Skeleton key={i} variant="rectangular" className="h-24 rounded-xl" />)}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5"><Skeleton variant="text" className="h-5 w-36" />{[0,1,2].map(i=><Skeleton key={i} variant="rectangular" className="mt-3 h-20 rounded-xl" />)}</div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[26px] font-semibold text-slate-900 mb-1">Rent & Payments</h1>
          <p className="text-[14px] text-slate-600">Manage your rent payments and view payment history</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Banknote size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900">No active lease found</h2>
          <p className="mt-2 text-sm text-slate-600">
            You need an active lease before you can make a payment. Contact your property owner if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const dueDateFormatted = currentCharge?.due_date
    ? new Date(currentCharge.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-[26px] font-semibold text-slate-900 mb-1">Rent & Payments</h1>
        <p className="text-[14px] text-slate-600">Manage your rent payments and view payment history</p>
      </div>

      {/* ── Current Payment Status — Large Card ── */}
      <div className={`rounded-2xl border shadow-lg overflow-hidden ${
        isOverdue
          ? "bg-gradient-to-br from-red-50 via-white to-red-50/30 border-red-200"
          : isPaid
          ? "bg-gradient-to-br from-green-50 via-white to-green-50/30 border-green-200"
          : "bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border-amber-200"
      }`}>
        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  isOverdue
                    ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30"
                    : isPaid
                    ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30"
                    : "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-600/30"
                }`}>
                  <CreditCard className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-slate-900">
                    {isPaid ? "Next Rent Payment" : "Current Rent Payment"}
                  </h2>
                  <p className="text-[13px] text-slate-600">Due {dueDateFormatted}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-[44px] font-bold text-slate-900">{amountFormatted}</span>
                <span className={`px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wide shadow-sm ${
                  isOverdue
                    ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                    : isPaid
                    ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                    : hasProcessing
                    ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                    : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                }`}>
                  {isOverdue ? "Overdue" : isPaid ? "Paid" : hasProcessing ? "Processing" : "Due"}
                </span>
              </div>

              {hasProcessing && (
                <div className="flex items-center gap-2 text-[13px] text-blue-700 font-medium">
                  <Clock className="w-4 h-4" />
                  Your bank transfer is in progress (3–5 business days)
                </div>
              )}
              {isOverdue && (
                <div className="flex items-center gap-2 text-[13px] text-red-700 font-medium">
                  <Clock className="w-4 h-4" />
                  Payment is overdue
                </div>
              )}
              {isPaid && (
                <div className="flex items-center gap-2 text-[13px] text-green-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Rent is paid — no action needed
                </div>
              )}
            </div>

            <div className="lg:w-72 flex flex-col gap-3">
              {canPay ? (
                <>
                  <button
                    onClick={handlePayRent}
                    disabled={isCheckingOut}
                    className="flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-green-600 to-green-700 text-white text-[14px] font-semibold rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transition-all disabled:opacity-50"
                  >
                    <CreditCard className="w-5 h-5" strokeWidth={2.5} />
                    {isCheckingOut ? "Processing…" : "Pay Now"}
                  </button>
                  <Link
                    href="/app/payment-methods"
                    className="flex items-center justify-center gap-2 h-10 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    Manage Payment Methods
                  </Link>
                </>
              ) : isPaid ? (
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <p className="text-[12px] text-slate-600 mb-1">Next payment due</p>
                  <p className="text-[14px] font-semibold text-slate-900">{dueDateFormatted}</p>
                </div>
              ) : null}
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Methods ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Payment Methods</h3>
            <button
              onClick={() => setAddMethodOpen(true)}
              className="text-[12px] text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Method
            </button>
          </div>
        </div>
        <div className="p-5">
          {methods.length === 0 ? (
            <div className="text-center py-6">
              <CreditCard size={40} strokeWidth={1.5} className="mx-auto mb-3 text-slate-400" />
              <p className="text-[13px] text-slate-600 mb-3">No saved payment methods</p>
              <button
                onClick={() => setAddMethodOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Payment Method
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {methods.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl relative ${
                    m.is_default
                      ? "bg-gradient-to-br from-slate-50 to-white border-2 border-green-200"
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  {m.is_default && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">
                        Default
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      m.is_default ? "bg-blue-50" : "bg-violet-50"
                    }`}>
                      <CreditCard className={`w-5 h-5 ${m.is_default ? "text-blue-600" : "text-violet-600"}`} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900 mb-0.5">
                        {brandLabel(m.brand)} •••• {m.last4 ?? "????"}
                      </p>
                      <p className="text-[12px] text-slate-600">
                        {m.exp_month && m.exp_year
                          ? `Expires ${String(m.exp_month).padStart(2, "0")}/${m.exp_year}`
                          : m.type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment History ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900">Payment History</h3>
              <p className="text-[12px] text-slate-600 mt-0.5">Your rent payment records</p>
            </div>
            {payments.length > 0 && (
              <Link
                href="/app/payment-history"
                className="flex items-center gap-2 h-9 px-3 bg-white text-slate-700 text-[12px] font-semibold rounded-lg border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
        <div className="p-5">
          {payments.length === 0 ? (
            <div className="text-center py-6">
              <Clock size={40} strokeWidth={1.5} className="mx-auto mb-3 text-slate-400" />
              <p className="text-[14px] text-slate-600 mb-1">No payments yet</p>
              <p className="text-[12px] text-slate-500">Your payment history will appear here once you make your first rent payment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 6).map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                        payment.status === "SUCCEEDED" ? "bg-green-50" :
                        payment.status === "FAILED" ? "bg-red-50" :
                        "bg-amber-50"
                      }`}>
                        {payment.status === "SUCCEEDED"
                          ? <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                          : payment.status === "FAILED"
                          ? <AlertCircle className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                          : <Clock className="w-5 h-5 text-amber-600" strokeWidth={2.5} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[14px] font-semibold text-slate-900">Rent Payment</p>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                            STATUS_VARIANTS[payment.status] ?? "bg-slate-100 text-slate-600"
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(payment.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </span>
                          {payment.method && <><span>•</span><span>{payment.method}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[16px] font-bold text-slate-900 mb-1">
                        {formatCents(payment.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {payments.length > 6 && (
                <Link
                  href="/app/payment-history"
                  className="flex items-center justify-center gap-2 w-full h-10 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  View All Payments <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Help Card ── */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-2xl border border-blue-200 p-6">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Need help with payments?</h3>
        <p className="text-[13px] text-slate-600 mb-4">
          Contact your property manager for payment assistance, questions about your account, or to set up automatic payments.
        </p>
        <Link
          href="/app/maintenance/new"
          className="inline-flex items-center gap-2 h-10 px-4 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all"
        >
          Contact Support
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        open={addMethodOpen}
        onClose={() => setAddMethodOpen(false)}
        onSuccess={() => { setAddMethodOpen(false); load(); }}
      />
    </div>
  );
}
