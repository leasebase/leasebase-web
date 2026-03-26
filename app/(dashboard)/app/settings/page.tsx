"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Pencil, Check, X, Palette, CreditCard, Plus, Bell, ChevronRight, Zap, CheckCircle, Loader2, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchUserSettings, updateUserSettings } from "@/services/settings/adapters";
import type { UserSettings } from "@/services/settings/types";
import {
  fetchOwnerBillingStatus,
  type BillingStatus,
} from "@/services/owner/adapters/billingAdapter";
import { BillingSetupForm } from "@/components/billing/BillingSetupForm";
import {
  fetchConnectStatus,
  startOnboarding,
  type ConnectStatus,
} from "@/services/payments/ownerPaymentAdapter";

/**
 * Settings page — application behavior, appearance, billing.
 *
 * Reads theme/branding from /api/settings (canonical, Phase 2).
 * Identity/profile info → /app/profile
 * Notification preferences → /app/settings/notifications
 */
export default function SettingsPage() {
  const { user } = authStore();
  const isOwner = user?.persona === "owner";

  // Settings state (from /api/settings — canonical)
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Appearance edit state
  const [editingAppearance, setEditingAppearance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState("system");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");

  // Owner billing state (existing)
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(isOwner);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);

  // Stripe Connect onboarding state
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [connectLoading, setConnectLoading] = useState(isOwner);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectActionLoading, setConnectActionLoading] = useState(false);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [connectReturnState, setConnectReturnState] = useState<"verifying" | "done" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Load settings
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchUserSettings();
      if (!cancelled && result.data) setSettings(result.data);
      if (!cancelled) setSettingsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Load owner billing
  const loadBillingStatus = useCallback(async () => {
    setBillingLoading(true); setBillingError(null);
    const result = await fetchOwnerBillingStatus();
    setBillingStatus(result.data);
    if (result.error) setBillingError(result.error);
    setBillingLoading(false);
  }, []);

  // Load Stripe Connect status
  const loadConnectStatus = useCallback(async () => {
    setConnectLoading(true); setConnectError(null);
    const result = await fetchConnectStatus();
    setConnectStatus(result.data);
    if (result.error) setConnectError(result.error);
    setConnectLoading(false);
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    loadBillingStatus();
    loadConnectStatus();
  }, [isOwner, loadBillingStatus, loadConnectStatus]);

  // ── Post-return callback handling ──────────────────────────────────────────
  useEffect(() => {
    const connectParam = searchParams.get("connect");
    if (!connectParam || !isOwner) return;

    // Clean the URL immediately so refresh doesn't re-trigger
    router.replace("/app/settings", { scroll: false });

    if (connectParam === "return" || connectParam === "refresh") {
      setConnectReturnState("verifying");

      // Poll connect status every 2s for up to 20s to wait for webhook
      let attempts = 0;
      const maxAttempts = 10;
      pollRef.current = setInterval(async () => {
        attempts++;
        const result = await fetchConnectStatus();
        if (result.data) {
          setConnectStatus(result.data);
          // Stop early if we reached a terminal state
          if (result.data.status === "ACTIVE" || attempts >= maxAttempts) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setConnectReturnState("done");
            setConnectLoading(false);
          }
        }
        if (attempts >= maxAttempts) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setConnectReturnState("done");
          setConnectLoading(false);
        }
      }, 2000);
    }

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartOnboarding = useCallback(async () => {
    setConnectActionLoading(true); setConnectError(null);
    const result = await startOnboarding();
    if (result.data?.url) {
      window.location.href = result.data.url;
    } else {
      setConnectError(result.error || "Failed to start payment setup");
      setConnectActionLoading(false);
    }
    // Don't reset loading — page is navigating away
  }, []);

  const handleOnboardConfirm = useCallback(() => {
    setOnboardModalOpen(false);
    handleStartOnboarding();
  }, [handleStartOnboarding]);

  const startEditAppearance = useCallback(() => {
    setThemeMode(settings?.theme_mode ?? "system");
    setPrimaryColor(settings?.primary_color ?? "");
    setSecondaryColor(settings?.secondary_color ?? "");
    setError(null);
    setEditingAppearance(true);
  }, [settings]);

  const saveAppearance = useCallback(async () => {
    setSaving(true); setError(null);
    const result = await updateUserSettings({
      theme_mode: themeMode as "light" | "dark" | "system",
      primary_color: primaryColor || null,
      secondary_color: secondaryColor || null,
    });
    if (result.data) { setSettings(result.data); setEditingAppearance(false); }
    else setError(result.error || "Save failed");
    setSaving(false);
  }, [themeMode, primaryColor, secondaryColor]);

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-900">{value || "Not set"}</dd>
    </div>
  );

  return (
    <>
      <PageHeader title="Settings" description="Application preferences, appearance, and billing." />

      <div className="mt-6 max-w-lg space-y-6">
        {/* ── Appearance / Theme ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Appearance</h2>
              </div>
              {!editingAppearance && (
                <Button variant="ghost" size="sm" onClick={startEditAppearance} icon={<Pencil size={14} />}>Edit</Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {settingsLoading ? (
              <div className="space-y-3"><Skeleton variant="text" className="h-4 w-48" /><Skeleton variant="text" className="h-4 w-36" /></div>
            ) : editingAppearance ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Theme Mode</label>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                {isOwner && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Primary Color" type="color" value={primaryColor || "#3b82f6"} onChange={(e) => setPrimaryColor(e.target.value)} />
                    <Input label="Secondary Color" type="color" value={secondaryColor || "#64748b"} onChange={(e) => setSecondaryColor(e.target.value)} />
                  </div>
                )}
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="primary" size="sm" onClick={saveAppearance} loading={saving} icon={<Check size={14} />}>Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingAppearance(false); setError(null); }} disabled={saving} icon={<X size={14} />}>Cancel</Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Field label="Theme" value={settings?.theme_mode ?? "system"} />
                {isOwner && settings?.primary_color && (
                  <div className="flex justify-between items-center">
                    <dt className="text-slate-400">Brand Colors</dt>
                    <dd className="flex gap-2">
                      <span className="inline-block h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: settings.primary_color }} />
                      {settings.secondary_color && (
                        <span className="inline-block h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: settings.secondary_color }} />
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </CardBody>
        </Card>

        {/* ── Notifications link ── */}
        <Link href="/app/settings/notifications" className="block">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-slate-500" />
                  <span className="text-sm font-semibold text-slate-900">Notification Preferences</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
              <p className="mt-1 text-xs text-slate-400">Email, SMS, push channels and category toggles</p>
            </CardBody>
          </Card>
        </Link>

        {/* ── Accept Payments (Stripe Connect) ── */}
        {isOwner && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-900">Accept Payments</h2>
                </div>
                {!connectLoading && connectStatus?.status === "ACTIVE" && (
                  <Badge variant="success">Payments enabled</Badge>
                )}
                {!connectLoading && connectStatus?.status === "PENDING_VERIFICATION" && (
                  <Badge variant="warning">Verifying</Badge>
                )}
                {!connectLoading && connectStatus?.status === "RESTRICTED" && (
                  <Badge variant="danger">Action required</Badge>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {/* ── Post-return verification spinner ── */}
              {connectReturnState === "verifying" ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Loader2 size={28} className="animate-spin text-brand-500 mb-3" />
                  <p className="text-sm font-medium text-slate-900">Verifying your payment setup…</p>
                  <p className="mt-1 text-xs text-slate-400">This usually takes just a moment.</p>
                </div>

              ) : connectLoading ? (
                <div className="space-y-3"><Skeleton variant="text" className="h-4 w-48" /><Skeleton variant="text" className="h-4 w-36" /></div>

              ) : connectError && !connectStatus ? (
                <p className="text-xs text-slate-400">Could not load payment setup status.</p>

              /* ── ACTIVE ── */
              ) : connectStatus?.status === "ACTIVE" ? (
                <div>
                  <div className="mb-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                    <p className="text-sm text-emerald-800">Payments are enabled. Tenants can pay rent through your portal.</p>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Card payments</dt>
                      <dd className="text-slate-900">{connectStatus.charges_enabled ? "Enabled" : "Pending"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Bank payouts</dt>
                      <dd className="text-slate-900">{connectStatus.payouts_enabled ? "Enabled" : "Pending"}</dd>
                    </div>
                  </dl>
                </div>

              /* ── PENDING_VERIFICATION ── */
              ) : connectStatus?.status === "PENDING_VERIFICATION" ? (
                <div>
                  <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                    <Clock size={14} className="mt-0.5 shrink-0 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Your identity verification is being processed. This usually completes within a few minutes.
                    </p>
                  </div>
                </div>

              /* ── RESTRICTED ── */
              ) : connectStatus?.status === "RESTRICTED" ? (
                <div>
                  <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />
                    <p className="text-sm text-red-800">
                      Additional information is needed to keep payments active. Complete the required steps to continue accepting payments.
                    </p>
                  </div>
                  {connectError && <p className="mt-2 text-xs text-red-600">{connectError}</p>}
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() => setOnboardModalOpen(true)}
                    loading={connectActionLoading}
                    icon={<AlertTriangle size={14} />}
                  >
                    Complete verification
                  </Button>
                </div>

              /* ── NOT_STARTED ── */
              ) : connectStatus?.status === "NOT_STARTED" || !connectStatus ? (
                <div>
                  <p className="text-sm text-slate-500">
                    Enable payments to let tenants pay rent directly through LeaseBase. Setup takes just a few minutes.
                  </p>
                  {connectError && <p className="mt-2 text-xs text-red-600">{connectError}</p>}
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() => setOnboardModalOpen(true)}
                    loading={connectActionLoading}
                    icon={<Zap size={14} />}
                  >
                    Enable payments
                  </Button>
                </div>

              /* ── ONBOARDING_INCOMPLETE (fallback) ── */
              ) : (
                <div>
                  <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <Clock size={14} className="mt-0.5 shrink-0 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Payment setup is not yet complete. Continue where you left off to start accepting payments.
                    </p>
                  </div>
                  {connectError && <p className="mt-2 text-xs text-red-600">{connectError}</p>}
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() => setOnboardModalOpen(true)}
                    loading={connectActionLoading}
                    icon={<Zap size={14} />}
                  >
                    Continue setup
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* ── Onboarding interstitial modal ── */}
        <Modal open={onboardModalOpen} onClose={() => setOnboardModalOpen(false)} title="Enable payments securely">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-500" />
              <div>
                <p className="text-sm text-slate-700">
                  LeaseBase uses Stripe to securely verify your identity and connect payouts to your bank account.
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  This usually takes a couple of minutes. You’ll return to LeaseBase automatically when finished.
                </p>
              </div>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2.5">
              <p className="text-xs text-slate-500">You’ll be asked to provide:</p>
              <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Basic business information</li>
                <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Identity verification</li>
                <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Bank account for payouts</li>
              </ul>
            </div>
            {connectError && <p className="text-xs text-red-600">{connectError}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleOnboardConfirm}
                loading={connectActionLoading}
                icon={<Zap size={14} />}
              >
                Continue
              </Button>
              <Button
                variant="ghost"
                onClick={() => setOnboardModalOpen(false)}
                disabled={connectActionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── Owner Billing ── */}
        {isOwner && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-900">Billing</h2>
                </div>
                {!billingLoading && billingStatus && !billingStatus.hasPaymentMethod && (
                  <Button variant="primary" size="sm" onClick={() => setBillingModalOpen(true)} icon={<Plus size={14} />}>Add</Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {billingLoading ? (
                <div className="space-y-3"><Skeleton variant="text" className="h-4 w-48" /><Skeleton variant="text" className="h-4 w-36" /></div>
              ) : billingError && !billingStatus ? (
                <p className="text-xs text-slate-400">Could not load billing information.</p>
              ) : billingStatus?.hasPaymentMethod ? (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Payment method</dt>
                    <dd className="text-slate-900">{billingStatus.brand ? `${billingStatus.brand} ` : ""}•••• {billingStatus.last4 ?? "****"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-500">
                  No payment method on file.{" "}
                  <button type="button" onClick={() => setBillingModalOpen(true)} className="font-medium text-brand-600 hover:text-brand-500 transition-colors">Add one now</button>
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Billing setup modal */}
        <Modal open={billingModalOpen} onClose={() => setBillingModalOpen(false)} title="Add Payment Method">
          <BillingSetupForm
            onSuccess={() => { setBillingModalOpen(false); loadBillingStatus(); }}
            onSkip={null}
            title="Add a payment method"
            description="Your card will be securely saved for subscription billing."
          />
        </Modal>

        {/* ── Payment Methods placeholder ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Payment Methods</h2>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-400">Payment method management is coming soon.</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
