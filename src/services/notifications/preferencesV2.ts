/**
 * Notification preferences v2 API adapters.
 *
 * Fetches/updates normalized preference rules (category × channel → mode)
 * and entity-level subscriptions (follow/mute).
 */
import { apiRequest } from "@/lib/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PreferenceRule {
  id?: string;
  category: string;
  channel: string;
  mode: "off" | "immediate" | "digest";
}

export interface PreferenceSchema {
  categories: string[];
  channels: string[];
  modes: string[];
}

export interface Subscription {
  id?: string;
  entity_type: string;
  entity_id: string;
  state: "following" | "muted";
}

// ── Schema ───────────────────────────────────────────────────────────────────

export async function fetchPreferenceSchema(): Promise<PreferenceSchema> {
  const res = await apiRequest<{ data: PreferenceSchema }>({
    path: "api/notifications/preferences/schema",
  });
  return res.data;
}

// ── Rules ────────────────────────────────────────────────────────────────────

export async function fetchPreferenceRules(): Promise<PreferenceRule[]> {
  const res = await apiRequest<{ data: PreferenceRule[] }>({
    path: "api/notifications/preferences/rules",
  });
  return res.data;
}

export async function savePreferenceRules(rules: PreferenceRule[]): Promise<PreferenceRule[]> {
  const res = await apiRequest<{ data: PreferenceRule[] }>({
    path: "api/notifications/preferences/rules",
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rules }),
  });
  return res.data;
}

// ── Subscriptions ────────────────────────────────────────────────────────────

export async function fetchSubscription(
  entityType: string,
  entityId: string,
): Promise<Subscription | null> {
  const res = await apiRequest<{ data: Subscription[] }>({
    path: `api/notifications/preferences/subscriptions?entity_type=${entityType}&entity_id=${entityId}`,
  });
  return res.data?.[0] ?? null;
}

export async function upsertSubscription(sub: Subscription): Promise<Subscription> {
  const res = await apiRequest<{ data: Subscription }>({
    path: "api/notifications/preferences/subscriptions",
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
  return res.data;
}
