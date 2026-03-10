# Stripe Webhook Handling Plan

## 1. Required Webhook Endpoints

LeaseBase registers **two** webhook endpoints in the Stripe Dashboard:

### 1.1 Platform Endpoint

**URL:** `https://api.{env}.leasebase.co/api/payments/webhooks/stripe`
**Signing secret:** Stored in `leasebase/{env}/stripe/webhook-signing` → `platform_endpoint_secret`

**Events to subscribe:**

| Event | Priority | Handler Action |
|---|---|---|
| `payment_intent.succeeded` | Critical | Update txn status → SUCCEEDED, create PAYMENT ledger entry, update obligation amount_paid |
| `payment_intent.payment_failed` | Critical | Update txn status → FAILED, trigger notification, schedule retry if applicable |
| `payment_intent.processing` | Normal | Update txn status → PROCESSING |
| `payment_intent.canceled` | Normal | Update txn status → CANCELED |
| `charge.refunded` | Normal | Confirm refund completion, update refund record status |
| `charge.dispute.created` | Critical | Create dispute record, create DISPUTE ledger entry, notify owner |
| `charge.dispute.updated` | Normal | Update dispute record |
| `charge.dispute.closed` | Critical | Resolve dispute (WON/LOST), create DISPUTE_REVERSAL ledger entry if lost |
| `checkout.session.completed` | Normal | Link checkout session to payment transaction |
| `transfer.created` | Normal | Store transfer ID on payment transaction |

### 1.2 Connect Endpoint

**URL:** `https://api.{env}.leasebase.co/api/payments/webhooks/stripe-connect`
**Signing secret:** Stored in `leasebase/{env}/stripe/webhook-signing` → `connect_endpoint_secret`
**Listen to:** Connected accounts

**Events to subscribe:**

| Event | Priority | Handler Action |
|---|---|---|
| `account.updated` | Critical | Update payment_account status, capabilities, requirements |
| `account.application.deauthorized` | Critical | Mark payment_account DISCONNECTED, suspend payment collection |
| `payout.created` | Normal | Create payout record |
| `payout.paid` | Normal | Update payout status → PAID |
| `payout.failed` | Critical | Update payout status → FAILED, notify owner |
| `payout.canceled` | Normal | Update payout status → CANCELED |

## 2. Idempotency Strategy

### 2.1 Deduplication

Every Stripe event has a unique `event.id` (e.g., `evt_1234`). The `webhook_event` table has a `UNIQUE` constraint on `stripe_event_id`.

**Processing flow:**

```
1. Receive webhook POST
2. Verify signature (see §3)
3. INSERT INTO webhook_event (stripe_event_id, ...) ON CONFLICT DO NOTHING
   → If INSERT succeeds (new event): proceed to processing
   → If INSERT conflicts (duplicate): check existing record status
     → If PROCESSED: return 200 immediately
     → If FAILED: re-process (allow retry)
     → If PROCESSING: return 200 (another worker is handling it)
4. Set status = 'PROCESSING'
5. Execute handler
6. Set status = 'PROCESSED' (or 'FAILED' with error_message)
7. Return 200
```

### 2.2 Handler Idempotency

Beyond event-level dedup, each handler must be idempotent at the business logic level:

- **payment_intent.succeeded**: Check if `payment_transaction.status` is already `SUCCEEDED` before creating ledger entries. Use the `stripe_payment_intent_id` as a natural idempotency key.
- **account.updated**: Overwrite `payment_account` fields — naturally idempotent.
- **payout.paid**: Check if payout record already has `status = PAID`.

### 2.3 Idempotency Keys for Outbound Calls

When the webhook handler triggers outbound Stripe API calls (rare, but possible for retries), use Stripe's `Idempotency-Key` header with a deterministic key derived from the event:

```
Idempotency-Key: leasebase-{event_id}-{action}
```

## 3. Signature Verification

### 3.1 Implementation

```typescript
import Stripe from 'stripe';

function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
```

### 3.2 Requirements

- The **raw request body** (not parsed JSON) must be used for signature verification.
- The BFF gateway must forward the raw body to the payments-service without parsing.
- The payments-service webhook route must use `express.raw({ type: 'application/json' })` instead of `express.json()`.
- The `stripe-signature` header must be forwarded by the BFF proxy.

### 3.3 Failure Handling

- If signature verification fails, return `401` and log the event with `status = 'SIGNATURE_INVALID'`.
- Do NOT store the event payload if signature verification fails (could be spoofed).
- Alert on repeated signature failures (potential attack or misconfigured secret).

## 4. Retry Handling

### 4.1 Stripe's Retry Behavior

Stripe retries webhook delivery for up to 3 days with exponential backoff if the endpoint returns a non-2xx status code. Retry schedule (approximate):

- 5 minutes, 30 minutes, 2 hours, 8 hours, 1 day, 2 days

### 4.2 Our Retry Strategy

**Always return 200** once the event is received and signature-verified, even if processing fails. This prevents Stripe from retrying delivery of an event we already have.

**Internal retry for failed processing:**

1. Mark `webhook_event.status = 'FAILED'` with `error_message`.
2. Increment `retry_count`.
3. Publish a retry message to the `payments-webhook-retry` SQS queue with a visibility timeout (backoff).
4. A consumer picks up the retry message and re-processes the event from the stored payload.
5. Max retries: 5. After 5 failures, mark as `PERMANENTLY_FAILED` and alert.

### 4.3 SQS Retry Queue Configuration

```
Queue: leasebase-{env}-payments-webhook-retry
Visibility Timeout: 300s (5 min base, consumer adjusts per retry)
Max Receive Count: 5
DLQ: leasebase-{env}-payments-webhook-dlq
Message Retention: 14 days
```

## 5. Dead-Letter and Recovery Plan

### 5.1 Dead-Letter Queue (DLQ)

Events that fail all retry attempts are moved to the DLQ:

```
Queue: leasebase-{env}-payments-webhook-dlq
Message Retention: 14 days
```

### 5.2 DLQ Monitoring

- CloudWatch alarm on `ApproximateNumberOfMessagesVisible > 0` on the DLQ.
- Alert fires to the ops SNS topic (already provisioned via IaC observability module).
- DLQ messages are reviewed manually and either:
  - Re-driven to the retry queue after the root cause is fixed.
  - Manually processed via an admin endpoint or script.
  - Acknowledged and discarded (for non-critical events that are no longer actionable).

### 5.3 Manual Recovery

```
POST /internal/payments/webhooks/replay
{
  "webhook_event_id": "uuid"
}
```

Admin-only endpoint to re-process a specific stored webhook event. Useful for:
- Events in PERMANENTLY_FAILED status after a bug fix.
- Events skipped due to a transient dependency failure (DB down, etc.).

### 5.4 Stripe Event Replay

If events are lost entirely (before reaching our endpoint), use the Stripe Dashboard or API to list recent events and replay them:

```
GET /v1/events?type=payment_intent.succeeded&created[gte]=1709942400
```

This is a last-resort recovery mechanism.

## 6. Observability and Logging Requirements

### 6.1 Structured Logging

Every webhook processing step is logged with structured fields:

```json
{
  "level": "info",
  "message": "Webhook event processed",
  "stripe_event_id": "evt_1234",
  "event_type": "payment_intent.succeeded",
  "stripe_account_id": "acct_xxx",
  "processing_time_ms": 45,
  "status": "PROCESSED",
  "correlation_id": "corr-uuid"
}
```

**Log levels:**
- `info`: Event received, processing started, processing completed.
- `warn`: Duplicate event received, non-critical processing error, slow processing (>5s).
- `error`: Signature verification failed, processing failed, DLQ send failed.

### 6.2 Metrics (CloudWatch Custom Metrics)

| Metric | Description |
|---|---|
| `webhook.received.count` | Total events received, by event_type |
| `webhook.processed.count` | Successfully processed events |
| `webhook.failed.count` | Failed processing attempts |
| `webhook.duplicate.count` | Duplicate events detected |
| `webhook.processing_time` | Time to process each event (p50, p95, p99) |
| `webhook.signature_invalid.count` | Failed signature verifications |
| `webhook.dlq.depth` | Messages in the DLQ |

### 6.3 Alarms

| Alarm | Threshold | Action |
|---|---|---|
| Webhook processing failures | >5 in 5 minutes | SNS alert to ops |
| DLQ depth > 0 | Any message in DLQ | SNS alert to ops |
| Signature verification failures | >3 in 1 hour | SNS alert to security |
| Processing latency p99 > 10s | Sustained for 5 min | SNS alert to ops |
| No webhook events received | 0 events in 24 hours | SNS alert to ops (endpoint may be down) |

### 6.4 Dashboard

Add a "Payments Webhooks" panel to the existing CloudWatch dashboard (provisioned by the observability module) showing:

- Events received per hour (by type)
- Processing success/failure rate
- Processing latency distribution
- DLQ depth
- Signature failures

## 7. BFF Configuration

The BFF gateway currently parses JSON bodies via `express.json()` before proxying. For webhook routes, the raw body must be preserved:

**Option A (recommended):** The BFF proxy already streams the body via `http-proxy-middleware` with `fixRequestBody`. Since it also calls `express.json()` globally, the webhook path should be excluded from JSON parsing, OR the payments-service should accept and verify against the re-serialized body.

**Option B:** Add a middleware in the BFF that skips `express.json()` for `/api/payments/webhooks/*` paths.

The current BFF uses `http-proxy-middleware` which streams the body; `fixRequestBody` re-serializes parsed JSON. For Stripe signature verification to work, the payments-service must verify against the exact bytes Stripe sent. Since the BFF uses `express.json()` globally and then `fixRequestBody` re-serializes, the re-serialized body may differ from the original bytes.

**Recommended fix:** In the BFF, exclude webhook paths from the global `express.json()` middleware so the raw body is forwarded intact via the proxy.

## 8. Infrastructure Requirements (IaC Changes)

### 8.1 New Secrets Manager Entries

```hcl
# In leasebase-iac: envs/dev/main.tf or a new payments-secrets module

resource "aws_secretsmanager_secret" "stripe_api_keys" {
  name        = "leasebase/${local.environment}/stripe/api-keys"
  description = "Stripe API keys for LeaseBase platform"
  kms_key_id  = module.kms.key_arn
}

resource "aws_secretsmanager_secret" "stripe_webhook_signing" {
  name        = "leasebase/${local.environment}/stripe/webhook-signing"
  description = "Stripe webhook signing secrets"
  kms_key_id  = module.kms.key_arn
}
```

### 8.2 New SQS Queues

Add to `var.sqs_queues`:

```
payments-webhook-retry
payments-webhook-dlq (as DLQ for the above)
```

### 8.3 Payments-Service Extra Env Vars

Add to `service_extra_env.payments-service`:

```hcl
{ name = "SQS_WEBHOOK_RETRY_QUEUE_URL", value = module.sqs.queue_urls["payments-webhook-retry"] }
```

### 8.4 Payments-Service Secrets

Add to `service_secrets.payments-service`:

```hcl
{ name = "STRIPE_SECRET_ARN", valueFrom = aws_secretsmanager_secret.stripe_api_keys.arn }
{ name = "STRIPE_WEBHOOK_SECRET_ARN", valueFrom = aws_secretsmanager_secret.stripe_webhook_signing.arn }
```

### 8.5 IAM for SQS

Add to `service_extra_iam.payments-service`:

```hcl
{
  Sid      = "SQSPaymentsWebhook"
  Effect   = "Allow"
  Action   = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage"]
  Resource = [
    module.sqs.queue_arns["payments-webhook-retry"],
    module.sqs.queue_arns["payments-webhook-dlq"]
  ]
}
```
