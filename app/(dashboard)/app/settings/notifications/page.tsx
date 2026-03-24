"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Check, Bell } from "lucide-react";
import {
  fetchPreferenceSchema,
  fetchPreferenceRules,
  savePreferenceRules,
  type PreferenceRule,
  type PreferenceSchema,
} from "@/services/notifications/preferencesV2";

const CATEGORY_LABELS: Record<string, string> = {
  maintenance_request_created: "Maintenance — New Requests",
  maintenance_comment_added: "Maintenance — Comments",
  maintenance_status_changed: "Maintenance — Status Changes",
  lease_updates: "Lease Updates",
  payment_updates: "Payment Updates",
  rent_reminders: "Rent Reminders",
  signature_updates: "Signature Updates",
  general_messages: "General Messages",
  announcements: "Announcements",
};

const MODE_OPTIONS = ["immediate", "off"] as const;
type Mode = "off" | "immediate" | "digest";

/**
 * Notification Preferences v2 — category × channel matrix.
 *
 * Rows: notification categories.  Columns: channels (in_app, email).
 * Each cell: mode selector (Immediate / Off).  Digest shown but disabled.
 */
export default function NotificationPreferencesPage() {
  const [schema, setSchema] = useState<PreferenceSchema | null>(null);
  const [rules, setRules] = useState<PreferenceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, r] = await Promise.all([
          fetchPreferenceSchema(),
          fetchPreferenceRules(),
        ]);
        if (!cancelled) { setSchema(s); setRules(r); }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load preferences");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const getMode = useCallback(
    (category: string, channel: string): Mode => {
      const rule = rules.find((r) => r.category === category && r.channel === channel);
      return rule?.mode ?? "immediate";
    },
    [rules],
  );

  const setMode = useCallback(
    (category: string, channel: string, mode: Mode) => {
      setRules((prev) => {
        const idx = prev.findIndex((r) => r.category === category && r.channel === channel);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], mode };
          return next;
        }
        return [...prev, { category, channel, mode }];
      });
      setDirty(true);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const saved = await savePreferenceRules(rules);
      setRules(saved); setDirty(false);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally { setSaving(false); }
  }, [rules]);

  const channels = (schema?.channels ?? ["in_app", "email"]).filter(
    (ch) => ch === "in_app" || ch === "email",
  );
  const categories = schema?.categories ?? Object.keys(CATEGORY_LABELS);

  if (loading) return (
    <>
      <PageHeader title="Notification Preferences" description="Control how and when you receive notifications." />
      <div className="mt-6 max-w-2xl">
        <Card><CardBody><div className="space-y-3">
          <Skeleton variant="text" className="h-6 w-64" />
          <Skeleton variant="text" className="h-48 w-full rounded-lg" />
        </div></CardBody></Card>
      </div>
    </>
  );

  return (
    <>
      <PageHeader
        title="Notification Preferences"
        description="Control how and when you receive notifications."
        actions={dirty ? (
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving} icon={<Check size={14} />}>Save Changes</Button>
        ) : undefined}
      />
      <div className="mt-6 max-w-2xl space-y-6">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Category × Channel Preferences</h2>
            </div>
          </CardHeader>
          <CardBody>
            {/* Header row */}
            <div className="grid grid-cols-[1fr_100px_100px] gap-2 mb-2">
              <div />
              {channels.map((ch) => (
                <div key={ch} className="text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {ch === "in_app" ? "In-App" : "Email"}
                </div>
              ))}
            </div>

            {/* Category rows */}
            <div className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <div key={cat} className="grid grid-cols-[1fr_100px_100px] gap-2 py-2.5 items-center">
                  <span className="text-sm text-slate-700">{CATEGORY_LABELS[cat] ?? cat}</span>
                  {channels.map((ch) => {
                    const mode = getMode(cat, ch);
                    return (
                      <div key={ch} className="flex justify-center">
                        <select
                          value={mode}
                          onChange={(e) => setMode(cat, ch, e.target.value as Mode)}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {MODE_OPTIONS.map((m) => (
                            <option key={m} value={m}>{m === "immediate" ? "Immediate" : "Off"}</option>
                          ))}
                          <option value="digest" disabled>Digest (coming soon)</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              SMS and Push channels are coming soon and will appear here when available.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
