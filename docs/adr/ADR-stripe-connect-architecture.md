# ADR: Stripe Connect Architecture for LeaseBase

**Status:** Proposed
**Date:** 2026-03-09
**Author:** Engineering
**Deciders:** Engineering, Product, Finance

## Context

LeaseBase is a property management SaaS platform. The core payment flow is:

1. **Tenants** pay rent through the platform.
2. **Property owners** (and optionally property managers) receive those funds.
3. **LeaseBase** collects a platform/SaaS fee on each transaction.

The platform must also handle refunds, failed payments, disputes, and eventually vendor payouts (maintenance contractors, etc.). Stripe is the chosen payment processor.

### Current State

- `leasebase-payments-service` exists as a scaffolded Express service with basic CRUD for payments and ledger entries. No Stripe SDK integration yet.
- `leasebase-bff-gateway` proxies `/api/payments/*` to the payments service. No payment-specific logic.
- IaC provisions the payments-service on ECS Fargate with Aurora PostgreSQL (schema: `payments_service`), Redis, Cognito JWT auth, and Secrets Manager for DB credentials.
- No Stripe secrets or Stripe-specific infra exists yet in IaC.
- Seed data references `processor: 'stripe'` and `external_transaction_id` fields, indicating Stripe was always the intended processor.

## Requirements

### Functional

- R1: Onboard property owners to receive payouts (KYC/AML compliant).
- R2: Collect rent from tenants via ACH bank transfer (primary) and card (secondary).
- R3: Deduct a configurable platform fee per transaction for LeaseBase.
- R4: Route net funds to the owner's bank account on a configurable payout schedule.
- R5: Support refunds (full and partial) initiated by owner/PM.
- R6: Handle failed payments with retry and notification flows.
- R7: Maintain an internal ledger independent of Stripe as the system of record.
- R8: Support future vendor/contractor payouts from collected funds.
- R9: Separate SaaS subscription billing from rent collection.

### Non-Functional

- N1: PCI compliance with minimal scope (use Stripe-hosted UI elements).
- N2: Idempotent webhook handling.
- N3: Auditable money trail (every dollar in/out tracked in internal ledger).
- N4: Secrets managed via AWS Secrets Manager, not env vars.
- N5: Service isolation — only `payments-service` talks to Stripe.

## Decision

### 1. Account Model: Stripe Connect — Express Accounts

**Chosen: Express Connect.**

Each property owner (or the property management company acting on their behalf) is onboarded as a **Stripe Express connected account**. LeaseBase is the **platform account**.

**Why Express over Standard:**
- Stripe hosts the KYC/identity-verification flow — LeaseBase does not need to build or maintain compliance UI.
- Stripe provides an embedded Express Dashboard for connected accounts to view payouts and tax documents (1099s).
- LeaseBase retains control over the onboarding flow trigger, branding, and required capabilities.
- Express supports all charge models (destination, separate, direct).

**Why Express over Custom:**
- Custom accounts require the platform to build the entire KYC/onboarding UI and assume liability for compliance.
- Engineering cost is 3-5x higher for Custom with no material benefit at this stage.
- If deeper UX control is needed later, Express can be migrated to Custom on a per-account basis.

### 2. Charge Model: Destination Charges (Phase 1) → Separate Charges and Transfers (Phase 2)

**Phase 1 (MVP): Destination Charges.**

```
Tenant pays $2,000
  → Stripe PaymentIntent created on LeaseBase platform account
  → transfer_data.destination = owner's connected account
  → application_fee_amount = $20 (1% platform fee, configurable)
  → Owner receives $2,000 – $20 – Stripe processing fee
  → LeaseBase receives $20 into platform balance
```

**Why destination charges for Phase 1:**
- Single API call creates the charge and routes funds.
- Stripe automatically handles 1099-K reporting for the connected account.
- `application_fee_amount` cleanly separates LeaseBase's revenue.
- Refunds are simple — Stripe reverses the transfer proportionally.
- Sufficient for the owner-receives-rent use case.

**Phase 2 (future): Separate Charges and Transfers.**

When vendor payouts or multi-party splits (owner + property manager) are needed:

```
Tenant pays $2,000
  → Charge created on LeaseBase platform account
  → Transfer 1: $1,800 to owner
  → Transfer 2: $150 to property manager
  → $50 retained by LeaseBase (platform fee)
```

**Why not separate charges from day one:**
- Adds complexity: manual transfer creation, timing management, partial-failure handling.
- Requires more sophisticated reconciliation logic.
- Not needed until property manager splits or vendor payouts are implemented.

**Why not direct charges:**
- Direct charges are created on the connected account. LeaseBase would lose control of the charge lifecycle.
- Platform fee extraction is less clean (requires `application_fee_amount` reversal path).
- Worse fit for a marketplace model where the platform mediates payments.

### 3. Payment Methods

- **Primary: ACH Direct Debit** via Stripe `us_bank_account` — lower fees (~0.8% capped at $5), standard for rent.
- **Secondary: Card payments** — higher fees (~2.9% + $0.30), offered as convenience option.
- **Future: Stripe Link, Apple Pay, Google Pay** — low effort to add once base flow works.

ACH is configured with `verify_with_microdeposits` as fallback if instant verification via Stripe Financial Connections is unavailable.

### 4. Platform Fee Strategy

- Platform fee is set as `application_fee_amount` on each PaymentIntent.
- Fee amount or percentage is stored in the `payment_account` record per organization, defaulting to the plan-level fee.
- Fee rules are evaluated in `payments-service` at charge-creation time — not hard-coded in Stripe.
- LeaseBase SaaS subscription billing (monthly plan fee) uses a **separate Stripe Billing/Subscription** on the platform account, completely decoupled from rent collection.

### 5. Payout Schedule

- Stripe Express accounts default to automatic payouts (T+2 for card, T+4 for ACH).
- LeaseBase does **not** manage custom payout schedules in Phase 1 — Stripe's automatic schedule applies.
- Phase 2 can switch to manual payouts (`payouts.schedule.interval = manual`) for more control (e.g., monthly owner disbursements).

### 6. Webhook Architecture

- A single webhook endpoint in `payments-service` receives events from Stripe.
- Events are verified via Stripe signature (`stripe-signature` header + webhook signing secret).
- Each event is stored in a `webhook_event` table for idempotency (dedup by `event.id`).
- Critical events are processed synchronously; non-critical events are queued via SQS/EventBridge for async handling.
- See `docs/ops/stripe-webhooks.md` for the full plan.

### 7. Secrets Management

New secrets to provision in AWS Secrets Manager (via IaC):

| Secret Path | Contents |
|---|---|
| `leasebase/{env}/stripe/api-keys` | `{ secret_key, publishable_key }` |
| `leasebase/{env}/stripe/webhook-signing` | `{ platform_endpoint_secret, connect_endpoint_secret }` |

These are injected into the payments-service ECS task as `valueFrom` secret references, consistent with how `DATABASE_SECRET_ARN` is already handled.

### 8. Service Boundaries

- **`payments-service`**: Sole owner of Stripe SDK calls, payment records, ledger, webhook processing. All Stripe logic is encapsulated here.
- **`bff-gateway`**: Proxies payment API calls. For Stripe webhooks, a dedicated path bypasses auth middleware (webhooks are verified by Stripe signature, not JWT).
- **`leasebase-web`**: Renders Stripe onboarding links, Checkout Sessions, and payment status UI. Uses `@stripe/stripe-js` for client-side elements.
- **`lease-service`**: Owns lease and rent schedule data. Payments-service queries lease data to generate payment obligations.

## Alternatives Rejected

### Custom Connect Accounts
Rejected because: 3-5x engineering effort for compliance UI, full liability for KYC, no material benefit for current product stage. Can migrate individual accounts later if needed.

### Standard Connect Accounts
Rejected because: Owners would need to create/manage their own full Stripe accounts. Poor UX — property owners are not Stripe power users. LeaseBase loses control over onboarding flow and cannot enforce required capabilities.

### Separate Charges and Transfers from Day One
Rejected because: Over-engineering for Phase 1. Destination charges cover owner-receives-rent with platform fee. Separate charges add transfer timing complexity, partial-failure handling, and manual reconciliation that isn't justified until multi-party splits (PM, vendors) are needed.

### Direct Charges
Rejected because: Charge is created on the connected account, not the platform. LeaseBase loses control over the charge lifecycle, dispute handling, and refund flow. Poor fit for marketplace model.

### Building Custom Payment Rails (non-Stripe)
Rejected because: PCI-DSS Level 1 compliance, banking partner integrations, money transmission licensing, and 1099 reporting are table-stakes requirements that Stripe solves out of the box.

## Compliance and Operational Implications

- **PCI Scope**: Minimized by using Stripe Elements / Checkout Sessions. LeaseBase never handles raw card numbers or bank credentials. SAQ-A eligible.
- **1099-K Reporting**: Stripe handles 1099-K generation for Express connected accounts receiving >$600/year (per IRS rules). LeaseBase does not need to file these.
- **Money Transmission**: By using Stripe Connect, LeaseBase operates as a technology platform, not a money transmitter. Stripe holds the required licenses.
- **Dispute Handling**: For destination charges, the connected account is the merchant of record. Disputes are handled by the connected account with platform support via the Stripe API.
- **Data Retention**: Payment records and ledger entries are retained indefinitely in Aurora. Stripe objects are referenced by ID; sensitive data stays in Stripe.

## Future Extension: Vendor Payouts

When maintenance vendor payouts are needed:

1. Vendors are onboarded as Express connected accounts (same flow as owners).
2. Vendor payouts use **Transfers** from the LeaseBase platform balance or from collected rent held in the platform account.
3. This requires moving to separate charges and transfers (Phase 2) for rent collection, so funds accumulate in the platform account before disbursement.
4. The `payment_account` entity already supports `account_type: 'VENDOR'` to distinguish from owner accounts.
5. The internal ledger tracks vendor payouts as a separate entry type.

## References

- [Stripe Connect Overview](https://docs.stripe.com/connect)
- [Stripe Express Accounts](https://docs.stripe.com/connect/express-accounts)
- [Destination Charges](https://docs.stripe.com/connect/destination-charges)
- [Separate Charges and Transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
- [Stripe Webhooks Best Practices](https://docs.stripe.com/webhooks/best-practices)
