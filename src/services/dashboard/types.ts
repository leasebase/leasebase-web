/**
 * Owner Dashboard — shared types.
 *
 * These interfaces define the data shapes consumed by dashboard widgets.
 * The service layer returns these regardless of whether data comes from
 * real API calls or stub adapters.
 */

/* ── Data provenance ── */

/** Indicates where a value came from. */
export type DataSource = "live" | "stub" | "unavailable";

/** Wraps a value with its provenance. */
export interface Sourced<T> {
  value: T;
  source: DataSource;
}

/* ── Per-domain fetch result ── */

export interface DomainResult<T> {
  data: T;
  source: DataSource;
  error: string | null;
}

/* ── Setup stage (progressive empty states) ── */

export type SetupStage =
  | "no-properties"
  | "no-units"
  | "no-leases"
  | "no-payments"
  | "active";

/* ── KPIs ── */

export interface DashboardKpis {
  totalProperties: Sourced<number>;
  totalUnits: Sourced<number>;
  occupiedUnits: Sourced<number>;
  vacancyRate: Sourced<number>; // percentage 0-100
  monthlyScheduledRent: Sourced<number>; // cents
  collectedThisMonth: Sourced<number>; // cents
  overdueAmount: Sourced<number>; // cents
  openMaintenanceRequests: Sourced<number>;
}

/* ── Alerts ── */

export type AlertSeverity = "danger" | "warning" | "info";

export type AlertType =
  | "LATE_RENT"
  | "LEASE_EXPIRING"
  | "MAINTENANCE_AGING"
  | "SETUP_INCOMPLETE";

export interface DashboardAlert {
  type: AlertType;
  severity: AlertSeverity;
  count: number;
  message: string;
  link: string;
}

/* ── Activity Feed ── */

export type ActivityEventType =
  | "PAYMENT_RECEIVED"
  | "TENANT_INVITED"
  | "MAINTENANCE_CREATED"
  | "MAINTENANCE_COMPLETED"
  | "LEASE_RENEWED"
  | "LEASE_TERMINATED";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string;
  timestamp: string; // ISO 8601
  link?: string;
}

/* ── Portfolio Health ── */

export interface PortfolioHealth {
  occupancyRate: Sourced<number>; // percentage 0-100
  collectionRate: Sourced<number>; // percentage 0-100
  openWorkOrders: Sourced<number>;
  trendAvailable: boolean;
}

/* ── Cash Flow / Receivables ── */

export interface CashFlowPropertyBreakdown {
  propertyId: string;
  propertyName: string;
  billed: number;     // cents
  collected: number;  // cents
  overdue: number;    // cents
}

export interface CashFlowData {
  billedThisMonth: Sourced<number>;     // cents
  collectedThisMonth: Sourced<number>;  // cents
  overdueAmount: Sourced<number>;       // cents
  upcomingDue: Sourced<number>;         // cents (next 30 days)
  perProperty: CashFlowPropertyBreakdown[];
}

/* ── Maintenance Overview ── */

export interface MaintenanceOverviewData {
  open: Sourced<number>;
  inProgress: Sourced<number>;
  waiting: Sourced<number>;   // OPEN older than 3 days with no assignee
  urgent: Sourced<number>;    // priority === HIGH
  oldestOpenAgeDays: Sourced<number>;
  mostAffectedProperty: Sourced<{ id: string; name: string; count: number } | null>;
}

/* ── Lease Risk / Expirations ── */

export interface LeaseExpirationItem {
  leaseId: string;
  unitId: string;
  endDate: string;  // ISO
  daysLeft: number;
  rentAmount: number; // cents
}

export interface LeaseRiskData {
  expiring30: Sourced<number>;
  expiring60: Sourced<number>;
  monthToMonth: Sourced<number>;
  topExpirations: LeaseExpirationItem[];
}

/* ── Vacancy / Setup Readiness ── */

export interface VacancyReadinessData {
  vacantUnits: Sourced<number>;
  readyToLease: Sourced<number>;    // vacant + has rent configured
  missingRentConfig: Sourced<number>; // vacant + rent_amount === 0
  missingSetup: Sourced<number>;    // units with no active lease AND no rent
}

/* ── Property Health Row (for DataTable) ── */

export interface PropertyHealthRow {
  id: string;
  name: string;
  totalUnits: number;
  occupancy: number;          // percentage 0-100
  collectedCents: number;
  billedCents: number;
  overdueCents: number;
  openMaintenance: number;
  expiringLeases: number;     // within 60 days
  status: "healthy" | "attention" | "critical";
}

/* ── Property Summary (legacy) ── */

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number; // percentage 0-100
}

/* ── Document Row ── */

export interface DocumentRow {
  id: string;
  related_type: string;
  related_id: string;
  name: string;
  created_at: string;
}

/* ── Per-domain error tracking ── */

export interface DomainErrors {
  properties: string | null;
  units: string | null;
  leases: string | null;
  payments: string | null;
  ledger: string | null;
  maintenance: string | null;
  documents: string | null;
  activity: string | null;
}

/* ── Full Dashboard Payload ── */

export interface OwnerDashboardData {
  kpis: DashboardKpis;
  alerts: DashboardAlert[];
  recentActivity: ActivityEvent[];
  portfolioHealth: PortfolioHealth;
  cashFlow: CashFlowData;
  maintenanceOverview: MaintenanceOverviewData;
  leaseRisk: LeaseRiskData;
  vacancyReadiness: VacancyReadinessData;
  propertyHealth: PropertyHealthRow[];
  properties: PropertySummary[];
  documentCount: number;
  setupStage: SetupStage;
  domainErrors: DomainErrors;
}

/* ── Loading State ── */

export interface OwnerDashboardState {
  data: OwnerDashboardData | null;
  isLoading: boolean;
  error: string | null;
}

/* ─────────────────────────────────────────────────── */
/* View-Model interfaces (consumed by widget components) */
/* ─────────────────────────────────────────────────── */

export interface KpiItem {
  key: string;
  label: string;
  value: string; // formatted for display
  rawValue: number;
  change?: string;
  source: DataSource;
  icon: string; // lucide icon key
  href?: string; // click-through link
}

export interface KpiGridViewModel {
  items: KpiItem[];
}

export interface AlertsViewModel {
  alerts: DashboardAlert[];
  hasAlerts: boolean;
}

export interface ActivityFeedViewModel {
  events: ActivityEvent[];
  isStub: boolean; // true = all data is stub
}

export interface PortfolioHealthViewModel {
  occupancyRate: Sourced<number>;
  collectionRate: Sourced<number>;
  openWorkOrders: Sourced<number>;
  trendAvailable: boolean;
}

export interface QuickAction {
  label: string;
  href: string;
  icon: string;
  priority: "primary" | "secondary";
}

export interface QuickActionsViewModel {
  actions: QuickAction[];
}

export interface PropertiesSummaryViewModel {
  properties: PropertySummary[];
  hasProperties: boolean;
}

/* ── New block VMs ── */

export interface CashFlowBreakdownVM {
  propertyId: string;
  propertyName: string;
  billed: string;     // formatted
  collected: string;  // formatted
  overdue: string;    // formatted
}

export interface CashFlowViewModel {
  billedThisMonth: string;
  collectedThisMonth: string;
  overdueAmount: string;
  upcomingDue: string;
  collectionPercent: number; // 0-100
  perProperty: CashFlowBreakdownVM[];
  source: DataSource;
}

export interface MaintenanceOverviewViewModel {
  open: number;
  inProgress: number;
  waiting: number;
  urgent: number;
  oldestOpenAgeDays: number;
  mostAffectedProperty: { id: string; name: string; count: number } | null;
  source: DataSource;
}

export interface LeaseExpirationVM {
  leaseId: string;
  unitId: string;
  endDate: string;  // formatted
  daysLeft: number;
  rentAmount: string; // formatted
}

export interface LeaseRiskViewModel {
  expiring30: number;
  expiring60: number;
  monthToMonth: number;
  topExpirations: LeaseExpirationVM[];
  source: DataSource;
}

export interface VacancyReadinessViewModel {
  vacantUnits: number;
  readyToLease: number;
  missingRentConfig: number;
  missingSetup: number;
  source: DataSource;
}

export interface PropertyHealthViewModel {
  rows: PropertyHealthRow[];
  hasData: boolean;
}

export interface PageHeaderViewModel {
  title: string;
  subtitle: string;
}

export interface OwnerDashboardViewModel {
  header: PageHeaderViewModel;
  kpis: KpiGridViewModel;
  alerts: AlertsViewModel;
  activityFeed: ActivityFeedViewModel;
  portfolioHealth: PortfolioHealthViewModel;
  cashFlow: CashFlowViewModel;
  maintenanceOverview: MaintenanceOverviewViewModel;
  leaseRisk: LeaseRiskViewModel;
  vacancyReadiness: VacancyReadinessViewModel;
  propertyHealthTable: PropertyHealthViewModel;
  quickActions: QuickActionsViewModel;
  propertiesSummary: PropertiesSummaryViewModel;
  setupStage: SetupStage;
  domainErrors: DomainErrors;
}
