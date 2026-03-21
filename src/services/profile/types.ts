/**
 * Profile system — shared types for user, owner, and tenant profile adapters.
 */

import type { DataSource, DomainResult } from "../dashboard/types";

export type { DataSource, DomainResult };

/* ── Base User Profile ── */

export interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string | null;
  timezone?: string;
  language?: string;
}

/* ── Owner Profile ── */

export interface OwnerProfile {
  user_id: string;
  company_name: string | null;
  business_type: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  theme_mode: string;
  logo_url: string | null;
  billing_email: string | null;
  billing_address: string | null;
  tax_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerProfileUpdatePayload {
  company_name?: string | null;
  business_type?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  theme_mode?: "light" | "dark" | "system";
  logo_url?: string | null;
  billing_email?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
}

/* ── Tenant Profile Extensions ── */

export interface TenantProfileExtension {
  user_id: string;
  date_of_birth: string | null;
  occupation: string | null;
  employer_name: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_email: string | null;
  preferred_payment_day: number | null;
  autopay_enabled: boolean;
  communication_preference: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantProfileExtensionUpdatePayload {
  date_of_birth?: string | null;
  occupation?: string | null;
  employer_name?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_email?: string | null;
  preferred_payment_day?: number | null;
  autopay_enabled?: boolean;
  communication_preference?: string | null;
}

/* ── Notification Preferences ── */

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  rent_reminder: boolean;
  lease_updates: boolean;
  maintenance_updates: boolean;
  general_announcements: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreferencesUpdatePayload {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  rent_reminder?: boolean;
  lease_updates?: boolean;
  maintenance_updates?: boolean;
  general_announcements?: boolean;
}
