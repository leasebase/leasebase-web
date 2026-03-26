"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import {
  Building2, User, Bell, CreditCard, Shield,
  Check, X, Zap, CheckCircle, Loader2, ShieldCheck, Clock, AlertTriangle,
} from "lucide-react";
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

/* ── Tab definitions ── */

type SettingsTab = "organization" | "profile" | "notifications" | "billing" | "security";

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: "organization", label: "Organization", icon: Building2 },
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "security", label: "Security", icon: Shield },
];

/* ── Main component ── */

export default function SettingsPage() {
  const { user } = authStore();
  const isOwner = user?.persona === "owner";
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Appearance edit state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState("system");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");

  // Owner billing state
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

  // ── Data loading ──

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchUserSettings();
      if (!cancelled && result.data) {
        setSettings(result.data);
        setThemeMode(result.data.theme_mode ?? "system");
        setPrimaryColor(result.data.primary_color ?? "");
        setSecondaryColor(result.data.secondary_color ?? "");
      }
      if (!cancelled) setSettingsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const loadBillingStatus = useCallback(async () => {
    setBillingLoading(true); setBillingError(null);
    const result = await fetchOwnerBillingStatus();
    setBillingStatus(result.data);
    if (result.error) setBillingError(result.error);
    setBillingLoading(false);
  }, []);

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

  // Post-return callback handling
  useEffect(() => {
    const connectParam = searchParams.get("connect");
    if (!connectParam || !isOwner) return;
    router.replace("/app/settings", { scroll: false });
    if (connectParam === "return" || connectParam === "refresh") {
      setConnectReturnState("verifying");
      let attempts = 0;
      const maxAttempts = 10;
      pollRef.current = setInterval(async () => {
        attempts++;
        const result = await fetchConnectStatus();
        if (result.data) {
          setConnectStatus(result.data);
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
  }, []);

  const handleOnboardConfirm = useCallback(() => {
    setOnboardModalOpen(false);
    handleStartOnboarding();
  }, [handleStartOnboarding]);

  const saveAppearance = useCallback(async () => {
    setSaving(true); setError(null);
    const result = await updateUserSettings({
      theme_mode: themeMode as "light" | "dark" | "system",
      primary_color: primaryColor || null,
      secondary_color: secondaryColor || null,
    });
    if (result.data) { setSettings(result.data); }
    else setError(result.error || "Save failed");
    setSaving(false);
  }, [themeMode, primaryColor, secondaryColor]);

  // ── Tab content renderers ──

  function renderOrganization() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Organization Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
              <input type="text" defaultValue="" placeholder="Your organization name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input type="email" defaultValue={user?.email ?? ""} placeholder="contact@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input type="tel" defaultValue="" placeholder="(555) 000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
              <input type="text" defaultValue="" placeholder="Street address, city, state, zip"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="pt-4">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Payment Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Payment Method for Tenants</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>ACH Bank Transfer</option>
                  <option>Credit Card</option>
                  <option>Check</option>
                  <option>Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Late Fee Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">$</span>
                  <input type="number" defaultValue="75"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Late Fee Grace Period</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>3 days</option>
                  <option>5 days</option>
                  <option>7 days</option>
                  <option>10 days</option>
                </select>
              </div>
              <div className="pt-4">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Save Payment Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-6">Profile Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input type="text" defaultValue={user?.name ?? ""} placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" defaultValue={user?.email ?? ""} disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input type="text" value={user?.persona === "owner" ? "Owner" : "Tenant"} disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <div className="pt-4 border-t border-gray-200 mt-6">
            <h3 className="font-medium text-gray-900 mb-4">Appearance</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme Mode</label>
              <select value={themeMode} onChange={(e) => setThemeMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            {isOwner && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input label="Primary Color" type="color" value={primaryColor || "#3b82f6"} onChange={(e) => setPrimaryColor(e.target.value)} />
                <Input label="Secondary Color" type="color" value={secondaryColor || "#64748b"} onChange={(e) => setSecondaryColor(e.target.value)} />
              </div>
            )}
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-4">
              <Button variant="primary" size="sm" onClick={saveAppearance} loading={saving} icon={<Check size={14} />}>Save Appearance</Button>
            </div>
          </div>
          <div className="pt-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Save Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderNotifications() {
    const toggles = [
      { label: "Payment Received", desc: "Get notified when a tenant makes a payment", on: true },
      { label: "Overdue Payments", desc: "Get notified when payments become overdue", on: true },
      { label: "Maintenance Requests", desc: "Get notified of new maintenance requests", on: true },
      { label: "Lease Expiration", desc: "Get notified 90 days before lease expires", on: true },
      { label: "Weekly Summary Email", desc: "Receive a weekly summary of all activity", on: false },
    ];
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-6">Notification Preferences</h2>
        <div className="space-y-4">
          {toggles.map((t, i) => (
            <div key={i} className={`flex items-center justify-between py-3 ${i < toggles.length - 1 ? "border-b border-gray-200" : ""}`}>
              <div>
                <p className="font-medium text-gray-900">{t.label}</p>
                <p className="text-sm text-gray-600">{t.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={t.on} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderBilling() {
    return (
      <div className="space-y-6">
        {isOwner && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Accept Payments</h2>
              {!connectLoading && connectStatus?.status === "ACTIVE" && <Badge variant="success">Payments enabled</Badge>}
              {!connectLoading && connectStatus?.status === "PENDING_VERIFICATION" && <Badge variant="warning">Verifying</Badge>}
              {!connectLoading && connectStatus?.status === "RESTRICTED" && <Badge variant="danger">Action required</Badge>}
            </div>
            {connectReturnState === "verifying" ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Loader2 size={28} className="animate-spin text-blue-500 mb-3" />
                <p className="text-sm font-medium text-gray-900">Verifying your payment setup…</p>
                <p className="mt-1 text-xs text-gray-400">This usually takes just a moment.</p>
              </div>
            ) : connectLoading ? (
              <div className="space-y-3"><Skeleton variant="text" className="h-4 w-48" /><Skeleton variant="text" className="h-4 w-36" /></div>
            ) : connectError && !connectStatus ? (
              <p className="text-xs text-gray-400">Could not load payment setup status.</p>
            ) : connectStatus?.status === "ACTIVE" ? (
              <div>
                <div className="mb-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <CheckCircle size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="text-sm text-emerald-800">Payments are enabled. Tenants can pay rent through your portal.</p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-gray-400">Card payments</dt><dd className="text-gray-900">{connectStatus.charges_enabled ? "Enabled" : "Pending"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Bank payouts</dt><dd className="text-gray-900">{connectStatus.payouts_enabled ? "Enabled" : "Pending"}</dd></div>
                </dl>
              </div>
            ) : connectStatus?.status === "PENDING_VERIFICATION" ? (
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                <Clock size={14} className="mt-0.5 shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">Your identity verification is being processed.</p>
              </div>
            ) : connectStatus?.status === "RESTRICTED" ? (
              <div>
                <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">Additional information is needed. Complete the required steps to continue accepting payments.</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setOnboardModalOpen(true)} loading={connectActionLoading} icon={<AlertTriangle size={14} />}>Complete verification</Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Enable payments to let tenants pay rent directly through LeaseBase.</p>
                <Button variant="primary" size="sm" className="mt-3" onClick={() => setOnboardModalOpen(true)} loading={connectActionLoading} icon={<Zap size={14} />}>
                  {connectStatus?.status === "NOT_STARTED" || !connectStatus ? "Enable payments" : "Continue setup"}
                </Button>
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Payment Method</h2>
              {!billingLoading && billingStatus && !billingStatus.hasPaymentMethod && (
                <button onClick={() => setBillingModalOpen(true)} className="text-sm font-medium text-blue-600 hover:text-blue-700">Add method</button>
              )}
            </div>
            {billingLoading ? (
              <div className="space-y-3"><Skeleton variant="text" className="h-4 w-48" /><Skeleton variant="text" className="h-4 w-36" /></div>
            ) : billingError && !billingStatus ? (
              <p className="text-xs text-gray-400">Could not load billing information.</p>
            ) : billingStatus?.hasPaymentMethod ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{billingStatus.brand ?? "Card"} •••• {billingStatus.last4 ?? "****"}</p>
                    <p className="text-xs text-gray-500">Default payment method</p>
                  </div>
                </div>
                <button onClick={() => setBillingModalOpen(true)} className="text-sm font-medium text-blue-600 hover:text-blue-700">Change</button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No payment method on file.{" "}
                <button type="button" onClick={() => setBillingModalOpen(true)} className="font-medium text-blue-600 hover:text-blue-500">Add one now</button>
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderSecurity() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input type="password" placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input type="password" placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input type="password" placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="pt-4">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Update Password
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="font-semibold text-red-900 mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-900">Export All Data</p>
                <p className="text-sm text-red-700">Download a complete copy of your data</p>
              </div>
              <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium">Export</button>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-900">Delete Account</p>
                <p className="text-sm text-red-700">Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Delete</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const TAB_CONTENT: Record<SettingsTab, () => JSX.Element> = {
    organization: renderOrganization,
    profile: renderProfile,
    notifications: renderNotifications,
    billing: renderBilling,
    security: renderSecurity,
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and preferences" />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tab Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-2">
          {settingsLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <Skeleton variant="text" className="h-6 w-48" />
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-3/4" />
              <Skeleton variant="text" className="h-10 w-full" />
            </div>
          ) : (
            TAB_CONTENT[activeTab]()
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal open={onboardModalOpen} onClose={() => setOnboardModalOpen(false)} title="Enable payments securely">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm text-gray-700">LeaseBase uses Stripe to securely verify your identity and connect payouts to your bank account.</p>
              <p className="mt-2 text-sm text-gray-700">This usually takes a couple of minutes.</p>
            </div>
          </div>
          <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2.5">
            <p className="text-xs text-gray-500">You&#39;ll be asked to provide:</p>
            <ul className="mt-1.5 space-y-1 text-xs text-gray-600">
              <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Basic business information</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Identity verification</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0" /> Bank account for payouts</li>
            </ul>
          </div>
          {connectError && <p className="text-xs text-red-600">{connectError}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="primary" className="flex-1" onClick={handleOnboardConfirm} loading={connectActionLoading} icon={<Zap size={14} />}>Continue</Button>
            <Button variant="ghost" onClick={() => setOnboardModalOpen(false)} disabled={connectActionLoading}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={billingModalOpen} onClose={() => setBillingModalOpen(false)} title="Add Payment Method">
        <BillingSetupForm
          onSuccess={() => { setBillingModalOpen(false); loadBillingStatus(); }}
          onSkip={null}
          title="Add a payment method"
          description="Your card will be securely saved for subscription billing."
        />
      </Modal>
    </>
  );
}
