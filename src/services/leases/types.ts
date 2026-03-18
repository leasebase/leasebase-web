/**
 * Lease Management — Types
 *
 * Defines API row shapes, form DTOs, and constants for the
 * owner-facing lease management screens.
 *
 * Row shapes mirror the canonical DB columns returned by the
 * lease-service (snake_case). Form DTOs use camelCase to match
 * the API request body.
 */

/* ── Tenant on a lease (from lease_tenants join) ── */

export interface LeaseTenantRow {
  id: string;
  name: string;
  role: "PRIMARY" | "OCCUPANT";
}

/* ── API row shape (from GET /api/leases, /api/leases/:id) ── */

export interface LeaseRow {
  id: string;
  org_id: string;
  property_id: string;
  unit_id: string;
  term_type: string;
  status: string;
  start_date: string;
  end_date: string;
  security_deposit: number | null;
  lease_terms: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Enrichment (from cross-schema JOINs)
  property_name?: string;
  unit_number?: string;
  tenants?: LeaseTenantRow[];
}

/* ── Form DTOs (camelCase — matches API request body) ── */

export interface CreateLeaseDTO {
  propertyId: string;
  unitId: string;
  termType: string;
  startDate: string;
  endDate?: string; // required only for CUSTOM
  securityDeposit?: number;
  leaseTerms?: Record<string, unknown>;
}

export type UpdateLeaseDTO = Partial<CreateLeaseDTO>;

export interface RenewLeaseDTO {
  termType: string;
  startDate: string;
  endDate?: string;
  securityDeposit?: number;
  leaseTerms?: Record<string, unknown>;
}

/* ── Pagination ── */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/* ── Status & term type constants ── */

export const LEASE_STATUSES = [
  "DRAFT",
  "ASSIGNED",
  "INVITED",
  "ACKNOWLEDGED",
  "ACTIVE",
  "EXPIRED",
  "EXTENDED",
  "RENEWED",
  "INACTIVE",
] as const;

export type LeaseStatus = (typeof LEASE_STATUSES)[number];

export const TERM_TYPES = [
  "MONTH_TO_MONTH",
  "THREE_MONTH",
  "SIX_MONTH",
  "TWELVE_MONTH",
  "CUSTOM",
] as const;

export type TermType = (typeof TERM_TYPES)[number];

export const TERM_TYPE_LABELS: Record<string, string> = {
  MONTH_TO_MONTH: "Month-to-Month",
  THREE_MONTH: "3 Months",
  SIX_MONTH: "6 Months",
  TWELVE_MONTH: "12 Months",
  CUSTOM: "Custom",
};
