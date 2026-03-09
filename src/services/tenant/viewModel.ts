/**
 * Tenant Dashboard — View-Model Mapper
 *
 * Pure function that transforms TenantDashboardData into per-widget view models.
 * All formatting, provenance labeling, and status computation happens here.
 */

import type {
  TenantDashboardData,
  TenantDashboardViewModel,
  TenantKpiHeaderViewModel,
  TenantActionCardsViewModel,
  TenantPaymentsWidgetViewModel,
  TenantPaymentItem,
  TenantMaintenanceWidgetViewModel,
  TenantMaintenanceItem,
  TenantDocumentsWidgetViewModel,
  TenantNotificationsWidgetViewModel,
  TenantNotificationItem,
  PaymentStatus,
  LeaseRow,
  PaymentRow,
} from "./types";

/* ── Formatting helpers ── */

function fmtCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtShortDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function fmtRelativeTime(isoStr: string): string {
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return fmtShortDate(isoStr);
}

/* ── Payment status computation (exported for testing) ── */

export function computePaymentStatus(
  lease: LeaseRow | null,
  payments: PaymentRow[]
): PaymentStatus {
  if (!lease) return "due";

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Derive "due date" from rent schedule
  // Phase 1 simplified: assume rent is due on the 1st of each month
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const dueDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;

  // Check if this month's rent has been paid
  const monthStart = new Date(currentYear, currentMonth, 1).toISOString();
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

  const thisMonthPayments = payments.filter(
    (p) => p.created_at >= monthStart && p.created_at <= monthEnd
  );

  const succeeded = thisMonthPayments.some((p) => p.status === "SUCCEEDED");
  if (succeeded) return "paid";

  const pending = thisMonthPayments.some((p) => p.status === "PENDING");
  if (pending) return "pending";

  const failed = thisMonthPayments.some((p) => p.status === "FAILED");
  if (failed) return "failed";

  // Not paid — check if overdue
  if (todayStr > dueDateStr) return "overdue";

  // Due within 7 days?
  const dueDate = new Date(dueDateStr + "T00:00:00");
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 7) return "due-soon";

  return "due";
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  due: "Due",
  "due-soon": "Due soon",
  overdue: "Overdue",
  paid: "Paid",
  pending: "Processing",
  failed: "Failed",
};

const PAYMENT_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  SUCCEEDED: "success",
  PENDING: "warning",
  FAILED: "danger",
  CANCELED: "neutral",
};

const MAINTENANCE_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

/* ── KPI Header ── */

function buildKpiHeader(data: TenantDashboardData): TenantKpiHeaderViewModel {
  const lease = data.lease;

  if (!lease) {
    return {
      rentAmount: "—",
      rentAmountCents: 0,
      dueDate: "—",
      dueDateRaw: "",
      paymentStatus: "due",
      paymentStatusLabel: "No active lease",
      leaseAddress: "—",
      leaseUnit: "—",
      leaseDates: "—",
      leaseStatus: "—",
      source: data.sources.lease,
    };
  }

  const now = new Date();
  const dueDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const paymentStatus = computePaymentStatus(lease, data.payments);

  return {
    rentAmount: fmtCurrency(lease.rent_amount),
    rentAmountCents: lease.rent_amount,
    dueDate: fmtDate(dueDateStr),
    dueDateRaw: dueDateStr,
    paymentStatus,
    paymentStatusLabel: STATUS_LABELS[paymentStatus],
    leaseAddress: lease.unit_id, // Phase 1: unit_id only (no property join)
    leaseUnit: lease.unit_id,
    leaseDates: `${fmtMonthYear(lease.start_date)} – ${fmtMonthYear(lease.end_date)}`,
    leaseStatus: lease.status,
    source: data.sources.lease,
  };
}

/* ── Action Cards ── */

function buildActionCards(data: TenantDashboardData): TenantActionCardsViewModel {
  const isActive = data.setupStage === "active";

  return {
    actions: [
      {
        label: "Pay Rent",
        href: "/app/pay-rent",
        icon: "payments",
        disabled: !isActive,
        disabledReason: isActive ? undefined : "No active lease",
      },
      {
        label: "Maintenance",
        href: "/app/maintenance/new",
        icon: "maintenance",
        disabled: !isActive,
        disabledReason: isActive ? undefined : "No active lease",
      },
      {
        label: "Documents",
        href: "/app/documents",
        icon: "documents",
      },
      {
        label: "View Lease",
        href: "/app/leases",
        icon: "leases",
      },
    ],
  };
}

/* ── Payments Widget ── */

function buildPaymentsWidget(data: TenantDashboardData): TenantPaymentsWidgetViewModel {
  const lease = data.lease;
  const paymentStatus = lease ? computePaymentStatus(lease, data.payments) : "due";

  const nextPayment = lease
    ? {
        amount: fmtCurrency(lease.rent_amount),
        dueDate: (() => {
          const now = new Date();
          const dueDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
          return fmtDate(dueDateStr);
        })(),
        status: paymentStatus,
      }
    : null;

  const recentPayments: TenantPaymentItem[] = data.recentPayments.map((p) => ({
    id: p.id,
    date: fmtShortDate(p.created_at),
    amount: fmtCurrency(p.amount),
    method: p.method || "—",
    status: p.status,
    statusVariant: PAYMENT_STATUS_VARIANT[p.status] ?? "neutral",
  }));

  return {
    nextPayment,
    recentPayments,
    source: data.sources.payments,
    hasPayments: data.payments.length > 0,
  };
}

/* ── Maintenance Widget ── */

function buildMaintenanceWidget(data: TenantDashboardData): TenantMaintenanceWidgetViewModel {
  const sorted = [...data.maintenanceRequests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const recentRequests: TenantMaintenanceItem[] = sorted.slice(0, 3).map((w) => ({
    id: w.id,
    description: w.description,
    category: w.category,
    priority: w.priority,
    status: w.status.replace("_", " "),
    statusVariant: MAINTENANCE_STATUS_VARIANT[w.status] ?? "neutral",
    date: fmtShortDate(w.created_at),
  }));

  return {
    openCount: data.openMaintenanceCount,
    recentRequests,
    source: data.sources.maintenance,
    hasRequests: data.maintenanceRequests.length > 0,
  };
}

/* ── Documents Widget ── */

function buildDocumentsWidget(data: TenantDashboardData): TenantDocumentsWidgetViewModel {
  const documents = (data.documents ?? []).slice(0, 5).map((d) => ({
    id: d.id,
    name: d.name,
    mimeType: d.mime_type,
    date: fmtShortDate(d.created_at),
  }));

  return {
    documents,
    source: data.sources.documents,
    hasDocuments: documents.length > 0,
  };
}

/* ── Notifications Widget ── */

function buildNotificationsWidget(data: TenantDashboardData): TenantNotificationsWidgetViewModel {
  const items: TenantNotificationItem[] = data.notifications.slice(0, 5).map((n) => {
    let link: string | null = null;
    if (n.related_type === "work_order" && n.related_id) {
      link = `/app/maintenance/${n.related_id}`;
    } else if (n.related_type === "payment" && n.related_id) {
      link = "/app/payment-history";
    } else if (n.related_type === "lease" && n.related_id) {
      link = "/app/leases";
    }

    return {
      id: n.id,
      title: n.title,
      body: n.body,
      time: fmtRelativeTime(n.created_at),
      isUnread: !n.read_at,
      link,
    };
  });

  return {
    items,
    unreadCount: data.unreadNotificationCount,
    source: data.sources.notifications,
    hasNotifications: data.notifications.length > 0,
  };
}

/* ── Public mapper ── */

export function toTenantDashboardViewModel(
  data: TenantDashboardData
): TenantDashboardViewModel {
  return {
    kpiHeader: buildKpiHeader(data),
    actionCards: buildActionCards(data),
    payments: buildPaymentsWidget(data),
    maintenance: buildMaintenanceWidget(data),
    documents: buildDocumentsWidget(data),
    notifications: buildNotificationsWidget(data),
    setupStage: data.setupStage,
    domainErrors: data.domainErrors,
  };
}
