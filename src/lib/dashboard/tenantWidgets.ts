/**
 * Tenant dashboard — widget registry.
 */

import type { WidgetDefinition } from "./widgetRegistry";

import { TenantKpiHeader } from "@/components/dashboards/tenant/TenantKpiHeader";
import { TenantActionCards } from "@/components/dashboards/tenant/TenantActionCards";
import { TenantMaintenanceWidget } from "@/components/dashboards/tenant/TenantMaintenanceWidget";
import { TenantPaymentsWidget } from "@/components/dashboards/tenant/TenantPaymentsWidget";
import { TenantDocumentsWidget } from "@/components/dashboards/tenant/TenantDocumentsWidget";
import { TenantNotificationsWidget } from "@/components/dashboards/tenant/TenantNotificationsWidget";

export const TENANT_WIDGETS: WidgetDefinition[] = [
  {
    id: "tenant-kpi-header",
    type: "metric",
    role: "tenant",
    title: "Lease & Payment Status",
    defaultPosition: 0,
    defaultEnabled: true,
    defaultSize: "full",
    component: TenantKpiHeader,
    vmKey: "kpiHeader",
  },
  {
    id: "tenant-actions",
    type: "action",
    role: "tenant",
    title: "Quick Actions",
    defaultPosition: 1,
    defaultEnabled: true,
    defaultSize: "full",
    component: TenantActionCards,
    vmKey: "actionCards",
  },
  {
    id: "tenant-maintenance",
    type: "chart",
    role: "tenant",
    title: "Maintenance Requests",
    defaultPosition: 2,
    defaultEnabled: true,
    defaultSize: "half",
    component: TenantMaintenanceWidget,
    vmKey: "maintenance",
  },
  {
    id: "tenant-payments",
    type: "chart",
    role: "tenant",
    title: "Payments",
    defaultPosition: 3,
    defaultEnabled: true,
    defaultSize: "half",
    component: TenantPaymentsWidget,
    vmKey: "payments",
  },
  {
    id: "tenant-documents",
    type: "feed",
    role: "tenant",
    title: "Documents",
    defaultPosition: 4,
    defaultEnabled: true,
    defaultSize: "half",
    component: TenantDocumentsWidget,
    vmKey: "documents",
  },
  {
    id: "tenant-notifications",
    type: "feed",
    role: "tenant",
    title: "Notifications",
    defaultPosition: 5,
    defaultEnabled: true,
    defaultSize: "half",
    component: TenantNotificationsWidget,
    vmKey: "notifications",
  },
];
