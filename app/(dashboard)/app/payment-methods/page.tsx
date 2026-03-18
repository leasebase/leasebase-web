"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CreditCard,
  Plus,
  Star,
  Trash2,
  Zap,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  fetchPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
} from "@/services/tenant/adapters/paymentMethodAdapter";
import {
  fetchAutopayStatus,
  updateAutopay,
} from "@/services/tenant/adapters/autopayAdapter";
import { AddPaymentMethodModal } from "@/components/payments/AddPaymentMethodModal";
import type { PaymentMethodRow, AutopayStatus } from "@/services/tenant/types";

const BRAND_DISPLAY: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
};

function brandLabel(brand: string | null): string {
  if (!brand) return "Card";
  return BRAND_DISPLAY[brand.toLowerCase()] ?? brand;
}

export default function Page() {
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [autopay, setAutopay] = useState<AutopayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // id of method being acted on
  const [autopayLoading, setAutopayLoading] = useState(false);

  const load = useCallback(async () => {
    const [methodsRes, autopayRes] = await Promise.all([
      fetchPaymentMethods(),
      fetchAutopayStatus(),
    ]);
    setMethods(methodsRes.data.filter((m) => m.status === "ACTIVE"));
    setAutopay(autopayRes.data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSetDefault(id: string) {
    setActionLoading(id);
    setError(null);
    try {
      const res = await setDefaultPaymentMethod(id);
      if (res.error) {
        setError(res.error);
      } else {
        await load();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(id: string) {
    setActionLoading(id);
    setError(null);
    try {
      const res = await removePaymentMethod(id);
      if (res.error) {
        setError(res.error);
      } else {
        await load();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAutopayToggle() {
    if (!autopay) return;
    setAutopayLoading(true);
    setError(null);
    try {
      const res = await updateAutopay(!autopay.enabled);
      if (res.error) {
        setError(res.error);
      } else {
        await load();
      }
    } finally {
      setAutopayLoading(false);
    }
  }

  function handleModalSuccess() {
    setModalOpen(false);
    load();
  }

  const defaultMethod = methods.find((m) => m.is_default);
  const hasDefault = !!defaultMethod;

  return (
    <>
      <PageHeader
        title="Payment Methods"
        description="Manage your saved payment methods and autopay settings."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            icon={<Plus size={14} />}
          >
            Add Payment Method
          </Button>
        }
      />

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <Card>
            <CardBody>
              <Skeleton variant="text" className="h-16 w-full" />
              <Skeleton variant="text" className="mt-3 h-16 w-full" />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Skeleton variant="text" className="h-12 w-full" />
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* ── Saved Payment Methods ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Saved Cards</h2>
            </CardHeader>
            <CardBody>
              {methods.length === 0 ? (
                <EmptyState
                  icon={<CreditCard size={40} strokeWidth={1.5} />}
                  title="No saved payment methods"
                  description="Add a card to enable autopay and faster payments."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {methods.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                          <CreditCard size={20} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {brandLabel(m.brand)} •••• {m.last4 ?? "????"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {m.exp_month && m.exp_year
                              ? `Expires ${String(m.exp_month).padStart(2, "0")}/${m.exp_year}`
                              : m.type}
                          </p>
                        </div>
                        {m.is_default && (
                          <Badge variant="info">
                            <Star size={10} className="mr-1 inline" />
                            Default
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!m.is_default && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetDefault(m.id)}
                            loading={actionLoading === m.id}
                            disabled={!!actionLoading}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRemove(m.id)}
                          loading={actionLoading === m.id}
                          disabled={!!actionLoading}
                          icon={<Trash2 size={14} />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* ── Autopay ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-brand-500" />
                <h2 className="text-sm font-semibold text-slate-900">Autopay</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    {autopay?.enabled
                      ? "Autopay is enabled. Your rent will be charged automatically using your default payment method."
                      : "Enable autopay to have your rent charged automatically each month using your default payment method."}
                  </p>

                  {autopay?.enabled && autopay.payment_method && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Using {brandLabel(autopay.payment_method.brand)} ····{" "}
                      {autopay.payment_method.last4 ?? "????"}
                    </div>
                  )}

                  {!hasDefault && !autopay?.enabled && (
                    <p className="mt-2 text-xs text-amber-600">
                      Add a payment method and set it as default to enable autopay.
                    </p>
                  )}
                </div>

                <Button
                  variant={autopay?.enabled ? "secondary" : "primary"}
                  size="sm"
                  onClick={handleAutopayToggle}
                  loading={autopayLoading}
                  disabled={!hasDefault && !autopay?.enabled}
                >
                  {autopay?.enabled ? "Disable" : "Enable Autopay"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <AddPaymentMethodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
