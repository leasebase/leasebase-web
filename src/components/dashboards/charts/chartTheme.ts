/**
 * Dashboard chart theme — color palette aligned to Tailwind design tokens.
 *
 * Use these constants in all Recharts components so every chart
 * shares a consistent visual language with the rest of the UI.
 */

export const CHART_COLORS = {
  brand:   "#18D7F0", // lb-color-primary (cyan)
  success: "#5EEA7A", // lb-color-accent (green)
  warning: "#f59e0b", // amber-500
  danger:  "#ef4444", // red-500
  info:    "#18D7F0", // lb-color-primary (cyan)

  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate700: "#334155",
  slate900: "#0f172a",
} as const;

/** Ordered palette for multi-segment charts (donut, stacked bar, etc.) */
export const PALETTE = [
  CHART_COLORS.brand,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
] as const;

/** Shared Recharts tooltip style */
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    fontSize: "0.75rem",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  },
  labelStyle: { fontWeight: 600, color: "#334155" },
} as const;

/** Shared Recharts tooltip style — dark variant for tenant dashboard */
export const TOOLTIP_STYLE_DARK = {
  contentStyle: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "0.5rem",
    fontSize: "0.75rem",
    color: "#e2e8f0",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
  },
  labelStyle: { fontWeight: 600, color: "#f1f5f9" },
} as const;
