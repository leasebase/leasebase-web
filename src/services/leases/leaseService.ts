/**
 * Lease Management — Lease Service
 *
 * API client for lease CRUD, terminate, and renew operations.
 * Uses /api/leases endpoints — scoped by org_id from the JWT.
 *
 * GUARDRAILS:
 * - Never passes org_id as authorization hints
 * - Server resolves all scoping via JWT
 * - All write operations return the created/updated row
 */

import { apiRequest } from "@/lib/api/client";
import type {
  LeaseRow,
  PaginatedResponse,
  CreateLeaseDTO,
  UpdateLeaseDTO,
  RenewLeaseDTO,
} from "./types";

/* ─── Filter types ─── */

export interface LeaseFilters {
  status?: string;
  propertyId?: string;
  unitId?: string;
}

/* ─── Read ─── */

export async function fetchLeases(
  page = 1,
  limit = 50,
  filters?: LeaseFilters,
): Promise<PaginatedResponse<LeaseRow>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.status) params.set("status", filters.status);
  if (filters?.propertyId) params.set("propertyId", filters.propertyId);
  if (filters?.unitId) params.set("unitId", filters.unitId);

  return apiRequest<PaginatedResponse<LeaseRow>>({
    path: `api/leases?${params.toString()}`,
  });
}

export async function fetchLease(
  id: string,
): Promise<{ data: LeaseRow }> {
  return apiRequest<{ data: LeaseRow }>({
    path: `api/leases/${id}`,
  });
}

/* ─── Write ─── */

export async function createLease(
  dto: CreateLeaseDTO,
): Promise<{ data: LeaseRow }> {
  return apiRequest<{ data: LeaseRow }>({
    path: "api/leases",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function updateLease(
  id: string,
  dto: UpdateLeaseDTO,
): Promise<{ data: LeaseRow }> {
  return apiRequest<{ data: LeaseRow }>({
    path: `api/leases/${id}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

/* ─── Lifecycle ─── */

export async function terminateLease(
  id: string,
  reason?: string,
): Promise<{ data: LeaseRow }> {
  return apiRequest<{ data: LeaseRow }>({
    path: `api/leases/${id}/terminate`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export async function renewLease(
  id: string,
  dto: RenewLeaseDTO,
): Promise<{ data: LeaseRow }> {
  return apiRequest<{ data: LeaseRow }>({
    path: `api/leases/${id}/renew`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

/**
 * Activate a lease that is in ACKNOWLEDGED status.
 *
 * Requirements (enforced server-side):
 *   - Lease must be in ACKNOWLEDGED status.
 *   - At least one lease document must be in EXECUTED or CONFIRMED_EXTERNAL status.
 *
 * On success, atomically transitions:
 *   - Lease → ACTIVE
 *   - All joined TenantProfile rows → ACTIVE
 *   - Unit → OCCUPIED
 */
export async function activateLease(
  id: string,
): Promise<{ data: LeaseRow }> {
  return apiRequest<{ data: LeaseRow }>({
    path: `api/leases/${id}/activate`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}
