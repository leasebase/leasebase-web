/**
 * Property Manager Dashboard — shared types.
 *
 * Mirrors the Owner/Tenant dashboard pattern: raw domain data, provenance
 * tracking, and per-widget view models. Components consume view models only.
 *
 * GUARDRAIL: PM flows fetch exclusively from /api/pm/* endpoints.
 * The frontend never passes property_id, lease_id, tenant_id, or org_id
 * as authorization hints. All scoping is server-side via
 * manager_property_assignments + organization_id.
 */

import type { DataSource, DomainResult, Sourced } from "../dashboard/types";

// Re-export shared provenance types so consumers only import from pm/types
export type { DataSource, DomainResult, Sourced };

/* ── Setup stage (progressive empty states) ── */

export type PMSetupStage =
  | "no-assignments"  // PM user has no properties assigned
  | "no-units"        // assigned properties have no units
  | "no-leases"       // units exist but no active leases
  | "active";         // at least one active lease — full dashboard

/* ── API row shapes (from /api/pm/* endpoints) ── */

export interface PMPropertyRow {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PMUnitRow {
  id: string;
  property_id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  rent_amount: number; // cents
  status: string;
}

export interface PMLeaseRow {
  id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number; // cents
  deposit_amount: number | null;
  status: "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED";
}

export interface PMTenantRow {
  id: string;
  user_id: string;
  lease_id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface PMWorkOrderRow {
  id: string;
  unit_id: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  description: string;
  assignee_id: string | null;
  tenant_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PMPaymentRow {
  id: string;
  lease_id: string;
  amount: number; // cents
  currency: string;
  method: string | null;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  created_at: string;
}

export interface PMLedgerRow {
  id: string;
  lease_id: string;
  type: "CHARGE" | "PAYMENT" | "CREDIT";
  amount: number; // cents
  currency: string;
  due_date: string;
  status: "PENDING" | "POSTED" | "VOID";
  description: string | null;
}

export interface PMDocumentRow {
  id: string;
  related_type: string;
  related_id: string;
  name: string;
  mime_type: string;
  created_by_user_id: string;
  created_at: string;
}

export interface PMTaskItem {
  id: string;
  type: "lease_renewal" | "vendor_invoice" | "tenant_complaint" | "maintenance" | "payment_overdue";
  title: string;
  severity: "danger" | "warning" | "info";
  link: string;
  due_date?: string;
  created_at: string;
}

/* ── Pagination ── */

export interface PMPaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PMPaginatedResponse<T> {
  data: T[];
  meta: PMPaginationMeta;
}

/* ── Domain errors tracking ── */

export interface PMDomainErrors {
  properties: string | null;
  units: string | null;
  leases: string | null;
  tenants: string | null;
  maintenance: string | null;
  payments: string | null;
  documents: string | null;
  tasks: string | null;
}

/* ── KPIs ── */

export interface PMDashboardKpis {
  totalProperties: Sourced<number>;
  totalUnits: Sourced<number>;
  occupiedUnits: Sourced<number>;
  vacancyRate: Sourced<number>;         // percentage 0-100
  monthlyScheduledRent: Sourced<number>; // cents
  collectedThisMonth: Sourced<number>;   // cents
  overdueAmount: Sourced<number>;        // cents
  openMaintenanceRequests: Sourced<number>;
}

/* ── Full Dashboard Payload ── */

export interface PMDashboardData {
  kpis: PMDashboardKpis;
  properties: PMPropertyRow[];
  units: PMUnitRow[];
  leases: PMLeaseRow[];
  tenants: PMTenantRow[];
  maintenanceRequests: PMWorkOrderRow[];
  recentPayments: PMPaymentRow[];
  tasks: PMTaskItem[];
  setupStage: PMSetupStage;
  domainErrors: PMDomainErrors;
}

/* ── Loading State ── */

export interface PMDashboardState {
  data: PMDashboardData | null;
  isLoading: boolean;
  error: string | null;
}

/* ─────────────────────────────────────────────────── */
/* View-Model interfaces (consumed by widget components) */
/* ─────────────────────────────────────────────────── */

export interface PMKpiItem {
  key: string;
  label: string;
  value: string;      // formatted for display
  rawValue: number;
  change?: string;
  source: DataSource;
  icon: string;       // lucide icon key
  href?: string;
}

export interface PMKpiGridViewModel {
  items: PMKpiItem[];
}

export interface PMTaskViewModel {
  id: string;
  title: string;
  severity: "danger" | "warning" | "info";
  badgeText: string;
  link: string;
}

export interface PMTasksListViewModel {
  tasks: PMTaskViewModel[];
  hasTasks: boolean;
}

export interface PMMaintenanceItem {
  id: string;
  title: string;
  status: string;
  statusVariant: "success" | "warning" | "danger" | "info" | "neutral";
  priority: string;
  date: string;
}

export interface PMMaintenanceWidgetViewModel {
  openCount: number;
  recentRequests: PMMaintenanceItem[];
  source: DataSource;
  hasRequests: boolean;
}

export interface PMPropertySummary {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
}

export interface PMDashboardViewModel {
  kpis: PMKpiGridViewModel;
  tasks: PMTasksListViewModel;
  maintenance: PMMaintenanceWidgetViewModel;
  properties: PMPropertySummary[];
  setupStage: PMSetupStage;
  domainErrors: PMDomainErrors;
}
