"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pencil, Check, X, Building2, Bell, CreditCard, User, Shield } from "lucide-react";
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

type EditSection = "personal" | "owner" | "tenant" | "notifications" | null;

export default function ProfilePage() {
  const { user } = authStore();
  const isTenant = user?.persona === "tenant";
  const isOwner = user?.persona === "owner";

  // Data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [tenantExt, setTenantExt] = useState<TenantProfileExtension | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState<EditSection>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state — personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");

  // Form state — owner
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [themeMode, setThemeMode] = useState("system");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [taxId, setTaxId] = useState("");

  // Form state — tenant extension
  const [occupation, setOccupation] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [ecName, setEcName] = useState("");
  const [ecRelationship, setEcRelationship] = useState("");
  const [ecPhone, setEcPhone] = useState("");
  const [ecEmail, setEcEmail] = useState("");
  const [commPref, setCommPref] = useState("");

  // Form state — notifications
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [rentReminder, setRentReminder] = useState(true);
  const [leaseUpdates, setLeaseUpdates] = useState(true);
  const [maintenanceUpdates, setMaintenanceUpdates] = useState(true);
  const [generalAnnouncements, setGeneralAnnouncements] = useState(true);

  // Load all profile data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await Promise.allSettled([
        fetchUserProfile(),
        isOwner ? fetchOwnerProfile() : Promise.resolve(null),
        isTenant ? fetchTenantProfileExtension() : Promise.resolve(null),
        fetchNotificationPreferences(),
      ]);

      if (cancelled) return;

      const [userRes, ownerRes, tenantRes, notifRes] = results;
      if (userRes.status === "fulfilled" && userRes.value && "data" in userRes.value) {
        setUserProfile(userRes.value.data);
      }
      if (ownerRes.status === "fulfilled" && ownerRes.value && "data" in ownerRes.value) {
        setOwnerProfile(ownerRes.value.data);
      }
      if (tenantRes.status === "fulfilled" && tenantRes.value && "data" in tenantRes.value) {
        setTenantExt(tenantRes.value.data);
      }
      if (notifRes.status === "fulfilled" && notifRes.value && "data" in notifRes.value) {
        setNotifPrefs(notifRes.value.data);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [isOwner, isTenant]);

  // Start editing a section — populate form fields
  const startEdit = useCallback((section: EditSection) => {
    setError(null);
    if (section === "personal") {
      setFirstName(userProfile?.first_name ?? "");
      setLastName(userProfile?.last_name ?? "");
      setPhoneNumber(userProfile?.phone_number ?? "");
      setTimezone(userProfile?.timezone ?? "UTC");
      setLanguage(userProfile?.language ?? "en");
    } else if (section === "owner") {
      setCompanyName(ownerProfile?.company_name ?? "");
      setBusinessType(ownerProfile?.business_type ?? "");
      setPrimaryColor(ownerProfile?.primary_color ?? "");
      setSecondaryColor(ownerProfile?.secondary_color ?? "");
      setThemeMode(ownerProfile?.theme_mode ?? "system");
      setBillingEmail(ownerProfile?.billing_email ?? "");
      setBillingAddress(ownerProfile?.billing_address ?? "");
      setTaxId(ownerProfile?.tax_id ?? "");
    } else if (section === "tenant") {
      setOccupation(tenantExt?.occupation ?? "");
      setEmployerName(tenantExt?.employer_name ?? "");
      setEcName(tenantExt?.emergency_contact_name ?? "");
      setEcRelationship(tenantExt?.emergency_contact_relationship ?? "");
      setEcPhone(tenantExt?.emergency_contact_phone ?? "");
      setEcEmail(tenantExt?.emergency_contact_email ?? "");
      setCommPref(tenantExt?.communication_preference ?? "");
    } else if (section === "notifications") {
      setEmailEnabled(notifPrefs?.email_enabled ?? true);
      setSmsEnabled(notifPrefs?.sms_enabled ?? false);
      setPushEnabled(notifPrefs?.push_enabled ?? false);
      setRentReminder(notifPrefs?.rent_reminder ?? true);
      setLeaseUpdates(notifPrefs?.lease_updates ?? true);
      setMaintenanceUpdates(notifPrefs?.maintenance_updates ?? true);
      setGeneralAnnouncements(notifPrefs?.general_announcements ?? true);
    }
    setEditing(section);
  }, [userProfile, ownerProfile, tenantExt, notifPrefs]);

  const cancel = useCallback(() => {
    setEditing(null);
    setError(null);
  }, []);

  // Save handlers
  const savePersonal = useCallback(async () => {
    setSaving(true);
    setError(null);
    const result = await updateUserProfile({
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      phone_number: phoneNumber || undefined,
      timezone,
      language,
    });
    if (result.data) { setUserProfile(result.data); setEditing(null); }
    else setError(result.error || "Save failed");
    setSaving(false);
  }, [firstName, lastName, phoneNumber, timezone, language]);

  const saveOwner = useCallback(async () => {
    setSaving(true);
    setError(null);
    const result = await updateOwnerProfile({
      company_name: companyName || null,
      business_type: businessType || null,
      primary_color: primaryColor || null,
      secondary_color: secondaryColor || null,
      theme_mode: themeMode as "light" | "dark" | "system",
      billing_email: billingEmail || null,
      billing_address: billingAddress || null,
      tax_id: taxId || null,
    });
    if (result.data) { setOwnerProfile(result.data); setEditing(null); }
    else setError(result.error || "Save failed");
    setSaving(false);
  }, [companyName, businessType, primaryColor, secondaryColor, themeMode, billingEmail, billingAddress, taxId]);

  const saveTenant = useCallback(async () => {
    setSaving(true);
    setError(null);
    const result = await updateTenantProfileExtension({
      occupation: occupation || null,
      employer_name: employerName || null,
      emergency_contact_name: ecName || null,
      emergency_contact_relationship: ecRelationship || null,
      emergency_contact_phone: ecPhone || null,
      emergency_contact_email: ecEmail || null,
      communication_preference: commPref || null,
    });
    if (result.data) { setTenantExt(result.data); setEditing(null); }
    else setError(result.error || "Save failed");
    setSaving(false);
  }, [occupation, employerName, ecName, ecRelationship, ecPhone, ecEmail, commPref]);

  const saveNotifications = useCallback(async () => {
    setSaving(true);
    setError(null);
    const result = await updateNotificationPreferences({
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      push_enabled: pushEnabled,
      rent_reminder: rentReminder,
      lease_updates: leaseUpdates,
      maintenance_updates: maintenanceUpdates,
      general_announcements: generalAnnouncements,
    });
    if (result.data) { setNotifPrefs(result.data); setEditing(null); }
    else setError(result.error || "Save failed");
    setSaving(false);
  }, [emailEnabled, smsEnabled, pushEnabled, rentReminder, leaseUpdates, maintenanceUpdates, generalAnnouncements]);

  const EditActions = ({ onSave }: { onSave: () => void }) => (
    <div className="flex gap-2 pt-2">
      <Button variant="primary" size="sm" onClick={onSave} loading={saving} icon={<Check size={14} />}>
        Save
      </Button>
      <Button variant="ghost" size="sm" onClick={cancel} disabled={saving} icon={<X size={14} />}>
        Cancel
      </Button>
    </div>
  );

  const SectionHeader = ({ title, icon, section }: { title: string; icon: React.ReactNode; section: EditSection }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {editing !== section && (
        <Button variant="ghost" size="sm" onClick={() => startEdit(section)} icon={<Pencil size={14} />}>
          Edit
        </Button>
      )}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-900">{value || "Not set"}</dd>
    </div>
  );

  if (loading) {
    return (
      <>
        <PageHeader title="Profile" description="Manage your profile, preferences, and account settings." />
        <div className="mt-6 max-w-lg space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody>
                <div className="space-y-3">
                  <Skeleton variant="text" className="h-4 w-48" />
                  <Skeleton variant="text" className="h-4 w-36" />
                  <Skeleton variant="text" className="h-4 w-44" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Profile" description="Manage your profile, preferences, and account settings." />

      <div className="mt-6 max-w-lg space-y-6">
        {/* ── Personal Info ── */}
        <Card>
          <CardHeader>
            <SectionHeader title="Personal Info" icon={<User size={14} className="text-slate-500" />} section="personal" />
          </CardHeader>
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
                <Field label="Name" value={user?.name} />
                <Field label="Email" value={user?.email} />
                <Field label="Phone" value={userProfile?.phone_number} />
                <Field label="Timezone" value={userProfile?.timezone} />
                <Field label="Language" value={userProfile?.language} />
              </dl>
            )}
          </CardBody>
        </Card>

        {/* ── Owner Branding & Billing ── */}
        {isOwner && (
          <Card>
            <CardHeader>
              <SectionHeader title="Company & Branding" icon={<Building2 size={14} className="text-slate-500" />} section="owner" />
            </CardHeader>
            <CardBody>
              {editing === "owner" ? (
                <div className="space-y-3">
                  <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  <Input label="Business Type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="LLC, Corporation, etc." />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Primary Color" type="color" value={primaryColor || "#3b82f6"} onChange={(e) => setPrimaryColor(e.target.value)} />
                    <Input label="Secondary Color" type="color" value={secondaryColor || "#64748b"} onChange={(e) => setSecondaryColor(e.target.value)} />
                  </div>
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
                  <Input label="Billing Email" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
                  <Input label="Billing Address" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
                  <Input label="Tax ID" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="EIN / Tax ID" />
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <EditActions onSave={saveOwner} />
                </div>
              ) : (
                <dl className="space-y-3 text-sm">
                  <Field label="Company" value={ownerProfile?.company_name} />
                  <Field label="Business Type" value={ownerProfile?.business_type} />
                  <Field label="Theme" value={ownerProfile?.theme_mode} />
                  <Field label="Billing Email" value={ownerProfile?.billing_email} />
                  <Field label="Billing Address" value={ownerProfile?.billing_address} />
                  <Field label="Tax ID" value={ownerProfile?.tax_id} />
                  {ownerProfile?.primary_color && (
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-400">Brand Colors</dt>
                      <dd className="flex gap-2">
                        <span className="inline-block h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: ownerProfile.primary_color }} />
                        {ownerProfile.secondary_color && (
                          <span className="inline-block h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: ownerProfile.secondary_color }} />
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </CardBody>
          </Card>
        )}

        {/* ── Tenant Emergency Contact & Employment ── */}
        {isTenant && (
          <Card>
            <CardHeader>
              <SectionHeader title="Emergency Contact & Employment" icon={<Shield size={14} className="text-slate-500" />} section="tenant" />
            </CardHeader>
            <CardBody>
              {editing === "tenant" ? (
                <div className="space-y-3">
                  <Input label="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                  <Input label="Employer" value={employerName} onChange={(e) => setEmployerName(e.target.value)} />
                  <hr className="border-slate-200" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Emergency Contact</p>
                  <Input label="Name" value={ecName} onChange={(e) => setEcName(e.target.value)} />
                  <Input label="Relationship" value={ecRelationship} onChange={(e) => setEcRelationship(e.target.value)} />
                  <Input label="Phone" type="tel" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} />
                  <Input label="Email" type="email" value={ecEmail} onChange={(e) => setEcEmail(e.target.value)} />
                  <hr className="border-slate-200" />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Communication Preference</label>
                    <select
                      value={commPref}
                      onChange={(e) => setCommPref(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Not set</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="push">Push</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <EditActions onSave={saveTenant} />
                </div>
              ) : (
                <dl className="space-y-3 text-sm">
                  <Field label="Occupation" value={tenantExt?.occupation} />
                  <Field label="Employer" value={tenantExt?.employer_name} />
                  <Field label="Emergency Name" value={tenantExt?.emergency_contact_name} />
                  <Field label="Emergency Relationship" value={tenantExt?.emergency_contact_relationship} />
                  <Field label="Emergency Phone" value={tenantExt?.emergency_contact_phone} />
                  <Field label="Emergency Email" value={tenantExt?.emergency_contact_email} />
                  <Field label="Comm. Preference" value={tenantExt?.communication_preference} />
                </dl>
              )}
            </CardBody>
          </Card>
        )}

        {/* ── Notification Preferences ── */}
        <Card>
          <CardHeader>
            <SectionHeader title="Notifications" icon={<Bell size={14} className="text-slate-500" />} section="notifications" />
          </CardHeader>
          <CardBody>
            {editing === "notifications" ? (
              <div className="space-y-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Channels</p>
                <Switch checked={emailEnabled} onChange={setEmailEnabled} label="Email" />
                <Switch checked={smsEnabled} onChange={setSmsEnabled} label="SMS" />
                <Switch checked={pushEnabled} onChange={setPushEnabled} label="Push" />
                <hr className="border-slate-200" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Categories</p>
                <Switch checked={rentReminder} onChange={setRentReminder} label="Rent Reminders" />
                <Switch checked={leaseUpdates} onChange={setLeaseUpdates} label="Lease Updates" />
                <Switch checked={maintenanceUpdates} onChange={setMaintenanceUpdates} label="Maintenance Updates" />
                <Switch checked={generalAnnouncements} onChange={setGeneralAnnouncements} label="General Announcements" />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <EditActions onSave={saveNotifications} />
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Field label="Email" value={notifPrefs?.email_enabled ? "Enabled" : "Disabled"} />
                <Field label="SMS" value={notifPrefs?.sms_enabled ? "Enabled" : "Disabled"} />
                <Field label="Push" value={notifPrefs?.push_enabled ? "Enabled" : "Disabled"} />
                <Field label="Rent Reminders" value={notifPrefs?.rent_reminder ? "On" : "Off"} />
                <Field label="Lease Updates" value={notifPrefs?.lease_updates ? "On" : "Off"} />
                <Field label="Maintenance" value={notifPrefs?.maintenance_updates ? "On" : "Off"} />
                <Field label="Announcements" value={notifPrefs?.general_announcements ? "On" : "Off"} />
              </dl>
            )}
          </CardBody>
        </Card>

        {/* ── Payment Methods (read-only placeholder) ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Payment Methods</h2>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-400">
              Payment method management is coming soon. Existing payment methods configured via billing setup remain active.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
