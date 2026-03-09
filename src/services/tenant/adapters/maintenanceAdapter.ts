/**
 * Maintenance adapter — LIVE (Phase 2).
 *
 * SECURITY: Uses GET /api/maintenance/mine which filters server-side by
 * created_by_user_id from JWT. Client never supplies user ID.
 *
 * Live operations:
 *   - GET  /api/maintenance/mine  (tenant's own work orders)
 *   - POST /api/maintenance  (create work order)
 *   - GET  /api/maintenance/:id  (single work order detail)
 *   - GET  /api/maintenance/:id/comments
 *   - POST /api/maintenance/:id/comments
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, WorkOrderRow, WorkOrderCommentRow } from "../types";

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; hasMore: boolean };
}

/** List tenant's own work orders — LIVE via GET /api/maintenance/mine */
export async function fetchTenantMaintenance(): Promise<DomainResult<WorkOrderRow[]>> {
  try {
    const res = await apiRequest<PaginatedResponse<WorkOrderRow>>({
      path: "api/maintenance/mine",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: [],
      source: "unavailable",
      error: e?.message || "Failed to fetch maintenance requests",
    };
  }
}

/** Create a new work order — LIVE. POST /api/maintenance is safe (sets created_by_user_id server-side). */
export async function createMaintenanceRequest(payload: {
  unit_id: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  description: string;
}): Promise<WorkOrderRow> {
  const res = await apiRequest<{ data: WorkOrderRow }>({
    path: "api/maintenance",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** Get a single work order by ID — LIVE. Safe for single-record access. */
export async function fetchMaintenanceDetail(
  id: string
): Promise<DomainResult<WorkOrderRow | null>> {
  try {
    const res = await apiRequest<{ data: WorkOrderRow }>({
      path: `api/maintenance/${id}`,
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: null,
      source: "unavailable",
      error: e?.message || "Failed to fetch work order",
    };
  }
}

/** Get comments for a work order — LIVE. */
export async function fetchMaintenanceComments(
  workOrderId: string
): Promise<DomainResult<WorkOrderCommentRow[]>> {
  try {
    const res = await apiRequest<{ data: WorkOrderCommentRow[] }>({
      path: `api/maintenance/${workOrderId}/comments`,
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: [],
      source: "unavailable",
      error: e?.message || "Failed to fetch comments",
    };
  }
}

/** Add a comment to a work order — LIVE. */
export async function addMaintenanceComment(
  workOrderId: string,
  comment: string
): Promise<WorkOrderCommentRow> {
  const res = await apiRequest<{ data: WorkOrderCommentRow }>({
    path: `api/maintenance/${workOrderId}/comments`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  return res.data;
}
