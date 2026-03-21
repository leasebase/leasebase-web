"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Pencil, Check, X, Palette, CreditCard, Plus, Bell, ChevronRight } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchUserSettings, updateUserSettings } from "@/services/settings/adapters";
import type { UserSettings } from "@/services/settings/types";
import {
  fetchOwnerBillingStatus,
  type BillingStatus,
} from "@/services/owner/adapters/billingAdapter";
import { BillingSetupForm } from "@/components/billing/BillingSetupForm";

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

  useEffect(() => {
    if (!isOwner) return;
    loadBillingStatus();
  }, [isOwner, loadBillingStatus]);

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
