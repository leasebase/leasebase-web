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
  /** Owner-facing lease lifecycle status (computed by backend). */
  display_status?: string;
  start_date: string;
  end_date: string;
  rent_amount: number;          // cents — canonical contract rent
  security_deposit: number | null;
  lease_terms: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Phase 1 activation metadata
  activation_mode?: ActivationMode | null;
  document_requirement_status?: DocumentRequirementStatus | null;
  tenant_signature_required?: boolean | null;
  owner_attested_signed_at?: string | null;
  owner_attested_by_user_id?: string | null;
  template_id?: string | null;
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
  rentAmount: number;            // cents — canonical contract rent
  securityDeposit?: number;
  leaseTerms?: Record<string, unknown>;
  activationMode?: ActivationMode;
  templateId?: string;
}

export type UpdateLeaseDTO = Partial<CreateLeaseDTO>;

export interface RenewLeaseDTO {
  termType: string;
  startDate: string;
  endDate?: string;
  rentAmount?: number;           // cents — if omitted, inherits from original lease
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

/** All raw backend statuses (internal state machine). */
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

/**
 * Owner-facing lease lifecycle statuses.
 * ACKNOWLEDGED is now surfaced to the owner so they can take action
 * (upload/confirm document → activate tenancy).
 * ASSIGNED/INVITED still map to DRAFT on the backend display_status.
 * EXPIRED maps to INACTIVE.
 */
export const LEASE_DISPLAY_STATUSES = [
  "DRAFT",
  "ACKNOWLEDGED",
  "ACTIVE",
  "INACTIVE",
  "EXTENDED",
  "RENEWED",
] as const;

export type LeaseDisplayStatus = (typeof LEASE_DISPLAY_STATUSES)[number];

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

/* ── Phase 1 Activation ── */

export const ACTIVATION_MODES = [
  "NEW_LEASE",
  "EXISTING_LEASE",
  // Legacy Phase 1 (backward compat)
  "EXISTING_SIGNED_UPLOAD",
  "OWNER_ATTESTED_NO_DOCUMENT",
  "PLATFORM_ESIGN",
] as const;

export type ActivationMode = (typeof ACTIVATION_MODES)[number];

export const ACTIVATION_MODE_LABELS: Record<ActivationMode, string> = {
  NEW_LEASE: "New lease",
  EXISTING_LEASE: "Existing lease",
  EXISTING_SIGNED_UPLOAD: "Upload existing signed lease",
  OWNER_ATTESTED_NO_DOCUMENT: "Skip document for now",
  PLATFORM_ESIGN: "Create & send for e-signature",
};

export const DOCUMENT_REQUIREMENT_STATUSES = [
  "REQUIRED",
  "WAIVED",
  "SATISFIED",
] as const;

export type DocumentRequirementStatus = (typeof DOCUMENT_REQUIREMENT_STATUSES)[number];
