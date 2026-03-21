/**
 * Document API Service — Phase 1
 *
 * Client for document-service endpoints.
 * All requests target /api/documents/* (proxied via BFF → document-service).
 */

import { apiRequest } from "@/lib/api/client";

// ── Document categories ──
export const DOCUMENT_CATEGORIES = [
  "LEASE_AGREEMENT",
  "LEASE_ADDENDUM",
  "NOTICE",
  "PAYMENT_RECEIPT",
  "MOVE_IN_CHECKLIST",
  "MOVE_OUT_CHECKLIST",
  "MAINTENANCE_ATTACHMENT",
  "OWNER_UPLOAD",
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

// ── Document statuses (Phase 1 vocabulary) ──
export const DOCUMENT_STATUSES = [
  "DRAFT",
  "UPLOADED",
  "PENDING_TENANT_SIGNATURE",
  "FULLY_EXECUTED",
  "VERIFIED_EXTERNAL",
  "ARCHIVED",
] as const;

export type DocumentStatus = typeof DOCUMENT_STATUSES[number];

/** Human-readable labels for document statuses */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Draft",
  UPLOADED: "Uploaded",
  PENDING_TENANT_SIGNATURE: "Pending Signature",
  FULLY_EXECUTED: "Fully Executed",
  VERIFIED_EXTERNAL: "Verified External",
  ARCHIVED: "Archived",
};

/** Statuses that qualify a document for lease activation */
export const ACTIVATABLE_STATUSES: DocumentStatus[] = [
  "FULLY_EXECUTED",
  "VERIFIED_EXTERNAL",
];

// ── Types ──

export interface DocumentRow {
  id: string;
  organization_id: string;
  category: DocumentCategory;
  status: DocumentStatus;
  related_type: string;
  related_id: string;
  title: string;
  description?: string | null;
  mime_type?: string;
  current_version_id?: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  storage_bucket: string;
  storage_key: string;
  file_name: string;
  original_file_name: string;
  mime_type: string;
  size_bytes?: number | null;
  sha256?: string | null;
  uploaded_by_user_id: string;
  created_at: string;
}

export interface UploadUrlResponse {
  data: DocumentRow;
  version: DocumentVersion;
  uploadUrl: string;
  storageKey: string;
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

export interface LeaseExecutionStatus {
  leaseId: string;
  hasLeaseAgreement: boolean;
  executionStatus: "NONE" | "UPLOADED" | "VERIFIED_EXTERNAL" | "FULLY_EXECUTED";
  documentId: string | null;
}

// ── List documents (owner) ──

export async function fetchDocuments(params: {
  relatedType?: string;
  relatedId?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedDocuments> {
  const q = new URLSearchParams();
  if (params.relatedType) q.set("relatedType", params.relatedType);
  if (params.relatedId) q.set("relatedId", params.relatedId);
  if (params.category) q.set("category", params.category);
  if (params.status) q.set("status", params.status);
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? 20));
  return apiRequest<PaginatedDocuments>({ path: `api/documents?${q}` });
}

/** Convenience wrapper: list documents for a specific lease */
export async function fetchLeaseDocuments(
  leaseId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedDocuments> {
  return fetchDocuments({ relatedType: "LEASE", relatedId: leaseId, page, limit });
}

// ── Upload flow (Phase 1: upload-url + upload-complete) ──

/**
 * Step 1 of upload: creates document + version 1, returns presigned PUT URL.
 */
export async function requestUploadUrl(params: {
  relatedType: string;
  relatedId: string;
  category: DocumentCategory;
  title: string;
  description?: string;
  fileName: string;
  mimeType: string;
}): Promise<UploadUrlResponse> {
  return apiRequest<UploadUrlResponse>({
    path: "api/documents/upload-url",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/**
 * Step 2 of upload: PUT file bytes directly to the presigned S3 URL.
 * Returns the fetch response; caller should check .ok.
 */
export async function putFileToS3(
  presignedUrl: string,
  file: File,
): Promise<Response> {
  return fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
}

/**
 * Step 3 of upload: mark upload complete, transitions document to UPLOADED.
 */
export async function completeUpload(params: {
  documentId: string;
  versionId: string;
  sizeBytes?: number;
  sha256?: string;
}): Promise<{ data: DocumentRow }> {
  return apiRequest<{ data: DocumentRow }>({
    path: "api/documents/upload-complete",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/**
 * Convenience: full upload pipeline — request URL, PUT to S3, complete.
 * Returns the final document row.
 */
export async function uploadDocument(params: {
  relatedType: string;
  relatedId: string;
  category: DocumentCategory;
  title: string;
  description?: string;
  file: File;
}): Promise<DocumentRow> {
  const { data: doc, version, uploadUrl } = await requestUploadUrl({
    relatedType: params.relatedType,
    relatedId: params.relatedId,
    category: params.category,
    title: params.title,
    description: params.description,
    fileName: params.file.name,
    mimeType: params.file.type || "application/octet-stream",
  });

  // Placeholder mode: if backend returned a non-http URL (no S3 bucket configured),
  // skip the S3 PUT step and complete directly. The document record exists in DRAFT
  // and will transition to UPLOADED without actual file storage.
  const isPlaceholder = !uploadUrl.startsWith("http");

  if (!isPlaceholder) {
    const s3Res = await putFileToS3(uploadUrl, params.file);
    if (!s3Res.ok) {
      throw new Error(`File upload failed (${s3Res.status}). Please try again.`);
    }
  }

  const { data: finalDoc } = await completeUpload({
    documentId: doc.id,
    versionId: version.id,
    sizeBytes: params.file.size,
  });

  return finalDoc;
}

// ── Document actions ──

export async function fetchDocumentById(id: string): Promise<{ data: DocumentRow }> {
  return apiRequest<{ data: DocumentRow }>({
    path: `api/documents/${id}`,
  });
}

export async function fetchDocumentDownloadUrl(
  id: string,
): Promise<{ data: DocumentRow; downloadUrl: string }> {
  return apiRequest<{ data: DocumentRow; downloadUrl: string }>({
    path: `api/documents/${id}/download`,
  });
}

export async function markVerifiedExternal(
  documentId: string,
): Promise<{ data: DocumentRow; alreadyVerified?: boolean }> {
  return apiRequest<{ data: DocumentRow; alreadyVerified?: boolean }>({
    path: `api/documents/${documentId}/mark-verified-external`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateDocument(
  documentId: string,
  fields: { title?: string; description?: string; category?: DocumentCategory; status?: DocumentStatus },
): Promise<{ data: DocumentRow }> {
  return apiRequest<{ data: DocumentRow }>({
    path: `api/documents/${documentId}`,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
}

export async function archiveDocument(documentId: string): Promise<void> {
  await apiRequest<void>({
    path: `api/documents/${documentId}`,
    method: "DELETE",
  });
}

// ── Lease execution status ──

export async function fetchLeaseExecutionStatus(
  leaseId: string,
): Promise<{ data: LeaseExecutionStatus }> {
  return apiRequest<{ data: LeaseExecutionStatus }>({
    path: `api/documents/lease/${leaseId}/execution-status`,
  });
}

// ── DEPRECATED (kept for backward compat) ──

/** @deprecated Use uploadDocument() + the upload pipeline instead */
export async function uploadLeaseDocument(params: {
  leaseId: string;
  name: string;
  mimeType: string;
}): Promise<{ data: DocumentRow; uploadUrl: string }> {
  return apiRequest<{ data: DocumentRow; uploadUrl: string }>({
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

/** @deprecated Use markVerifiedExternal() instead */
export async function confirmLeaseDocument(
  documentId: string,
  status: "EXECUTED" | "CONFIRMED_EXTERNAL" | "FULLY_EXECUTED" | "VERIFIED_EXTERNAL",
): Promise<{ data: DocumentRow }> {
  return apiRequest<{ data: DocumentRow }>({
    path: `api/documents/${documentId}/confirm`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
