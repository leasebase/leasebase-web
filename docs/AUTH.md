# Authentication

**Last updated:** 2026-03-14 (alignment audit)

Leasebase Web uses AWS Cognito for authentication. The backend microservices enforce authorization via JWT verification and RBAC guards.

## Auth Flow

### Registration (Owner — self-service)

1. User visits `/auth/register` and submits email + password + name.
2. Frontend calls `POST /api/auth/register` (BFF → auth-service).
3. Auth-service creates user in Cognito with `custom:role=OWNER`, bootstraps Org + User + Subscription in DB.
4. User confirms email via code, then logs in.

Only `OWNER` can self-register. Tenants are invited by an owner (see below).

### Registration (Tenant — via invitation)

1. Owner creates invitation via `POST /api/tenants/invitations`.
2. Tenant clicks invite link, visits `/invite/:token`, submits password.
3. Tenant-service calls auth-service internally to create Cognito user with `custom:role=TENANT`.
4. DB records (User, tenant_profile, lease) are created transactionally.

### Login

1. User visits `/auth/login`, enters email + password.
2. Frontend calls `POST /api/auth/login` (BFF → auth-service).
3. Auth-service authenticates via Cognito `USER_PASSWORD_AUTH`.
4. Returns `{ accessToken, idToken, refreshToken, expiresIn }`.
5. Frontend stores the **ID token** and sends it as `Authorization: Bearer <idToken>` on API requests.

### Authenticated Requests

1. Frontend sends `Authorization: Bearer <idToken>` to BFF.
2. BFF proxies to the appropriate backend service (no auth logic at BFF level).
3. Backend service runs `requireAuth` middleware (from `@leasebase/service-common`):
   - Verifies JWT signature via Cognito JWKS
   - Extracts `custom:role` claim → FAIL-CLOSED if missing (401)
   - Enriches from DB (orgId, name) as fail-open fallback
   - Attaches `{ userId, orgId, role, email }` to `req.user`
4. Optional `requireRole(UserRole.OWNER)` guard checks role.
5. All DB queries scoped by `organization_id` from `req.user.orgId`.

## Roles

Only two roles exist in the system:

- `OWNER` — Property owner / landlord. Full CRUD within their organization.
- `TENANT` — Renter. Scoped access to own profile, lease, payments, and maintenance.

The `UserRole` enum in `@leasebase/service-common` enforces this. Legacy roles (`ORG_ADMIN`, `PM_STAFF`, `PROPERTY_MANAGER`) have been removed.

## ID Token as Bearer (temporary)

Cognito access tokens do **not** carry custom attributes (`custom:role`). The system currently uses ID tokens as Bearer tokens so that `custom:role` is available for fail-closed auth.

This is a temporary measure. A planned Pre-Token Generation Lambda will inject custom claims into access tokens, at which point the frontend will switch back to access tokens (standard OAuth pattern). See `docs/security/auth-authority-decision.md`.

## Middleware

The Next.js middleware (`middleware.ts`) handles:

- Old-domain redirects: `*.leasebase.co` → `app.{env}.leasebase.ai` (301)
- Root path `/` → redirect to `/auth/login` (307)
- Pass-through for all other paths

There is no cookie-based role checking or `/pm/*` routing in the middleware.

## Key Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` — Backend API base URL
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` — Cognito User Pool ID
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` — Cognito app client ID
- `NEXT_PUBLIC_COGNITO_DOMAIN` — Cognito Hosted UI domain
- `DEV_ONLY_MOCK_AUTH` — Dev-only flag (must be `false` in production)

## Logout

- `/auth/logout` clears tokens and redirects to `/`.
- If Cognito Hosted UI is configured, redirects through Cognito logout first.
