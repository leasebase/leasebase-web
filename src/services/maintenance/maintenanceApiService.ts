/**
 * Maintenance API Service — Owner / Admin endpoints.
 *
 * Calls the maintenance-service via BFF at /api/maintenance.
 * These endpoints require OWNER role (PM roles being removed — see ADR-001).
 * Server scopes by organizationId from JWT — client never passes orgId.
 */

import { apiRequest } from "@/lib/api/client";

/* ── Types ── */

export interface MaintenanceWorkOrder {
  id: string;
  organization_id: string;
  unit_id: string;
  property_id: string | null;
  created_by_user_id: string;
  tenant_user_id: string | null;
  assignee_id: string | null;
  title: string | null;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "SUBMITTED" | "IN_REVIEW" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" | "CANCELLED";
  description: string;
  entry_permission: string | null;
  contact_preference: string | null;
  availability_notes: string | null;
  request_number: string | null;
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
  work_order_id: string;
  user_id: string;
  comment: string;
  author_name: string;
  created_at: string;
}

export interface MaintenanceAttachment {
  id: string;
  work_order_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  uploaded_by_user_id: string;
  uploader_name: string;
  created_at: string;
}

export interface TimelineEntry {
  id: string;
  type: "event" | "comment";
  event_type: string;
  actor_user_id: string;
  actor_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Server-side aggregated counts by status from GET /api/maintenance/stats. */
export interface MaintenanceStats {
  submitted: number;
  in_review: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  closed: number;
  cancelled: number;
  [key: string]: number;
}

/* ── API functions ── */

/** Fetch aggregated status counts. Requires OWNER. */
export async function fetchMaintenanceStats(): Promise<{ data: MaintenanceStats }> {
  return apiRequest<{ data: MaintenanceStats }>({ path: "api/maintenance/stats" });
}

/** Fetch work orders with optional filters. Requires OWNER. */
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

/** Update the status of a work order. Requires OWNER. */
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

/** Assign a work order. Requires OWNER. v2: supports name + type. */
export async function assignMaintenanceWorkOrder(
  id: string,
  assignment: { assigneeId?: string; assigneeName?: string; assigneeType?: "self" | "external" },
): Promise<{ data: MaintenanceWorkOrder }> {
  return apiRequest<{ data: MaintenanceWorkOrder }>({
    path: `api/maintenance/${id}/assign`,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignment),
  });
}

/** Cancel a work order. Allowed from SUBMITTED / IN_REVIEW. */
export async function cancelMaintenanceWorkOrder(
  id: string,
): Promise<{ data: MaintenanceWorkOrder }> {
  return apiRequest<{ data: MaintenanceWorkOrder }>({
    path: `api/maintenance/${id}/cancel`,
    method: "POST",
  });
}

/** Fetch attachments for a work order. */
export async function fetchMaintenanceAttachments(
  id: string,
): Promise<{ data: MaintenanceAttachment[] }> {
  return apiRequest<{ data: MaintenanceAttachment[] }>({ path: `api/maintenance/${id}/attachments` });
}

/** Upload an attachment to a work order. */
export async function uploadMaintenanceAttachment(
  id: string,
  attachment: { fileUrl: string; fileType: string; fileName: string },
): Promise<{ data: MaintenanceAttachment }> {
  return apiRequest<{ data: MaintenanceAttachment }>({
    path: `api/maintenance/${id}/attachments`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attachment),
  });
}

/** Fetch the unified timeline for a work order. */
export async function fetchMaintenanceTimeline(
  id: string,
): Promise<{ data: TimelineEntry[] }> {
  return apiRequest<{ data: TimelineEntry[] }>({ path: `api/maintenance/${id}/timeline` });
}

/** Update work order fields. Requires OWNER. */
export async function updateMaintenanceWorkOrder(
  id: string,
  fields: Partial<{
    title: string;
    category: string;
    priority: string;
    description: string;
    scheduledDate: string | null;
    assigneeName: string | null;
  }>,
): Promise<{ data: MaintenanceWorkOrder }> {
  return apiRequest<{ data: MaintenanceWorkOrder }>({
    path: `api/maintenance/${id}`,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
}
