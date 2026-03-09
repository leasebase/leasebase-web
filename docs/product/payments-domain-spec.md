# Payments Domain Specification

## 1. Actors

**Owner** — Property owner. Onboards a Stripe Express connected account. Receives rent payouts. Can initiate refunds. Views ledger and payout history.

**Property Manager (PM)** — Manages properties on behalf of an owner. Same permissions as Owner for payment operations within their scope. In Phase 2, may receive a split of collected rent.

**Tenant** — Occupies a unit under a lease. Pays rent and fees. Sets up payment methods. Views payment history and upcoming obligations.

**LeaseBase Platform** — Mediates all payments. Collects platform fees. Owns the Stripe platform account. Processes webhooks. Maintains the internal ledger.

**Stripe** — External payment processor. Handles fund movement, KYC, compliance, payouts, dispute resolution.

## 2. Money Flows

### 2.1 Rent Collection (Phase 1 — Destination Charges)

```
Tenant
  │
  ▼
Stripe PaymentIntent (on platform account)
  │
  ├── application_fee_amount → LeaseBase platform balance
  │
  └── transfer_data.destination → Owner's connected account
        │
        └── Stripe auto-payout → Owner's bank account
```

- Tenant initiates payment via Checkout Session or PaymentIntent with Stripe Elements.
- PaymentIntent is created with `transfer_data.destination` pointing to the owner's `stripe_account_id`.
- `application_fee_amount` is the LeaseBase platform fee (configurable per org).
- Stripe processing fee is deducted from the owner's share (standard for destination charges).
- Owner's connected account receives net funds; Stripe pays out to their bank on the automatic schedule.

### 2.2 SaaS Subscription Billing (Separate Bounded Context)

```
Owner/PM
  │
  ▼
Stripe Subscription (on platform account, NOT Connect)
  │
  └── Monthly charge to Owner's payment method
        │
        └── Revenue to LeaseBase platform balance
```

- Monthly plan fee charged directly on the platform account.
- No connected accounts involved.
- Managed by a separate billing module (not in scope of rent collection).

### 2.3 Future: Vendor Payouts (Phase 2)

```
LeaseBase platform balance (or collected rent)
  │
  ▼
Stripe Transfer → Vendor's connected account
  │
  └── Stripe auto-payout → Vendor's bank account
```

## 3. Payment Lifecycle

### 3.1 States

```
OBLIGATION_CREATED
  │
  ▼
PAYMENT_INITIATED  ──(Stripe checkout/PI created)
  │
  ├── PAYMENT_PROCESSING  ──(ACH: pending bank confirmation)
  │     │
  │     ├── PAYMENT_SUCCEEDED  ──(funds captured)
  │     │     │
  │     │     └── PAYOUT_PENDING → PAYOUT_PAID
  │     │
  │     └── PAYMENT_FAILED  ──(NSF, declined, etc.)
  │           │
  │           └── RETRY or OBLIGATION_PAST_DUE
  │
  └── PAYMENT_CANCELED  ──(user or system canceled before processing)
```

### 3.2 State Transitions

- **OBLIGATION_CREATED → PAYMENT_INITIATED**: Tenant opens checkout or payment is auto-initiated from a saved method.
- **PAYMENT_INITIATED → PAYMENT_PROCESSING**: Stripe confirms the PaymentIntent is processing (especially for ACH, which has a multi-day settlement).
- **PAYMENT_PROCESSING → PAYMENT_SUCCEEDED**: `payment_intent.succeeded` webhook received.
- **PAYMENT_PROCESSING → PAYMENT_FAILED**: `payment_intent.payment_failed` webhook received.
- **PAYMENT_SUCCEEDED → PAYOUT_PENDING**: Internal state when awaiting Stripe payout to owner.
- **PAYOUT_PENDING → PAYOUT_PAID**: `payout.paid` webhook on connected account confirms disbursement.
- **PAYMENT_FAILED → RETRY**: System or tenant retries. New PaymentIntent created, old one linked.
- **PAYMENT_FAILED (after max retries) → OBLIGATION_PAST_DUE**: Flagged for manual intervention/late fee.

### 3.3 ACH-Specific Considerations

- ACH payments remain in `PROCESSING` for 4-5 business days.
- `payment_intent.processing` webhook fired when bank debit is initiated.
- `payment_intent.succeeded` fires when bank confirms funds.
- ACH failures can occur up to 4 business days after initiation (NSF, account closed).
- Late failures must trigger reversal logic in the internal ledger.

## 4. Payout Lifecycle

### 4.1 Automatic Payouts (Phase 1)

- Stripe automatically pays out the connected account's available balance to their bank.
- Default schedule: rolling (daily), T+2 for card, T+4 for ACH.
- LeaseBase tracks payout events via `payout.created`, `payout.paid`, `payout.failed` webhooks on the connected account.

### 4.2 Manual Payouts (Phase 2)

- Connected accounts switched to `payouts.schedule.interval = manual`.
- LeaseBase triggers payouts via `POST /v1/payouts` on behalf of the connected account.
- Enables custom schedules (weekly, monthly, on-demand).

### 4.3 Payout States

```
PAYOUT_PENDING → PAYOUT_IN_TRANSIT → PAYOUT_PAID
                                    → PAYOUT_FAILED → PAYOUT_CANCELED
```

## 5. Refunds and Disputes

### 5.1 Refunds

- Initiated by Owner or PM via the LeaseBase UI.
- Full or partial refund supported.
- For destination charges, Stripe automatically reverses the transfer to the connected account proportionally.
- The `application_fee_amount` can optionally be refunded (configurable: `refund_application_fee: true|false`).
- A refund creates a `REFUND` ledger entry that offsets the original `PAYMENT` entry.
- Refund states: `REFUND_PENDING → REFUND_SUCCEEDED → REFUND_FAILED`.

### 5.2 Disputes (Chargebacks)

- For destination charges, the connected account is the merchant of record.
- `charge.dispute.created` webhook notifies LeaseBase.
- LeaseBase creates a `DISPUTE` ledger entry and flags the payment.
- Owner/PM can submit evidence via the Stripe Dashboard (Express Dashboard) or via API.
- `charge.dispute.closed` webhook resolves the dispute (won/lost).
- If lost, Stripe debits the connected account. LeaseBase records a `DISPUTE_LOSS` ledger entry.

### 5.3 Refund Rules

- Refunds are only allowed on payments in `SUCCEEDED` status.
- Partial refunds are allowed up to the original amount minus any prior refunds.
- Refunds after payout require the connected account to have sufficient balance (Stripe handles negative balance recovery).
- Maximum refund window: 180 days (Stripe limit).

## 6. Ledger Rules

### 6.1 Principles

- The internal ledger is the **system of record** for financial reporting. Stripe is the execution layer.
- Every money movement (in or out) produces a ledger entry.
- Ledger entries are **append-only** — never mutated or deleted.
- Corrections are made via offsetting entries (e.g., refund offsets payment).
- Each ledger entry references both the internal entity ID and the Stripe object ID.

### 6.2 Entry Types

- `CHARGE` — Rent or fee obligation created (debit on tenant).
- `PAYMENT` — Successful payment received (credit, offsets a CHARGE).
- `PLATFORM_FEE` — LeaseBase fee deducted (debit on owner's share).
- `REFUND` — Refund issued (debit, offsets a PAYMENT).
- `PAYOUT` — Funds disbursed to owner's bank (informational, tracks Stripe payout).
- `DISPUTE` — Dispute opened (hold on funds).
- `DISPUTE_REVERSAL` — Dispute resolved (won: release hold; lost: debit).
- `CREDIT` — Manual credit applied (e.g., goodwill, proration).
- `LATE_FEE` — Late fee assessed on overdue obligation.
- `VENDOR_PAYOUT` — (Phase 2) Transfer to vendor.

### 6.3 Double-Entry Style

Each transaction creates paired entries:

- Rent payment of $2,000:
  - `PAYMENT +$2,000` (tenant → platform)
  - `PLATFORM_FEE -$20` (platform fee extracted)
  - `PAYOUT +$1,980` (platform → owner, once paid out)

### 6.4 Reconciliation

- Nightly reconciliation job compares internal ledger totals against Stripe balance transactions.
- Mismatches are logged as `RECONCILIATION_DISCREPANCY` alerts.
- Stripe `balance_transaction` IDs are stored on ledger entries for cross-reference.

## 7. Webhook Event Handling

See `docs/ops/stripe-webhooks.md` for the complete webhook handling plan.

### 7.1 Critical Events (Synchronous Processing)

- `payment_intent.succeeded` — Update payment status, create PAYMENT ledger entry.
- `payment_intent.payment_failed` — Update payment status, trigger retry/notification.
- `account.updated` — Update onboarding status for connected account.
- `charge.dispute.created` — Create DISPUTE ledger entry, flag payment.

### 7.2 Informational Events (Async via SQS/EventBridge)

- `payout.paid` — Update payout tracking record.
- `payout.failed` — Alert owner, update payout record.
- `charge.refunded` — Confirm refund completion (refund was initiated by us).
- `invoice.*` — SaaS billing events (separate bounded context).

## 8. Reconciliation Model

### 8.1 Real-Time

- Every Stripe webhook updates the corresponding internal record.
- `stripe_payment_intent_id`, `stripe_charge_id`, `stripe_transfer_id`, `stripe_payout_id` are stored on internal records for 1:1 mapping.

### 8.2 Batch (Nightly)

- Reconciliation job fetches Stripe `BalanceTransactions` for the past 24-48 hours.
- Compares against internal ledger entries.
- Flags:
  - Stripe transactions with no matching internal record (orphans).
  - Internal records with no matching Stripe transaction (ghosts).
  - Amount mismatches.
- Output: reconciliation report stored in `reconciliation_runs` table.

### 8.3 Monthly Close

- Aggregate ledger balances per org.
- Compare against Stripe Connect account balances.
- Generate owner statements.

## 9. Edge Cases

### 9.1 Owner Not Yet Onboarded

- Tenant cannot pay until owner has a verified Stripe connected account.
- Payment obligations are still created (rent schedule runs regardless).
- UI shows "Payments cannot be collected until the property owner enables payments."

### 9.2 ACH Late Failure

- ACH payment initially succeeds, then fails 3-4 days later.
- `payment_intent.payment_failed` webhook arrives after `payment_intent.succeeded`.
- Internal ledger must reverse the `PAYMENT` entry with a `PAYMENT_REVERSAL` entry.
- Owner's connected account balance is debited by Stripe.
- Tenant is notified and the obligation returns to unpaid.

### 9.3 Partial Payment

- Tenant pays less than the full obligation amount.
- A `PAYMENT` ledger entry for the partial amount is created.
- The obligation remains partially unpaid; a new payment can be collected for the remainder.
- Late fees may still apply if the full amount is not received by the due date.

### 9.4 Duplicate Webhook Delivery

- Stripe may deliver the same event multiple times.
- Idempotency check on `event.id` in `webhook_events` table prevents double-processing.
- If `event.id` already exists with `status = 'PROCESSED'`, return 200 immediately.

### 9.5 Connected Account Deauthorization

- Owner disconnects their Stripe account.
- `account.application.deauthorized` webhook received.
- Owner's `payment_account` is marked `DISCONNECTED`.
- Active payment collection for their properties is suspended.
- Pending payouts may still complete; no new charges can be created.

### 9.6 Stripe Outage

- If Stripe API is unavailable, payment initiation fails gracefully.
- The obligation remains unpaid; tenant sees "Payment processing is temporarily unavailable."
- No ledger entries are created for failed initiation attempts.
- Circuit breaker pattern in payments-service prevents cascade.
