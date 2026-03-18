/**
 * Owner Payment Adapter — LIVE.
 *
 * Fetches payment data from the payments-service via BFF proxy.
 * All endpoints are owner-scoped (org_id from JWT).
 */

import { apiRequest } from "@/lib/api/client";
import type { DomainResult } from "../dashboard/types";

// ── Row types ────────────────────────────────────────────────────────────────

export interface ChargeRow {
  id: string;
  organization_id: string;
  lease_id: string;
  tenant_user_id: string | null;
  type: "RENT" | "SECURITY_DEPOSIT" | "LATE_FEE" | "OTHER";
  amount: number; // cents
  currency: string;
  billing_period: string | null;
  due_date: string;
  status: "PENDING" | "OVERDUE" | "PAID" | "PARTIALLY_PAID" | "VOID" | "CREDITED";
  amount_paid: number; // cents
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionRow {
  id: string;
  organization_id: string;
  charge_id: string | null;
  lease_id: string;
  tenant_user_id: string | null;
  amount: number; // cents
  currency: string;
  method: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED";
  billing_period: string | null; // from charge join
  charge_type: string | null;    // from charge join
  charge_due_date: string | null;
  application_fee_amount: number;
  source: "MANUAL" | "AUTOPAY" | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptRow {
  id: string;
  organization_id: string;
  receipt_number: string;
  amount: number; // cents
  currency: string;
  payment_method_summary: string | null;
  property_name: string | null;
  unit_number: string | null;
  billing_period: string | null;
  tenant_user_id: string;
  lease_id: string;
  created_at: string;
}

export interface ConnectStatus {
  status: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  stripe_account_id: string | null;
}

// ── Paginated response shape ─────────────────────────────────────────────────

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; hasMore: boolean };
}

// ── Adapters ─────────────────────────────────────────────────────────────────

export async function fetchOwnerPayments(
  page = 1,
  limit = 25,
): Promise<DomainResult<PaymentTransactionRow[]>> {
  try {
    const res = await apiRequest<PaginatedResponse<PaymentTransactionRow>>({
      path: `api/payments?page=${page}&limit=${limit}`,
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch payments" };
  }
}

export async function fetchOwnerCharges(
  page = 1,
  limit = 25,
  filters?: { status?: string; leaseId?: string },
): Promise<DomainResult<ChargeRow[]>> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.set("status", filters.status);
    if (filters?.leaseId) params.set("leaseId", filters.leaseId);

    const res = await apiRequest<PaginatedResponse<ChargeRow>>({
      path: `api/payments/charges?${params}`,
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch charges" };
  }
}

export async function fetchOwnerReceipts(
  page = 1,
  limit = 25,
): Promise<DomainResult<ReceiptRow[]>> {
  try {
    const res = await apiRequest<PaginatedResponse<ReceiptRow>>({
      path: `api/payments/receipts?page=${page}&limit=${limit}`,
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: [], source: "unavailable", error: e?.message || "Failed to fetch receipts" };
  }
}

export async function fetchConnectStatus(): Promise<DomainResult<ConnectStatus | null>> {
  try {
    const res = await apiRequest<{ data: ConnectStatus }>({
      path: "api/payments/connect/status",
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to fetch connect status" };
  }
}

export async function startOnboarding(): Promise<DomainResult<{ url: string } | null>> {
  try {
    const res = await apiRequest<{ data: { url: string } }>({
      path: "api/payments/connect/onboard",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl: `${window.location.origin}/app/settings`, refreshUrl: `${window.location.origin}/app/settings` }),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to start onboarding" };
  }
}

export async function getDashboardLink(): Promise<DomainResult<{ url: string } | null>> {
  try {
    const res = await apiRequest<{ data: { url: string } }>({
      path: "api/payments/connect/dashboard-link",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return { data: res.data, source: "live", error: null };
  } catch (e: any) {
    return { data: null, source: "unavailable", error: e?.message || "Failed to get dashboard link" };
  }
}
