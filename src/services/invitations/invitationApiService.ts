import { apiRequest } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/apiBase";

// ── Typed API error (carries error code from backend responses) ────────────
export class InvitationApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "InvitationApiError";
  }
}

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
  /** True if the invited email already has a LeaseBase account (multi-lease). */
  existingUser?: boolean;
}

export interface AcceptInvitationPayload {
  token: string;
  /** Password is optional for existing users (multi-lease link). */
  password?: string;
  legalAcceptance?: Array<{ slug: string; version: string; hash?: string }>;
}

// ── Protected endpoints (require auth) ─────────────────────────────────────

export async function createInvitation(
  payload: CreateInvitationPayload,
): Promise<{ data: TenantInvitation }> {
  const base = getApiBaseUrl();
  const url = `${base}/api/tenants/invitations`;

  // Use raw fetch so we can extract both code + message from the error body.
  const state = (await import("@/lib/auth/store")).authStore.getState();
  const { getIdToken } = await import("@/lib/auth/tokens");
  const headers = new Headers({ "Content-Type": "application/json" });
  if (state.mode === "cognito") {
    const token = getIdToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } else if (state.mode === "devBypass" && state.devBypass) {
    headers.set("x-dev-user-email", state.devBypass.email);
    headers.set("x-dev-user-role", state.devBypass.role);
    headers.set("x-dev-org-id", state.devBypass.orgId);
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Request failed (${res.status})`;
    let code = "UNKNOWN";
    try {
      const body = JSON.parse(text);
      message = body?.error?.message || body?.message || message;
      code = body?.error?.code || code;
    } catch { /* non-JSON */ }
    throw new InvitationApiError(message, code, res.status);
  }

  return res.json();
}

export async function fetchInvitations(
  page = 1,
  limit = 20,
): Promise<{ data: TenantInvitation[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  return apiRequest({
    path: `api/tenants/invitations?page=${page}&limit=${limit}`,
  });
}

/**
 * Fetch PENDING invitations for a specific unit.
 *
 * Pulls the first page of invitations and filters client-side by unit_id +
 * status. This is safe given typical invitation volumes per org.
 */
export async function fetchPendingInvitationsForUnit(
  unitId: string,
): Promise<TenantInvitation[]> {
  const res = await fetchInvitations(1, 200);
  return res.data.filter(
    (inv) => inv.unit_id === unitId && inv.status === "PENDING",
  );
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
): Promise<{ data: { accepted: boolean; email: string; message: string; existingUser?: boolean } }> {
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
