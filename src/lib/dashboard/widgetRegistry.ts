/**
 * Dashboard widget registry — types and layout engine.
 *
 * The registry defines the full list of available widgets per role.
 * The layout engine merges saved user preferences with the registry
 * to produce the final ordered list of widgets to render.
 */

import type { ComponentType } from "react";

/* ── Widget definition ── */

export type WidgetType = "chart" | "metric" | "table" | "feed" | "action";
export type WidgetSize = "full" | "half";
export type WidgetRole = "owner" | "tenant";

export interface WidgetDefinition {
  /** Unique stable identifier (e.g. "owner-kpi-grid") */
  id: string;
  type: WidgetType;
  role: WidgetRole;
  title: string;
  /** Default position index (0-based, lower = higher on page) */
  defaultPosition: number;
  defaultEnabled: boolean;
  defaultSize: WidgetSize;
  /**
   * The React component to render.
   * It will receive the full dashboard ViewModel as props
   * and extract what it needs via vmKey.
   */
  component: ComponentType<any>;
  /** Key in the ViewModel object to pass as the widget's `vm` prop */
  vmKey?: string;
}

/* ── User preference ── */

export interface UserWidgetPref {
  widgetId: string;
  enabled: boolean;
  position: number;
  size?: WidgetSize;
}

/* ── Resolved widget (ready to render) ── */

export interface ResolvedWidget {
  definition: WidgetDefinition;
  enabled: boolean;
  position: number;
  size: WidgetSize;
}

/* ── Layout engine ── */

/**
 * Merge saved user preferences with the default widget registry.
 *
 * Rules:
 * 1. For each widget in `defaults`, look for a matching pref by widgetId.
 * 2. If a pref exists, use its enabled/position/size values.
 * 3. If no pref exists (new widget added to registry), use defaults.
 * 4. Stale prefs (widgetId not in registry) are silently ignored.
 * 5. Sort by position ascending.
 */
export function mergePreferences(
  defaults: WidgetDefinition[],
  prefs: UserWidgetPref[],
): ResolvedWidget[] {
  const prefMap = new Map(prefs.map((p) => [p.widgetId, p]));

  const resolved: ResolvedWidget[] = defaults.map((def) => {
    const pref = prefMap.get(def.id);
    return {
      definition: def,
      enabled: pref ? pref.enabled : def.defaultEnabled,
      position: pref ? pref.position : def.defaultPosition,
      size: pref?.size ?? def.defaultSize,
    };
  });

  resolved.sort((a, b) => a.position - b.position);

  // Safety: if prefs result in zero enabled widgets, fall back to defaults.
  // This prevents a blank dashboard from corrupted or overly-aggressive prefs.
  const anyEnabled = resolved.some((w) => w.enabled);
  if (!anyEnabled && defaults.length > 0) {
    return defaults
      .map((def) => ({
        definition: def,
        enabled: def.defaultEnabled,
        position: def.defaultPosition,
        size: def.defaultSize,
      }))
      .sort((a, b) => a.position - b.position);
  }

  return resolved;
}

/** Convert resolved widgets back to a preference array (for saving). */
export function toPreferences(widgets: ResolvedWidget[]): UserWidgetPref[] {
  return widgets.map((w, i) => ({
    widgetId: w.definition.id,
    enabled: w.enabled,
    position: i,
    size: w.size,
  }));
}
