/**
 * Lease Management — Types
 *
 * Defines API row shapes, form DTOs, and constants for the
 * owner-facing lease management screens.
 *
 * Row shapes mirror the canonical DB columns returned by the
 * lease-service (snake_case). Form DTOs use camelCase to match
 * the API request body.
 *
 * NOTE: tenant_name enrichment is deferred. The frontend displays
 * tenant_id as a raw value (or "Not assigned") until a follow-up
 * adds tenant name resolution.
 */

/* ── API row shape (from GET /api/leases, /api/leases/:id) ── */

export interface LeaseRow {
  id: string;
  org_id: string;
  property_id: string;
  unit_id: string;
  tenant_id: string | null;
  lease_type: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_rent: number; // cents
  security_deposit: number | null;
  lease_terms: Record<string, unknown> | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  // Enrichment (optional, from cross-schema JOIN)
  property_name?: string;
  unit_number?: string;
}

/* ── Form DTOs (camelCase — matches API request body) ── */

export interface CreateLeaseDTO {
  propertyId: string;
  unitId: string;
  tenantId?: string;
  leaseType?: string;
  status?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number; // cents
  securityDeposit?: number;
  leaseTerms?: Record<string, unknown>;
  signedAt?: string;
}

export type UpdateLeaseDTO = Partial<CreateLeaseDTO>;

export interface RenewLeaseDTO {
  startDate: string;
  endDate: string;
  monthlyRent: number; // cents
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

/* ── Status & type constants ── */

export const LEASE_STATUSES = [
  "DRAFT",
  "PENDING",
  "ACTIVE",
  "TERMINATED",
  "EXPIRED",
] as const;

export type LeaseStatus = (typeof LEASE_STATUSES)[number];

export const LEASE_TYPES = [
  "FIXED_TERM",
  "MONTH_TO_MONTH",
] as const;

export type LeaseType = (typeof LEASE_TYPES)[number];
