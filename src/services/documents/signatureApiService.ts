/**
 * Signature Request API Service — Phase 2
 *
 * Client for document-service signature request endpoints.
 * All requests target /api/documents/* (proxied via BFF → document-service).
 */

import { apiRequest } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SignerType = "OWNER" | "TENANT" | "WITNESS";
export type SignerStatus = "PENDING" | "VIEWED" | "SIGNED" | "DECLINED" | "FAILED";
export type SignatureRequestStatus =
  | "DRAFT"
  | "REQUESTED"
  | "PARTIALLY_SIGNED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export interface SignatureRequestSigner {
  id: string;
  signature_request_id: string;
  signer_type: SignerType;
  user_id: string;
  email?: string | null;
  display_name?: string | null;
  routing_order: number;
  status: SignerStatus;
  signed_at?: string | null;
  created_at: string;
}

export interface SignatureRequestEvent {
  id: string;
  signature_request_id: string;
  event_type: string;
  payload_json: Record<string, unknown>;
  created_at: string;
}

export interface SignatureRequestRow {
  id: string;
  document_id: string;
  organization_id: string;
  provider: string;
  provider_request_id?: string | null;
  status: SignatureRequestStatus;
  requested_by_user_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  signers?: SignatureRequestSigner[];
  events?: SignatureRequestEvent[];
}

// ── Status labels ─────────────────────────────────────────────────────────────

export const SIGNATURE_REQUEST_STATUS_LABELS: Record<SignatureRequestStatus, string> = {
  DRAFT:            "Draft",
  REQUESTED:        "Awaiting signatures",
  PARTIALLY_SIGNED: "Partially signed",
  COMPLETED:        "Completed",
  CANCELLED:        "Cancelled",
  FAILED:           "Failed",
};

export const SIGNER_STATUS_LABELS: Record<SignerStatus, string> = {
  PENDING:  "Pending",
  VIEWED:   "Viewed",
  SIGNED:   "Signed ✓",
  DECLINED: "Declined",
  FAILED:   "Failed",
};

// ── API calls ─────────────────────────────────────────────────────────────────

export async function createSignatureRequest(
  documentId: string,
  signers: {
    user_id: string;
    signer_type?: SignerType;
    email?: string;
    display_name?: string;
    routing_order?: number;
  }[],
): Promise<{ data: SignatureRequestRow }> {
  return apiRequest<{ data: SignatureRequestRow }>({
    path: `api/documents/documents/${documentId}/signature-requests`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signers }),
  });
}

export async function fetchSignatureRequestsForDocument(
  documentId: string,
): Promise<{ data: SignatureRequestRow[] }> {
  return apiRequest<{ data: SignatureRequestRow[] }>({
    path: `api/documents/documents/${documentId}/signature-requests`,
  });
}

export async function fetchSignatureRequestById(
  id: string,
): Promise<{ data: SignatureRequestRow }> {
  return apiRequest<{ data: SignatureRequestRow }>({
    path: `api/documents/signature-requests/${id}`,
  });
}

export async function cancelSignatureRequest(
  id: string,
): Promise<{ data: SignatureRequestRow; alreadyCancelled?: boolean }> {
  return apiRequest<{ data: SignatureRequestRow; alreadyCancelled?: boolean }>({
    path: `api/documents/signature-requests/${id}/status`,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CANCELLED" }),
  });
}

export async function signRequest(
  requestId: string,
  signerId: string,
): Promise<{
  data: { signatureRequest: SignatureRequestRow; signer: SignatureRequestSigner };
  alreadySigned?: boolean;
}> {
  return apiRequest({
    path: `api/documents/signature-requests/${requestId}/sign`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signerId }),
  });
}
