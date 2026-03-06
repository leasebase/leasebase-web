#!/usr/bin/env python3
"""
Publish LeaseBase Web product documentation to Confluence.

Usage:
    python3 scripts/publish_confluence_docs.py

Requires env vars:
    CONFLUENCE_BASE_URL   (e.g. https://leasebase.atlassian.net/wiki)
    CONFLUENCE_EMAIL
    CONFLUENCE_API_TOKEN
    CONFLUENCE_SPACE_KEY  (e.g. LeaseBase)
"""

import os, sys, json, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# ── Config ──────────────────────────────────────────────────────────────────
BASE_URL = os.environ.get("CONFLUENCE_BASE_URL", "https://leasebase.atlassian.net/wiki")
EMAIL = os.environ.get("CONFLUENCE_EMAIL", "")
TOKEN = os.environ.get("CONFLUENCE_API_TOKEN", "")
SPACE = os.environ.get("CONFLUENCE_SPACE_KEY", "LeaseBase")
HOMEPAGE_ID = "5963954"

if not EMAIL or not TOKEN:
    print("ERROR: CONFLUENCE_EMAIL and CONFLUENCE_API_TOKEN must be set.")
    sys.exit(1)

import base64
AUTH = base64.b64encode(f"{EMAIL}:{TOKEN}".encode()).decode()

def api(method, path, body=None):
    url = f"{BASE_URL}/rest/api{path}"
    headers = {
        "Authorization": f"Basic {AUTH}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        err_body = e.read().decode()
        print(f"  HTTP {e.code} on {method} {path}: {err_body[:300]}")
        raise

def find_page(title):
    """Find existing page by title in space."""
    import urllib.parse
    encoded = urllib.parse.quote(title)
    try:
        result = api("GET", f"/content?spaceKey={SPACE}&title={encoded}&limit=1")
        if result.get("results"):
            return result["results"][0]
    except:
        pass
    return None

def create_or_update_page(title, body_html, parent_id):
    """Create page or update if it already exists. Returns page id."""
    existing = find_page(title)
    if existing:
        page_id = existing["id"]
        version = existing.get("version", {}).get("number", 1)
        payload = {
            "version": {"number": version + 1},
            "title": title,
            "type": "page",
            "body": {
                "storage": {"value": body_html, "representation": "storage"}
            },
        }
        result = api("PUT", f"/content/{page_id}", payload)
        print(f"  Updated: {title} (id={page_id}, v{version+1})")
        return page_id
    else:
        payload = {
            "type": "page",
            "title": title,
            "space": {"key": SPACE},
            "ancestors": [{"id": str(parent_id)}],
            "body": {
                "storage": {"value": body_html, "representation": "storage"}
            },
        }
        result = api("POST", "/content", payload)
        page_id = result["id"]
        print(f"  Created: {title} (id={page_id})")
        return page_id

# ── Page content ────────────────────────────────────────────────────────────
# All content uses Confluence storage format (XHTML subset).

PAGES = {}  # title -> (html, parent_key_or_none)
# parent_key_or_none: None = child of homepage, string = child of that title

def p(title, html, parent=None):
    PAGES[title] = (html, parent)

# ════════════════════════════════════════════════════════════════════════════
# 1. OVERVIEW
# ════════════════════════════════════════════════════════════════════════════
p("LeaseBase Web — Overview", """
<h1>LeaseBase Web — Product Overview</h1>
<p><strong>LeaseBase</strong> is a multi-tenant property-management platform. The web frontend is a <strong>Next.js 14</strong> (App Router) + <strong>Tailwind CSS</strong> application that communicates with a NestJS + Prisma backend API.</p>

<h2>Tech Stack</h2>
<table>
<tr><th>Layer</th><th>Technology</th></tr>
<tr><td>Framework</td><td>Next.js 14 (App Router, TypeScript)</td></tr>
<tr><td>Styling</td><td>Tailwind CSS 3.4</td></tr>
<tr><td>State Management</td><td>Zustand 4.5 (persisted auth store)</td></tr>
<tr><td>Auth</td><td>AWS Cognito (with dev-bypass mode)</td></tr>
<tr><td>API Client</td><td>Fetch-based client with auto-auth headers</td></tr>
<tr><td>Icons</td><td>Lucide React</td></tr>
<tr><td>Validation</td><td>Zod 3.23</td></tr>
<tr><td>Testing</td><td>Jest + Testing Library (unit), Playwright (E2E)</td></tr>
</table>

<h2>Repository Structure</h2>
<table>
<tr><th>Path</th><th>Purpose</th></tr>
<tr><td><code>app/</code></td><td>Next.js App Router pages and layouts</td></tr>
<tr><td><code>app/auth/</code></td><td>Authentication pages (login, register, verify-email, callback)</td></tr>
<tr><td><code>app/app/</code></td><td>Authenticated AppShell (sidebar layout + persona dashboards)</td></tr>
<tr><td><code>src/components/ui/</code></td><td>Reusable UI component library (Button, Card, DataTable, Modal, Toast, etc.)</td></tr>
<tr><td><code>src/components/dashboards/</code></td><td>Persona-specific dashboard components (PM, Owner, Tenant)</td></tr>
<tr><td><code>src/lib/auth/</code></td><td>Auth store (Zustand), role mapping, route guard hook</td></tr>
<tr><td><code>src/lib/api/</code></td><td>API client with automatic auth header injection</td></tr>
<tr><td><code>src/lib/appNav.ts</code></td><td>Navigation items filtered by persona</td></tr>
<tr><td><code>tests/</code></td><td>Unit tests (Jest) and E2E tests (Playwright)</td></tr>
</table>

<h2>Key Commands</h2>
<table>
<tr><th>Command</th><th>Description</th></tr>
<tr><td><code>npm run dev</code></td><td>Start dev server</td></tr>
<tr><td><code>npm run build</code></td><td>Production build</td></tr>
<tr><td><code>npm test</code></td><td>Run Jest unit tests</td></tr>
<tr><td><code>npm run test:e2e</code></td><td>Run Playwright E2E tests</td></tr>
<tr><td><code>npm run lint</code></td><td>ESLint check</td></tr>
</table>
""")

# ════════════════════════════════════════════════════════════════════════════
# 2. SYSTEM ARCHITECTURE
# ════════════════════════════════════════════════════════════════════════════
p("System Architecture", """
<h1>System Architecture</h1>

<h2>High-Level Architecture</h2>
<p>The LeaseBase platform consists of three main components:</p>
<ol>
<li><strong>Web Frontend</strong> (this repo) — Next.js SPA/SSR served behind AWS infrastructure</li>
<li><strong>Backend API</strong> — NestJS + Prisma + PostgreSQL (separate <code>leasebase</code> repo)</li>
<li><strong>Auth Provider</strong> — AWS Cognito user pools for authentication</li>
</ol>

<ac:structured-macro ac:name="code" ac:schema-version="1">
<ac:parameter ac:name="language">text</ac:parameter>
<ac:parameter ac:name="title">Architecture Diagram (Mermaid)</ac:parameter>
<ac:plain-text-body><![CDATA[graph TB
    subgraph "Client Browser"
        WEB[Next.js Web App]
    end

    subgraph "AWS"
        COG[AWS Cognito]
        API[NestJS API<br/>localhost:4000]
        DB[(PostgreSQL)]
    end

    WEB -->|"Login / Register"| COG
    WEB -->|"REST API calls<br/>Bearer token or dev-bypass headers"| API
    API -->|"Prisma ORM"| DB
    COG -->|"JWT validation"| API
]]></ac:plain-text-body>
</ac:structured-macro>

<h2>Authentication Flow</h2>
<ac:structured-macro ac:name="code" ac:schema-version="1">
<ac:parameter ac:name="language">text</ac:parameter>
<ac:parameter ac:name="title">Auth Sequence (Mermaid)</ac:parameter>
<ac:plain-text-body><![CDATA[sequenceDiagram
    participant U as User Browser
    participant W as Next.js Web
    participant A as Backend API
    participant C as AWS Cognito

    U->>W: Navigate to /auth/login
    U->>W: Enter email + password
    W->>A: POST /auth/login {email, password}
    A->>C: Cognito InitiateAuth
    C-->>A: accessToken, idToken, refreshToken
    A-->>W: {accessToken, idToken, expiresIn}
    W->>W: Store tokens in Zustand (localStorage)
    W->>A: GET /auth/me (Authorization: Bearer token)
    A-->>W: {id, orgId, email, name, role}
    W->>W: Map role to persona, set status=authenticated
    W->>W: Redirect to /app (persona dashboard)
]]></ac:plain-text-body>
</ac:structured-macro>

<h2>API Base URL Resolution</h2>
<p>The web app resolves the API URL via <code>NEXT_PUBLIC_API_BASE_URL</code>:</p>
<ul>
<li>If set and different origin → use as-is</li>
<li>If set and same origin without <code>/api</code> → prepend <code>/api</code></li>
<li>If not set → default to <code>window.location.origin/api</code></li>
</ul>

<h2>State Management</h2>
<p>Auth state is managed by a Zustand store (<code>authStore</code>) with <code>persist</code> middleware. The store is saved to localStorage under key <code>lb_auth_v1</code>. It tracks:</p>
<ul>
<li><code>mode</code>: "cognito" or "devBypass"</li>
<li><code>accessToken</code>, <code>idToken</code>, <code>refreshToken</code>, <code>expiresAt</code></li>
<li><code>user</code>: CurrentUser object with persona mapping</li>
<li><code>status</code>: idle → initializing → authenticated / unauthenticated</li>
</ul>
""")

# ════════════════════════════════════════════════════════════════════════════
# 3. PERSONAS
# ════════════════════════════════════════════════════════════════════════════
p("Personas", """
<h1>Personas &amp; Roles</h1>
<p>LeaseBase uses a role-based access model. Backend roles are mapped to frontend <strong>personas</strong> that determine dashboard experience, navigation, and available workflows.</p>

<h2>Role-to-Persona Mapping</h2>
<table>
<tr><th>Backend Role</th><th>Frontend Persona</th><th>Description</th></tr>
<tr><td><code>ORG_ADMIN</code></td><td><code>propertyManager</code></td><td>Full portfolio management access</td></tr>
<tr><td><code>PM_STAFF</code></td><td><code>propertyManager</code></td><td>Property management staff (same UI as ORG_ADMIN)</td></tr>
<tr><td><code>OWNER</code></td><td><code>owner</code></td><td>Property owner / landlord</td></tr>
<tr><td><code>TENANT</code></td><td><code>tenant</code></td><td>Renter / lease holder</td></tr>
<tr><td><em>Unknown / future</em></td><td><code>tenant</code></td><td>Defaults to tenant for safety</td></tr>
</table>

<h2>Persona: Property Manager</h2>
<table>
<tr><th>Attribute</th><th>Detail</th></tr>
<tr><td>Backend Roles</td><td>ORG_ADMIN, PM_STAFF</td></tr>
<tr><td>Goals</td><td>Manage portfolio of properties, units, leases, tenants; track occupancy and revenue; handle maintenance; approve invoices; communicate with owners and tenants</td></tr>
<tr><td>Dashboard</td><td>Portfolio overview — KPI cards (Properties, Units, Occupancy, Revenue MTD), Tasks &amp; follow-ups, Recent maintenance</td></tr>
<tr><td>Navigation</td><td>Dashboard, Properties, Units, Leases, Tenants, Payments, Maintenance, Messages, Reports, Settings</td></tr>
</table>

<h2>Persona: Owner</h2>
<table>
<tr><th>Attribute</th><th>Detail</th></tr>
<tr><td>Backend Role</td><td>OWNER</td></tr>
<tr><td>Goals</td><td>Track income and performance of owned properties; view lease status; monitor expenses</td></tr>
<tr><td>Dashboard</td><td>Owner dashboard — KPI cards (Monthly Income, YTD Income, Properties), Properties summary, Lease status</td></tr>
<tr><td>Navigation</td><td>Dashboard, Properties, Leases, Payments, Maintenance, Messages, Reports, Settings</td></tr>
</table>

<h2>Persona: Tenant</h2>
<table>
<tr><th>Attribute</th><th>Detail</th></tr>
<tr><td>Backend Role</td><td>TENANT</td></tr>
<tr><td>Goals</td><td>Pay rent; view lease details; submit and track maintenance requests; communicate with property management</td></tr>
<tr><td>Dashboard</td><td>Tenant dashboard — KPI cards (Next Rent Due, Lease Ends, Open Requests), Rent status, Maintenance requests, Messages</td></tr>
<tr><td>Navigation</td><td>Dashboard, Leases, Payments, Maintenance, Messages, Settings</td></tr>
</table>

<h2>Future Personas (Planned)</h2>
<table>
<tr><th>Persona</th><th>Nav Items</th><th>Status</th></tr>
<tr><td><code>agent</code></td><td>Showings</td><td>Future — route placeholder exists</td></tr>
<tr><td><code>vendor</code></td><td>Vendor portal</td><td>Future — route placeholder exists</td></tr>
</table>

<h2>Navigation Access Matrix</h2>
<ac:structured-macro ac:name="code" ac:schema-version="1">
<ac:parameter ac:name="language">text</ac:parameter>
<ac:parameter ac:name="title">Navigation by Persona (Mermaid)</ac:parameter>
<ac:plain-text-body><![CDATA[graph LR
    subgraph "Property Manager"
        PM_D[Dashboard] --> PM_P[Properties]
        PM_P --> PM_U[Units]
        PM_U --> PM_L[Leases]
        PM_L --> PM_T[Tenants]
        PM_T --> PM_PAY[Payments]
        PM_PAY --> PM_M[Maintenance]
        PM_M --> PM_MSG[Messages]
        PM_MSG --> PM_R[Reports]
        PM_R --> PM_S[Settings]
    end
]]></ac:plain-text-body>
</ac:structured-macro>
""")

# ════════════════════════════════════════════════════════════════════════════
# 4. AUTHENTICATION
# ════════════════════════════════════════════════════════════════════════════
p("Authentication", """
<h1>Authentication</h1>

<h2>Overview</h2>
<p>LeaseBase supports two authentication modes:</p>
<ol>
<li><strong>Cognito mode</strong> — Production flow using AWS Cognito (email + password, with future social login support)</li>
<li><strong>Dev Bypass mode</strong> — Local/dev-only mode that skips Cognito entirely. Enabled via <code>NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true</code></li>
</ol>

<h2>Auth Store</h2>
<p>The auth state lives in a Zustand store (<code>src/lib/auth/store.ts</code>) with persistence to localStorage (key: <code>lb_auth_v1</code>).</p>
<table>
<tr><th>State Field</th><th>Type</th><th>Purpose</th></tr>
<tr><td><code>mode</code></td><td>"cognito" | "devBypass" | null</td><td>Current auth mode</td></tr>
<tr><td><code>accessToken</code></td><td>string</td><td>Cognito JWT access token</td></tr>
<tr><td><code>idToken</code></td><td>string</td><td>Cognito JWT ID token</td></tr>
<tr><td><code>refreshToken</code></td><td>string</td><td>Cognito refresh token</td></tr>
<tr><td><code>expiresAt</code></td><td>number</td><td>Epoch ms when access token expires</td></tr>
<tr><td><code>user</code></td><td>CurrentUser</td><td>Logged-in user profile + persona</td></tr>
<tr><td><code>status</code></td><td>AuthStatus</td><td>idle → initializing → authenticated / unauthenticated</td></tr>
</table>

<h2>Auth Status Lifecycle</h2>
<ac:structured-macro ac:name="code" ac:schema-version="1">
<ac:parameter ac:name="language">text</ac:parameter>
<ac:parameter ac:name="title">Auth Status State Machine (Mermaid)</ac:parameter>
<ac:plain-text-body><![CDATA[stateDiagram-v2
    [*] --> idle
    idle --> initializing: initializeFromStorage (has token)
    idle --> unauthenticated: initializeFromStorage (no token / expired)
    initializing --> authenticated: loadMe() success
    initializing --> unauthenticated: loadMe() failure
    authenticated --> unauthenticated: logout() or 401/403
]]></ac:plain-text-body>
</ac:structured-macro>

<h2>Route Guard</h2>
<p>The <code>useRequireAuth()</code> hook protects all <code>/app/*</code> routes:</p>
<ol>
<li>On mount, if status is <code>idle</code>, calls <code>initializeFromStorage()</code></li>
<li>If status is <code>initializing</code> and no user, calls <code>loadMe()</code> to fetch <code>/auth/me</code></li>
<li>If <code>loadMe()</code> fails or status becomes <code>unauthenticated</code>, redirects to <code>/auth/login?next=&lt;currentPath&gt;</code></li>
</ol>

<h2>API Auth Headers</h2>
<p>The API client (<code>src/lib/api/client.ts</code>) automatically injects auth headers on every request:</p>
<table>
<tr><th>Mode</th><th>Headers</th></tr>
<tr><td>Cognito</td><td><code>Authorization: Bearer &lt;accessToken&gt;</code></td></tr>
<tr><td>Dev Bypass</td><td><code>x-dev-user-email</code>, <code>x-dev-user-role</code>, <code>x-dev-org-id</code></td></tr>
</table>
<p>On 401 or 403 responses, the client automatically calls <code>logout("unauthorized")</code>.</p>

<h2>Registration Flow</h2>
<p>User types available at registration:</p>
<table>
<tr><th>Type</th><th>Backend Value</th><th>Description</th></tr>
<tr><td>Property Manager</td><td>PROPERTY_MANAGER</td><td>Manages properties for owners</td></tr>
<tr><td>Landlord / Owner</td><td>OWNER</td><td>Owns and rents out properties</td></tr>
<tr><td>Tenant</td><td>TENANT</td><td>Rents a property</td></tr>
</table>

<h2>Email Verification</h2>
<p>After registration, if the user is not auto-confirmed, they are redirected to <code>/auth/verify-email</code> where they enter a 6-digit code. The page also supports resending the code.</p>
""")

# ════════════════════════════════════════════════════════════════════════════
# 5. USER FLOWS (parent)
# ════════════════════════════════════════════════════════════════════════════
p("User Flows", """
<h1>User Flows</h1>
<p>This section documents the major user flows in LeaseBase Web, including click paths for each workflow.</p>
<ac:structured-macro ac:name="children" ac:schema-version="2"><ac:parameter ac:name="all">true</ac:parameter></ac:structured-macro>
""")

# 5a. Login Flow
p("Login Flow", """
<h1>Login Flow</h1>

<h2>Click Path</h2>
<table>
<tr><th>Step</th><th>Action</th><th>Result</th></tr>
<tr><td>1</td><td>Navigate to <code>/auth/login</code></td><td>Login page renders with email/password form</td></tr>
<tr><td>2</td><td>Enter email address</td><td>Email field populated</td></tr>
<tr><td>3</td><td>Enter password</td><td>Password field populated</td></tr>
<tr><td>4</td><td>Click "Sign in"</td><td>Loading state shown, POST <code>/auth/login</code> called</td></tr>
<tr><td>5a</td><td>Success</td><td>Tokens stored, <code>/auth/me</code> called, redirect to <code>/app</code></td></tr>
<tr><td>5b</td><td>Failure</td><td>Red error message displayed below heading</td></tr>
</table>

<h2>Alternate Flows</h2>
<table>
<tr><th>Flow</th><th>Trigger</th><th>Behavior</th></tr>
<tr><td>Social Login</td><td>Click "Social login (coming soon)"</td><td>Error: "Social login is not configured for this environment"</td></tr>
<tr><td>Dev Bypass</td><td>When <code>NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true</code></td><td>Extra panel shown: select role (ORG_ADMIN, PM_STAFF, OWNER, TENANT), enter dev email/org, click "Sign in with dev bypass"</td></tr>
<tr><td>Navigate to Register</td><td>Click "Sign up" link</td><td>Redirect to <code>/auth/register</code></td></tr>
<tr><td>Navigate to Verify</td><td>Click "Verify your email" link</td><td>Redirect to <code>/auth/verify-email?email=...</code></td></tr>
<tr><td>Post-registration</td><td>Arrive with <code>?registered=true&amp;message=...</code></td><td>Green success banner displayed above form</td></tr>
</table>

<h2>Error States</h2>
<ul>
<li>Invalid credentials → backend error message displayed</li>
<li>Network failure → "Login failed" displayed</li>
<li><code>/auth/me</code> failure after token exchange → redirected back to login</li>
</ul>

<h2>API Dependencies</h2>
<table>
<tr><th>Endpoint</th><th>Method</th><th>Purpose</th></tr>
<tr><td><code>/auth/login</code></td><td>POST</td><td>Exchange email + password for tokens</td></tr>
<tr><td><code>/auth/me</code></td><td>GET</td><td>Fetch current user profile after login</td></tr>
</table>
""", parent="User Flows")

# 5b. Registration Flow
p("Registration Flow", """
<h1>Registration Flow</h1>

<h2>Click Path</h2>
<table>
<tr><th>Step</th><th>Action</th><th>Result</th></tr>
<tr><td>1</td><td>Navigate to <code>/auth/register</code></td><td>Step 1: User type selection cards displayed</td></tr>
<tr><td>2</td><td>Click Property Manager / Owner / Tenant card</td><td>Selected type stored, advances to Step 2</td></tr>
<tr><td>3</td><td>Fill First Name, Last Name, Email, Password, Confirm Password</td><td>Form fields populated</td></tr>
<tr><td>4</td><td>Click "Create account"</td><td>Loading state, POST <code>/auth/register</code> called</td></tr>
<tr><td>5a</td><td>User not auto-confirmed</td><td>Redirect to <code>/auth/verify-email?email=...</code></td></tr>
<tr><td>5b</td><td>User auto-confirmed</td><td>Redirect to <code>/auth/login?registered=true&amp;message=...</code></td></tr>
<tr><td>5c</td><td>Error</td><td>Red error message displayed</td></tr>
</table>

<h2>Validation Rules</h2>
<ul>
<li>All fields required</li>
<li>Password minimum 8 characters</li>
<li>Password and Confirm Password must match</li>
<li>User type must be selected (enforced by Step 1)</li>
</ul>

<h2>Alternate Flows</h2>
<table>
<tr><th>Flow</th><th>Trigger</th><th>Behavior</th></tr>
<tr><td>Back to Step 1</td><td>Click "Back" button</td><td>Returns to user type selection, clears error</td></tr>
<tr><td>Navigate to Login</td><td>Click "Sign in" link</td><td>Redirect to <code>/auth/login</code></td></tr>
</table>

<h2>API Dependencies</h2>
<table>
<tr><th>Endpoint</th><th>Method</th><th>Body</th></tr>
<tr><td><code>/auth/register</code></td><td>POST</td><td><code>{email, password, firstName, lastName, userType}</code></td></tr>
</table>
""", parent="User Flows")

# 5c. Email Verification Flow
p("Email Verification Flow", """
<h1>Email Verification Flow</h1>

<h2>Click Path</h2>
<table>
<tr><th>Step</th><th>Action</th><th>Result</th></tr>
<tr><td>1</td><td>Arrive at <code>/auth/verify-email?email=user@example.com</code></td><td>Verification form shown with email pre-filled</td></tr>
<tr><td>2</td><td>Enter 6-digit verification code</td><td>Code field populated</td></tr>
<tr><td>3</td><td>Click "Verify email"</td><td>POST <code>/auth/confirm-email</code> called</td></tr>
<tr><td>4a</td><td>Success</td><td>Redirect to <code>/auth/login?registered=true&amp;message=...</code></td></tr>
<tr><td>4b</td><td>Failure</td><td>Red error message displayed</td></tr>
</table>

<h2>Alternate Flows</h2>
<table>
<tr><th>Flow</th><th>Trigger</th><th>Behavior</th></tr>
<tr><td>Resend Code</td><td>Click "Resend code"</td><td>POST <code>/auth/resend-confirmation</code>, green success or red error shown</td></tr>
<tr><td>Back to Login</td><td>Click "Back to sign in"</td><td>Navigate to <code>/auth/login</code></td></tr>
</table>

<h2>API Dependencies</h2>
<table>
<tr><th>Endpoint</th><th>Method</th><th>Body</th></tr>
<tr><td><code>/auth/confirm-email</code></td><td>POST</td><td><code>{email, code}</code></td></tr>
<tr><td><code>/auth/resend-confirmation</code></td><td>POST</td><td><code>{email}</code></td></tr>
</table>
""", parent="User Flows")

# 5d. Dashboard Flow
p("Dashboard Flow", """
<h1>Dashboard Flow</h1>

<h2>Entry Points</h2>
<ul>
<li>After successful login → redirect to <code>/app</code></li>
<li><code>/</code> (root) → auto-redirect to <code>/app</code></li>
<li><code>/dashboard</code> (legacy) → auto-redirect to <code>/app</code></li>
<li>Click "Dashboard" in sidebar → navigate to <code>/app</code></li>
</ul>

<h2>Persona-Based Dashboard Rendering</h2>
<p>The <code>/app</code> page reads the current user's persona from <code>authStore</code> and renders the corresponding dashboard:</p>
<table>
<tr><th>Persona</th><th>Component</th><th>Dashboard Title</th></tr>
<tr><td><code>propertyManager</code></td><td>PMDashboard</td><td>Portfolio overview</td></tr>
<tr><td><code>owner</code></td><td>OwnerDashboard</td><td>Owner dashboard</td></tr>
<tr><td><code>tenant</code></td><td>TenantDashboard</td><td>Tenant dashboard</td></tr>
<tr><td><em>unknown</em></td><td>TenantDashboard</td><td>Tenant dashboard (fallback)</td></tr>
</table>

<h2>Property Manager Dashboard Modules</h2>
<ol>
<li><strong>KPI Cards</strong>: Properties (count), Units (count + vacant), Occupancy (%), Revenue MTD ($)</li>
<li><strong>Tasks &amp; Follow-ups</strong>: List with badges (Warning/Due, Info/New, Danger/Overdue)</li>
<li><strong>Recent Maintenance</strong>: List with status (In progress, Scheduled, Completed)</li>
</ol>

<h2>Owner Dashboard Modules</h2>
<ol>
<li><strong>KPI Cards</strong>: Monthly Income, YTD Income, Properties count</li>
<li><strong>Properties Summary</strong>: Property name, unit count, occupancy %</li>
<li><strong>Lease Status</strong>: Tenant name, property, expiration date, status badge</li>
</ol>

<h2>Tenant Dashboard Modules</h2>
<ol>
<li><strong>KPI Cards</strong>: Next Rent Due (amount + date), Lease Ends (date + months remaining), Open Requests (count)</li>
<li><strong>Rent Status</strong>: Current month amount, due date, status badge</li>
<li><strong>Maintenance Requests</strong>: Title, submit date, status badge</li>
<li><strong>Messages</strong>: Sender, preview text, timestamp</li>
</ol>
""", parent="User Flows")

# 5e. Navigation Flow
p("Navigation Flow", """
<h1>Navigation Flow</h1>

<h2>AppShell Layout</h2>
<p>All authenticated pages render inside the AppShell layout (<code>app/app/layout.tsx</code>) which includes:</p>
<ul>
<li><strong>Top bar</strong>: Logo/brand, global search input (desktop), notifications bell, user avatar with name/persona, logout button</li>
<li><strong>Sidebar</strong> (desktop: static 56-width, mobile: slide-out with backdrop overlay)</li>
<li><strong>Breadcrumbs</strong>: Auto-generated from URL path segments</li>
<li><strong>Main content area</strong>: Renders child route</li>
</ul>

<h2>Sidebar Navigation Items</h2>
<p>Sidebar items are filtered by the current user's persona:</p>
<table>
<tr><th>Path</th><th>Label</th><th>Icon</th><th>PM</th><th>Owner</th><th>Tenant</th></tr>
<tr><td><code>/app</code></td><td>Dashboard</td><td>LayoutDashboard</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><code>/app/properties</code></td><td>Properties</td><td>Building2</td><td>✅</td><td>✅</td><td>—</td></tr>
<tr><td><code>/app/units</code></td><td>Units</td><td>DoorOpen</td><td>✅</td><td>—</td><td>—</td></tr>
<tr><td><code>/app/leases</code></td><td>Leases</td><td>FileText</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><code>/app/tenants</code></td><td>Tenants</td><td>Users</td><td>✅</td><td>—</td><td>—</td></tr>
<tr><td><code>/app/payments</code></td><td>Payments</td><td>CreditCard</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><code>/app/maintenance</code></td><td>Maintenance</td><td>Wrench</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><code>/app/messages</code></td><td>Messages</td><td>MessageSquare</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td><code>/app/reports</code></td><td>Reports</td><td>BarChart3</td><td>✅</td><td>✅</td><td>—</td></tr>
<tr><td><code>/app/settings</code></td><td>Settings</td><td>Settings</td><td>✅</td><td>✅</td><td>✅</td></tr>
</table>

<h2>Mobile Navigation</h2>
<ol>
<li>Tap hamburger menu (☰) in top bar</li>
<li>Slide-out nav panel appears with backdrop overlay</li>
<li>Tap any nav item → navigate + auto-close panel</li>
<li>Press Escape or tap backdrop → close panel</li>
</ol>

<h2>Accessibility Features</h2>
<ul>
<li>Skip-to-main-content link (visible on focus)</li>
<li><code>aria-current="page"</code> on active sidebar item</li>
<li><code>aria-label="Primary navigation"</code> on sidebar nav</li>
<li><code>aria-expanded</code> on hamburger button</li>
<li>Focus management: closing mobile nav returns focus to hamburger</li>
<li>Keyboard: Escape closes mobile nav</li>
</ul>
""", parent="User Flows")

# ════════════════════════════════════════════════════════════════════════════
# 6. USE CASES (parent)
# ════════════════════════════════════════════════════════════════════════════
p("Use Cases", """
<h1>Use Cases</h1>
<p>Functional use cases organized by domain area.</p>
<ac:structured-macro ac:name="children" ac:schema-version="2"><ac:parameter ac:name="all">true</ac:parameter></ac:structured-macro>
""")

# 6a. UC: Authentication
p("UC — Authentication", """
<h1>Use Case: User Authentication</h1>
<table>
<tr><th>Field</th><th>Detail</th></tr>
<tr><td>Title</td><td>User Authentication (Login / Register / Verify / Logout)</td></tr>
<tr><td>Actors</td><td>Property Manager, Owner, Tenant (all personas)</td></tr>
<tr><td>Description</td><td>Users authenticate to access the LeaseBase platform via email/password or dev bypass</td></tr>
<tr><td>Preconditions</td><td>User has a registered account (or registers as part of the flow)</td></tr>
</table>

<h2>Main Flow — Login</h2>
<ol>
<li>User navigates to <code>/auth/login</code></li>
<li>User enters email and password</li>
<li>User clicks "Sign in"</li>
<li>System calls <code>POST /auth/login</code></li>
<li>System stores tokens in auth store</li>
<li>System calls <code>GET /auth/me</code> to fetch user profile</li>
<li>System maps backend role to frontend persona</li>
<li>System redirects to <code>/app</code></li>
</ol>

<h2>Alternate Flow — Registration</h2>
<ol>
<li>User clicks "Sign up" on login page</li>
<li>User selects user type (Property Manager / Owner / Tenant)</li>
<li>User fills registration form and submits</li>
<li>System calls <code>POST /auth/register</code></li>
<li>If not auto-confirmed: redirect to email verification</li>
<li>If auto-confirmed: redirect to login with success message</li>
</ol>

<h2>Alternate Flow — Logout</h2>
<ol>
<li>User clicks logout icon in top bar</li>
<li>System clears all auth state from store + localStorage</li>
<li>System sets status to "unauthenticated"</li>
<li>Route guard redirects to <code>/auth/login</code></li>
</ol>

<h2>Error Conditions</h2>
<ul>
<li>Invalid credentials → error message on login form</li>
<li>Registration with existing email → backend error message</li>
<li>Password mismatch → client-side "Passwords do not match"</li>
<li>Password too short → client-side "Password must be at least 8 characters"</li>
<li>Invalid verification code → error message on verify form</li>
<li>Expired token → auto-logout on next API call (401/403)</li>
</ul>

<h2>Permissions</h2>
<p>Authentication pages (<code>/auth/*</code>) are public. All <code>/app/*</code> routes require authentication via <code>useRequireAuth()</code> hook.</p>

<h2>API Dependencies</h2>
<table>
<tr><th>Endpoint</th><th>Method</th><th>Auth Required</th></tr>
<tr><td><code>/auth/login</code></td><td>POST</td><td>No</td></tr>
<tr><td><code>/auth/register</code></td><td>POST</td><td>No</td></tr>
<tr><td><code>/auth/confirm-email</code></td><td>POST</td><td>No</td></tr>
<tr><td><code>/auth/resend-confirmation</code></td><td>POST</td><td>No</td></tr>
<tr><td><code>/auth/me</code></td><td>GET</td><td>Yes</td></tr>
</table>
""", parent="Use Cases")

# 6b-6g. Domain use cases
for title, actors, desc, flows, apis in [
    ("UC — Properties", "Property Manager, Owner",
     "View, create, and manage property records",
     ["Navigate to /app/properties from sidebar", "View list of properties in DataTable", "Click property row to view detail", "Create new property via form", "Edit property details", "View units within a property"],
     [("/properties", "GET", "List all properties"), ("/properties/:id", "GET", "Get property detail"), ("/properties", "POST", "Create property"), ("/properties/:id", "PUT", "Update property")]),
    ("UC — Leases", "Property Manager, Owner, Tenant",
     "View and manage lease agreements",
     ["Navigate to /app/leases from sidebar", "View list of leases in DataTable", "Click lease to view detail", "Create new lease (PM only)", "Renew or terminate lease (PM only)", "Tenant views own active lease"],
     [("/leases", "GET", "List leases"), ("/leases/:id", "GET", "Get lease detail"), ("/leases", "POST", "Create lease"), ("/leases/:id", "PUT", "Update lease")]),
    ("UC — Maintenance", "Property Manager, Owner, Tenant",
     "Submit, track, and resolve maintenance requests",
     ["Navigate to /app/maintenance from sidebar", "View list of maintenance requests", "Tenant submits new request", "PM assigns vendor / updates status", "Owner views maintenance for owned properties", "All users track status changes"],
     [("/maintenance", "GET", "List requests"), ("/maintenance/:id", "GET", "Get request detail"), ("/maintenance", "POST", "Create request"), ("/maintenance/:id", "PUT", "Update status")]),
    ("UC — Payments", "Property Manager, Owner, Tenant",
     "Track rent payments and financial transactions",
     ["Navigate to /app/payments from sidebar", "View payment history in DataTable", "Tenant sees upcoming rent due", "PM records payment received", "Owner views income from properties"],
     [("/payments", "GET", "List payments"), ("/payments/:id", "GET", "Get payment detail"), ("/payments", "POST", "Record payment")]),
    ("UC — Messages", "Property Manager, Owner, Tenant",
     "In-app messaging between users",
     ["Navigate to /app/messages from sidebar", "View message threads", "Send new message", "Reply to existing thread", "Receive notifications for new messages"],
     [("/messages", "GET", "List threads"), ("/messages/:id", "GET", "Get thread"), ("/messages", "POST", "Send message")]),
    ("UC — Reports", "Property Manager, Owner",
     "Generate and view financial and operational reports",
     ["Navigate to /app/reports from sidebar", "Select report type", "Set date range and filters", "View report data", "Export report"],
     [("/reports", "GET", "List available reports"), ("/reports/:type", "GET", "Generate report data")]),
]:
    flow_html = "".join(f"<li>{f}</li>" for f in flows)
    api_html = "".join(f"<tr><td><code>{e}</code></td><td>{m}</td><td>{p}</td></tr>" for e,m,p in apis)
    p(title, f"""
<h1>Use Case: {title.replace("UC — ", "")}</h1>
<table>
<tr><th>Field</th><th>Detail</th></tr>
<tr><td>Actors</td><td>{actors}</td></tr>
<tr><td>Description</td><td>{desc}</td></tr>
<tr><td>Preconditions</td><td>User is authenticated with appropriate persona</td></tr>
</table>
<h2>Main Flow</h2>
<ol>{flow_html}</ol>
<h2>API Dependencies</h2>
<table>
<tr><th>Endpoint</th><th>Method</th><th>Purpose</th></tr>
{api_html}
</table>
""", parent="Use Cases")

# ════════════════════════════════════════════════════════════════════════════
# 7. PAGE REFERENCE (parent)
# ════════════════════════════════════════════════════════════════════════════
p("Page Reference", """
<h1>Page Reference</h1>
<p>Detailed documentation for each page/route in the application.</p>
<ac:structured-macro ac:name="children" ac:schema-version="2"><ac:parameter ac:name="all">true</ac:parameter></ac:structured-macro>
""")

for route, purpose, components, inputs, buttons, actions, api_calls, perms, edge in [
    ("/auth/login", "User sign-in page",
     "LoginContent (client component with Suspense wrapper)",
     "Email (email, required), Password (password, required), Dev Email (optional), Dev Org ID (optional), Dev Role (select)",
     "Sign in, Social login (coming soon), Sign in with dev bypass, Verify your email link, Sign up link",
     "Submit login form, Start OIDC login (placeholder), Dev bypass login, Navigate to register, Navigate to verify",
     "POST /auth/login, GET /auth/me",
     "Public (no auth required)",
     "Shows post-registration success message if ?registered=true. Social login not yet implemented. Dev bypass only visible when NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH is set."),
    ("/auth/register", "New user registration (2-step form)",
     "RegisterContent (client component with Suspense wrapper)",
     "Step 1: User type selection (3 cards). Step 2: First Name, Last Name, Email, Password, Confirm Password (all required)",
     "User type cards (Property Manager, Owner, Tenant), Back button, Create account, Sign in link",
     "Select user type → advance to step 2, Submit registration form, Navigate to login",
     "POST /auth/register",
     "Public (no auth required)",
     "Client-side validation: password min 8 chars, password match. Backend may return errors for duplicate email."),
    ("/auth/verify-email", "Email verification with 6-digit code",
     "VerifyEmailContent (client component with Suspense wrapper)",
     "Email (pre-filled from query param), Verification code (text, required)",
     "Verify email, Resend code, Back to sign in link",
     "Submit verification code, Resend verification code, Navigate to login",
     "POST /auth/confirm-email, POST /auth/resend-confirmation",
     "Public (no auth required)",
     "Email pre-filled from ?email= query param. Resend shows success/error inline."),
    ("/auth/callback", "OAuth/OIDC callback handler",
     "AuthCallbackContent (client component with Suspense wrapper)",
     "None (reads state and error from query params)",
     "None",
     "Auto-redirect to destination from state param, or display error",
     "None (backend handles token exchange)",
     "Public",
     "If ?error is present, displays error. Otherwise redirects to decoded state param."),
    ("/app", "Persona-aware dashboard (main landing page)",
     "AppDashboardPage → PMDashboard / OwnerDashboard / TenantDashboard",
     "None",
     "None (dashboard is read-only display)",
     "View KPIs, View tasks/requests/messages, Navigate via sidebar",
     "GET /auth/me (via route guard on layout)",
     "Authenticated users only (useRequireAuth guard)",
     "Unknown personas fall back to TenantDashboard. Loading state shows skeleton."),
]:
    page_title = f"Page — {route}"
    p(page_title, f"""
<h1>Page: <code>{route}</code></h1>
<table>
<tr><th>Attribute</th><th>Detail</th></tr>
<tr><td>Route</td><td><code>{route}</code></td></tr>
<tr><td>Purpose</td><td>{purpose}</td></tr>
<tr><td>Components</td><td>{components}</td></tr>
<tr><td>Inputs</td><td>{inputs}</td></tr>
<tr><td>Buttons / Actions</td><td>{buttons}</td></tr>
<tr><td>User Actions</td><td>{actions}</td></tr>
<tr><td>API Calls</td><td><code>{api_calls}</code></td></tr>
<tr><td>Permissions</td><td>{perms}</td></tr>
<tr><td>Edge Cases</td><td>{edge}</td></tr>
</table>
""", parent="Page Reference")

# ════════════════════════════════════════════════════════════════════════════
# 8. PERMISSIONS MATRIX
# ════════════════════════════════════════════════════════════════════════════
p("Permissions Matrix", """
<h1>Permissions Matrix</h1>

<h2>Route Access</h2>
<table>
<tr><th>Route</th><th>Auth Required</th><th>Personas Allowed</th></tr>
<tr><td><code>/auth/login</code></td><td>No</td><td>All (public)</td></tr>
<tr><td><code>/auth/register</code></td><td>No</td><td>All (public)</td></tr>
<tr><td><code>/auth/verify-email</code></td><td>No</td><td>All (public)</td></tr>
<tr><td><code>/auth/callback</code></td><td>No</td><td>All (public)</td></tr>
<tr><td><code>/app</code></td><td>Yes</td><td>All authenticated</td></tr>
<tr><td><code>/app/properties</code></td><td>Yes</td><td>propertyManager, owner</td></tr>
<tr><td><code>/app/units</code></td><td>Yes</td><td>propertyManager</td></tr>
<tr><td><code>/app/leases</code></td><td>Yes</td><td>propertyManager, owner, tenant</td></tr>
<tr><td><code>/app/tenants</code></td><td>Yes</td><td>propertyManager</td></tr>
<tr><td><code>/app/payments</code></td><td>Yes</td><td>propertyManager, owner, tenant</td></tr>
<tr><td><code>/app/maintenance</code></td><td>Yes</td><td>propertyManager, owner, tenant</td></tr>
<tr><td><code>/app/messages</code></td><td>Yes</td><td>propertyManager, owner, tenant</td></tr>
<tr><td><code>/app/reports</code></td><td>Yes</td><td>propertyManager, owner</td></tr>
<tr><td><code>/app/settings</code></td><td>Yes</td><td>propertyManager, owner, tenant</td></tr>
</table>

<h2>Navigation Visibility</h2>
<p>Sidebar items are filtered by persona via <code>filterNavForPersona()</code>. A user never sees nav items for routes they cannot access.</p>

<h2>Auth Enforcement</h2>
<ul>
<li><strong>Client-side</strong>: <code>useRequireAuth()</code> hook on <code>/app</code> layout redirects unauthenticated users to <code>/auth/login</code></li>
<li><strong>API-side</strong>: 401/403 responses trigger automatic logout via <code>apiRequest()</code> client</li>
<li><strong>Token expiry</strong>: Checked during <code>initializeFromStorage()</code> — expired tokens clear the session</li>
</ul>
""")

# ════════════════════════════════════════════════════════════════════════════
# 9. ERROR HANDLING
# ════════════════════════════════════════════════════════════════════════════
p("Error Handling", """
<h1>Error Handling</h1>

<h2>Authentication Errors</h2>
<table>
<tr><th>Scenario</th><th>Error Source</th><th>User Experience</th></tr>
<tr><td>Invalid login credentials</td><td>Backend 401</td><td>Red error text on login form</td></tr>
<tr><td>Registration with existing email</td><td>Backend 409</td><td>Red error text on registration form</td></tr>
<tr><td>Passwords don't match</td><td>Client validation</td><td>"Passwords do not match" error</td></tr>
<tr><td>Password too short</td><td>Client validation</td><td>"Password must be at least 8 characters"</td></tr>
<tr><td>Invalid verification code</td><td>Backend error</td><td>Red error text on verify form</td></tr>
<tr><td>Resend code failure</td><td>Backend error</td><td>Red error text on verify form</td></tr>
<tr><td>Social login attempted</td><td>Client</td><td>"Social login is not configured"</td></tr>
<tr><td>OAuth callback error</td><td>Query param</td><td>Red error text on callback page</td></tr>
</table>

<h2>Session/Token Errors</h2>
<table>
<tr><th>Scenario</th><th>Behavior</th></tr>
<tr><td>Token expired on page load</td><td><code>initializeFromStorage()</code> clears session → redirect to login</td></tr>
<tr><td>Token expired mid-session</td><td>Next API call returns 401/403 → <code>apiRequest</code> calls <code>logout("unauthorized")</code></td></tr>
<tr><td><code>/auth/me</code> fails after login</td><td>Auth store cleared, error thrown, login page shown</td></tr>
<tr><td>No token in storage</td><td>Status set to "unauthenticated" → redirect to login</td></tr>
</table>

<h2>API Client Error Handling</h2>
<p>The centralized API client (<code>src/lib/api/client.ts</code>):</p>
<ul>
<li>Automatically parses JSON or returns raw text for non-JSON responses</li>
<li>Returns <code>undefined</code> for empty response bodies</li>
<li>On 401/403: triggers <code>logout("unauthorized")</code> and throws "Unauthorized"</li>
</ul>

<h2>UI Component Error States</h2>
<table>
<tr><th>Component</th><th>Error Behavior</th></tr>
<tr><td>DataTable</td><td>Displays red-bordered error alert with message</td></tr>
<tr><td>DataTable (empty)</td><td>Displays "No data available" message</td></tr>
<tr><td>DataTable (loading)</td><td>Displays skeleton rows with pulse animation</td></tr>
<tr><td>Input</td><td>Red border + error message below field with <code>role="alert"</code></td></tr>
<tr><td>Select</td><td>Red border + error message below field</td></tr>
<tr><td>Toast</td><td>Error variant: red-themed notification in bottom-right</td></tr>
</table>
""")

# ════════════════════════════════════════════════════════════════════════════
# 10. API INTEGRATION
# ════════════════════════════════════════════════════════════════════════════
p("API Integration", """
<h1>API Integration</h1>

<h2>API Client Architecture</h2>
<p>All API calls go through <code>src/lib/api/client.ts</code> → <code>apiRequest()</code> function.</p>

<h3>Features</h3>
<ul>
<li>Automatic base URL resolution via <code>getApiBaseUrl()</code></li>
<li>Automatic auth header injection (Cognito Bearer token or dev-bypass headers)</li>
<li>Automatic logout on 401/403</li>
<li>JSON parsing with fallback to raw text</li>
<li>Support for anonymous requests (no auth headers)</li>
</ul>

<h2>API Base URL Resolution</h2>
<table>
<tr><th>Condition</th><th>Resolved URL</th></tr>
<tr><td>Server-side + env set</td><td>Use <code>NEXT_PUBLIC_API_BASE_URL</code> as-is</td></tr>
<tr><td>Client + no env</td><td><code>window.location.origin/api</code></td></tr>
<tr><td>Client + env (same origin, no /api)</td><td>Prepend <code>/api</code> to path</td></tr>
<tr><td>Client + env (different origin)</td><td>Use env as-is</td></tr>
</table>

<h2>Known API Endpoints</h2>
<table>
<tr><th>Endpoint</th><th>Method</th><th>Auth</th><th>Used By</th></tr>
<tr><td><code>/auth/login</code></td><td>POST</td><td>No</td><td>Login page</td></tr>
<tr><td><code>/auth/register</code></td><td>POST</td><td>No</td><td>Registration page</td></tr>
<tr><td><code>/auth/confirm-email</code></td><td>POST</td><td>No</td><td>Email verification page</td></tr>
<tr><td><code>/auth/resend-confirmation</code></td><td>POST</td><td>No</td><td>Email verification page</td></tr>
<tr><td><code>/auth/me</code></td><td>GET</td><td>Yes</td><td>Auth store (loadMe)</td></tr>
</table>

<h2>Auth Header Injection</h2>
<table>
<tr><th>Auth Mode</th><th>Headers Sent</th></tr>
<tr><td>Cognito</td><td><code>Authorization: Bearer &lt;accessToken&gt;</code></td></tr>
<tr><td>Dev Bypass</td><td><code>x-dev-user-email</code>, <code>x-dev-user-role</code>, <code>x-dev-org-id</code></td></tr>
<tr><td>Anonymous</td><td>No auth headers</td></tr>
</table>
""")

# ════════════════════════════════════════════════════════════════════════════
# 11. UI COMPONENT LIBRARY
# ════════════════════════════════════════════════════════════════════════════
p("UI Component Library", """
<h1>UI Component Library</h1>
<p>All shared UI components live in <code>src/components/ui/</code> and are exported from <code>src/components/ui/index.ts</code>.</p>

<h2>Components</h2>
<table>
<tr><th>Component</th><th>Variants / Props</th><th>Description</th></tr>
<tr><td><strong>Button</strong></td><td>Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. Props: loading, icon</td><td>Standard action button with loading spinner</td></tr>
<tr><td><strong>Input</strong></td><td>Props: label, error, helperText</td><td>Text input with label, error state, helper text. Uses aria-invalid and aria-describedby</td></tr>
<tr><td><strong>Select</strong></td><td>Props: label, error, helperText</td><td>Dropdown select with same label/error pattern as Input</td></tr>
<tr><td><strong>Badge</strong></td><td>Variants: success, warning, danger, info, neutral</td><td>Inline status pill/tag</td></tr>
<tr><td><strong>Card</strong></td><td>Sub-components: CardHeader, CardBody, CardFooter</td><td>Container with border and sections</td></tr>
<tr><td><strong>DataTable</strong></td><td>Props: columns, rows, loading, error, emptyMessage, pageSize</td><td>Paginated table with loading skeleton, error, and empty states</td></tr>
<tr><td><strong>Modal</strong></td><td>Props: open, onClose, title</td><td>Dialog with backdrop, focus trap, Escape to close, portal rendering</td></tr>
<tr><td><strong>Toast / ToastProvider</strong></td><td>Variants: success, error, info</td><td>Notification system. Auto-dismiss. Bottom-right positioned</td></tr>
<tr><td><strong>Checkbox</strong></td><td>Props: label</td><td>Styled checkbox with optional label</td></tr>
<tr><td><strong>Switch</strong></td><td>Props: checked, onChange, label</td><td>Toggle switch with role="switch" and aria-checked</td></tr>
<tr><td><strong>Tooltip</strong></td><td>Props: content</td><td>Hover/focus tooltip with role="tooltip"</td></tr>
<tr><td><strong>Icon</strong></td><td>Props: name, size</td><td>Maps string key to Lucide icon component</td></tr>
<tr><td><strong>PageHeader</strong></td><td>Props: title, description, actions</td><td>Page heading with optional description and action buttons</td></tr>
<tr><td><strong>StatCard</strong></td><td>Props: label, value, change, icon</td><td>KPI metric card for dashboards</td></tr>
</table>

<h2>Design Tokens (Tailwind)</h2>
<ul>
<li>Background: slate-900, slate-950</li>
<li>Brand color: brand-500 (emerald-based)</li>
<li>Danger: red</li>
<li>Warning: amber</li>
<li>Info: blue</li>
<li>Success: emerald</li>
<li>Text: slate-50 (primary), slate-300 (secondary), slate-400 (muted)</li>
<li>Borders: slate-700, slate-800</li>
</ul>
""")

# ════════════════════════════════════════════════════════════════════════════
# 12. TESTING SCENARIOS
# ════════════════════════════════════════════════════════════════════════════
p("Testing Scenarios", """
<h1>Testing Scenarios</h1>

<h2>Unit Tests (Jest + Testing Library)</h2>
<table>
<tr><th>Test File</th><th>What It Tests</th></tr>
<tr><td><code>Button.test.tsx</code></td><td>Button component rendering and variants</td></tr>
<tr><td><code>Input.test.tsx</code></td><td>Input component with label, error, helper text</td></tr>
<tr><td><code>DataTable.empty.test.tsx</code></td><td>DataTable empty state message</td></tr>
<tr><td><code>Login.mockAuth.test.tsx</code></td><td>Login page with mocked auth store</td></tr>
<tr><td><code>pmDashboard.loading.test.tsx</code></td><td>PM Dashboard loading/skeleton state</td></tr>
<tr><td><code>roles.guard.test.ts</code></td><td>Role-to-persona mapping logic</td></tr>
<tr><td><code>session.mock.test.ts</code></td><td>Session initialization and mock auth</td></tr>
<tr><td><code>apiHeaders.test.ts</code></td><td>API client auth header injection</td></tr>
<tr><td><code>appNav.test.ts</code></td><td>Navigation filtering by persona</td></tr>
<tr><td><code>VerifyEmail.flow.test.tsx</code></td><td>Email verification form flow</td></tr>
</table>

<h2>E2E Tests (Playwright)</h2>
<table>
<tr><th>Test</th><th>Steps</th></tr>
<tr><td>PM dev-bypass login</td><td>Go to /auth/login → fill dev bypass (ORG_ADMIN) → verify "Portfolio overview" heading</td></tr>
<tr><td>Tenant dev-bypass login</td><td>Go to /auth/login → fill dev bypass (TENANT) → verify "Tenant dashboard" heading</td></tr>
<tr><td>PM sidebar navigation</td><td>Login as PM → verify "Properties" and "Maintenance" links in sidebar</td></tr>
</table>

<h2>Running Tests</h2>
<table>
<tr><th>Command</th><th>Description</th></tr>
<tr><td><code>npm test</code></td><td>Run all Jest unit tests</td></tr>
<tr><td><code>npm run test:watch</code></td><td>Jest in watch mode</td></tr>
<tr><td><code>npm run test:e2e</code></td><td>Run Playwright E2E tests (requires dev server with mock auth)</td></tr>
<tr><td><code>npm run test:e2e:headed</code></td><td>E2E tests in headed browser mode</td></tr>
</table>
""")

# ════════════════════════════════════════════════════════════════════════════
# PUBLISH ALL PAGES
# ════════════════════════════════════════════════════════════════════════════

def main():
    print(f"Publishing to {BASE_URL}, space={SPACE}, homepage={HOMEPAGE_ID}")
    print(f"Total pages to create: {len(PAGES)}")
    print()

    # Track page IDs for parent resolution
    page_ids = {}
    created = 0
    updated = 0

    # First pass: create/update pages with no parent (children of homepage)
    for title, (html, parent) in PAGES.items():
        if parent is not None:
            continue
        try:
            pid = create_or_update_page(title, html, HOMEPAGE_ID)
            page_ids[title] = pid
            created += 1
            time.sleep(0.3)  # rate limit courtesy
        except Exception as e:
            print(f"  FAILED: {title} — {e}")

    # Second pass: create/update child pages
    for title, (html, parent) in PAGES.items():
        if parent is None:
            continue
        parent_id = page_ids.get(parent, HOMEPAGE_ID)
        try:
            pid = create_or_update_page(title, html, parent_id)
            page_ids[title] = pid
            created += 1
            time.sleep(0.3)
        except Exception as e:
            print(f"  FAILED: {title} — {e}")

    print()
    print("=" * 60)
    print(f"DONE — {created} pages created/updated")
    print(f"Space key: {SPACE}")
    print(f"Root URL: {BASE_URL}/spaces/{SPACE}/overview")
    print()
    print("Major sections:")
    for title in PAGES:
        parent = PAGES[title][1]
        prefix = "  └─ " if parent else "• "
        print(f"  {prefix}{title}")
    print("=" * 60)

if __name__ == "__main__":
    main()
