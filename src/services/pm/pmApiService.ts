/**
 * PM API Service — Per-domain adapters for Phase 2 pages.
 *
 * All requests go through pmApiRequest() which enforces assertPMPath().
 * Every call targets /api/pm/* exclusively.
 *
 * GUARDRAILS:
 * - Never calls org-wide endpoints (/api/properties, /api/leases, etc.)
 * - Never passes client-side scope hints (property_id, org_id, etc.)
 * - Server resolves all scoping via JWT + manager_property_assignments
 */

import { apiRequest } from "@/lib/api/client";
import { assertPMPath } from "./permissions";
import type {
  PMPaginatedResponse,
  PMPropertyRow,
  PMUnitRow,
  PMTenantRow,
  PMWorkOrderRow,
  PMPaymentRow,
  PMDocumentRow,
} from "./types";

/* ─── Base helper ─── */

async function pmApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  assertPMPath(path);
  return apiRequest<T>({ path, ...init });
}

/* ─── Properties ─── */

export async function fetchPMProperties(
  page = 1, limit = 20,
): Promise<PMPaginatedResponse<PMPropertyRow>> {
  return pmApiRequest(`api/pm/properties?page=${page}&limit=${limit}`);
}

export async function fetchPMProperty(
  id: string,
): Promise<{ data: PMPropertyRow }> {
  return pmApiRequest(`api/pm/properties/${id}`);
}

/* ─── Units ─── */

export async function fetchPMUnits(
  page = 1, limit = 20,
): Promise<PMPaginatedResponse<PMUnitRow & { property_name: string }>> {
  return pmApiRequest(`api/pm/units?page=${page}&limit=${limit}`);
}

export async function fetchPMUnit(
  id: string,
): Promise<{ data: PMUnitRow & { property_name: string } }> {
  return pmApiRequest(`api/pm/units/${id}`);
}

/* ─── Tenants ─── */

export interface PMTenantListRow extends PMTenantRow {
  unit_number: string;
  property_name: string;
}

export interface PMTenantDetailRow extends PMTenantListRow {
  property_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  lease_status: string;
}

export async function fetchPMTenants(
  page = 1, limit = 20,
): Promise<PMPaginatedResponse<PMTenantListRow>> {
  return pmApiRequest(`api/pm/tenants?page=${page}&limit=${limit}`);
}

export async function fetchPMTenant(
  id: string,
): Promise<{ data: PMTenantDetailRow }> {
  return pmApiRequest(`api/pm/tenants/${id}`);
}

/* ─── Maintenance ─── */

export interface PMMaintenanceListRow extends PMWorkOrderRow {
  unit_number: string;
  property_name: string;
}

export async function fetchPMMaintenance(
  page = 1, limit = 20,
): Promise<PMPaginatedResponse<PMMaintenanceListRow>> {
  return pmApiRequest(`api/pm/maintenance?page=${page}&limit=${limit}`);
}

export async function fetchPMMaintenanceItem(
  id: string,
): Promise<{ data: PMMaintenanceListRow & { property_id: string } }> {
  return pmApiRequest(`api/pm/maintenance/${id}`);
}

export async function updatePMMaintenanceStatus(
  id: string, status: string,
): Promise<{ data: PMWorkOrderRow }> {
  return pmApiRequest(`api/pm/maintenance/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export interface PMCommentRow {
  id: string;
  work_order_id: string;
  user_id: string;
  comment: string;
  author_name: string;
  created_at: string;
}

export async function fetchPMMaintenanceComments(
  id: string,
): Promise<{ data: PMCommentRow[] }> {
  return pmApiRequest(`api/pm/maintenance/${id}/comments`);
}

export async function postPMMaintenanceComment(
  id: string, comment: string,
): Promise<{ data: PMCommentRow }> {
  return pmApiRequest(`api/pm/maintenance/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
}

/* ─── Payments ─── */

export interface PMPaymentListRow extends PMPaymentRow {
  unit_number: string;
  property_name: string;
}

export async function fetchPMPayments(
  page = 1, limit = 20,
): Promise<PMPaginatedResponse<PMPaymentListRow>> {
  return pmApiRequest(`api/pm/payments?page=${page}&limit=${limit}`);
}

export async function fetchPMPayment(
  id: string,
): Promise<{ data: PMPaymentListRow & { property_id: string } }> {
  return pmApiRequest(`api/pm/payments/${id}`);
}

/* ─── Documents ─── */

export async function fetchPMDocuments(
  page = 1, limit = 20,
): Promise<PMPaginatedResponse<PMDocumentRow>> {
  return pmApiRequest(`api/pm/documents?page=${page}&limit=${limit}`);
}

export async function fetchPMDocument(
  id: string,
): Promise<{ data: PMDocumentRow }> {
  return pmApiRequest(`api/pm/documents/${id}`);
}
