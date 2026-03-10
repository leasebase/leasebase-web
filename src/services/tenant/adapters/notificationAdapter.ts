/**
 * Notification adapter — fetches tenant's notifications.
 *
 * The notification-service already scopes by recipient_user_id,
 * so no client-side filtering is needed.
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, NotificationRow } from "../types";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export async function fetchTenantNotifications(): Promise<
  DomainResult<NotificationRow[]>
> {
  try {
    // Fetch first page only for dashboard (limit 20 most recent)
    const res = await apiRequest<PaginatedResponse<NotificationRow>>({
      path: "api/notifications?limit=20&page=1",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: [],
      source: "unavailable",
      error: e?.message || "Failed to fetch notifications",
    };
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest({
    path: `api/notifications/${id}/read`,
    method: "PATCH",
  });
}
