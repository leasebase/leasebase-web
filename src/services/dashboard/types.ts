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

/* ── Property Summary ── */

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number; // percentage 0-100
}

/* ── Per-domain error tracking ── */

export interface DomainErrors {
  properties: string | null;
  units: string | null;
  leases: string | null;
  payments: string | null;
  ledger: string | null;
  maintenance: string | null;
  activity: string | null;
}

/* ── Full Dashboard Payload ── */

export interface OwnerDashboardData {
  kpis: DashboardKpis;
  alerts: DashboardAlert[];
  recentActivity: ActivityEvent[];
  portfolioHealth: PortfolioHealth;
  properties: PropertySummary[];
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

export interface OwnerDashboardViewModel {
  kpis: KpiGridViewModel;
  alerts: AlertsViewModel;
  activityFeed: ActivityFeedViewModel;
  portfolioHealth: PortfolioHealthViewModel;
  quickActions: QuickActionsViewModel;
  propertiesSummary: PropertiesSummaryViewModel;
  setupStage: SetupStage;
  domainErrors: DomainErrors;
}
