import { api } from "@/lib/api/http";
import type {
  BillingSummary,
  Document,
  Lease,
  LedgerEntry,
  OrgProfile,
  OrgUser,
  PmDashboardSummary,
  Property,
  TenantDashboardSummary,
  Unit,
  WorkOrder,
  WorkOrderComment
} from "@/lib/api/types";

// PM area

export async function getPmDashboard(): Promise<PmDashboardSummary> {
  const res = await api.get<PmDashboardSummary>("/pm/dashboard");
  return res.data;
}

export async function listProperties(): Promise<Property[]> {
  const res = await api.get<Property[]>("/pm/properties");
  return res.data;
}

export async function listLeases(): Promise<Lease[]> {
  const res = await api.get<Lease[]>("/pm/leases");
  return res.data;
}

export async function listWorkOrders(): Promise<WorkOrder[]> {
  const res = await api.get<WorkOrder[]>("/pm/work-orders");
  return res.data;
}

export async function listDocuments(): Promise<Document[]> {
  const res = await api.get<Document[]>("/pm/documents");
  return res.data;
}

export async function getOrgProfile(): Promise<OrgProfile> {
  const res = await api.get<OrgProfile>("/pm/settings/org");
  return res.data;
}

export async function listOrgUsers(): Promise<OrgUser[]> {
  const res = await api.get<OrgUser[]>("/pm/settings/users");
  return res.data;
}

export async function getBillingSummary(): Promise<BillingSummary> {
  const res = await api.get<BillingSummary>("/pm/billing/summary");
  return res.data;
}

export async function getLeaseLedger(leaseId: string): Promise<LedgerEntry[]> {
  const res = await api.get<LedgerEntry[]>(`/pm/leases/${leaseId}/ledger`);
  return res.data;
}

export async function getLeaseById(leaseId: string): Promise<Lease> {
  const res = await api.get<Lease>(`/pm/leases/${leaseId}`);
  return res.data;
}

export async function getPropertyWithUnits(
  propertyId: string
): Promise<{ property: Property; units: Unit[] }> {
  const res = await api.get<{ property: Property; units: Unit[] }>(
    `/pm/properties/${propertyId}`
  );
  return res.data;
}

export async function getUnitById(unitId: string): Promise<Unit> {
  const res = await api.get<Unit>(`/pm/units/${unitId}`);
  return res.data;
}

export async function listWorkOrderComments(
  workOrderId: string
): Promise<WorkOrderComment[]> {
  const res = await api.get<WorkOrderComment[]>(`/pm/work-orders/${workOrderId}/comments`);
  return res.data;
}

// Tenant area

export async function getTenantDashboard(): Promise<TenantDashboardSummary> {
  const res = await api.get<TenantDashboardSummary>("/tenant/dashboard");
  return res.data;
}

export async function listTenantPayments(): Promise<any[]> {
  const res = await api.get<any[]>("/tenant/payments");
  return res.data;
}

export async function listTenantWorkOrders(): Promise<WorkOrder[]> {
  const res = await api.get<WorkOrder[]>("/tenant/maintenance");
  return res.data;
}

export async function listTenantDocuments(): Promise<Document[]> {
  const res = await api.get<Document[]>("/tenant/documents");
  return res.data;
}
