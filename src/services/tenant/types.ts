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
  | "no-profile"     // user is TENANT but has no tenant_profile row
  | "no-lease"       // tenant profile exists but lease_id is null or lease not found
  | "lease-ended"    // lease exists but status is TERMINATED or EXPIRED
  | "active";        // active lease found

/* ── API row shapes ── */

export interface TenantProfileRow {
  id: string;
  user_id: string;
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
  start_date: string;
  end_date: string;
  rent_amount: number; // cents
  deposit_amount: number | null;
  status: "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED";
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  organization_id: string;
  lease_id: string;
  amount: number; // cents
  currency: string;
  method: string | null;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  ledger_entry_id: string | null;
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
  name: string;
  mime_type: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
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
  leaseAddress: string;         // e.g. "Unit 1A, 123 Main St"
  leaseUnit: string;
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
