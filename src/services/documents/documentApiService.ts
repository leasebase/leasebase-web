/**
 * Document API Service
 *
 * Client for document-service endpoints:
 *   - List documents for a lease
 *   - Upload (get presigned URL + create metadata)
 *   - Confirm executed/external status
 *
 * All requests target /api/documents/* (proxied via BFF → document-service).
 */

import { apiRequest } from "@/lib/api/client";

/* ── Types ── */

/** Document statuses aligned with document_service schema */
export type DocumentStatus = "UPLOADED" | "EXECUTED" | "CONFIRMED_EXTERNAL";

export interface DocumentRow {
  id: string;
  organization_id: string;
  related_type: string;
  related_id: string;
  name: string;
  mime_type: string;
  status: DocumentStatus;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  data: DocumentRow;
  uploadUrl: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedDocuments {
  data: DocumentRow[];
  meta: PaginationMeta;
}

/* ── List documents for a lease ── */

export async function fetchLeaseDocuments(
  leaseId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedDocuments> {
  const params = new URLSearchParams({
    relatedType: "LEASE",
    relatedId: leaseId,
    page: String(page),
    limit: String(limit),
  });
  return apiRequest<PaginatedDocuments>({ path: `api/documents?${params}` });
}

/* ── Upload document (create metadata + get presigned URL) ── */

/**
 * Creates document metadata and returns a presigned upload URL.
 * The document starts in UPLOADED status.
 * You must separately PUT the file bytes to the returned uploadUrl.
 */
export async function uploadLeaseDocument(params: {
  leaseId: string;
  name: string;
  mimeType: string;
}): Promise<UploadResponse> {
  return apiRequest<UploadResponse>({
    path: "api/documents/upload",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      relatedType: "LEASE",
      relatedId: params.leaseId,
      name: params.name,
      mimeType: params.mimeType,
    }),
  });
}

/* ── Confirm document execution status ── */

/**
 * Promotes a lease document to EXECUTED or CONFIRMED_EXTERNAL.
 *
 * - CONFIRMED_EXTERNAL: owner confirms a paper/external lease is on file
 * - EXECUTED: lease was signed through the platform
 *
 * Either status qualifies the lease for activation by the lease-service.
 * This is idempotent — calling with the current status returns the same document.
 */
export async function confirmLeaseDocument(
  documentId: string,
  status: "EXECUTED" | "CONFIRMED_EXTERNAL",
): Promise<{ data: DocumentRow }> {
  return apiRequest<{ data: DocumentRow }>({
    path: `api/documents/${documentId}/confirm`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
