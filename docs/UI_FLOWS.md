# UI flows

High-level UI flows for the Leasebase web app personas.

## Property Manager / Landlord

Core areas:

- **Dashboard** – occupancy, delinquency, open work orders.
- **Properties** – list and detail views.
- **Units** – list and detail per property.
- **Leases** – create and view leases.
- **Ledger** – per-lease ledger (charges, payments, balance).
- **Maintenance** – work orders list, detail, status updates, comments.
- **Documents** – upload/download documents via signed URLs provided by the API.
- **Organization settings** – manage org profile, users, and roles.
- **Billing** – plan, unit count, Stripe billing portal link.

## Tenant

Core areas:

- **Dashboard** – balance due, next due date, open maintenance.
- **Pay rent** – initiate payments and confirm success/failure.
- **Payment history** – list of payments with receipts.
- **Maintenance requests** – create, attach photos, view status and comments.
- **Documents** – view/download lease and related documents.

These flows should be reflected in the App Router structure (e.g., `/pm` and `/tenant` segments) and will be wired up to the typed API client generated from the backend OpenAPI spec.
