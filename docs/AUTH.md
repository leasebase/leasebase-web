# Authentication

Leasebase Web uses AWS Cognito for authentication, with an optional dev-only mock auth flow.

## Cognito Hosted UI

The preferred auth flow is Cognito Hosted UI with the Authorization Code (OIDC) flow.

Key env vars:

- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_COGNITO_DOMAIN`

Flow:

1. User visits `/auth/login` and clicks **Continue with Cognito**.
2. The app builds an authorize URL for the Cognito Hosted UI and redirects the browser.
3. After login, Cognito redirects back to `/auth/callback` with `code` and `state`.
4. The callback page should call a backend endpoint to exchange the code for tokens and
   establish a secure session (implemented in the backend repo). This frontend assumes the
   backend sets HttpOnly cookies as part of that flow.

## User types and registration

During registration, users select one of three user types:

- `PROPERTY_MANAGER` – Manages properties for multiple owners/landlords. Creates an organization.
- `OWNER` – Landlord who owns and rents out properties.
- `TENANT` – Rents a property and manages their lease.

The `userType` is sent to the backend during registration and determines the user's initial role and
permissions.

## Role-based access

Roles are represented as:

- `ORG_ADMIN`, `PM_STAFF`, `OWNER` – may access `/pm/*`.
- `TENANT` – may access `/tenant/*`.

The middleware in `middleware.ts`:

- Reads `lb_role` from cookies.
- Redirects unauthenticated users hitting `/pm/*` or `/tenant/*` to `/auth/login` with `next`.
- Redirects users with an insufficient role to `/auth/access-denied`.

## DEV-only mock auth

For local development without Cognito, a mock auth mode is available when **both**:

- `DEV_ONLY_MOCK_AUTH=true` (server-side) and/or
- `NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true` (client-side).

When enabled:

- `/auth/login` shows a **Dev-only mock login** form where you can choose:
  - `role` (ORG_ADMIN, PM_STAFF, OWNER, TENANT)
  - `orgId`
  - `userEmail`
- On submit, it calls `/api/dev-login`, which:
  - Validates the payload.
  - Creates an encoded mock session and sets `lb_role` and `lb_session` HttpOnly cookies.
- Middleware and API calls then treat this like a real session, and all guarded routes work.

**Important:**

- Mock auth must never be enabled in production.
- Real authentication and authorization enforcement belong in the backend; the frontend only
  handles routing and basic UX around login/logout.

## Logout

- `/auth/logout`:
  - Calls `/api/logout` to clear `lb_role` and `lb_session` cookies.
  - If Cognito is configured, redirects to Cognito logout with a return URL to `/`.
  - Otherwise, redirects directly back to `/`.
