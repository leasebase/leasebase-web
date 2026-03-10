# Owner Portfolio — API Contract

All endpoints use **PUT** (not PATCH) for updates. Responses follow the `{ data, meta }` envelope.

## Base URL

- **Local dev**: `http://localhost:4000` (BFF gateway)
- **BFF proxy**: `/api/properties` → property-service `/internal/properties`

## Authentication

All requests require a valid JWT Bearer token (or dev-bypass headers). The `organization_id` is extracted from the JWT — no client-side org hint is sent.

## Endpoints

### Properties

#### List Properties
```
GET /api/properties?page=1&limit=50
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Response**:
```json
{
  "data": [PropertyRow, ...],
  "meta": { "page": 1, "limit": 50, "total": 3, "totalPages": 1 }
}
```

#### Get Property
```
GET /api/properties/:id
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Response**: `{ "data": PropertyRow }`
**Errors**: 404 if not found or not in org

#### Create Property
```
POST /api/properties
Content-Type: application/json
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Request body**:
```json
{
  "name": "Sunset Apartments",
  "addressLine1": "123 Main St",
  "addressLine2": "Suite 100",
  "city": "Los Angeles",
  "state": "CA",
  "postalCode": "90001",
  "country": "US"
}
```
Required: `name`, `addressLine1`, `city`, `state`, `postalCode`
Optional: `addressLine2`, `country` (defaults to "US")
**Response**: `201 { "data": PropertyRow }`

#### Update Property
```
PUT /api/properties/:id
Content-Type: application/json
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Request body**: Partial of create body (all fields optional)
**Response**: `200 { "data": PropertyRow }`
**Errors**: 404 if not found or not in org

#### Delete Property
```
DELETE /api/properties/:id
```
**Roles**: ORG_ADMIN only (OWNER/PM_STAFF → 403)
**Response**: `204 No Content`

### Units

#### List Units for Property
```
GET /api/properties/:propertyId/units?page=1&limit=100
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Response**:
```json
{
  "data": [UnitRow, ...],
  "meta": { "page": 1, "limit": 100, "total": 5, "totalPages": 1 }
}
```

#### Get Unit
```
GET /api/properties/units/:unitId
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER, TENANT
**Response**: `{ "data": UnitRow }`
**Errors**: 404 if not found or not in org

#### Create Unit
```
POST /api/properties/:propertyId/units
Content-Type: application/json
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Request body**:
```json
{
  "unitNumber": "101",
  "bedrooms": 2,
  "bathrooms": 1.5,
  "squareFeet": 850,
  "rentAmount": 150000,
  "status": "AVAILABLE"
}
```
Required: `unitNumber`, `bedrooms`, `bathrooms`, `rentAmount`
Optional: `squareFeet`, `status` (defaults to "AVAILABLE")
Note: `rentAmount` is in **cents** (150000 = $1,500)
**Response**: `201 { "data": UnitRow }`

#### Update Unit
```
PUT /api/properties/units/:unitId
Content-Type: application/json
```
**Roles**: ORG_ADMIN, PM_STAFF, OWNER
**Request body**: Partial of create body (all fields optional)
**Response**: `200 { "data": UnitRow }`
**Errors**: 404 if not found or not in org

#### Delete Unit
```
DELETE /api/properties/units/:unitId
```
**Roles**: ORG_ADMIN only (OWNER/PM_STAFF/TENANT → 403)
**Response**: `204 No Content`

## Error Responses

All errors use the envelope:
```json
{
  "error": { "code": "NOT_FOUND", "message": "Property not found" }
}
```

- **401** — Unauthenticated (no/invalid token). Frontend clears auth state.
- **403** — Authenticated but unauthorized. Frontend shows error message, does NOT clear auth.
- **404** — Resource not found or not in caller's org (prevents org-id enumeration).
- **422/400** — Validation error (missing required fields, invalid values).

## Cross-org Isolation

All queries include `WHERE organization_id = $orgId` from the JWT. An OWNER in org-X never sees data from org-Y — the backend returns 404 (not 403) to prevent information leakage.
