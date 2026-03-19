/**
 * Owner Portfolio — Types
 *
 * Defines API row shapes, form DTOs, and pagination types for the
 * owner-facing property and unit management screens.
 *
 * Row shapes mirror the actual DB columns returned by the property-service
 * (snake_case). Form DTOs use camelCase to match the API request body.
 */

/* ── API row shapes (from GET /api/properties, /api/properties/:id/units) ── */

export interface PropertyRow {
  id: string;
  organization_id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UnitRow {
  id: string;
  organization_id: string;
  property_id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/* ── Form DTOs (camelCase — matches API request body) ── */

export interface CreatePropertyDTO {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export type UpdatePropertyDTO = Partial<CreatePropertyDTO>;

export interface CreateUnitDTO {
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  status?: string;
}

export type UpdateUnitDTO = Partial<CreateUnitDTO>;

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

/* ── Computed summary for property list ── */

export interface PropertyListItem extends PropertyRow {
  unitCount: number;
  occupiedCount: number;
}

/* ── Unit status constants ── */

export const UNIT_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "OFFLINE",
] as const;

export type UnitStatus = (typeof UNIT_STATUSES)[number];
