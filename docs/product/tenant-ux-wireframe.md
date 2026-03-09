# Tenant UX Wireframe

## Design Principles

1. **Mobile-first**: Design for 375px width, enhance for tablet (768px) and desktop (1024px+)
2. **Trust through transparency**: Every data point shows its provenance; nothing looks fake
3. **Minimal cognitive load**: "What do I owe? When is it due? What's happening with my requests?"
4. **Progressive disclosure**: Dashboard shows summary; detail pages show full info
5. **Consistent with Owner dashboard**: Same visual language, same component library, same Tailwind theme

## Layout Zones

### Dashboard (`/app`)

```
┌─────────────────────────────────────────┐
│  [KPI Header]                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Rent Due │ │  Status  │ │  Lease   │ │
│  │ $1,450   │ │  Due Soon│ │  Ends    │ │
│  │ Mar 1    │ │ ⚠ badge  │ │  Aug '26 │ │
│  └──────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────┤
│  [Quick Actions]                        │
│  [Pay Rent] [Maintenance] [Documents]   │
│  [View Lease]                           │
├─────────────────────────────────────────┤
│  ┌────────────────┐ ┌────────────────┐  │
│  │  Payments      │ │  Maintenance   │  │
│  │  Next: $1,450  │ │  1 open        │  │
│  │  History: 3    │ │  Faucet - Open │  │
│  └────────────────┘ └────────────────┘  │
│  ┌────────────────┐ ┌────────────────┐  │
│  │  Documents     │ │  Notifications │  │
│  │  Unavailable   │ │  2 unread      │  │
│  │  (403)         │ │  ...           │  │
│  └────────────────┘ └────────────────┘  │
└─────────────────────────────────────────┘
```

**Mobile (< 768px):** Single column, cards stack vertically. Quick actions become a 2×2 grid.
**Tablet (768px–1024px):** 2-column grid for widget cards.
**Desktop (1024px+):** 2-column grid for widgets, KPI header spans full width.

### Empty States

**No Active Lease:**
```
┌─────────────────────────────────────────┐
│           🏠                            │
│     No active lease                     │
│                                         │
│  Your lease may not have started yet,   │
│  or it has ended. Contact your          │
│  property manager for details.          │
│                                         │
│  [View Payment History]                 │
└─────────────────────────────────────────┘
```

**Invite Pending:**
```
┌─────────────────────────────────────────┐
│           ✉️                            │
│     Welcome to LeaseBase                │
│                                         │
│  Your account is set up. Your property  │
│  manager hasn't linked you to a lease   │
│  yet. You'll see your dashboard once    │
│  your lease is active.                  │
└─────────────────────────────────────────┘
```

**Lease Ended:**
```
┌─────────────────────────────────────────┐
│           📋                            │
│     Your lease has ended                │
│                                         │
│  Your lease at 123 Main St ended on     │
│  Dec 31, 2025. You can still view       │
│  your payment history and past          │
│  maintenance requests.                  │
│                                         │
│  [Payment History] [Maintenance]        │
└─────────────────────────────────────────┘
```

### Error States

**Per-Widget Error:**
Each widget wraps in `WidgetErrorBoundary`. On render error:
```
┌─────────────────────────────────────────┐
│  ⚠ [Widget Name] failed to render.     │
└─────────────────────────────────────────┘
```

**Domain Fetch Error:**
Widget shows inline error with provenance:
```
┌─────────────────────────────────────────┐
│  Payments                               │
│  ─────────                              │
│  ⚠ Could not load payment data.        │
│  [Try again]                            │
└─────────────────────────────────────────┘
```

**Full Dashboard Error:**
```
┌─────────────────────────────────────────┐
│  ❌ Failed to load dashboard            │
│     [error message]                     │
└─────────────────────────────────────────┘
```

### Pay Rent (`/app/pay-rent`)

```
┌─────────────────────────────────────────┐
│  Pay Rent                               │
│  ─────────                              │
│                                         │
│  Amount: $1,450.00                      │
│  Due: March 1, 2026                     │
│  Lease: Unit 1A, 123 Main St           │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ⓘ Payment processing is not   │    │
│  │    yet available. This is a     │    │
│  │    preview of the payment flow. │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Payment Method:                        │
│  ○ Credit/Debit Card                    │
│  ○ Bank Account (ACH)                   │
│                                         │
│  [Pay $1,450.00] (disabled/stub)        │
└─────────────────────────────────────────┘
```

### Payment History (`/app/payment-history`)

```
┌─────────────────────────────────────────┐
│  Payment History                        │
│  ───────────────                        │
│                                         │
│  ┌────┬────────┬────────┬──────┬─────┐  │
│  │Date│ Amount │ Method │Status│     │  │
│  ├────┼────────┼────────┼──────┼─────┤  │
│  │3/1 │$1,450  │ Card   │ Paid │ ▶   │  │
│  │2/1 │$1,450  │ ACH    │ Paid │ ▶   │  │
│  │1/1 │$1,450  │ Card   │ Paid │ ▶   │  │
│  └────┴────────┴────────┴──────┴─────┘  │
└─────────────────────────────────────────┘
```

**Mobile:** Cards instead of table rows.

### Maintenance List (`/app/maintenance`)

```
┌─────────────────────────────────────────┐
│  Maintenance Requests    [+ New Request]│
│  ────────────────────                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Leaking kitchen faucet          │    │
│  │ Plumbing · Medium · Open       │    │
│  │ Submitted Feb 20               │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Broken blinds — living room     │    │
│  │ General · Low · Completed       │    │
│  │ Submitted Jan 15               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### New Maintenance Request (`/app/maintenance/new`)

```
┌─────────────────────────────────────────┐
│  New Maintenance Request                │
│  ───────────────────────                │
│                                         │
│  Category: [Plumbing         ▼]         │
│                                         │
│  Priority: ○ Low  ● Medium  ○ High     │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ⚠ Emergency? If this is an    │    │
│  │  emergency, call your property  │    │
│  │  manager immediately.           │    │
│  └─────────────────────────────────┘    │
│  (shown when High is selected)          │
│                                         │
│  Description:                           │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  📷 Photo upload — coming soon          │
│                                         │
│  [Submit Request]                       │
└─────────────────────────────────────────┘
```

### Notifications (`/app/notifications`)

```
┌─────────────────────────────────────────┐
│  Notifications                          │
│  ─────────────                          │
│                                         │
│  ● Maintenance update                   │
│    Faucet repair scheduled for Tue      │
│    2 hours ago                          │
│                                         │
│  ○ Rent reminder                        │
│    Your rent of $1,450 is due Mar 1     │
│    1 day ago                            │
│                                         │
│  ○ Welcome to LeaseBase                 │
│    Your account has been set up         │
│    5 days ago                           │
└─────────────────────────────────────────┘
```

● = unread (bold text, dot indicator)
○ = read (normal weight)

### Documents (`/app/documents`) — Tenant View

```
┌─────────────────────────────────────────┐
│  Documents                              │
│  ─────────                              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🔒 Document access is not     │    │
│  │     yet available for tenants.  │    │
│  │     Your property manager can   │    │
│  │     share documents with you    │    │
│  │     directly.                   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Settings (`/app/settings`) — Tenant View

```
┌─────────────────────────────────────────┐
│  Settings                               │
│  ────────                               │
│                                         │
│  Profile                                │
│  Name: Jane Doe                         │
│  Email: jane@example.com                │
│  Phone: (555) 123-4567                  │
│  Role: Tenant                           │
│                                         │
│  ⓘ Profile editing coming soon.        │
│    Contact your property manager to     │
│    update your information.             │
│                                         │
│  ───────────────                        │
│  Autopay                                │
│  ⓘ Automatic payments — coming soon.   │
└─────────────────────────────────────────┘
```
