/**
 * Maintenance API Service — Owner / Admin endpoints.
 *
 * Calls the maintenance-service via BFF at /api/maintenance.
 * These endpoints require ORG_ADMIN, PM_STAFF, or OWNER role.
 * Server scopes by organizationId from JWT — client never passes orgId.
 */

import { apiRequest } from "@/lib/api/client";

/* ── Types ── */

export interface MaintenanceWorkOrder {
  id: string;
  organizationId: string;
  unitId: string;
  createdByUserId: string;
  tenantUserId: string | null;
  assigneeId: string | null;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  description: string;
  /** Resolved via JOIN from Unit — present on list/detail reads. */
  propertyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceListFilters {
  status?: string;
  priority?: string;
  propertyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface MaintenanceComment {
  id: string;
  workOrderId: string;
  userId: string;
  comment: string;
  authorName: string;
  createdAt: string;
}

/** Server-side aggregated counts by status from GET /api/maintenance/stats. */
export interface MaintenanceStats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  [key: string]: number;
}

/* ── API functions ── */

/** Fetch aggregated status counts. Requires ORG_ADMIN | PM_STAFF | OWNER. */
export async function fetchMaintenanceStats(): Promise<{ data: MaintenanceStats }> {
  return apiRequest<{ data: MaintenanceStats }>({ path: "api/maintenance/stats" });
}

/** Fetch work orders with optional filters. Requires ORG_ADMIN | PM_STAFF | OWNER. */
export async function fetchMaintenanceList(
  filters: MaintenanceListFilters = {},
): Promise<PaginatedResponse<MaintenanceWorkOrder>> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.propertyId) params.set("propertyId", filters.propertyId);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const qs = params.toString();
  const path = qs ? `api/maintenance?${qs}` : "api/maintenance";

  return apiRequest<PaginatedResponse<MaintenanceWorkOrder>>({ path });
}

/** Fetch a single work order by ID. */
export async function fetchMaintenanceDetail(
  id: string,
): Promise<{ data: MaintenanceWorkOrder }> {
  return apiRequest<{ data: MaintenanceWorkOrder }>({ path: `api/maintenance/${id}` });
}

/** Fetch comments for a work order. */
export async function fetchMaintenanceComments(
  id: string,
): Promise<{ data: MaintenanceComment[] }> {
  return apiRequest<{ data: MaintenanceComment[] }>({ path: `api/maintenance/${id}/comments` });
}

/** Post a comment on a work order. */
export async function postMaintenanceComment(
  id: string,
  comment: string,
): Promise<{ data: MaintenanceComment }> {
  return apiRequest<{ data: MaintenanceComment }>({
    path: `api/maintenance/${id}/comments`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
}

/** Update the status of a work order. Requires ORG_ADMIN | PM_STAFF | OWNER. */
export async function updateMaintenanceStatus(
  id: string,
  status: string,
): Promise<{ data: MaintenanceWorkOrder }> {
  return apiRequest<{ data: MaintenanceWorkOrder }>({
    path: `api/maintenance/${id}/status`,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

/** Assign a work order. Requires ORG_ADMIN | PM_STAFF | OWNER. */
export async function assignMaintenanceWorkOrder(
  id: string,
  assigneeId: string,
): Promise<{ data: MaintenanceWorkOrder }> {
  return apiRequest<{ data: MaintenanceWorkOrder }>({
    path: `api/maintenance/${id}/assign`,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assigneeId }),
  });
}
