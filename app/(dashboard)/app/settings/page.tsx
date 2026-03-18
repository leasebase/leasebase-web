"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Pencil, X, Check, CreditCard, Plus } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import {
  fetchTenantProfile,
  updateTenantProfile,
  type TenantProfileUpdatePayload,
} from "@/services/tenant/adapters/profileAdapter";
import type { TenantProfileRow } from "@/services/tenant/types";
import {
  fetchOwnerBillingStatus,
  type BillingStatus,
} from "@/services/owner/adapters/billingAdapter";
import { BillingSetupForm } from "@/components/billing/BillingSetupForm";

/**
 * Settings — shows account info, tenant profile, and owner billing.
 */
export default function Page() {
  const { user } = authStore();
  const isTenant = user?.persona === "tenant";
  const isOwner = user?.persona === "owner";
  const [profile, setProfile] = useState<TenantProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(isTenant);
  const [profileSource, setProfileSource] = useState<string>("stub");

  // Owner billing state
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(isOwner);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editEmergencyContact, setEditEmergencyContact] = useState("");

  useEffect(() => {
    if (!isTenant) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchTenantProfile();
        if (!cancelled) {
          setProfile(result.data);
          setProfileSource(result.source);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isTenant]);

  // Load owner billing status
  const loadBillingStatus = useCallback(async () => {
    setBillingLoading(true);
    setBillingError(null);
    const result = await fetchOwnerBillingStatus();
    setBillingStatus(result.data);
    if (result.error) setBillingError(result.error);
    setBillingLoading(false);
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    loadBillingStatus();
  }, [isOwner, loadBillingStatus]);

  const startEditing = useCallback(() => {
    setEditPhone(profile?.phone ?? "");
    setEditEmergencyContact(profile?.emergency_contact ?? "");
    setEditError(null);
    setIsEditing(true);
  }, [profile]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditError(null);
  }, []);

  const saveProfile = useCallback(async () => {
    setIsSaving(true);
    setEditError(null);
    try {
      const payload: TenantProfileUpdatePayload = {};
      // Only include fields that changed (supports explicit null for clearing)
      const newPhone = editPhone.trim() || null;
      if (newPhone !== (profile?.phone ?? null)) {
        payload.phone = newPhone;
      }
      const newEmergencyContact = editEmergencyContact.trim() || null;
      if (newEmergencyContact !== (profile?.emergency_contact ?? null)) {
        payload.emergency_contact = newEmergencyContact;
      }

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await updateTenantProfile(payload);
      if (result.data) {
        setProfile(result.data);
        setIsEditing(false);
      } else {
        setEditError(result.error || "Failed to save profile");
      }
    } catch {
      setEditError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  }, [editPhone, editEmergencyContact, profile]);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and notification preferences."
      />

      <div className="mt-6 max-w-lg space-y-6">
        {/* Account info from auth store */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Account</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Name</dt>
                <dd className="text-slate-900">{user?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Email</dt>
                <dd className="text-slate-900">{user?.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Role</dt>
                <dd className="text-slate-900">{user?.role ?? "—"}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {/* Owner billing */}
        {isOwner && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-900">Billing</h2>
                </div>
                {!billingLoading && billingStatus && !billingStatus.hasPaymentMethod && (
                  <Button variant="primary" size="sm" onClick={() => setBillingModalOpen(true)} icon={<Plus size={14} />}>
                    Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {billingLoading ? (
                <div className="space-y-3">
                  <Skeleton variant="text" className="h-4 w-48" />
                  <Skeleton variant="text" className="h-4 w-36" />
                </div>
              ) : billingError && !billingStatus ? (
                <p className="text-xs text-slate-400">
                  Could not load billing information. The billing endpoint may not be deployed yet.
                </p>
              ) : billingStatus?.hasPaymentMethod ? (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Payment method</dt>
                    <dd className="text-slate-900">
                      {billingStatus.brand ? `${billingStatus.brand} ` : ""}•••• {billingStatus.last4 ?? "****"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-500">
                  No payment method on file.{" "}
                  <button
                    type="button"
                    onClick={() => setBillingModalOpen(true)}
                    className="font-medium text-brand-600 hover:text-brand-500 transition-colors"
                  >
                    Add one now
                  </button>
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Billing setup modal */}
        <Modal
          open={billingModalOpen}
          onClose={() => setBillingModalOpen(false)}
          title="Add Payment Method"
        >
          <BillingSetupForm
            onSuccess={() => {
              setBillingModalOpen(false);
              loadBillingStatus();
            }}
            onSkip={null}
            title="Add a payment method"
            description="Your card will be securely saved for subscription billing."
          />
        </Modal>

        {/* Tenant profile from /tenants/me with edit */}
        {isTenant && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Tenant Profile</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={profileSource === "live" ? "success" : "neutral"}>
                    {profileSource === "live" ? "Live" : "Unavailable"}
                  </Badge>
                  {profile && !isEditing && (
                    <Button variant="ghost" size="sm" onClick={startEditing} icon={<Pencil size={14} />}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton variant="text" className="h-4 w-48" />
                  <Skeleton variant="text" className="h-4 w-36" />
                </div>
              ) : profile ? (
                isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full rounded-md border border-slate-200 bg-slate-800 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Emergency Contact</label>
                      <input
                        type="text"
                        value={editEmergencyContact}
                        onChange={(e) => setEditEmergencyContact(e.target.value)}
                        placeholder="Name, phone, relationship"
                        maxLength={500}
                        className="w-full rounded-md border border-slate-200 bg-slate-800 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    {editError && (
                      <div className="rounded-md border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs text-red-700">
                        {editError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={saveProfile} loading={isSaving} icon={<Check size={14} />}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving} icon={<X size={14} />}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Phone</dt>
                      <dd className="text-slate-900">{profile.phone ?? "Not set"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Emergency Contact</dt>
                      <dd className="text-slate-900">{profile.emergency_contact ?? "Not set"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Member since</dt>
                      <dd className="text-slate-900">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                )
              ) : (
                <p className="text-xs text-slate-400">
                  Could not load tenant profile. The tenant context endpoint
                  may not be deployed yet.
                </p>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
