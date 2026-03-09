# Owner Payments Setup UX Specification

## 1. Entry Point: "Enable Payments"

### 1.1 Location

The owner sees the payments setup CTA in two places:

**Primary — Settings > Payments**
- Dedicated payments settings page at `/settings/payments`.
- Always accessible from the main navigation sidebar under Settings.
- Shows full onboarding status and payout configuration.

**Secondary — Owner Dashboard Banner**
- A dismissible banner on the owner dashboard (`/dashboard`) if payments are not enabled.
- Copy: "Start collecting rent online. Enable payments to let tenants pay directly through LeaseBase."
- CTA button: "Enable Payments" → navigates to `/settings/payments`.
- Banner is shown until the connected account reaches `ACTIVE` status.

### 1.2 Visibility Rules

- Only visible to users with `ORG_ADMIN` or `OWNER` role.
- Property Managers (`PM_STAFF`) can view payment status but cannot initiate onboarding.
- Tenants never see the onboarding flow.

## 2. Onboarding Flow

### 2.1 Step-by-Step

**Step 1: Pre-Onboarding (Status: NOT_STARTED)**

Page content at `/settings/payments`:
```
Payments
────────────────────────────────────────
Accept rent payments from your tenants directly through LeaseBase.
Payments are processed securely by Stripe.

What you'll need:
  ✓ Business or personal bank account for receiving payouts
  ✓ Tax identification (SSN or EIN)
  ✓ Government-issued ID (for identity verification)

By continuing, you agree to Stripe's Connected Account Agreement
and the LeaseBase Terms of Service.

[ Enable Payments → ]
```

**Step 2: Stripe Hosted Onboarding (External)**

Clicking "Enable Payments":
1. Frontend calls `POST /api/payments/connect/onboard` with return/refresh URLs.
2. Backend creates a Stripe Express account (if not exists) and generates an Account Link.
3. Frontend redirects the user to the Stripe-hosted onboarding URL.
4. Owner completes identity verification, bank account setup, and business info on Stripe's hosted pages.
5. Stripe redirects back to `return_url` (`/settings/payments`).

**Step 3: Post-Onboarding Return**

When the owner returns to `/settings/payments`, the frontend calls `GET /api/payments/connect/status` to determine the current state.

### 2.2 Onboarding States and UI

**ONBOARDING_INCOMPLETE**

Owner started but didn't finish Stripe's onboarding flow.

```
Payments Setup
────────────────────────────────────────
⚠️ Your payments setup is incomplete.

You need to complete identity verification to start
accepting payments.

[ Continue Setup → ]

Need help? Contact support@leasebase.co
```

"Continue Setup" generates a new Account Link and redirects to Stripe.

**PENDING_VERIFICATION**

Owner completed all steps; Stripe is reviewing.

```
Payments Setup
────────────────────────────────────────
⏳ Verification in progress

Stripe is reviewing your information. This usually takes
1-2 business days. We'll notify you when your account
is ready.

No action needed right now.
```

**ACTIVE**

Fully verified. Charges and payouts enabled.

```
Payments
────────────────────────────────────────
✅ Payments enabled

Payment Collection: Active
Payouts: Active — funds arrive in your bank account
         within 2-4 business days.

Bank Account: ••••6789 (Chase Bank)

[ View Stripe Dashboard → ]  [ Manage Payout Settings ]

Recent Payouts
────────────────────────────────────────
Mar 7, 2026    $1,980.00    Paid
Mar 5, 2026    $3,200.00    Paid
Feb 28, 2026   $1,980.00    Paid
                        [ View All Payouts → ]
```

**RESTRICTED**

Account has issues (e.g., additional documentation needed, compliance hold).

```
Payments
────────────────────────────────────────
⚠️ Action Required

Your payments account has been restricted. Please update
your information to continue accepting payments.

Issues:
  • Additional identity document required
  • Business address verification needed

[ Update Information → ]

Payments are temporarily paused until these issues are resolved.
```

"Update Information" generates a new Account Link targeting the specific requirements.

**DISCONNECTED**

Owner deauthorized the connected account.

```
Payments
────────────────────────────────────────
❌ Payments Disconnected

Your Stripe account has been disconnected. Tenants cannot
make payments until you reconnect.

[ Reconnect Payments → ]
```

## 3. Incomplete Onboarding States

### 3.1 Account Link Expiration

Stripe Account Links expire after a short period (typically ~5 minutes for security). If the owner returns to LeaseBase without completing onboarding:

- The `refresh_url` parameter causes Stripe to redirect back to LeaseBase if the link expires.
- LeaseBase detects the `refresh=true` query param and automatically generates a new Account Link.
- The owner is seamlessly redirected to continue onboarding.

### 3.2 Partial Completion

If the owner completes some onboarding steps but not all:

- `account.updated` webhook updates the `payment_account` record with current `requirements`.
- Frontend reads `requirements.currently_due` to show which fields are still needed.
- The "Continue Setup" button generates a new Account Link that drops the owner at the next incomplete step.

### 3.3 Multiple Devices / Sessions

- Onboarding state is stored server-side (via `payment_account` record).
- Any authenticated user with `ORG_ADMIN` or `OWNER` role can resume onboarding.
- No session-specific state is needed.

## 4. Payout Status UI

### 4.1 Payout List View

Located at `/settings/payments/payouts` (or a tab within `/settings/payments`).

Columns:
- Date
- Amount
- Status (badge: Pending → In Transit → Paid / Failed)
- Arrival Date (estimated)
- Bank Account (last 4 digits)

Filter by: date range, status.
Pagination: 25 per page.

### 4.2 Payout Status Badges

- **Pending**: Gray badge. Funds are being prepared.
- **In Transit**: Blue badge. Funds have been sent to the bank.
- **Paid**: Green badge. Funds have arrived.
- **Failed**: Red badge. Payout failed. Shows failure reason on hover/click.

### 4.3 Payout Detail

Clicking a payout shows:
- Breakdown of which rent payments contributed to this payout.
- Platform fees deducted.
- Stripe processing fees.
- Net amount received.

## 5. Error and Retry Flows

### 5.1 Onboarding API Failure

If `POST /api/payments/connect/onboard` fails:

```
Unable to start payments setup. Please try again.

[ Try Again ]

If the problem persists, contact support@leasebase.co.
Error reference: corr-uuid-xxx
```

The correlation ID is displayed so support can trace the issue.

### 5.2 Stripe Redirect Failure

If the Stripe Account Link URL fails to load or Stripe is down:

- Owner sees Stripe's own error page.
- Stripe redirects to `refresh_url` which triggers a new link generation.
- If that also fails, owner sees the "incomplete" state with a "Try Again" button.

### 5.3 Payout Failure

If a payout fails (e.g., bank account closed, invalid routing number):

```
⚠️ Payout Failed — $1,980.00

Reason: Bank account could not be verified.

Please update your bank account information in the Stripe Dashboard.

[ Open Stripe Dashboard → ]
```

Notification is also sent via email (handled by notification-service).

### 5.4 Account Restriction

If Stripe restricts the account mid-operation:

- An in-app notification banner appears on all pages: "Your payments account needs attention. [Fix Now →]"
- Email notification sent with details.
- Active checkout sessions for tenants paying this owner will fail with a user-friendly message.

## 6. Compliance and KYC Messaging

### 6.1 Why We Collect This Information

During onboarding, before redirecting to Stripe:

```
Why do we need this information?

Federal regulations require us to verify the identity of anyone
receiving payments through our platform. This information is
collected and secured by Stripe, our payment processor.

LeaseBase does not store your SSN, bank account numbers, or
identity documents. All sensitive information is handled directly
by Stripe.

Learn more: stripe.com/connect/account-verification
```

### 6.2 Tax Reporting

On the payments settings page (once active):

```
📋 Tax Information

Stripe will issue a 1099-K if you receive $600 or more in
payments during the calendar year. Tax documents will be
available in your Stripe Express Dashboard in January.

[ View Tax Documents in Stripe → ]
```

### 6.3 Data Privacy

Footer text on all payments pages:

```
Payment processing is provided by Stripe. Your financial
information is encrypted and stored by Stripe in compliance
with PCI-DSS Level 1. LeaseBase does not have access to
your full bank account or card numbers.
```

## 7. Tenant Payment Experience (Brief)

While this spec focuses on owner setup, the tenant-facing payment UI should:

1. Show upcoming obligations on the tenant dashboard.
2. Provide a "Pay Now" button that creates a Checkout Session and redirects to Stripe.
3. Show payment history with status.
4. Allow saving payment methods for future use.
5. Show clear error messages if payment fails.
6. If the owner hasn't enabled payments, show: "Online payments are not yet available for this property. Contact your landlord."

Detailed tenant payment UX spec is a separate document.

## 8. Frontend Implementation Notes

### 8.1 Required Dependencies

- `@stripe/stripe-js` — Stripe.js loader for client-side (Checkout redirect, Elements if used).
- No server-side Stripe SDK needed in the frontend.

### 8.2 Environment Variables

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  (or pk_live_xxx)
```

This is the only Stripe-related env var needed in the frontend. It is safe to expose (publishable key).

### 8.3 Key Components to Build

- `PaymentsSettingsPage` — `/settings/payments` — Main onboarding and status page.
- `PaymentStatusBanner` — Dashboard banner for incomplete onboarding.
- `PayoutList` — Payout history table with filters.
- `ConnectStatusCard` — Displays current Stripe account status with action buttons.
- `TenantPaymentPage` — `/payments` — Tenant's view of obligations and pay button.

### 8.4 API Hooks

```
useConnectStatus()     → GET /api/payments/connect/status
useCreateOnboardLink() → POST /api/payments/connect/onboard
usePayouts()           → GET /api/payments/payouts
useObligations()       → GET /api/payments/obligations
useCreateCheckout()    → POST /api/payments/checkout-session
```
