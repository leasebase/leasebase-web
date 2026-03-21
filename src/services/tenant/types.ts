/**
 * Tenant Dashboard — shared types.
 *
 * Mirrors the Owner dashboard pattern: raw domain data, provenance tracking,
 * and per-widget view models. Components consume view models only.
 */

import type { DataSource, DomainResult, Sourced } from "../dashboard/types";

// Re-export shared provenance types so consumers only import from tenant/types
export type { DataSource, DomainResult, Sourced };

/* ── Setup stage (progressive empty states) ── */

export type TenantSetupStage =
  | "no-profile"         // user is TENANT but has no tenant_profile row
  | "no-lease"           // tenant profile exists but no lease found for current org
  | "pending-activation" // lease exists (DRAFT/ASSIGNED/INVITED/ACKNOWLEDGED) — not yet active
  | "lease-ended"        // lease exists but status is INACTIVE, EXPIRED, or RENEWED
  | "active";            // active lease found

/* ── API row shapes ── */

export interface TenantProfileRow {
  id: string;
  user_id: string;
  /**
   * @deprecated Use GET /tenants/me/leases to resolve lease(s) via lease_tenants.
   * Kept for backward compat; will be removed once all consumers migrate.
   */
  lease_id: string | null;
  phone: string | null;
  emergency_contact: string | null;
  notification_preferences: Record<string, boolean> | null;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LeaseRow {
  id: string;
  organization_id: string;
  unit_id: string;
  term_type: string;
  start_date: string;
  end_date: string;
  deposit_amount: number | null;
  /** Monthly rent in cents — from lease.rent_amount (added in enriched /me/leases endpoint). Absent on non-enriched responses. */
  rent_amount?: number | null;
  status: "DRAFT" | "ASSIGNED" | "INVITED" | "ACKNOWLEDGED" | "ACTIVE" | "EXPIRED" | "EXTENDED" | "RENEWED" | "INACTIVE";
  created_at: string;
  updated_at?: string;
  /** Enriched via JOIN in /me/leases */
  property_name?: string | null;
  property_address?: string | null;
  unit_number?: string | null;
  organization_name?: string | null;
  tenants?: Array<{ id: string; name: string; role: string }>;
}

export interface PaymentRow {
  id: string;
  organization_id: string;
  lease_id: string;
  amount: number; // cents
  currency: string;
  method: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED";
  charge_id: string | null;
  billing_period: string | null;
  charge_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderRow {
  id: string;
  organization_id: string;
  unit_id: string;
  property_id: string | null;
  created_by_user_id: string;
  tenant_user_id: string | null;
  title: string | null;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "SUBMITTED" | "IN_REVIEW" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" | "CANCELLED";
  description: string;
  entry_permission: string | null;
  contact_preference: string | null;
  availability_notes: string | null;
  request_number: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  scheduled_date: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  /* Enriched via JOIN */
  unit_number?: string;
  property_name?: string;
}

export interface WorkOrderCommentRow {
  id: string;
  work_order_id: string;
  user_id: string;
  comment: string;
  author_name: string;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  organization_id: string;
  related_type: string;
  related_id: string;
  /** Phase 1: canonical title (replaces legacy 'name' column). */
  title: string;
  /** Legacy column — may be null for Phase 1 uploads. Use 'title' for display. */
  name?: string;
  category?: string;
  status?: string;
  mime_type?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface PaymentMethodRow {
  id: string;
  type: string;
  last4: string | null;
  brand: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
  status: "ACTIVE" | "DETACHED" | "FAILED";
  created_at: string;
}

export interface AutopayStatus {
  enabled: boolean;
  status: "ENABLED" | "DISABLED" | "PAUSED";
  lease_id: string | null;
  enrollment_id: string | null;
  payment_method: {
    id: string;
    type: string;
    last4: string | null;
    brand: string | null;
  } | null;
}

export interface SetupIntentResult {
  clientSecret: string;
  setupIntentId: string;
  customerId: string;
  publishableKey: string;
}

export interface NotificationRow {
  id: string;
  organization_id: string;
  recipient_user_id: string;
  sender_user_id: string;
  title: string;
  body: string;
  type: string;
  related_type: string | null;
  related_id: string | null;
  read_at: string | null;
  created_at: string;
}

/* ── Domain errors tracking ── */

export interface TenantDomainErrors {
  profile: string | null;
  lease: string | null;
  payments: string | null;
  maintenance: string | null;
  documents: string | null;
  notifications: string | null;
}

/* ── Full Dashboard Payload ── */

export interface TenantDashboardData {
  profile: TenantProfileRow | null;
  lease: LeaseRow | null;
  payments: PaymentRow[];
  recentPayments: PaymentRow[];         // last 3 for dashboard widget
  maintenanceRequests: WorkOrderRow[];
  openMaintenanceCount: number;
  documents: DocumentRow[];
  notifications: NotificationRow[];
  unreadNotificationCount: number;
  setupStage: TenantSetupStage;
  domainErrors: TenantDomainErrors;
  sources: {
    profile: DataSource;
    lease: DataSource;
    payments: DataSource;
    maintenance: DataSource;
    documents: DataSource;
    notifications: DataSource;
  };
}

/* ── Loading State ── */

export interface TenantDashboardState {
  data: TenantDashboardData | null;
  isLoading: boolean;
  error: string | null;
}

/* ─────────────────────────────────────────────────── */
/* View-Model interfaces (consumed by widget components) */
/* ─────────────────────────────────────────────────── */

export type PaymentStatus = "due" | "due-soon" | "overdue" | "paid" | "pending" | "failed";

export interface TenantKpiHeaderViewModel {
  rentAmount: string;           // formatted, e.g. "$1,450"
  rentAmountCents: number;
  dueDate: string;              // formatted, e.g. "March 1, 2026"
  dueDateRaw: string;           // ISO date for comparison
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  leaseAddress: string;         // e.g. "Unit 1A, Oak Terrace Apartments"
  leaseUnit: string;            // e.g. "3B"
  propertyName: string;         // e.g. "Oak Terrace Apartments"
  leaseDates: string;           // e.g. "Jan 2024 – Dec 2026"
  leaseStatus: string;
  source: DataSource;
}

export interface TenantQuickAction {
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface TenantActionCardsViewModel {
  actions: TenantQuickAction[];
}

export interface TenantPaymentItem {
  id: string;
  date: string;           // formatted
  amount: string;         // formatted
  method: string;
  status: string;
  statusVariant: "success" | "warning" | "danger" | "info" | "neutral";
}

export interface TenantPaymentsWidgetViewModel {
  nextPayment: {
    amount: string;
    dueDate: string;
    status: PaymentStatus;
  } | null;
  recentPayments: TenantPaymentItem[];
  source: DataSource;
  hasPayments: boolean;
}

export interface TenantMaintenanceItem {
  id: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  statusVariant: "success" | "warning" | "danger" | "info" | "neutral";
  date: string;
}

export interface TenantMaintenanceWidgetViewModel {
  openCount: number;
  recentRequests: TenantMaintenanceItem[];
  source: DataSource;
  hasRequests: boolean;
}

export interface TenantDocumentItem {
  id: string;
  name: string;
  mimeType: string;
  date: string;
}

export interface TenantDocumentsWidgetViewModel {
  documents: TenantDocumentItem[];
  source: DataSource;
  hasDocuments: boolean;
}

export interface TenantNotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;             // relative time string
  isUnread: boolean;
  link: string | null;
}

export interface TenantNotificationsWidgetViewModel {
  items: TenantNotificationItem[];
  unreadCount: number;
  source: DataSource;
  hasNotifications: boolean;
}

export interface TenantDashboardViewModel {
  kpiHeader: TenantKpiHeaderViewModel;
  actionCards: TenantActionCardsViewModel;
  payments: TenantPaymentsWidgetViewModel;
  maintenance: TenantMaintenanceWidgetViewModel;
  documents: TenantDocumentsWidgetViewModel;
  notifications: TenantNotificationsWidgetViewModel;
  setupStage: TenantSetupStage;
  domainErrors: TenantDomainErrors;
}
