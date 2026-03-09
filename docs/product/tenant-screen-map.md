# Tenant Screen Map

## Routing Overview

All tenant screens live under the `(dashboard)/app/` route group and share the authenticated dashboard layout. The tenant persona is determined by `user.persona === "tenant"` from the auth store.

### Route → Screen → Use Cases

**`/app`** — Tenant Dashboard
- Components: TenantKpiHeader, TenantActionCards, TenantPaymentsWidget, TenantMaintenanceWidget, TenantNotificationsWidget
- Use cases: UC-02, UC-03, UC-04, UC-05 (entry), UC-07, UC-08, UC-12, UC-14 (entry), UC-16 (summary), UC-20

**`/app/pay-rent`** — Pay Rent Flow
- Components: PayRentForm (stub), PaymentMethodSelector, PaymentConfirmation
- Use cases: UC-05, UC-06, UC-07, UC-10 (enforced), UC-11 (enforced)

**`/app/payment-history`** — Payment History
- Components: PaymentHistoryList, PaymentReceiptDetail
- Use cases: UC-08, UC-09, UC-20 (read-only), UC-23

**`/app/leases`** — Lease Details
- Components: LeaseDetailCard (reused from existing page, filtered for tenant)
- Use cases: UC-04

**`/app/maintenance`** — Maintenance Request List
- Components: MaintenanceRequestList (filtered by current user)
- Use cases: UC-16, UC-17 (documented limitation), UC-20 (read-only)

**`/app/maintenance/new`** — New Maintenance Request
- Components: MaintenanceRequestForm
- Use cases: UC-14, UC-15 (photo placeholder)

**`/app/maintenance/[id]`** — Maintenance Request Detail
- Components: MaintenanceDetail, CommentThread
- Use cases: UC-16, UC-24

**`/app/documents`** — Documents List
- Components: DocumentsList (unavailable state for tenant)
- Use cases: UC-04, UC-15

**`/app/notifications`** — Notifications List
- Components: NotificationsList, NotificationItem
- Use cases: UC-09 (reversal notification), UC-16 (status change)

**`/app/messages`** — Messages (Future)
- Components: EmptyState placeholder
- Use cases: UC-18

**`/app/settings`** — Profile / Settings
- Components: TenantProfileView (read-only), AutopayPlaceholder
- Use cases: UC-13 (future), UC-19

## Component Hierarchy

```
TenantDashboard
├── TenantDashboardSkeleton (loading state)
├── TenantEmptyState (no-lease / invite-pending / lease-ended)
└── [Active Dashboard]
    ├── TenantKpiHeader
    │   ├── Rent amount + due date
    │   ├── Payment status badge
    │   └── Lease summary (unit, address, dates)
    ├── TenantActionCards
    │   ├── Pay Rent → /app/pay-rent
    │   ├── Submit Maintenance → /app/maintenance/new
    │   ├── View Documents → /app/documents
    │   └── View Lease → /app/leases
    ├── WidgetErrorBoundary > TenantPaymentsWidget
    │   ├── Next payment due
    │   └── Recent payment history (last 3)
    ├── WidgetErrorBoundary > TenantMaintenanceWidget
    │   └── Open requests (last 3)
    ├── WidgetErrorBoundary > TenantDocumentsWidget
    │   └── Document list or "unavailable"
    └── WidgetErrorBoundary > TenantNotificationsWidget
        └── Recent unread notifications (last 5)
```

## Shared Components (from existing UI library)

- `PageHeader` — page title + description
- `Badge` — status badges (success, warning, danger, info, neutral)
- `EmptyState` — empty state with icon, title, description, action
- `StatCard` / `StatCardSkeleton` — KPI cards
- `Skeleton` / `SkeletonCard` — loading placeholders
- `Tooltip` — provenance labels
- `WidgetErrorBoundary` — per-widget error isolation (reused from owner/)

## Navigation Items (already configured in appNav.ts)

Tenant persona sees:
- Dashboard (`/app`)
- Leases (`/app/leases`)
- Pay Rent (`/app/pay-rent`)
- Payment History (`/app/payment-history`)
- Maintenance (`/app/maintenance`)
- Documents (`/app/documents`)
- Messages (`/app/messages`)
- Notifications (`/app/notifications`)
- Settings (`/app/settings`)
