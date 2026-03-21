/**
 * Settings domain — user application behavior and presentation preferences.
 * Canonical source: auth-service GET|PUT /api/settings
 */

import type { DataSource, DomainResult } from "../dashboard/types";

export type { DataSource, DomainResult };

export interface UserSettings {
  user_id: string;
  theme_mode: "light" | "dark" | "system";
  primary_color: string | null;
  secondary_color: string | null;
  default_dashboard: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserSettingsUpdatePayload {
  theme_mode?: "light" | "dark" | "system";
  primary_color?: string | null;
  secondary_color?: string | null;
  default_dashboard?: string | null;
}
