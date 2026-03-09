# Owner Dashboard — Product Specification

## Purpose

Provide property owners (10–200 units) with an investor-grade, operationally useful dashboard that surfaces financial performance, portfolio health, alerts, and quick actions — dramatically simpler than AppFolio or Buildium.

## Target User

**Persona**: Owner (mapped from backend role `OWNER`)
A landlord or real-estate investor who owns one or more properties managed through LeaseBase. They care about:
- Cash flow visibility (rent scheduled vs. collected vs. overdue)
- Occupancy and vacancy at a glance
- Maintenance burden
- Lease expiration pipeline
- Getting set up quickly on day one

## User Goals

1. **See financial health in 5 seconds**: monthly scheduled rent, collected this month, overdue amount.
2. **Understand portfolio status**: total properties, units, occupied units, vacancy rate.
3. **Spot problems before they escalate**: late rent, expiring leases, aging maintenance.
4. **Track recent activity**: who paid, who was invited, what maintenance was filed.
5. **Take action fast**: add property, add unit, invite tenant, create lease, upload document.
6. **Onboard smoothly**: clear guidance when starting from zero (no properties, no tenants).

## Dashboard Widgets

### 1. KPI Grid (top of page)
Eight stat cards in a responsive grid:

| KPI | Source | Computation |
|-----|--------|-------------|
| Total Properties | property-service `GET /api/properties` | `meta.total` |
| Total Units | property-service (aggregate across properties) | Sum of unit counts |
| Occupied Units | lease-service + property-service | Units with active lease |
| Vacancy Rate | Computed | `(totalUnits - occupiedUnits) / totalUnits * 100` |
| Monthly Scheduled Rent | lease-service | Sum of `rentAmount` for active leases |
| Collected This Month | payments-service | Sum of payments with status=SUCCEEDED this month |
| Overdue Amount | payments-service / ledger | CHARGE entries past due_date with status=PENDING |
| Open Maintenance | maintenance-service | Work orders with status IN (OPEN, IN_PROGRESS) |

### 2. Alerts Panel
Priority-ordered alert cards:
- **Late rent**: Ledger charges past due date, unpaid. Badge: danger.
- **Lease expiring soon**: Leases ending within 60 days. Badge: warning.
- **Maintenance aging**: Work orders open > 7 days. Badge: warning.
- **Incomplete setup**: No properties, no units, no tenants, payments not configured. Badge: info.

### 3. Recent Activity Feed
Chronological list of the last 10 events:
- Payment received
- Tenant invited
- Maintenance request created / completed
- Lease renewed / terminated

**Data dependency**: No activity-feed endpoint exists today. This widget will use stub data and display an honest "Activity feed coming soon" note when stubs are replaced.

### 4. Portfolio Health
Three metrics with progress bars:
- **Occupancy rate**: `occupiedUnits / totalUnits`
- **Collection rate**: `collectedThisMonth / scheduledRent`
- **Maintenance load**: `openWorkOrders` displayed as a count with context

Trend lines are NOT shown until backend provides time-series data. Instead, show current-month snapshot with text like "Trend data available after 2+ months of usage."

### 5. Quick Actions
Action shortcut buttons:
- Add Property → `/app/properties` (future: modal)
- Add Unit → `/app/units`
- Invite Tenant → `/app/tenants`
- Create Lease → `/app/leases/new`
- Enable Payments → `/app/payments`
- Upload Document → `/app/documents`

### 6. Properties Summary Table
List of properties with:
- Property name and address
- Unit count
- Occupied / total units
- Occupancy badge (success ≥90%, warning 70-89%, danger <70%)

## Empty States

| Condition | Display |
|-----------|---------|
| No properties | Full-page onboarding: illustration + "Add your first property" CTA |
| Properties but no units | KPI grid shows zeros + alert: "Add units to your properties" |
| Units but no tenants | Alert: "Invite tenants to get started" |
| No payments configured | Alert: "Enable online payments to track rent collection" |
| All zeros (brand new account) | Full onboarding empty state with setup checklist |

## Alerts Logic

```
lateRent:     ledger entries WHERE type=CHARGE AND status=PENDING AND due_date < today
expiringLease: leases WHERE status=ACTIVE AND end_date BETWEEN today AND today+60d
agingMaint:   work_orders WHERE status IN (OPEN, IN_PROGRESS) AND created_at < today-7d
setupItems:   properties.length === 0 || units.length === 0 || tenants.length === 0
```

## Permissions / Visibility Rules

- Dashboard is only rendered for `persona === "owner"` (role `OWNER`).
- All API calls are scoped to `organization_id` by the backend middleware.
- Owner cannot see tenant personal details beyond name and lease association.
- Owner sees read-only financial data; cannot create payments (only view).

## Click Paths

- **KPI card "Total Properties"** → `/app/properties`
- **KPI card "Open Maintenance"** → `/app/maintenance`
- **KPI card "Collected"** → `/app/payments`
- **Alert "Late rent"** → `/app/payments` (filtered view, future)
- **Alert "Lease expiring"** → `/app/leases`
- **Alert "Maintenance aging"** → `/app/maintenance`
- **Quick Action buttons** → respective pages
- **Property row in summary** → `/app/properties/[id]`

## Success Criteria

1. Owner can see all 8 KPIs within 2 seconds of page load.
2. Empty states guide new owners through setup without confusion.
3. Alerts surface actionable items — zero false positives.
4. Dashboard works on desktop (1280px+), tablet (768px), and mobile (375px).
5. No hardcoded data in page components — all data flows through service layer.
6. Skeleton states display during loading; no layout shift on data arrival.
7. Code compiles, passes lint, and does not break existing routes.
