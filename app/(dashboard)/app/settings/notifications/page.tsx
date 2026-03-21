"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { Check, X, Bell } from "lucide-react";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/profile/adapters";
import type { NotificationPreferences } from "@/services/profile/types";

/**
 * Notification Preferences page — canonical source: /api/notifications/preferences.
 *
 * Phase 2: also manages communication_preference and preferred_payment_day,
 * which are now canonically owned by notification-service.
 */
export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Channel toggles
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  // Category toggles
  const [rentReminder, setRentReminder] = useState(true);
  const [leaseUpdates, setLeaseUpdates] = useState(true);
  const [maintenanceUpdates, setMaintenanceUpdates] = useState(true);
  const [generalAnnouncements, setGeneralAnnouncements] = useState(true);
  // Phase 2 fields
  const [commPref, setCommPref] = useState("");
  const [paymentDay, setPaymentDay] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchNotificationPreferences();
      if (!cancelled && result.data) setPrefs(result.data);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const startEdit = useCallback(() => {
    setEmailEnabled(prefs?.email_enabled ?? true);
    setSmsEnabled(prefs?.sms_enabled ?? false);
    setPushEnabled(prefs?.push_enabled ?? false);
    setRentReminder(prefs?.rent_reminder ?? true);
    setLeaseUpdates(prefs?.lease_updates ?? true);
    setMaintenanceUpdates(prefs?.maintenance_updates ?? true);
    setGeneralAnnouncements(prefs?.general_announcements ?? true);
    setCommPref(prefs?.communication_preference ?? "");
    setPaymentDay(prefs?.preferred_payment_day?.toString() ?? "");
    setError(null);
    setEditing(true);
  }, [prefs]);

  const save = useCallback(async () => {
    setSaving(true); setError(null);
    const result = await updateNotificationPreferences({
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      push_enabled: pushEnabled,
      rent_reminder: rentReminder,
      lease_updates: leaseUpdates,
      maintenance_updates: maintenanceUpdates,
      general_announcements: generalAnnouncements,
      communication_preference: commPref || null,
      preferred_payment_day: paymentDay ? parseInt(paymentDay, 10) : null,
    });
    if (result.data) { setPrefs(result.data); setEditing(false); }
    else setError(result.error || "Save failed");
    setSaving(false);
  }, [emailEnabled, smsEnabled, pushEnabled, rentReminder, leaseUpdates, maintenanceUpdates, generalAnnouncements, commPref, paymentDay]);

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );

  if (loading) return (
    <>
      <PageHeader title="Notification Preferences" description="Manage how and when you receive notifications." />
      <div className="mt-6 max-w-lg"><Card><CardBody><div className="space-y-3"><Skeleton variant="text" className="h-4 w-48" /><Skeleton variant="text" className="h-4 w-36" /></div></CardBody></Card></div>
    </>
  );

  return (
    <>
      <PageHeader title="Notification Preferences" description="Manage how and when you receive notifications." />
      <div className="mt-6 max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Preferences</h2>
              </div>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={startEdit} icon={<span className="text-xs">Edit</span>}>Edit</Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {editing ? (
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
                <hr className="border-slate-200" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Communication</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Channel</label>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rent Reminder Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(e.target.value)}
                    placeholder="Day of month (1-31)"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="primary" size="sm" onClick={save} loading={saving} icon={<Check size={14} />}>Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setError(null); }} disabled={saving} icon={<X size={14} />}>Cancel</Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Field label="Email" value={prefs?.email_enabled ? "Enabled" : "Disabled"} />
                <Field label="SMS" value={prefs?.sms_enabled ? "Enabled" : "Disabled"} />
                <Field label="Push" value={prefs?.push_enabled ? "Enabled" : "Disabled"} />
                <Field label="Rent Reminders" value={prefs?.rent_reminder ? "On" : "Off"} />
                <Field label="Lease Updates" value={prefs?.lease_updates ? "On" : "Off"} />
                <Field label="Maintenance" value={prefs?.maintenance_updates ? "On" : "Off"} />
                <Field label="Announcements" value={prefs?.general_announcements ? "On" : "Off"} />
                <Field label="Preferred Channel" value={prefs?.communication_preference || "Not set"} />
                <Field label="Rent Reminder Day" value={prefs?.preferred_payment_day?.toString() || "Not set"} />
              </dl>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
