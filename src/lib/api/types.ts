import type { UserRole } from "@/lib/config";

export interface Property {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  unitCount?: number;
}

export interface Unit {
  id: string;
  name: string;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  propertyId: string;
}

export interface Lease {
  id: string;
  propertyId: string;
  unitId: string;
  tenantEmail: string;
  rentAmount: number;
  depositAmount?: number;
  startDate: string;
  endDate?: string;
  status: "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED";
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: "CHARGE" | "PAYMENT" | "CREDIT";
  description: string;
  amount: number;
  balanceAfter: number;
}

export interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderComment {
  id: string;
  authorEmail: string;
  message: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  createdAt: string;
  category?: string;
  downloadUrl?: string;
}

export interface OrgUser {
  id: string;
  email: string;
  role: UserRole;
  status: "INVITED" | "ACTIVE" | "DISABLED";
}

export interface OrgProfile {
  id: string;
  name: string;
  slug?: string;
}

export interface BillingSummary {
  planName: string;
  unitCount: number;
  billingPortalUrl?: string;
}

export interface PmDashboardSummary {
  occupancyRate: number;
  delinquentLeaseCount: number;
  openWorkOrderCount: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
}

export interface TenantDashboardSummary {
  balanceDue: number;
  nextDueDate?: string;
  openWorkOrderCount: number;
}
