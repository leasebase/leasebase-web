# Owner Dashboard — API Contract

## Overview

The owner dashboard aggregates data from multiple microservices into a single response. Until a dedicated BFF aggregation endpoint exists, the frontend fetches from individual service endpoints and computes derived values client-side.

## Target BFF Endpoint

```
GET /api/dashboard/owner
Authorization: Bearer <token>
```

### Response Shape

```json
{
  "data": {
    "kpis": {
      "totalProperties": 12,
      "totalUnits": 48,
      "occupiedUnits": 44,
      "vacancyRate": 8.33,
      "monthlyScheduledRent": 42000,
      "collectedThisMonth": 38200,
      "overdueAmount": 3800,
      "openMaintenanceRequests": 5
    },
    "alerts": [
      {
        "type": "LATE_RENT",
        "severity": "danger",
        "count": 2,
        "message": "2 rent payments are overdue",
        "link": "/app/payments"
      },
      {
        "type": "LEASE_EXPIRING",
        "severity": "warning",
        "count": 3,
        "message": "3 leases expiring within 60 days",
        "link": "/app/leases"
      },
      {
        "type": "MAINTENANCE_AGING",
        "severity": "warning",
        "count": 1,
        "message": "1 maintenance request open for 7+ days",
        "link": "/app/maintenance"
      },
      {
        "type": "SETUP_INCOMPLETE",
        "severity": "info",
        "count": 1,
        "message": "Complete your setup: invite tenants",
        "link": "/app/tenants"
      }
    ],
    "recentActivity": [
      {
        "id": "evt_1",
        "type": "PAYMENT_RECEIVED",
        "title": "Payment received",
        "description": "$1,450 from Alice Johnson",
        "timestamp": "2026-03-08T22:00:00Z",
        "link": "/app/payments"
      }
    ],
    "portfolioHealth": {
      "occupancyRate": 91.67,
      "collectionRate": 90.95,
      "openWorkOrders": 5,
      "trendAvailable": false
    },
    "properties": [
      {
        "id": "prop_1",
        "name": "123 Main St",
        "address": "123 Main St, Portland, OR 97201",
        "totalUnits": 4,
        "occupiedUnits": 4,
        "occupancyRate": 100
      }
    ]
  }
}
```

## Data Ownership by Microservice

### property-service
- `totalProperties`: `GET /api/properties` → `meta.total`
- `totalUnits`: Aggregate unit counts across all properties
- `properties[]`: Property list with addresses
- **Current limitation**: No summary/count endpoint. Must paginate through all properties, then fetch units per property. For large portfolios (100+ properties), this is N+1 and slow.
- **Recommended backend enhancement**: Add `GET /api/properties/summary` returning counts and per-property unit totals in one call.

### lease-service
- `occupiedUnits`: Count of units with `status=ACTIVE` leases
- `monthlyScheduledRent`: Sum of `rentAmount` for active leases
- Leases expiring within 60 days (for alerts)
- **Current limitation**: No aggregation endpoint. Must fetch all leases and compute client-side.
- **Recommended backend enhancement**: Add `GET /api/leases/summary` with counts by status and sum of rent.

### payments-service
- `collectedThisMonth`: Sum of payments with `status=SUCCEEDED` in current month
- `overdueAmount`: Sum of ledger entries with `type=CHARGE`, `status=PENDING`, `due_date < today`
- **Current limitation**: `GET /api/payments` and `GET /api/payments/ledger` exist but no aggregation.
- **Recommended backend enhancement**: Add `GET /api/payments/summary?month=YYYY-MM` returning totals.

### maintenance-service
- `openMaintenanceRequests`: Count of work orders with `status` IN (`OPEN`, `IN_PROGRESS`)
- Aging work orders (for alerts): orders where `created_at < today - 7d`
- **Current limitation**: `GET /api/maintenance` exists but no count/filter endpoint.
- **Recommended backend enhancement**: Add `GET /api/maintenance/summary` returning counts by status.

### Activity Feed
- **No endpoint exists today in any microservice.**
- Requires either:
  a. A cross-service event log (via EventBridge → persistence layer), or
  b. BFF aggregation that merges recent records from multiple services
- **Frontend approach**: Use stub data, display "Coming soon" indicator.

### tenant-service
- Used for setup alerts (no tenants = setup incomplete)
- **Current limitation**: `GET /api/tenants` requires `ORG_ADMIN` or `PM_STAFF` role. OWNER cannot access.
- **Recommended backend enhancement**: Add OWNER to allowed roles for `GET /api/tenants` (at minimum a count endpoint).

## Fallback Behavior

When a downstream service is unavailable:

| Service | Fallback |
|---------|----------|
| property-service | Show "Unable to load property data" in KPI section; other sections still render |
| lease-service | Occupancy and rent KPIs show "—"; alerts still show property/maintenance data |
| payments-service | Financial KPIs show "—"; collection rate shows "Data unavailable" |
| maintenance-service | Maintenance KPI shows "—"; other sections unaffected |
| All services down | Show error state with retry button |

The frontend service layer catches errors per-domain and returns partial data. Each widget handles `null`/`undefined` values gracefully.

## Current Frontend Implementation (interim)

Until the BFF endpoint exists, the frontend:
1. Fetches `GET /api/properties?limit=100` to get property list + total count
2. For each property, fetches `GET /api/properties/:id/units` (batched, max 10 concurrent)
3. Fetches `GET /api/leases?limit=100` to compute occupancy + rent
4. Fetches `GET /api/payments?limit=100` for collection data
5. Fetches `GET /api/payments/ledger?limit=100` for overdue computation
6. Fetches `GET /api/maintenance?limit=100` for open work orders
7. Uses **stub data** for: activity feed, tenant count (OWNER not authorized)

All stub usage is clearly isolated in `src/services/dashboard/stubs/` and marked with `TODO` comments.
