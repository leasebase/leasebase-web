# UI Flows

**Last updated:** 2026-03-14 (alignment audit)

High-level UI flows for the Leasebase web app. All personas are served from a unified `/app` dashboard — the app renders role-specific content based on `user.role` (OWNER or TENANT).

## Owner (Landlord)

Core areas under `/app`:

- **Dashboard** – occupancy, delinquency, open work orders, revenue summary.
- **Properties** – list and detail views.
- **Units** – list and detail per property.
- **Leases** – create, view, terminate, renew.
- **Tenants** – invite, manage profiles, deactivate.
- **Maintenance** – work orders list, detail, status updates, comments.
- **Payments** – Stripe Connect onboarding, payment overview, ledger.
- **Documents** – upload/download documents via signed URLs.
- **Reports** – occupancy, revenue, payments, maintenance.
- **Settings** – organization profile, billing.

## Tenant

Core areas under `/app`:

- **Dashboard** – balance due, next due date, open maintenance.
- **Pay rent** – Stripe Checkout for rent payments.
- **Payment history** – list of own payments with receipts.
- **Maintenance requests** – create, attach photos, view status and comments.
- **Documents** – view/download own lease and related documents.
- **Profile** – update phone, emergency contact, notification preferences.

All routes live under the `/app` segment. There are no separate `/pm` or `/tenant` URL segments.
