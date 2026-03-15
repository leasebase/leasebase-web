/**
 * Dashboard preference persistence — V1 (localStorage).
 *
 * Stores per-role widget preferences in localStorage.
 * Falls back gracefully if localStorage is unavailable.
 *
 * ## Future: Backend persistence
 * When a backend endpoint is available (e.g. PUT /api/preferences/dashboard),
 * the `savePreferences` function should be extended to sync to the server.
 * Schema recommendation:
 *   dashboard_preferences (
 *     id UUID PRIMARY KEY,
 *     user_id TEXT NOT NULL,
 *     organization_id TEXT NOT NULL,
 *     role TEXT NOT NULL,       -- 'owner' | 'tenant'
 *     config JSONB NOT NULL,    -- UserWidgetPref[]
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     updated_at TIMESTAMPTZ DEFAULT NOW(),
 *     UNIQUE (user_id, role)
 *   )
 * Endpoints:
 *   GET  /api/preferences/dashboard
 *   PUT  /api/preferences/dashboard
 *   DELETE /api/preferences/dashboard  (reset to defaults)
 */

import type { UserWidgetPref } from "./widgetRegistry";

const STORAGE_VERSION = 2;
const KEY_PREFIX = `lb-dashboard-prefs-v${STORAGE_VERSION}`;

function storageKey(role: "owner" | "tenant"): string {
  return `${KEY_PREFIX}-${role}`;
}

/** Validate that a stored entry has the required shape. */
function isValidPref(p: unknown): p is UserWidgetPref {
  return (
    typeof p === "object" &&
    p !== null &&
    typeof (p as Record<string, unknown>).widgetId === "string" &&
    typeof (p as Record<string, unknown>).enabled === "boolean" &&
    typeof (p as Record<string, unknown>).position === "number"
  );
}

/** Load saved preferences for the given role. Returns empty array if none saved. */
export function loadPreferences(role: "owner" | "tenant"): UserWidgetPref[] {
  try {
    const raw = localStorage.getItem(storageKey(role));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Only keep entries that have the required shape
    return parsed.filter(isValidPref);
  } catch {
    return [];
  }
}

/** Save preferences to localStorage. */
export function savePreferences(role: "owner" | "tenant", prefs: UserWidgetPref[]): void {
  try {
    localStorage.setItem(storageKey(role), JSON.stringify(prefs));
  } catch {
    // localStorage full or unavailable — silently fail for V1
  }
}

/** Clear saved preferences for the given role (returns to defaults). */
export function resetPreferences(role: "owner" | "tenant"): void {
  try {
    localStorage.removeItem(storageKey(role));
  } catch {
    // noop
  }
}
