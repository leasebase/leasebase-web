# Tenant Persona Specification

## 1. Persona Definition

**Name:** Tenant (Renter)
**Backend role:** `TENANT`
**Frontend persona:** `tenant`

A Tenant is an individual who rents a residential unit managed through LeaseBase. They interact with the platform primarily to pay rent, track maintenance requests, view lease and property documents, and receive notifications from their property manager or owner.

### Demographics & Characteristics
- Age range: 18–65+, skews 25–45
- Tech comfort: moderate — expects mobile-friendly, simple flows
- Primary device: smartphone (60%+), desktop secondary
- Frequency: 1–3× per month (rent payment, maintenance check)
- Relationship to platform: passive consumer — did NOT choose this software; their PM/owner did

### Key Implication
Because tenants did not choose LeaseBase, the UX must be **immediately intuitive** with zero onboarding friction. Trust is earned through transparency (no hidden fees, clear payment status) and reliability (no data that looks wrong or stale).

## 2. Goals / Jobs-to-Be-Done

| Priority | Job | Success Metric |
|----------|-----|----------------|
| P0 | Pay rent on time, every time | Payment confirmed within 1 click of dashboard |
| P0 | Know exactly what I owe and when | Rent amount + due date visible on dashboard |
| P0 | Report a maintenance issue quickly | Request submitted in < 2 minutes |
| P1 | Track maintenance request status | Status visible without contacting PM |
| P1 | Access my lease documents | Lease PDF viewable/downloadable |
| P1 | See notifications from PM/owner | Unread count visible; click-through to detail |
| P2 | View payment history / receipts | Past payments listed with status |
| P2 | Update my contact information | Phone/email editable in settings |
| P3 | Communicate with PM/owner | (Future: messaging) |
| P3 | Set up autopay | (Future: no backend support) |

## 3. Trust & Safety Requirements

### Financial Transparency
- Never show a dollar amount without provenance context (live data vs. sample)
- Never imply a payment was processed when it was not
- Payment status must distinguish: due, paid, pending, failed, reversed
- If payment processing is stubbed, show "Sample data — payment processing not yet available" prominently

### Data Accuracy
- Use `DomainResult<T>` + `DataSource` provenance on every data fetch
- If a service is unreachable, show "unavailable" rather than stale/zero data
- Never show partial counts as if they were totals

### Authentication & Authorization
- Tenant must only see data related to their own lease(s) and unit(s)
- Client-side filtering is a temporary measure; backend should enforce tenant-scoping
- Session expiry must redirect to login without data loss (form state preserved if feasible)

### Error Handling
- Per-widget failure isolation — one broken service doesn't crash the whole dashboard
- Friendly error messages — no stack traces, no technical jargon
- Retry guidance where appropriate ("Try again" button)

## 4. Accessibility Considerations

### WCAG 2.1 AA Compliance Targets
- **Keyboard navigation**: All interactive elements reachable via Tab/Enter/Space
- **Screen readers**: Semantic HTML, proper heading hierarchy, ARIA labels on dynamic content
- **Color contrast**: All text meets 4.5:1 ratio (verified by existing Tailwind theme)
- **Focus indicators**: Visible focus rings on all interactive elements (existing `focus-visible:ring-2` pattern)
- **Motion**: Respect `prefers-reduced-motion` for skeleton animations
- **Form labels**: All inputs must have associated `<label>` elements
- **Status updates**: Use `role="status"` for loading/error states so screen readers announce changes

### Mobile-First Design
- Touch targets: minimum 44×44px for interactive elements
- No hover-only interactions — all tooltips must also be accessible via focus
- Responsive grid: 1 column on mobile, 2–3 on tablet/desktop
- Bottom-aligned CTAs for thumb-reachable actions on mobile

### Internationalization (Future)
- All user-facing strings should be extractable for i18n
- Currency formatting via `Intl.NumberFormat`
- Date formatting via `Intl.DateTimeFormat`
- RTL layout support deferred to future phase
