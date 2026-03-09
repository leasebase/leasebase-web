/**
 * Document adapter — LIVE (Phase 2).
 *
 * SECURITY: Uses GET /api/documents/mine which resolves tenant identity
 * server-side via JWT → tenant_profiles → lease_id. Only LEASE-related
 * documents are returned. s3_key is excluded from the response.
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult, DocumentRow } from "../types";

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; hasMore: boolean };
}

/** Fetch tenant's lease-related documents — LIVE via GET /api/documents/mine */
export async function fetchTenantDocuments(): Promise<DomainResult<DocumentRow[]>> {
  try {
    const res = await apiRequest<PaginatedResponse<DocumentRow>>({
      path: "api/documents/mine",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return {
      data: [],
      source: "unavailable",
      error: e?.message || "Failed to fetch documents",
    };
  }
}
