import { apiRequest } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/apiBase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TenantInvitation {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string;
  invited_email: string;
  invited_first_name: string;
  invited_last_name: string;
  invited_phone?: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expires_at: string;
  created_at: string;
  property_name?: string;
  unit_number?: string;
  inviter_name?: string;
}

export interface CreateInvitationPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  propertyId: string;
  unitId: string;
  leaseStart?: string;
  leaseEnd?: string;
  monthlyRent?: number;
  securityDeposit?: number;
}

export interface InvitationAcceptInfo {
  id: string;
  invitedEmail: string;
  invitedFirstName: string;
  invitedLastName: string;
  propertyName: string;
  unitNumber: string;
  inviterName: string;
  expiresAt: string;
  status: string;
}

export interface AcceptInvitationPayload {
  token: string;
  password: string;
}

// ── Protected endpoints (require auth) ─────────────────────────────────────

export async function createInvitation(
  payload: CreateInvitationPayload,
): Promise<{ data: TenantInvitation }> {
  return apiRequest({
    path: "api/tenants/invitations",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchInvitations(
  page = 1,
  limit = 20,
): Promise<{ data: TenantInvitation[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  return apiRequest({
    path: `api/tenants/invitations?page=${page}&limit=${limit}`,
  });
}

export async function resendInvitation(
  id: string,
): Promise<{ data: { id: string; status: string; expires_at: string } }> {
  return apiRequest({
    path: `api/tenants/invitations/${id}/resend`,
    method: "POST",
  });
}

export async function revokeInvitation(
  id: string,
): Promise<{ data: { id: string; status: string } }> {
  return apiRequest({
    path: `api/tenants/invitations/${id}/revoke`,
    method: "POST",
  });
}

// ── Public endpoints (no auth) ─────────────────────────────────────────────

export async function fetchInvitationByToken(
  token: string,
): Promise<{ data: InvitationAcceptInfo }> {
  const base = getApiBaseUrl();
  const url = `${base}/api/tenants/invitations/accept?token=${encodeURIComponent(token)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Request failed (${res.status})`;
    let code = "UNKNOWN";
    try {
      const body = JSON.parse(text);
      message = body?.error?.message || message;
      code = body?.error?.code || code;
    } catch { /* non-JSON */ }
    const err = new Error(message) as Error & { code: string; status: number };
    err.code = code;
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export async function acceptInvitation(
  payload: AcceptInvitationPayload,
): Promise<{ data: { accepted: boolean; email: string; message: string } }> {
  const base = getApiBaseUrl();
  const url = `${base}/api/tenants/invitations/accept`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Request failed (${res.status})`;
    let code = "UNKNOWN";
    try {
      const body = JSON.parse(text);
      message = body?.error?.message || message;
      code = body?.error?.code || code;
    } catch { /* non-JSON */ }
    const err = new Error(message) as Error & { code: string; status: number };
    err.code = code;
    err.status = res.status;
    throw err;
  }

  return res.json();
}
