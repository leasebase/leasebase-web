"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pencil, Check, X, Building2, User, Shield } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import {
  fetchUserProfile,
  updateUserProfile,
  fetchOwnerProfile,
  updateOwnerProfile,
  fetchTenantProfileExtension,
  updateTenantProfileExtension,
} from "@/services/profile/adapters";
import type {
  UserProfile,
  OwnerProfile,
  TenantProfileExtension,
} from "@/services/profile/types";

type EditSection = "personal" | "owner" | "tenant" | null;

/**
 * Profile page — identity and persona information only.
 *
 * Settings (theme, branding colors) → /app/settings
 * Notification preferences          → /app/settings/notifications
 */
export default function ProfilePage() {
  const { user } = authStore();
  const isTenant = user?.persona === "tenant";
  const isOwner = user?.persona === "owner";

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [tenantExt, setTenantExt] = useState<TenantProfileExtension | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditSection>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Personal form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");
  // Owner identity form
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  // Tenant profile form
  const [occupation, setOccupation] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [ecName, setEcName] = useState("");
  const [ecRelationship, setEcRelationship] = useState("");
  const [ecPhone, setEcPhone] = useState("");
  const [ecEmail, setEcEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await Promise.allSettled([
        fetchUserProfile(),
        isOwner ? fetchOwnerProfile() : Promise.resolve(null),
        isTenant ? fetchTenantProfileExtension() : Promise.resolve(null),
      ]);
      if (cancelled) return;
      const [userRes, ownerRes, tenantRes] = results;
      if (userRes.status === "fulfilled" && userRes.value && "data" in userRes.value) setUserProfile(userRes.value.data);
      if (ownerRes.status === "fulfilled" && ownerRes.value && "data" in ownerRes.value) setOwnerProfile(ownerRes.value.data);
      if (tenantRes.status === "fulfilled" && tenantRes.value && "data" in tenantRes.value) setTenantExt(tenantRes.value.data);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [isOwner, isTenant]);

  const startEdit = useCallback((section: EditSection) => {
    setError(null);
    if (section === "personal") {
      setFirstName(userProfile?.first_name ?? ""); setLastName(userProfile?.last_name ?? "");
      setPhoneNumber(userProfile?.phone_number ?? ""); setTimezone(userProfile?.timezone ?? "UTC");
      setLanguage(userProfile?.language ?? "en");
    } else if (section === "owner") {
      setCompanyName(ownerProfile?.company_name ?? ""); setBusinessType(ownerProfile?.business_type ?? "");
      setBillingEmail(ownerProfile?.billing_email ?? ""); setTaxId(ownerProfile?.tax_id ?? "");
    } else if (section === "tenant") {
      setOccupation(tenantExt?.occupation ?? ""); setEmployerName(tenantExt?.employer_name ?? "");
      setEcName(tenantExt?.emergency_contact_name ?? ""); setEcRelationship(tenantExt?.emergency_contact_relationship ?? "");
      setEcPhone(tenantExt?.emergency_contact_phone ?? ""); setEcEmail(tenantExt?.emergency_contact_email ?? "");
    }
    setEditing(section);
  }, [userProfile, ownerProfile, tenantExt]);

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

  const saveTenant = useCallback(async () => {
    setSaving(true); setError(null);
    const result = await updateTenantProfileExtension({ occupation: occupation || null, employer_name: employerName || null, emergency_contact_name: ecName || null, emergency_contact_relationship: ecRelationship || null, emergency_contact_phone: ecPhone || null, emergency_contact_email: ecEmail || null });
    if (result.data) { setTenantExt(result.data); setEditing(null); } else setError(result.error || "Save failed");
    setSaving(false);
  }, [occupation, employerName, ecName, ecRelationship, ecPhone, ecEmail]);

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
        {/* ── Personal Info ── */}
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

        {/* ── Owner Company Identity ── */}
        {isOwner && (
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
        )}

        {/* ── Tenant Emergency Contact & Employment ── */}
        {isTenant && (
          <Card>
            <CardHeader><SectionHeader title="Emergency Contact & Employment" icon={<Shield size={14} className="text-slate-500" />} section="tenant" /></CardHeader>
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
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <EditActions onSave={saveTenant} />
                </div>
              ) : (
                <dl className="space-y-3 text-sm">
                  <Field label="Occupation" value={tenantExt?.occupation} /><Field label="Employer" value={tenantExt?.employer_name} />
                  <Field label="Emergency Name" value={tenantExt?.emergency_contact_name} /><Field label="Emergency Relationship" value={tenantExt?.emergency_contact_relationship} />
                  <Field label="Emergency Phone" value={tenantExt?.emergency_contact_phone} /><Field label="Emergency Email" value={tenantExt?.emergency_contact_email} />
                </dl>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
