# Payments API Contract

All public endpoints are exposed via the BFF gateway at `/api/payments/*`.
The BFF proxies to the internal payments-service at `/internal/payments/*`.
Auth: Cognito JWT Bearer token (except webhook endpoints, which use Stripe signature verification).

## 1. Connect Onboarding

### POST /api/payments/connect/onboard

Create a Stripe Connect Account Link for owner onboarding. Returns a URL that redirects the owner to Stripe's hosted onboarding.

**Auth:** `ORG_ADMIN` or `OWNER`

**Request:**
```json
{
  "return_url": "https://app.leasebase.co/settings/payments",
  "refresh_url": "https://app.leasebase.co/settings/payments?refresh=true"
}
```

**Response (201):**
```json
{
  "data": {
    "url": "https://connect.stripe.com/setup/e/acct_xxx/yyy",
    "expires_at": "2026-03-09T02:00:00Z"
  }
}
```

**Behavior:**
- If no `payment_account` exists for the org, creates a Stripe Express account and stores the mapping.
- If a `payment_account` exists but is incomplete, generates a new Account Link for the existing account.
- If already fully onboarded, returns 409 with the current status.

**Internal route:** `POST /internal/payments/connect/onboard`

---

### GET /api/payments/connect/status

Retrieve the Stripe Connect onboarding and capability status for the current org.

**Auth:** `ORG_ADMIN`, `OWNER`, `PM_STAFF`

**Response (200):**
```json
{
  "data": {
    "account_id": "pa_uuid",
    "stripe_account_id": "acct_xxx",
    "status": "ACTIVE",
    "charges_enabled": true,
    "payouts_enabled": true,
    "requirements": {
      "currently_due": [],
      "eventually_due": [],
      "past_due": [],
      "disabled_reason": null
    },
    "capabilities": {
      "card_payments": "active",
      "us_bank_account_ach_payments": "active",
      "transfers": "active"
    },
    "default_payout_schedule": {
      "interval": "daily",
      "delay_days": 2
    }
  }
}
```

**Status values:** `NOT_STARTED`, `ONBOARDING_INCOMPLETE`, `PENDING_VERIFICATION`, `ACTIVE`, `RESTRICTED`, `DISCONNECTED`

**Internal route:** `GET /internal/payments/connect/status`

---

### POST /api/payments/connect/dashboard-link

Generate a login link to the Stripe Express Dashboard for the connected account.

**Auth:** `ORG_ADMIN`, `OWNER`

**Response (200):**
```json
{
  "data": {
    "url": "https://connect.stripe.com/express/xxx"
  }
}
```

**Internal route:** `POST /internal/payments/connect/dashboard-link`

---

## 2. Tenant Payment

### POST /api/payments/checkout-session

Create a Stripe Checkout Session for a tenant to pay a specific obligation or amount.

**Auth:** `TENANT`

**Request:**
```json
{
  "obligation_id": "obl_uuid",
  "payment_method_types": ["us_bank_account", "card"],
  "success_url": "https://app.leasebase.co/payments/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://app.leasebase.co/payments/cancel"
}
```

**Response (201):**
```json
{
  "data": {
    "session_id": "cs_xxx",
    "url": "https://checkout.stripe.com/pay/cs_xxx"
  }
}
```

**Behavior:**
- Looks up the obligation to determine amount, currency, and destination connected account.
- Creates a Stripe Checkout Session with `mode: 'payment'`, `transfer_data.destination`, and `application_fee_amount`.
- Creates a `payment_transaction` record in `INITIATED` status.
- Returns the Checkout Session URL for redirect.

**Internal route:** `POST /internal/payments/checkout-session`

---

### POST /api/payments/payment-intent

Create a PaymentIntent directly (for embedded Stripe Elements, not Checkout Session redirect).

**Auth:** `TENANT`

**Request:**
```json
{
  "obligation_id": "obl_uuid",
  "payment_method_id": "pm_xxx"
}
```

**Response (201):**
```json
{
  "data": {
    "client_secret": "pi_xxx_secret_yyy",
    "payment_intent_id": "pi_xxx",
    "status": "requires_confirmation"
  }
}
```

**Internal route:** `POST /internal/payments/payment-intent`

---

## 3. Payment Methods

### GET /api/payments/methods

List saved payment methods for the authenticated tenant.

**Auth:** `TENANT`

**Response (200):**
```json
{
  "data": [
    {
      "id": "pm_internal_uuid",
      "stripe_payment_method_id": "pm_xxx",
      "type": "us_bank_account",
      "last_four": "6789",
      "bank_name": "Chase",
      "is_default": true,
      "is_verified": true
    }
  ]
}
```

**Internal route:** `GET /internal/payments/methods`

---

### POST /api/payments/methods/setup-intent

Create a Stripe SetupIntent for adding a new payment method.

**Auth:** `TENANT`

**Response (201):**
```json
{
  "data": {
    "client_secret": "seti_xxx_secret_yyy",
    "setup_intent_id": "seti_xxx"
  }
}
```

**Internal route:** `POST /internal/payments/methods/setup-intent`

---

### DELETE /api/payments/methods/:id

Detach and remove a saved payment method.

**Auth:** `TENANT`

**Response:** `204 No Content`

**Internal route:** `DELETE /internal/payments/methods/:id`

---

## 4. Ledger

### GET /api/payments/ledger

List ledger entries for the current org (owner/PM view) or current tenant (tenant view).

**Auth:** `ORG_ADMIN`, `OWNER`, `PM_STAFF`, `TENANT`

**Query params:**
- `page` (default: 1)
- `limit` (default: 25, max: 100)
- `type` — filter by entry type (e.g., `PAYMENT`, `REFUND`)
- `lease_id` — filter by lease
- `from` / `to` — date range (ISO 8601)

**Response (200):**
```json
{
  "data": [
    {
      "id": "le_uuid",
      "type": "PAYMENT",
      "amount": 200000,
      "currency": "usd",
      "description": "Rent payment for March 2026",
      "lease_id": "lease_uuid",
      "tenant_id": "tenant_uuid",
      "stripe_object_id": "pi_xxx",
      "status": "POSTED",
      "created_at": "2026-03-05T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 42,
    "totalPages": 2
  }
}
```

**Internal route:** `GET /internal/payments/ledger`

---

## 5. Payouts

### GET /api/payments/payouts

List payouts for the current org's connected account.

**Auth:** `ORG_ADMIN`, `OWNER`, `PM_STAFF`

**Query params:** `page`, `limit`, `status`, `from`, `to`

**Response (200):**
```json
{
  "data": [
    {
      "id": "po_uuid",
      "stripe_payout_id": "po_xxx",
      "amount": 198000,
      "currency": "usd",
      "status": "PAID",
      "arrival_date": "2026-03-07",
      "method": "standard",
      "created_at": "2026-03-05T12:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 25, "total": 5, "totalPages": 1 }
}
```

**Internal route:** `GET /internal/payments/payouts`

---

## 6. Refunds

### POST /api/payments/refunds

Initiate a refund on a completed payment.

**Auth:** `ORG_ADMIN`, `OWNER`, `PM_STAFF`

**Request:**
```json
{
  "payment_transaction_id": "pt_uuid",
  "amount": 50000,
  "reason": "tenant_request",
  "refund_application_fee": false
}
```

`amount` is optional — omit for full refund.
`reason` enum: `tenant_request`, `duplicate`, `fraudulent`, `other`.

**Response (201):**
```json
{
  "data": {
    "id": "ref_uuid",
    "stripe_refund_id": "re_xxx",
    "amount": 50000,
    "currency": "usd",
    "status": "PENDING",
    "reason": "tenant_request"
  }
}
```

**Internal route:** `POST /internal/payments/refunds`

---

### GET /api/payments/refunds

List refunds for the current org.

**Auth:** `ORG_ADMIN`, `OWNER`, `PM_STAFF`

**Internal route:** `GET /internal/payments/refunds`

---

## 7. Obligations

### GET /api/payments/obligations

List payment obligations (rent due, fees) for a tenant or org.

**Auth:** `ORG_ADMIN`, `OWNER`, `PM_STAFF`, `TENANT`

**Query params:** `lease_id`, `status` (`PENDING`, `PAID`, `PARTIAL`, `PAST_DUE`, `CANCELED`), `page`, `limit`

**Response (200):**
```json
{
  "data": [
    {
      "id": "obl_uuid",
      "lease_id": "lease_uuid",
      "tenant_id": "tenant_uuid",
      "type": "RENT",
      "amount": 200000,
      "amount_paid": 0,
      "currency": "usd",
      "due_date": "2026-04-01",
      "status": "PENDING",
      "description": "April 2026 Rent"
    }
  ],
  "meta": { "page": 1, "limit": 25, "total": 1, "totalPages": 1 }
}
```

**Internal route:** `GET /internal/payments/obligations`

---

## 8. Webhooks

### POST /api/payments/webhooks/stripe

Stripe platform webhook endpoint. **No JWT auth** — verified via `stripe-signature` header.

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Body:** Raw Stripe event JSON

**Response:** `200 OK` with `{ "received": true }`

**Behavior:**
- Verifies signature using platform webhook signing secret.
- Stores event in `webhook_events` table.
- Processes event (update payment status, create ledger entries, etc.).
- Returns 200 even if processing fails (to prevent Stripe retries for already-received events).
- Processing errors are logged and queued for retry.

**Internal route:** `POST /internal/payments/webhooks/stripe`

> **BFF Note:** The BFF must forward the **raw body** (not parsed JSON) to the payments-service for signature verification. The proxy should not parse or modify the body for this route.

---

### POST /api/payments/webhooks/stripe-connect

Stripe Connect webhook endpoint for connected account events (payouts, account updates).

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Body:** Raw Stripe event JSON

**Response:** `200 OK` with `{ "received": true }`

**Internal route:** `POST /internal/payments/webhooks/stripe-connect`

---

## 9. Admin / Internal

### GET /api/payments/admin/reconciliation

Retrieve the latest reconciliation report.

**Auth:** `ORG_ADMIN` (platform admin in future)

**Internal route:** `GET /internal/payments/admin/reconciliation`

---

## Error Response Format

All error responses follow the standard LeaseBase error format:

```json
{
  "error": {
    "code": "PAYMENT_ACCOUNT_NOT_FOUND",
    "message": "No payment account configured for this organization",
    "details": {}
  }
}
```

**Payment-specific error codes:**
- `PAYMENT_ACCOUNT_NOT_FOUND` — Org has no Stripe connected account (404)
- `PAYMENT_ACCOUNT_NOT_ACTIVE` — Connected account not fully onboarded (402)
- `OBLIGATION_NOT_FOUND` — Referenced obligation does not exist (404)
- `OBLIGATION_ALREADY_PAID` — Obligation has already been fully paid (409)
- `REFUND_EXCEEDS_AMOUNT` — Refund amount exceeds remaining refundable amount (422)
- `STRIPE_API_ERROR` — Stripe returned an error (502)
- `WEBHOOK_SIGNATURE_INVALID` — Stripe signature verification failed (401)
