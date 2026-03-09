"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pencil, X, Check } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import {
  fetchTenantProfile,
  updateTenantProfile,
  type TenantProfileUpdatePayload,
} from "@/services/tenant/adapters/profileAdapter";
import type { TenantProfileRow } from "@/services/tenant/types";

/**
 * Settings — shows tenant profile from /tenants/me with edit support (Phase 2).
 * PATCH /api/tenants/me for phone, emergency_contact, notification_preferences.
 */
export default function Page() {
  const { user } = authStore();
  const isTenant = user?.persona === "tenant";
  const [profile, setProfile] = useState<TenantProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(isTenant);
  const [profileSource, setProfileSource] = useState<string>("stub");

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
            <h2 className="text-sm font-semibold text-slate-100">Account</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Name</dt>
                <dd className="text-slate-100">{user?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Email</dt>
                <dd className="text-slate-100">{user?.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Role</dt>
                <dd className="text-slate-100">{user?.role ?? "—"}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {/* Tenant profile from /tenants/me with edit */}
        {isTenant && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">Tenant Profile</h2>
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
                        className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
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
                        className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    {editError && (
                      <div className="rounded-md border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
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
                      <dd className="text-slate-100">{profile.phone ?? "Not set"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Emergency Contact</dt>
                      <dd className="text-slate-100">{profile.emergency_contact ?? "Not set"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Lease ID</dt>
                      <dd className="text-slate-100 font-mono text-xs">
                        {profile.lease_id ?? "Not linked"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Member since</dt>
                      <dd className="text-slate-100">
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
