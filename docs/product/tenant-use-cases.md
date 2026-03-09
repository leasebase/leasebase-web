# Tenant Use Cases

All use cases follow a consistent format: Preconditions, Main Success Path (click path), Alternate/Edge/Error Paths, Data/Entities Involved, UI Screens/Components Impacted, and Backend/API Dependencies.

Provenance legend: **Live** = endpoint exists and TENANT role is authorized; **Stub** = endpoint exists but TENANT role is forbidden (or data must be fabricated); **Unavailable** = no endpoint exists.

---

## UC-01: Tenant receives invitation and creates account

**Preconditions:** PM/Owner has created a lease and invited the tenant via email. The email contains a registration link with an invite token.

**Main Success Path:**
1. Tenant clicks invite link in email → lands on `/auth/register?invite=<token>`
2. Tenant fills registration form (email pre-filled, password, first name, last name)
3. System calls `POST /api/auth/register` with invite token
4. Tenant receives verification email
5. Tenant enters code on `/auth/verify-email` → `POST /api/auth/confirm-email`
6. Tenant logs in → redirected to `/app` (tenant dashboard)

**Alternate/Edge/Error Paths:**
- **Invite expired**: Show "This invitation has expired. Contact your property manager."
- **Email already registered**: Show "An account already exists. Try logging in instead."
- **Password too weak**: Inline validation with password requirements component
- **Verification code wrong/expired**: Show error, offer resend

**Data/Entities:** User, Invite (future), TenantProfile, Lease

**UI Screens:** `/auth/register`, `/auth/verify-email`, `/auth/login`

**Backend Status:** `POST /api/auth/register` = **Live** (no invite token support yet); `POST /api/auth/confirm-email` = **Live**. Invite-token flow = **Unavailable** — requires backend invite system. Current workaround: PM creates user manually, tenant uses standard registration.

---

## UC-02: Tenant joins existing account to a new lease

**Preconditions:** Tenant already has a LeaseBase account. PM assigns them to a new lease (same email, different unit or renewed lease).

**Main Success Path:**
1. PM assigns tenant to new lease via `POST /api/leases/:id/tenants`
2. Tenant logs in → dashboard shows updated/additional lease
3. If multiple leases: lease selector appears in dashboard header

**Alternate/Edge/Error Paths:**
- **Tenant not notified**: Relies on notification service sending update (future)
- **Stale dashboard**: Tenant refreshes page to pick up new lease

**Data/Entities:** User, TenantProfile, Lease (old + new)

**UI Screens:** `/app` (dashboard)

**Backend Status:** `POST /api/leases/:id/tenants` = **Live** (PM_STAFF/ORG_ADMIN only). Tenant sees result via lease list. No tenant-side notification for new assignment = **Unavailable**.

---

## UC-03: Tenant has multiple leases (current + future)

**Preconditions:** Tenant's user account is linked to 2+ lease records (e.g., renewed lease starting next month while current is still active).

**Main Success Path:**
1. Tenant logs in → dashboard shows a lease context selector
2. Tenant selects which lease to view
3. Dashboard updates KPIs, payment info, and documents for selected lease

**Alternate/Edge/Error Paths:**
- **All leases expired**: Show "no active lease" empty state with historical access toggle
- **Only one active**: No selector shown, but lease info displayed

**Data/Entities:** TenantProfile (multiple lease_id associations), Lease[]

**UI Screens:** `/app` (dashboard), TenantKpiHeader (lease selector)

**Backend Status:** Tenant profile currently stores single `lease_id`. Multiple leases = **Stub** — requires schema change to support many-to-many. Phase 1 shows the single linked lease.

---

## UC-04: Tenant views lease terms and documents

**Preconditions:** Tenant has an active lease.

**Main Success Path:**
1. Tenant clicks "View Lease" quick action or navigates to `/app/leases`
2. System shows lease summary: unit, address, rent amount, start/end dates, status
3. Tenant clicks "Documents" tab or navigates to `/app/documents`
4. System shows list of documents associated with lease
5. Tenant clicks download → presigned URL opens document

**Alternate/Edge/Error Paths:**
- **No documents uploaded**: Empty state — "No documents have been shared yet"
- **Document service unavailable**: Show unavailable banner with provenance
- **Lease expired**: Show read-only lease details with "Ended" badge

**Data/Entities:** Lease, Document[], Unit, Property

**UI Screens:** `/app` (lease summary widget), `/app/leases`, `/app/documents`

**Backend Status:** `GET /api/leases/:id` = **Live**. `GET /api/documents` = **Stub** (TENANT not authorized — 403). `GET /api/documents/:id/download` = **Stub**. Follow-up: add TENANT to document-service requireRole for read operations.

---

## UC-05: Tenant pays rent (card)

**Preconditions:** Tenant has active lease with rent due. Stripe Connect configured for the property owner.

**Main Success Path:**
1. Tenant clicks "Pay Rent" on dashboard or navigates to `/app/pay-rent`
2. System displays: rent amount, due date, payment method selection
3. Tenant selects "Credit/Debit Card"
4. System creates Stripe Checkout Session → redirects to Stripe hosted page
5. Tenant completes payment on Stripe
6. Stripe redirects back to `/app/pay-rent?success=true`
7. Dashboard updates payment status to "Processing"
8. Webhook confirms → status becomes "Paid"

**Alternate/Edge/Error Paths:**
- **Card declined**: Stripe shows error → tenant returns to pay-rent with failure message
- **Stripe unavailable**: Show "Payment processing temporarily unavailable" with provenance
- **Already paid**: Show "Rent already paid for this period" with green badge
- **Partial amount**: Not allowed (full rent amount only, enforced in UI)

**Data/Entities:** Lease, Payment, LedgerEntry, StripeCheckoutSession

**UI Screens:** `/app/pay-rent`, Stripe Checkout (external)

**Backend Status:** `POST /api/payments` = **Live** (creates DB record). Stripe Checkout Session creation = **Unavailable** (scaffolded but not wired). Phase 1 implements UI with stub checkout clearly labeled.

---

## UC-06: Tenant pays rent (ACH / bank transfer)

**Preconditions:** Same as UC-05. ACH payment method available.

**Main Success Path:**
1–4. Same as UC-05 but tenant selects "Bank Account (ACH)"
5. Stripe creates ACH payment (takes 3–5 business days)
6. Dashboard shows "Pending" status with "ACH payments typically take 3–5 business days"
7. Webhook confirms → status becomes "Paid"

**Alternate/Edge/Error Paths:**
- **ACH return (UC-09)**: Handled separately — payment reverses days later
- **Insufficient funds**: Stripe returns failure → payment marked "Failed"

**Data/Entities:** Same as UC-05

**UI Screens:** `/app/pay-rent`

**Backend Status:** Same as UC-05 — **Unavailable** (Stripe integration stubbed).

---

## UC-07: Tenant payment fails (card declined)

**Preconditions:** Tenant attempted card payment and it was declined.

**Main Success Path:**
1. Stripe declines card → returns error to checkout
2. Tenant sees "Payment failed — your card was declined"
3. Dashboard shows "Failed" badge on rent status
4. Tenant can retry with different card

**Alternate/Edge/Error Paths:**
- **Repeated failures**: Show "Contact your bank or try a different payment method"
- **Late fee triggers**: If late fee logic exists, display it (currently unavailable)

**Data/Entities:** Payment (status=FAILED)

**UI Screens:** `/app/pay-rent`, `/app` (dashboard payment widget)

**Backend Status:** Payment record creation = **Live**. Status update via webhook = **Unavailable** (webhook handler scaffolded). UI shows the state from payment record.

---

## UC-08: Tenant payment pending (ACH)

**Preconditions:** Tenant initiated ACH payment, processing.

**Main Success Path:**
1. Dashboard shows "Pending" badge with tooltip: "ACH payments take 3–5 business days"
2. Payment history shows transaction with "Pending" status
3. Once confirmed, status updates to "Paid"

**Data/Entities:** Payment (status=PENDING)

**UI Screens:** `/app` (dashboard), `/app/payment-history`

**Backend Status:** Payment records = **Live**. Status transitions via webhooks = **Unavailable**.

---

## UC-09: Tenant payment reversal (ACH return)

**Preconditions:** ACH payment was initially accepted but later returned by bank.

**Main Success Path:**
1. Webhook receives `charge.dispute.created` or ACH return event
2. Payment status changes from SUCCEEDED → FAILED
3. Dashboard shows "Reversed" badge with explanation
4. Tenant sees notification: "Your payment was returned by your bank"

**Alternate/Edge/Error Paths:**
- **Tenant disputes reversal**: Show "Contact your property manager" guidance
- **Late fees now apply**: Display if supported (currently unavailable)

**Data/Entities:** Payment (status=FAILED after reversal), Notification

**UI Screens:** `/app`, `/app/payment-history`, `/app/notifications`

**Backend Status:** Webhook handling = **Unavailable** (scaffolded). Notification creation = **Live** (PM must send manually). Automatic reversal notification = **Unavailable**.

---

## UC-10: Partial payment

**Decision:** Partial payments are **NOT allowed** in Phase 1.

**Rationale:** The payments-service `createPaymentSchema` accepts any `amount >= 1` but has no validation against the lease rent amount. Allowing partial payments without proper ledger tracking would create accounting ambiguity. The UI will enforce full rent amount only.

**Future:** When the backend supports a rent obligations/schedule table with remaining balance tracking, partial payments can be enabled with clear "Amount remaining" display.

---

## UC-11: Overpayment / credit balance

**Decision:** Overpayments are **NOT tracked** in Phase 1.

**Rationale:** No credit balance mechanism exists in the payments-service. If a tenant overpays (e.g., pays $1500 on $1400 rent), the excess is not tracked as a credit. The UI will not allow custom amounts — only the lease rent amount.

**Future:** Requires a credit_balance field on tenant_profiles or a CREDIT ledger entry type, plus logic to apply credits to future payments.

---

## UC-12: Late rent + late fees visibility

**Preconditions:** Rent due date has passed, tenant has not paid.

**Main Success Path:**
1. Dashboard shows "Overdue" badge (red) on rent status
2. Due date shown with "X days overdue" calculation
3. If late fees exist in ledger, display amount

**Alternate/Edge/Error Paths:**
- **Late fee not configured**: Show "Contact your property manager for late fee information"
- **Ledger unavailable**: Late fees cannot be shown (403 for TENANT on ledger endpoint)

**Data/Entities:** Lease (due date derived from rent schedule), LedgerEntry (CHARGE)

**UI Screens:** `/app` (dashboard KPI header)

**Backend Status:** Ledger endpoint = **Stub** (TENANT not authorized). Late fee calculation = **Unavailable**. Phase 1 derives overdue status from lease `end_date` and payment records. Cannot show late fee amounts.

---

## UC-13: Tenant sets autopay

**Status:** Future — not implemented in Phase 1.

**Preconditions:** Stripe Connect account set up, tenant has saved payment method.

**Rationale:** No backend endpoint exists for saving payment methods or configuring recurring payments. Requires Stripe Customer + PaymentMethod storage, plus a recurring charge scheduler.

**UI:** Settings page shows "Autopay — Coming soon" placeholder.

---

## UC-14: Tenant submits maintenance request

**Preconditions:** Tenant has active lease with unit assignment.

**Main Success Path:**
1. Tenant clicks "Submit Maintenance Request" on dashboard or navigates to `/app/maintenance/new`
2. System shows form: category (dropdown), priority (Low/Medium/High), description (textarea)
3. If priority = "HIGH": show emergency contact guidance banner
4. Tenant fills form and clicks "Submit"
5. System calls `POST /api/maintenance` with unitId, category, priority, description
6. Success → redirect to `/app/maintenance` with success toast

**Alternate/Edge/Error Paths:**
- **Missing required fields**: Inline validation errors
- **Service unavailable**: Show error, preserve form state
- **No unit assigned**: Cannot determine unitId — show "Contact your property manager"

**Data/Entities:** WorkOrder (created), Unit

**UI Screens:** `/app/maintenance/new`, `/app/maintenance`

**Backend Status:** `POST /api/maintenance` = **Live** (any authenticated user can create).

---

## UC-15: Tenant adds photos/attachments to maintenance

**Preconditions:** Tenant is creating or viewing a maintenance request.

**Main Success Path:**
1. On maintenance form, tenant clicks "Add Photos"
2. System shows file picker (accept images)
3. Tenant selects files
4. System calls `POST /api/documents/upload` with relatedType=work_order, relatedId

**Alternate/Edge/Error Paths:**
- **File too large**: Client-side validation, show limit
- **Upload fails**: Preserve form, show retry

**Data/Entities:** Document, WorkOrder

**UI Screens:** `/app/maintenance/new`

**Backend Status:** `POST /api/documents/upload` = **Stub** (TENANT not authorized — 403). Follow-up: add TENANT to upload requireRole for maintenance attachments. Phase 1 shows "Photo upload coming soon" placeholder.

---

## UC-16: Tenant tracks maintenance status changes

**Preconditions:** Tenant has submitted a maintenance request.

**Main Success Path:**
1. Tenant navigates to `/app/maintenance` → sees list of their requests
2. Each request shows: title, status (Open/In Progress/Resolved/Closed), date, priority
3. Tenant clicks a request → detail view at `/app/maintenance/[id]`
4. Detail shows: description, status timeline, comments

**Alternate/Edge/Error Paths:**
- **No requests**: Empty state — "No maintenance requests yet"
- **Status change notification**: Relies on notification service (if configured)

**Data/Entities:** WorkOrder, WorkOrderComment[]

**UI Screens:** `/app/maintenance`, `/app/maintenance/[id]`

**Backend Status:** `GET /api/maintenance` = **Live**. `GET /api/maintenance/:id` = **Live**. `GET /api/maintenance/:id/comments` = **Live**. Filtering by created_by_user_id is client-side.

---

## UC-17: Tenant cancels/edits maintenance request

**Decision:** Tenants **CANNOT** edit or cancel maintenance requests in Phase 1.

**Rationale:** `PUT /api/maintenance/:id` and `PATCH /api/maintenance/:id/status` require ORG_ADMIN or PM_STAFF role. Allowing tenant edits/cancellation requires a backend change.

**Workaround:** Tenant can add a comment (UC-16 detail view) saying "Please cancel this request."

**Future:** Add `PATCH /api/maintenance/:id/cancel` endpoint that only the creator can call, limited to OPEN status.

---

## UC-18: Tenant messages owner/manager

**Status:** Future — not implemented in Phase 1.

**Rationale:** No messaging service exists. The notification service is one-directional (PM → tenant).

**Phase 1 placeholder:** "Messages — Coming soon" on the messages page. Emergency contact info shown on maintenance emergency flow.

---

## UC-19: Tenant updates profile

**Preconditions:** Tenant is logged in.

**Main Success Path:**
1. Tenant navigates to `/app/settings`
2. System shows profile info: name, email, phone
3. Tenant edits phone number, clicks "Save"
4. System calls `PUT /api/tenants/:id`

**Alternate/Edge/Error Paths:**
- **Save fails**: Show error, preserve edits
- **Email change**: Not supported (email is Cognito identity, requires separate flow)

**Data/Entities:** TenantProfile, User

**UI Screens:** `/app/settings`

**Backend Status:** `PUT /api/tenants/:id` = **Stub** (TENANT not authorized — ORG_ADMIN, PM_STAFF only). Phase 1 shows read-only profile. Follow-up: add TENANT self-update to tenant-service.

---

## UC-20: Tenant moves out / lease ended

**Preconditions:** Lease status is TERMINATED or EXPIRED.

**Main Success Path:**
1. Tenant logs in → dashboard detects no active lease
2. System shows TenantEmptyState: "Your lease has ended"
3. Tenant can still view historical payment history and past maintenance requests (read-only)
4. Pay Rent action is hidden/disabled

**Alternate/Edge/Error Paths:**
- **Lease ended but tenant not aware**: PM should send notification (manual)
- **Deposit refund tracking**: Not supported in Phase 1

**Data/Entities:** Lease (status=TERMINATED/EXPIRED), Payment[], WorkOrder[]

**UI Screens:** `/app` (empty state), `/app/payment-history` (read-only), `/app/maintenance` (read-only)

**Backend Status:** Lease status check = **Live**. All historical data endpoints = **Live**.

---

## UC-21: Tenant is locked out or invite revoked

**Preconditions:** PM disables tenant account or revokes invite.

**Main Success Path:**
1. Tenant attempts login → Cognito returns error
2. Login page shows "Your account has been disabled. Contact your property manager."

**Alternate/Edge/Error Paths:**
- **Token still valid**: Next API call returns 401 → auth store clears session
- **Tenant profile deleted**: API calls return 404 → dashboard shows error state

**Data/Entities:** User (disabled), TenantProfile (deleted)

**UI Screens:** `/auth/login` (error), `/app` (error state if mid-session)

**Backend Status:** Cognito account disable = **Live** (admin action). Tenant profile deletion = **Live** (ORG_ADMIN). Session invalidation = **Live** (401 handling in apiRequest).

---

## UC-22: Tenant disputes a charge / requests refund

**Status:** Future — not implemented in Phase 1.

**Rationale:** No dispute/refund endpoint exists. Stripe refunds are scaffolded in webhook handlers but not wired. No tenant-facing refund request flow.

**Future:** Add `POST /api/payments/:id/dispute` endpoint. PM reviews and either approves refund via Stripe or rejects with explanation. Tenant sees dispute status on payment history.

---

## UC-23: Tenant views payment receipts

**Preconditions:** Tenant has completed payments.

**Main Success Path:**
1. Tenant navigates to `/app/payment-history`
2. Clicks on a specific payment → detail/receipt view
3. Shows: date, amount, method, status, confirmation number

**Alternate/Edge/Error Paths:**
- **No payments**: Empty state
- **Receipt PDF**: Not available (no receipt generation service)

**Data/Entities:** Payment

**UI Screens:** `/app/payment-history`

**Backend Status:** `GET /api/payments` = **Live**. Receipt PDF generation = **Unavailable**.

---

## UC-24: Tenant adds comment to maintenance request

**Preconditions:** Tenant has an existing maintenance request.

**Main Success Path:**
1. Tenant opens maintenance detail `/app/maintenance/[id]`
2. Scrolls to comments section
3. Types comment, clicks "Add Comment"
4. System calls `POST /api/maintenance/:id/comments`
5. Comment appears in thread

**Alternate/Edge/Error Paths:**
- **Empty comment**: Validation prevents submission
- **Service error**: Show error, preserve comment text

**Data/Entities:** WorkOrderComment

**UI Screens:** `/app/maintenance/[id]`

**Backend Status:** `POST /api/maintenance/:id/comments` = **Live**. `GET /api/maintenance/:id/comments` = **Live**.
