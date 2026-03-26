"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Pencil, Check, X, Building2, User, Shield, Bell, Lock,
  CreditCard, Save, Mail, Phone, MapPin, Calendar,
} from "lucide-react";
import { authStore } from "@/lib/auth/store";
import {
  fetchUserProfile,
  updateUserProfile,
  fetchOwnerProfile,
  updateOwnerProfile,
  fetchTenantProfileExtension,
  updateTenantProfileExtension,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/profile/adapters";
import type {
  UserProfile,
  OwnerProfile,
  TenantProfileExtension,
  NotificationPreferences,
} from "@/services/profile/types";

type EditSection = "personal" | "owner" | "tenant" | null;

// ══════════════════════════════════════════════════════════════════════════════
// TENANT PROFILE — UIUX design
// ══════════════════════════════════════════════════════════════════════════════

function TenantProfilePage() {
  const { user } = authStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tenantExt, setTenantExt] = useState<TenantProfileExtension | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await Promise.allSettled([
        fetchUserProfile(),
        fetchTenantProfileExtension(),
        fetchNotificationPreferences(),
      ]);
      if (cancelled) return;
      const [userRes, tenantRes, notifRes] = results;
      if (userRes.status === "fulfilled" && userRes.value && "data" in userRes.value) setUserProfile(userRes.value.data);
      if (tenantRes.status === "fulfilled" && tenantRes.value && "data" in tenantRes.value) setTenantExt(tenantRes.value.data);
      if (notifRes.status === "fulfilled" && notifRes.value && "data" in notifRes.value) setNotifPrefs(notifRes.value.data);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const startEdit = useCallback(() => {
    setError(null);
    setFirstName(userProfile?.first_name ?? "");
    setLastName(userProfile?.last_name ?? "");
    setPhoneNumber(userProfile?.phone_number ?? "");
    setIsEditing(true);
  }, [userProfile]);

  const savePersonal = useCallback(async () => {
    setSaving(true); setError(null);
    const result = await updateUserProfile({
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      phone_number: phoneNumber || undefined,
    });
    if (result.data) { setUserProfile(result.data); setIsEditing(false); }
    else setError(result.error || "Save failed");
    setSaving(false);
  }, [firstName, lastName, phoneNumber]);

  const togglePref = useCallback(async (key: keyof NotificationPreferences, value: boolean) => {
    if (!notifPrefs) return;
    const optimistic = { ...notifPrefs, [key]: value };
    setNotifPrefs(optimistic);
    const result = await updateNotificationPreferences({ [key]: value });
    if (result.data) setNotifPrefs(result.data);
  }, [notifPrefs]);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const createdDate = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between"><div><Skeleton variant="text" className="h-7 w-48" /><Skeleton variant="text" className="mt-2 h-4 w-64" /></div></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6"><div className="flex gap-6"><Skeleton variant="rectangular" className="w-20 h-20 rounded-2xl" /><div><Skeleton variant="text" className="h-6 w-40" /><Skeleton variant="text" className="mt-2 h-4 w-56" /><Skeleton variant="text" className="mt-2 h-4 w-32" /></div></div></div>
        {[0,1,2].map(i=><div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-md p-6"><Skeleton variant="text" className="h-5 w-36" /><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">{[0,1].map(j=><Skeleton key={j} variant="text" className="h-12" />)}</div></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-slate-900 mb-1">Profile & Settings</h1>
          <p className="text-[14px] text-slate-600">Manage your account information and preferences</p>
        </div>
        <button
          onClick={() => isEditing ? setIsEditing(false) : startEdit()}
          className={`h-10 px-4 text-[13px] font-semibold rounded-xl transition-all ${
            isEditing
              ? "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300"
              : "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/30 hover:from-green-700 hover:to-green-800"
          }`}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* ── Profile Hero Card ── */}
      <div className="bg-gradient-to-br from-green-50 via-white to-green-50/30 rounded-2xl border border-green-200 shadow-lg p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-[28px] font-bold shadow-xl shadow-green-500/30">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-[22px] font-bold text-slate-900 mb-1">{user?.name || "Tenant"}</h2>
            <p className="text-[14px] text-slate-600 mb-3">Tenant</p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[11px] font-bold uppercase rounded-lg ring-1 ring-green-200">
                Active
              </span>
              {createdDate && (
                <span className="text-[12px] text-slate-600">Since {createdDate}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <h3 className="text-[15px] font-semibold text-slate-900">Personal Information</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 mb-2">
                <User className="w-4 h-4 text-slate-500" /> Full Name
              </label>
              {isEditing ? (
                <div className="flex gap-2">
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First"
                    className="flex-1 h-11 px-4 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last"
                    className="flex-1 h-11 px-4 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              ) : (
                <p className="text-[14px] text-slate-900 font-medium">{user?.name || "Not set"}</p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 mb-2">
                <Mail className="w-4 h-4 text-slate-500" /> Email Address
              </label>
              <p className="text-[14px] text-slate-900 font-medium">{user?.email || "Not set"}</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 mb-2">
                <Phone className="w-4 h-4 text-slate-500" /> Phone Number
              </label>
              {isEditing ? (
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567"
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              ) : (
                <p className="text-[14px] text-slate-900 font-medium">{userProfile?.phone_number || "Not set"}</p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-slate-500" /> Member Since
              </label>
              <p className="text-[14px] text-slate-900 font-medium">{createdDate || "\u2014"}</p>
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 flex gap-3">
              <button
                onClick={savePersonal}
                disabled={saving}
                className="flex items-center gap-2 h-11 px-5 bg-gradient-to-r from-green-600 to-green-700 text-white text-[14px] font-semibold rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving\u2026" : "Save Changes"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="h-11 px-5 bg-white text-slate-700 text-[14px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-700" />
            <h3 className="text-[15px] font-semibold text-slate-900">Notification Preferences</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {notifPrefs ? (
            <>
              <ToggleRow label="Email Notifications" description="Receive updates via email" checked={notifPrefs.email_enabled} onChange={(v) => togglePref("email_enabled", v)} />
              <ToggleRow label="SMS Notifications" description="Get text messages for urgent updates" checked={notifPrefs.sms_enabled} onChange={(v) => togglePref("sms_enabled", v)} />
              <ToggleRow label="Payment Reminders" description="Reminders before rent is due" checked={notifPrefs.rent_reminder} onChange={(v) => togglePref("rent_reminder", v)} />
              <ToggleRow label="Maintenance Updates" description="Status changes on your requests" checked={notifPrefs.maintenance_updates} onChange={(v) => togglePref("maintenance_updates", v)} />
            </>
          ) : (
            <p className="text-[13px] text-slate-500">Notification preferences are not available.</p>
          )}
        </div>
      </div>

      {/* ── Security ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-700" />
            <h3 className="text-[15px] font-semibold text-slate-900">Security</h3>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <Link
            href="/app/settings"
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all text-left"
          >
            <div>
              <p className="text-[13px] font-semibold text-slate-900 mb-0.5">Account Settings</p>
              <p className="text-[12px] text-slate-600">Manage your account and security preferences</p>
            </div>
            <Lock className="w-5 h-5 text-slate-400" />
          </Link>
          <Link
            href="/app/payment-methods"
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all text-left"
          >
            <div>
              <p className="text-[13px] font-semibold text-slate-900 mb-0.5">Payment Methods</p>
              <p className="text-[12px] text-slate-600">Manage saved payment methods</p>
            </div>
            <CreditCard className="w-5 h-5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ── Help ── */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-2xl border border-blue-200 p-6">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Need Help?</h3>
        <p className="text-[13px] text-slate-600">
          Have questions about your account or lease? Contact your property manager for assistance.
        </p>
      </div>
    </div>
  );
}

/** Toggle row for notification preferences */
function ToggleRow({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div>
        <p className="text-[13px] font-semibold text-slate-900 mb-0.5">{label}</p>
        <p className="text-[12px] text-slate-600">{description}</p>
      </div>
      <label className="relative inline-block w-12 h-6 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={() => onChange(!checked)} className="sr-only peer" />
        <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
      </label>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OWNER PROFILE (unchanged)
// ══════════════════════════════════════════════════════════════════════════════

function OwnerProfilePage() {
  const { user } = authStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditSection>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [taxId, setTaxId] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await Promise.allSettled([fetchUserProfile(), fetchOwnerProfile()]);
      if (cancelled) return;
      const [userRes, ownerRes] = results;
      if (userRes.status === "fulfilled" && userRes.value && "data" in userRes.value) setUserProfile(userRes.value.data);
      if (ownerRes.status === "fulfilled" && ownerRes.value && "data" in ownerRes.value) setOwnerProfile(ownerRes.value.data);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const startEdit = useCallback((section: EditSection) => {
    setError(null);
    if (section === "personal") { setFirstName(userProfile?.first_name ?? ""); setLastName(userProfile?.last_name ?? ""); setPhoneNumber(userProfile?.phone_number ?? ""); setTimezone(userProfile?.timezone ?? "UTC"); setLanguage(userProfile?.language ?? "en"); }
    else if (section === "owner") { setCompanyName(ownerProfile?.company_name ?? ""); setBusinessType(ownerProfile?.business_type ?? ""); setBillingEmail(ownerProfile?.billing_email ?? ""); setTaxId(ownerProfile?.tax_id ?? ""); }
    setEditing(section);
  }, [userProfile, ownerProfile]);

  const cancel = useCallback(() => { setEditing(null); setError(null); }, []);
  const savePersonal = useCallback(async () => {
    setSaving(true); setError(null);
    const result = await updateUserProfile({ first_name: firstName || undefined, last_name: lastName || undefined, phone_number: phoneNumber || undefined, timezone, language });
    if (result.data) { setUserProfile(result.data); setEditing(null); } else setError(result.error || "Save failed");
    setSaving(false);
  }, [firstName, lastName, phoneNumber, timezone, language]);
  const saveOwner = useCallback(async () => {
    setSaving(true); setError(null);
    const result = await updateOwnerProfile({ company_name: companyName || null, business_type: businessType || null, billing_email: billingEmail || null, tax_id: taxId || null });
    if (result.data) { setOwnerProfile(result.data); setEditing(null); } else setError(result.error || "Save failed");
    setSaving(false);
  }, [companyName, businessType, billingEmail, taxId]);

  const EditActions = ({ onSave }: { onSave: () => void }) => (
    <div className="flex gap-2 pt-2">
      <Button variant="primary" size="sm" onClick={onSave} loading={saving} icon={<Check size={14} />}>Save</Button>
      <Button variant="ghost" size="sm" onClick={cancel} disabled={saving} icon={<X size={14} />}>Cancel</Button>
    </div>
  );
  const SectionHeader = ({ title, icon, section }: { title: string; icon: React.ReactNode; section: EditSection }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">{icon}<h2 className="text-sm font-semibold text-slate-900">{title}</h2></div>
      {editing !== section && <Button variant="ghost" size="sm" onClick={() => startEdit(section)} icon={<Pencil size={14} />}>Edit</Button>}
    </div>
  );
  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between"><dt className="text-slate-400">{label}</dt><dd className="text-slate-900">{value || "Not set"}</dd></div>
  );

  if (loading) return (
    <>
      <PageHeader title="Profile" description="Your identity and personal information." />
      <div className="mt-6 max-w-lg space-y-6">{[1, 2].map((i) => <Card key={i}><CardBody><div className="space-y-3"><Skeleton variant="text" className="h-4 w-48" /><Skeleton variant="text" className="h-4 w-36" /></div></CardBody></Card>)}</div>
    </>
  );

  return (
    <>
      <PageHeader title="Profile" description="Your identity and personal information." />
      <div className="mt-6 max-w-lg space-y-6">
        <Card>
          <CardHeader><SectionHeader title="Personal Info" icon={<User size={14} className="text-slate-500" />} section="personal" /></CardHeader>
          <CardBody>
            {editing === "personal" ? (
              <div className="space-y-3">
                <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <Input label="Phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" />
                <Input label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                <Input label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <EditActions onSave={savePersonal} />
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Field label="Name" value={user?.name} /><Field label="Email" value={user?.email} />
                <Field label="Phone" value={userProfile?.phone_number} /><Field label="Timezone" value={userProfile?.timezone} /><Field label="Language" value={userProfile?.language} />
              </dl>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><SectionHeader title="Company" icon={<Building2 size={14} className="text-slate-500" />} section="owner" /></CardHeader>
          <CardBody>
            {editing === "owner" ? (
              <div className="space-y-3">
                <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <Input label="Business Type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="LLC, Corporation, etc." />
                <Input label="Billing Email" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
                <Input label="Tax ID" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="EIN / Tax ID" />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <EditActions onSave={saveOwner} />
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Field label="Company" value={ownerProfile?.company_name} /><Field label="Business Type" value={ownerProfile?.business_type} />
                <Field label="Billing Email" value={ownerProfile?.billing_email} /><Field label="Tax ID" value={ownerProfile?.tax_id} />
              </dl>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE — persona router
// ══════════════════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const { user } = authStore();
  if (user?.persona === "tenant") return <TenantProfilePage />;
  return <OwnerProfilePage />;
}
