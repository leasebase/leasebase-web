# UI implementation

This document describes the main route map and shared components for the Leasebase web app.

## Route map

Public:

- `/` – Landing page with quick overview of personas and a link to `/auth/login`.
- `/auth/login` – Login screen with Cognito button and optional dev-only mock auth.
- `/auth/logout` – Signs the user out (clears cookies, optional Cognito logout) and redirects.
- `/auth/callback` – Cognito hosted UI callback handler.
- `/auth/access-denied` – Shown when the user lacks permission for a route.

PM / Landlord area (requires `ORG_ADMIN`, `PM_STAFF`, or `OWNER`):

- `/pm` – Dashboard (occupancy, delinquency, open work orders + recent activity).
- `/pm/properties` – Properties list with inline "New property" modal.
- `/pm/properties/[propertyId]` – Property detail with units table.
- `/pm/units/[unitId]` – Unit detail with current lease summary.
- `/pm/leases` – Leases list.
- `/pm/leases/new` – Create lease form.
- `/pm/leases/[leaseId]` – Lease detail.
- `/pm/leases/[leaseId]/ledger` – Ledger view (charges, payments, credits).
- `/pm/work-orders` – Work orders list.
- `/pm/work-orders/[workOrderId]` – Work order detail with comments.
- `/pm/documents` – Documents library with signed URL upload flow.
- `/pm/settings` – Organization profile + users table and invite form.
- `/pm/billing` – Plan + unit count + billing portal link.

Tenant area (requires `TENANT`):

- `/tenant` – Tenant dashboard (balance, next due date, open maintenance).
- `/tenant/payments` – Pay rent + payment history.
- `/tenant/maintenance` – Maintenance list.
- `/tenant/maintenance/new` – Create maintenance request with optional photo.
- `/tenant/maintenance/[workOrderId]` – Maintenance detail with comments.
- `/tenant/documents` – Lease documents.

## Shared layout & components

- Global layout (`app/layout.tsx`): header + centered content, wrapped in `ToastProvider`.
- PM layout (`app/(pm)/pm/layout.tsx`): left sidebar nav for management area.
- Tenant layout (`app/(tenant)/tenant/layout.tsx`): left sidebar nav for tenant area.

Reusable components in `src/components/ui`:

- `PageHeader` – page title, description, and actions.
- `StatCard` – small metric cards for dashboards.
- `DataTable` – generic table with configurable columns and built-in empty state.
- `Modal` – simple modal dialog used for create flows.
- `FormField` – label + field wrapper with optional hint.
- `Toast` / `ToastProvider` / `useToast` – lightweight toast notifications.
