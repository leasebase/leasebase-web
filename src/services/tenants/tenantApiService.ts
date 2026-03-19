/**
 * Tenant API Service — Owner/Admin tenant management endpoints.
 *
 * All requests target /api/tenants/* (proxied to tenant-service via BFF).
 */

import { apiRequest } from "@/lib/api/client";

/* ── Types ── */

export interface TenantListRow {
  id: string;
  source_type: "TENANT_PROFILE" | "INVITATION";
  tenant_profile_id: string | null;
  invitation_id: string | null;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  /** INVITED | JOINED | ACTIVE | INACTIVE */
  status: string;
  emergency_contact: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  notes: string | null;
  lease_id: string | null;
  lease_status: string | null;
  property_id: string | null;
  property_name: string | null;
  unit_id: string | null;
  unit_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantDetailRow extends TenantListRow {
  start_date: string | null;
  end_date: string | null;
  monthly_rent: number | null;
}

export interface LeaseHistoryRow {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  rent_amount: number;
  deposit_amount: number | null;
  property_name: string | null;
  unit_number: string | null;
  created_at: string;
}

export interface PaymentHistoryRow {
  id: string;
  lease_id: string;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  created_at: string;
}

export interface MaintenanceHistoryRow {
  id: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  unit_number: string | null;
  property_name: string | null;
  created_at: string;
}

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

/* ── List / Search ── */

export async function fetchTenants(
  opts: { page?: number; limit?: number; search?: string; status?: string } = {},
): Promise<PaginatedResponse<TenantListRow>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("limit", String(opts.limit ?? 20));
  if (opts.search) params.set("search", opts.search);
  if (opts.status) params.set("status", opts.status);
  return apiRequest({ path: `api/tenants?${params}` });
}

/* ── Detail ── */

export async function fetchTenant(id: string): Promise<{ data: TenantDetailRow }> {
  return apiRequest({ path: `api/tenants/${id}` });
}

/* ── Update ── */

export async function updateTenant(
  id: string,
  body: { phone?: string; emergency_contact?: string; move_in_date?: string; move_out_date?: string; notes?: string },
): Promise<{ data: TenantDetailRow }> {
  return apiRequest({
    path: `api/tenants/${id}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ── Lifecycle ── */

export async function deactivateTenant(id: string): Promise<{ data: TenantDetailRow }> {
  return apiRequest({ path: `api/tenants/${id}/deactivate`, method: "POST" });
}

export async function reactivateTenant(id: string): Promise<{ data: TenantDetailRow }> {
  return apiRequest({ path: `api/tenants/${id}/reactivate`, method: "POST" });
}

/* ── History ── */

export async function fetchTenantLeases(
  id: string, page = 1, limit = 20,
): Promise<PaginatedResponse<LeaseHistoryRow>> {
  return apiRequest({ path: `api/tenants/${id}/leases?page=${page}&limit=${limit}` });
}

export async function fetchTenantPayments(
  id: string, page = 1, limit = 20,
): Promise<PaginatedResponse<PaymentHistoryRow>> {
  return apiRequest({ path: `api/tenants/${id}/payments?page=${page}&limit=${limit}` });
}

export async function fetchTenantMaintenance(
  id: string, page = 1, limit = 20,
): Promise<PaginatedResponse<MaintenanceHistoryRow>> {
  return apiRequest({ path: `api/tenants/${id}/maintenance?page=${page}&limit=${limit}` });
}
