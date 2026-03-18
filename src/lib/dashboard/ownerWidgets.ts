/**
 * Owner dashboard — widget registry.
 *
 * Each entry maps to an existing component. The `vmKey` tells the dashboard
 * renderer which slice of `OwnerDashboardViewModel` to pass as `vm` prop.
 */

import type { WidgetDefinition } from "./widgetRegistry";

import { KpiGrid } from "@/components/dashboards/owner/KpiGrid";
import { CashFlowCard } from "@/components/dashboards/owner/CashFlowCard";
import { MaintenanceOverviewCard } from "@/components/dashboards/owner/MaintenanceOverviewCard";
import { LeaseRiskCard } from "@/components/dashboards/owner/LeaseRiskCard";
import { VacancyReadinessCard } from "@/components/dashboards/owner/VacancyReadinessCard";
import { PropertyHealthTable } from "@/components/dashboards/owner/PropertyHealthTable";
import { PortfolioHealthWidget } from "@/components/dashboards/owner/PortfolioHealth";
import { ActivityFeed } from "@/components/dashboards/owner/ActivityFeed";
import { AlertsPanel } from "@/components/dashboards/owner/AlertsPanel";
import { QuickActions } from "@/components/dashboards/owner/QuickActions";

export const OWNER_WIDGETS: WidgetDefinition[] = [
  {
    id: "owner-kpi-grid",
    type: "metric",
    role: "owner",
    title: "KPI Overview",
    defaultPosition: 0,
    defaultEnabled: true,
    defaultSize: "full",
    component: KpiGrid,
    vmKey: "kpis",
  },
  {
    id: "owner-cash-flow",
    type: "chart",
    role: "owner",
    title: "Cash Flow & Receivables",
    defaultPosition: 1,
    defaultEnabled: true,
    defaultSize: "half",
    component: CashFlowCard,
    vmKey: "cashFlow",
  },
  {
    id: "owner-maintenance",
    type: "chart",
    role: "owner",
    title: "Maintenance Overview",
    defaultPosition: 2,
    defaultEnabled: true,
    defaultSize: "half",
    component: MaintenanceOverviewCard,
    vmKey: "maintenanceOverview",
  },
  {
    id: "owner-lease-risk",
    type: "chart",
    role: "owner",
    title: "Lease Risk & Expirations",
    defaultPosition: 3,
    defaultEnabled: true,
    defaultSize: "half",
    component: LeaseRiskCard,
    vmKey: "leaseRisk",
  },
  {
    id: "owner-vacancy",
    type: "metric",
    role: "owner",
    title: "Vacancy & Readiness",
    defaultPosition: 4,
    defaultEnabled: true,
    defaultSize: "half",
    component: VacancyReadinessCard,
    vmKey: "vacancyReadiness",
  },
  {
    id: "owner-property-health",
    type: "table",
    role: "owner",
    title: "Property Health",
    defaultPosition: 5,
    defaultEnabled: true,
    defaultSize: "full",
    component: PropertyHealthTable,
    vmKey: "propertyHealthTable",
  },
  {
    id: "owner-activity-feed",
    type: "feed",
    role: "owner",
    title: "Recent Activity",
    defaultPosition: 6,
    defaultEnabled: true,
    defaultSize: "half",
    component: ActivityFeed,
    vmKey: "activityFeed",
  },
  {
    id: "owner-alerts",
    type: "feed",
    role: "owner",
    title: "Alerts",
    defaultPosition: 7,
    defaultEnabled: true,
    defaultSize: "half",
    component: AlertsPanel,
    vmKey: "alerts",
  },
  {
    id: "owner-portfolio-health",
    type: "chart",
    role: "owner",
    title: "Portfolio Health",
    defaultPosition: 8,
    defaultEnabled: true,
    defaultSize: "full",
    component: PortfolioHealthWidget,
    vmKey: "portfolioHealth",
  },
  {
    id: "owner-quick-actions",
    type: "action",
    role: "owner",
    title: "Quick Actions",
    defaultPosition: 9,
    defaultEnabled: true,
    defaultSize: "full",
    component: QuickActions,
    vmKey: "quickActions",
  },
];
