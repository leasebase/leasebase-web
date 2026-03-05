#!/usr/bin/env node
/**
 * LeaseBase Web — Confluence Documentation Publisher
 *
 * Generates a full product documentation suite from the codebase analysis
 * and publishes it to Confluence via REST API.
 *
 * Usage:
 *   node scripts/publish-confluence-docs.mjs
 *
 * Required env vars:
 *   CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN, CONFLUENCE_SPACE_KEY
 */

const BASE_URL = process.env.CONFLUENCE_BASE_URL;
const EMAIL = process.env.CONFLUENCE_EMAIL;
const TOKEN = process.env.CONFLUENCE_API_TOKEN;
const SPACE_KEY = process.env.CONFLUENCE_SPACE_KEY;

// ── Pre-flight checks ──────────────────────────────────────────────────────
const missing = [];
if (!BASE_URL) missing.push("CONFLUENCE_BASE_URL");
if (!EMAIL) missing.push("CONFLUENCE_EMAIL");
if (!TOKEN) missing.push("CONFLUENCE_API_TOKEN");
if (!SPACE_KEY) missing.push("CONFLUENCE_SPACE_KEY");
if (missing.length) {
  console.error(`❌ Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const API = `${BASE_URL}/rest/api/content`;
const AUTH = Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");

const headers = {
  Authorization: `Basic ${AUTH}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

let stats = { created: 0, updated: 0, errors: 0 };

// ── Confluence helpers ──────────────────────────────────────────────────────

async function findPage(title) {
  const url = `${API}?title=${encodeURIComponent(title)}&spaceKey=${SPACE_KEY}&expand=version`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results && data.results.length > 0 ? data.results[0] : null;
}

async function createPage(title, body, ancestorId) {
  const payload = {
    type: "page",
    title,
    space: { key: SPACE_KEY },
    body: { storage: { value: body, representation: "storage" } },
  };
  if (ancestorId) payload.ancestors = [{ id: ancestorId }];

  const res = await fetch(API, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create "${title}" failed (${res.status}): ${txt}`);
  }
  return res.json();
}

async function updatePage(pageId, title, body, version) {
  const payload = {
    type: "page",
    title,
    version: { number: version + 1 },
    body: { storage: { value: body, representation: "storage" } },
  };
  const res = await fetch(`${API}/${pageId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Update "${title}" failed (${res.status}): ${txt}`);
  }
  return res.json();
}

async function upsertPage(title, body, ancestorId) {
  try {
    const existing = await findPage(title);
    if (existing) {
      const page = await updatePage(existing.id, title, body, existing.version.number);
      stats.updated++;
      console.log(`  ✏️  Updated: "${title}" (v${existing.version.number + 1})`);
      return page;
    } else {
      const page = await createPage(title, body, ancestorId);
      stats.created++;
      console.log(`  ✅ Created: "${title}"`);
      return page;
    }
  } catch (err) {
    stats.errors++;
    console.error(`  ❌ Error: "${title}" — ${err.message}`);
    return null;
  }
}

// Helper to make a Confluence info/note/warning panel
function panel(type, title, body) {
  return `<ac:structured-macro ac:name="${type}"><ac:parameter ac:name="title">${title}</ac:parameter><ac:rich-text-body>${body}</ac:rich-text-body></ac:structured-macro>`;
}

function code(lang, content) {
  return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${lang}</ac:parameter><ac:parameter ac:name="theme">Midnight</ac:parameter><ac:plain-text-body><![CDATA[${content}]]></ac:plain-text-body></ac:structured-macro>`;
}

function toc() {
  return `<ac:structured-macro ac:name="toc"><ac:parameter ac:name="printable">true</ac:parameter><ac:parameter ac:name="style">disc</ac:parameter><ac:parameter ac:name="maxLevel">3</ac:parameter></ac:structured-macro>`;
}

function h(level, text) {
  return `<h${level}>${text}</h${level}>`;
}

function table(headings, rows) {
  let html = `<table><thead><tr>${headings.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
  for (const row of rows) {
    html += `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`;
  }
  html += `</tbody></table>`;
  return html;
}

// ────────────────────────────────────────────────────────────────────────────
// PAGE CONTENT GENERATORS
// ────────────────────────────────────────────────────────────────────────────

function rootPageContent() {
  return `
${panel("info", "LeaseBase Web Documentation", "<p>Complete product documentation for the LeaseBase web frontend. This documentation covers every feature, user flow, page, and API integration.</p>")}
${h(2, "About LeaseBase")}
<p>LeaseBase is a property management platform that serves <strong>Property Managers</strong>, <strong>Owners</strong>, and <strong>Tenants</strong>. The web application is built with <strong>Next.js 14</strong> (App Router), <strong>TypeScript</strong>, <strong>Tailwind CSS</strong>, and <strong>Zustand</strong> for state management.</p>
${h(2, "Documentation Sections")}
<ul>
  <li><strong>Overview</strong> — System overview, tech stack, and high-level architecture</li>
  <li><strong>System Architecture</strong> — Architecture diagrams, deployment model, and component relationships</li>
  <li><strong>Personas</strong> — User types, goals, and role-based access</li>
  <li><strong>Authentication</strong> — Login, registration, verification, and session management</li>
  <li><strong>User Flows</strong> — Step-by-step click paths for every major workflow</li>
  <li><strong>Use Cases</strong> — Formal use case documents per functional area</li>
  <li><strong>Page Reference</strong> — Detailed page-by-page documentation</li>
  <li><strong>Permissions Matrix</strong> — Role-based access control across all features</li>
  <li><strong>Error Handling</strong> — Error states, messages, and recovery flows</li>
  <li><strong>API Integration</strong> — Backend API endpoints, auth headers, and contracts</li>
  <li><strong>Design System &amp; UI Components</strong> — Visual language, tokens, and component inventory</li>
  <li><strong>Testing Scenarios</strong> — Unit, integration, and E2E test coverage</li>
</ul>
${h(2, "Tech Stack")}
${table(["Technology", "Purpose", "Version"], [
  ["Next.js", "React framework (App Router, SSR/SSG)", "14.2.5"],
  ["TypeScript", "Type-safe JavaScript", "5.6.3"],
  ["Tailwind CSS", "Utility-first CSS framework", "3.4.14"],
  ["Zustand", "Lightweight state management", "4.5.4"],
  ["Lucide React", "Icon library", "0.577.0"],
  ["AWS Cognito", "Authentication provider", "via Amplify 6.x"],
  ["Zod", "Schema validation", "3.23.8"],
  ["Jest + Testing Library", "Unit / component testing", "29.7 / 16.0"],
  ["Playwright", "End-to-end testing", "1.48.2"],
])}
${h(2, "Repository")}
<p>Source: <code>leasebase-web</code> (GitHub) — Branch: <code>feature/uiux-foundation</code></p>
`;
}

function overviewContent() {
  return `
${toc()}
${h(2, "System Overview")}
<p>LeaseBase Web is the <strong>standalone frontend</strong> for the LeaseBase property management platform. It is a Next.js application that communicates with a separate NestJS backend API.</p>

${h(3, "Key Characteristics")}
<ul>
  <li><strong>Frontend-only</strong> — No backend code, database, or infrastructure code lives in this repo</li>
  <li><strong>App Router</strong> — Uses Next.js App Router with <code>app/</code> directory structure</li>
  <li><strong>Role-based UI</strong> — Navigation and dashboards adapt to the authenticated user's persona</li>
  <li><strong>Dark theme</strong> — Slate-based dark UI with emerald/brand accent colors</li>
  <li><strong>Accessible</strong> — WCAG-compliant with focus indicators, ARIA attributes, and skip navigation</li>
</ul>

${h(3, "Backend Dependency")}
<p>The web client talks to the Leasebase backend API at the URL configured via <code>NEXT_PUBLIC_API_BASE_URL</code>. The backend is a NestJS + Prisma + PostgreSQL service in a separate repository (<code>leasebase</code>).</p>

${h(3, "Route Structure")}
${table(["Route Group", "Description", "Auth Required"], [
  ["<code>/</code>", "Root — redirects to <code>/app</code>", "No (redirect)"],
  ["<code>/auth/*</code>", "Authentication pages (login, register, verify, callback)", "No"],
  ["<code>/login</code>", "Alias for <code>/auth/login</code>", "No"],
  ["<code>/app</code>", "Authenticated application shell with persona-aware dashboard", "Yes"],
  ["<code>/app/*</code>", "All authenticated pages (properties, leases, etc.)", "Yes"],
  ["<code>/dashboard</code>", "Legacy redirect to <code>/app</code>", "No (redirect)"],
])}

${h(3, "Local Development")}
${code("bash", `# 1. Start the backend API (from ../leasebase)
cd ../leasebase && npm install && npm run dev:api

# 2. Start the web frontend
cd ../leasebase-web && npm install && npm run dev`)}

${h(3, "Build &amp; Deploy")}
<p>The Next.js app builds to <code>.next/</code> and is deployed as a container (port 3000) behind AWS infrastructure provisioned from the backend repo.</p>
`;
}

function systemArchitectureContent() {
  return `
${toc()}
${h(2, "System Architecture")}

${h(3, "High-Level Architecture Diagram")}
${code("text", `
┌─────────────────────────────────────────────────────────────────┐
│                        LEASEBASE PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │   leasebase-web      │  HTTP   │   leasebase (backend)    │  │
│  │   ─────────────      │ ──────> │   ──────────────────     │  │
│  │   Next.js 14         │         │   NestJS + Prisma        │  │
│  │   TypeScript         │         │   PostgreSQL             │  │
│  │   Tailwind CSS       │         │   AWS Cognito            │  │
│  │   Zustand            │         │   S3 (documents)         │  │
│  │                      │         │                          │  │
│  │  Port: 3000          │         │  Port: 4000              │  │
│  └──────────────────────┘         └──────────────────────────┘  │
│           │                                │                    │
│           │ Static/SSR                     │ Auth               │
│           ▼                                ▼                    │
│  ┌──────────────────┐            ┌──────────────────┐           │
│  │  AWS CloudFront  │            │  AWS Cognito     │           │
│  │  + ALB           │            │  User Pool       │           │
│  └──────────────────┘            └──────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
`)}

${h(3, "Frontend Component Architecture")}
${code("text", `
app/
├── layout.tsx ─────────────── Root Layout (HTML, global styles)
│
├── auth/
│   ├── login/page.tsx ─────── Login (email/password + social + dev bypass)
│   ├── register/page.tsx ──── Registration (user type selection → form)
│   ├── verify-email/page.tsx  Email verification (6-digit code)
│   └── callback/page.tsx ──── OAuth callback handler
│
├── app/
│   ├── layout.tsx ─────────── AppShell (sidebar, topbar, breadcrumbs, toast)
│   │                          Uses useRequireAuth() guard
│   └── page.tsx ──────────── Persona-aware dashboard dispatcher
│                              ├── PMDashboard
│                              ├── OwnerDashboard
│                              └── TenantDashboard
│
├── page.tsx ──────────────── Root redirect → /app
├── login/page.tsx ────────── Alias → auth/login
└── dashboard/page.tsx ────── Legacy redirect → /app
`)}

${h(3, "State Management")}
<p>Authentication state is managed via <strong>Zustand</strong> with localStorage persistence (key: <code>lb_auth_v1</code>). The <code>authStore</code> holds:</p>
<ul>
  <li>Auth mode (<code>cognito</code> or <code>devBypass</code>)</li>
  <li>Access/ID/refresh tokens and expiration</li>
  <li>Current user object with persona mapping</li>
  <li>Auth status (<code>idle</code>, <code>initializing</code>, <code>authenticated</code>, <code>unauthenticated</code>)</li>
</ul>

${h(3, "Authentication Flow Diagram")}
${code("text", `
┌──────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ User │────>│ Login    │────>│ Backend  │────>│ Cognito  │
│      │     │ Page     │     │ /auth/   │     │ User     │
│      │     │          │     │ login    │     │ Pool     │
└──────┘     └──────────┘     └──────────┘     └──────────┘
                  │                 │
                  │  tokens         │  validate
                  │<────────────────│
                  │                 │
                  ▼                 │
           ┌──────────┐            │
           │ authStore │            │
           │ Zustand   │────────────┘
           │ persist   │  GET /auth/me
           └──────────┘
                  │
                  ▼
           ┌──────────┐
           │ AppShell  │
           │ Dashboard │
           └──────────┘
`)}

${h(3, "Navigation Architecture")}
<p>Navigation items are defined in <code>src/lib/appNav.ts</code> and filtered by the user's persona. Each nav item specifies which personas can see it.</p>

${h(3, "Container &amp; Deployment")}
<ul>
  <li>Container exposes port <strong>3000</strong></li>
  <li>Runs <code>npm run start</code> (Next.js production server)</li>
  <li>Requires outbound access to <code>NEXT_PUBLIC_API_BASE_URL</code></li>
  <li>Health check: <code>GET /api/health</code> → <code>{"status":"ok"}</code></li>
  <li>Stateless — no persistent storage needed</li>
</ul>
`;
}

function personasContent() {
  return `
${toc()}
${h(2, "Personas")}
<p>LeaseBase defines five user personas, three of which are currently active and two are planned for future releases.</p>

${h(3, "Active Personas")}

${h(4, "1. Property Manager (ORG_ADMIN / PM_STAFF)")}
${table(["Attribute", "Details"], [
  ["Backend Roles", "<code>ORG_ADMIN</code>, <code>PM_STAFF</code>"],
  ["Frontend Persona", "<code>propertyManager</code>"],
  ["Dashboard", "PMDashboard — Portfolio overview with KPIs, tasks, and maintenance"],
  ["Goals", "Manage properties, units, leases, tenants, maintenance, and payments across a portfolio"],
  ["Primary Workflows", "View occupancy metrics, review lease renewals, approve vendor invoices, manage work orders, run reports"],
])}

<p><strong>Available Navigation:</strong></p>
<ul>
  <li>Dashboard</li>
  <li>Properties</li>
  <li>Units</li>
  <li>Leases</li>
  <li>Tenants</li>
  <li>Payments</li>
  <li>Maintenance</li>
  <li>Messages</li>
  <li>Reports</li>
  <li>Settings</li>
</ul>

<p><strong>Dashboard Modules:</strong></p>
<ul>
  <li>KPI Grid: Properties count, Units count, Occupancy %, Revenue (MTD)</li>
  <li>Tasks &amp; Follow-ups: Lease renewals, vendor invoices, tenant complaints with priority badges</li>
  <li>Recent Maintenance: Work orders with status (In Progress, Scheduled, Completed)</li>
</ul>

${h(4, "2. Owner (OWNER)")}
${table(["Attribute", "Details"], [
  ["Backend Role", "<code>OWNER</code>"],
  ["Frontend Persona", "<code>owner</code>"],
  ["Dashboard", "OwnerDashboard — Income tracking, property performance, lease status"],
  ["Goals", "Track rental income, monitor property performance, review lease status"],
  ["Primary Workflows", "View income metrics, review property summaries, monitor lease renewals"],
])}

<p><strong>Available Navigation:</strong></p>
<ul>
  <li>Dashboard</li>
  <li>Properties</li>
  <li>Leases</li>
  <li>Payments</li>
  <li>Maintenance</li>
  <li>Messages</li>
  <li>Reports</li>
  <li>Settings</li>
</ul>

<p><strong>Dashboard Modules:</strong></p>
<ul>
  <li>KPI Grid: Monthly Income, YTD Income, Properties count</li>
  <li>Properties Summary: Property name, units, occupancy rate</li>
  <li>Lease Status: Tenant name, property, expiration, status (Active/Renewing)</li>
</ul>

${h(4, "3. Tenant (TENANT)")}
${table(["Attribute", "Details"], [
  ["Backend Role", "<code>TENANT</code>"],
  ["Frontend Persona", "<code>tenant</code>"],
  ["Dashboard", "TenantDashboard — Rent status, lease details, maintenance requests"],
  ["Goals", "Pay rent, submit and track maintenance requests, view lease documents"],
  ["Primary Workflows", "Check rent due date, make payments, submit maintenance requests, view messages"],
])}

<p><strong>Available Navigation:</strong></p>
<ul>
  <li>Dashboard</li>
  <li>Leases</li>
  <li>Payments</li>
  <li>Maintenance</li>
  <li>Messages</li>
  <li>Settings</li>
</ul>

<p><strong>Dashboard Modules:</strong></p>
<ul>
  <li>KPI Grid: Next Rent Due (amount + date), Lease End date, Open Requests count</li>
  <li>Rent Status: Current month, amount, due date with "Due soon" badge</li>
  <li>Maintenance Requests: Request title, submission date, status</li>
  <li>Messages: Recent messages from property management</li>
</ul>

${h(3, "Future Personas (Planned)")}

${h(4, "4. Agent")}
<p>Future persona for real estate agents managing showings and leads. Will have access to the <code>/app/showings</code> route.</p>

${h(4, "5. Vendor")}
<p>Future persona for vendors/contractors handling maintenance and repairs. Will have access to the <code>/app/vendor</code> route.</p>

${h(3, "Role Mapping")}
${table(["Backend Role", "Frontend Persona", "Description"], [
  ["<code>ORG_ADMIN</code>", "<code>propertyManager</code>", "Organization administrator (full PM access)"],
  ["<code>PM_STAFF</code>", "<code>propertyManager</code>", "Property management staff"],
  ["<code>OWNER</code>", "<code>owner</code>", "Property owner / landlord"],
  ["<code>TENANT</code>", "<code>tenant</code>", "Tenant / renter"],
  ["Unknown / null", "<code>tenant</code>", "Falls back to tenant (safe default with least privilege)"],
])}
`;
}

function authenticationContent() {
  return `
${toc()}
${h(2, "Authentication")}

${h(3, "Overview")}
<p>LeaseBase uses <strong>AWS Cognito</strong> for authentication. The frontend supports two auth modes:</p>
<ol>
  <li><strong>Cognito (Production)</strong> — Full OAuth/OIDC flow with the Cognito User Pool</li>
  <li><strong>Dev Bypass (Development only)</strong> — Mock auth that skips Cognito for local development</li>
</ol>

${h(3, "Auth Store")}
<p>Authentication state is managed by <code>authStore</code> (Zustand) and persisted to <code>localStorage</code> under the key <code>lb_auth_v1</code>.</p>

${table(["State Field", "Type", "Description"], [
  ["<code>mode</code>", "<code>cognito | devBypass | null</code>", "Current auth mode"],
  ["<code>accessToken</code>", "<code>string</code>", "Cognito access token (JWT)"],
  ["<code>idToken</code>", "<code>string</code>", "Cognito ID token"],
  ["<code>refreshToken</code>", "<code>string</code>", "Cognito refresh token"],
  ["<code>expiresAt</code>", "<code>number</code>", "Token expiration (epoch millis)"],
  ["<code>user</code>", "<code>CurrentUser</code>", "Authenticated user object with persona"],
  ["<code>devBypass</code>", "<code>DevBypassSession</code>", "Dev bypass session data"],
  ["<code>status</code>", "<code>AuthStatus</code>", "idle → initializing → authenticated | unauthenticated"],
])}

${h(3, "Auth Status Lifecycle")}
${code("text", `
  idle ──────────> initializing ──────────> authenticated
    │                    │                        │
    │  initializeFrom    │  loadMe() succeeds     │  logout()
    │  Storage()         │                        │
    │                    │                        ▼
    └──────────> unauthenticated <────────── unauthenticated
                     │
                     │  redirect to /auth/login?next=...
                     ▼
`)}

${h(3, "Login with Password (Cognito)")}
<ol>
  <li>User enters email and password on <code>/auth/login</code></li>
  <li>Frontend calls <code>POST /auth/login</code> with <code>{ email, password }</code></li>
  <li>Backend validates with Cognito and returns <code>{ accessToken, idToken, refreshToken, expiresIn }</code></li>
  <li>Tokens stored in authStore; <code>loadMe()</code> called to fetch user profile</li>
  <li><code>GET /auth/me</code> returns user data (id, orgId, email, name, role)</li>
  <li>Role mapped to persona via <code>mapUserRoleToPersona()</code></li>
  <li>User redirected to the <code>next</code> parameter (default: <code>/dashboard</code>)</li>
</ol>

${h(3, "Dev Bypass Login")}
${panel("warning", "Development Only", "<p>Dev bypass requires <code>NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true</code>. Must NEVER be enabled in production.</p>")}
<ol>
  <li>User selects role, enters email and org ID in the dev bypass section</li>
  <li>Frontend calls <code>authStore.loginDevBypass()</code> which sets the dev session</li>
  <li><code>loadMe()</code> is called with dev headers: <code>x-dev-user-email</code>, <code>x-dev-user-role</code>, <code>x-dev-org-id</code></li>
  <li>Backend returns user profile based on dev headers</li>
</ol>

${h(3, "Registration")}
<ol>
  <li>User navigates to <code>/auth/register</code></li>
  <li><strong>Step 1:</strong> Select user type (Property Manager, Owner, or Tenant)</li>
  <li><strong>Step 2:</strong> Fill registration form (first name, last name, email, password, confirm password)</li>
  <li>Frontend calls <code>POST /auth/register</code> with form data + selected <code>userType</code></li>
  <li>If user is auto-confirmed → redirect to login with success message</li>
  <li>If not confirmed → redirect to <code>/auth/verify-email?email=...</code></li>
</ol>

${h(3, "Email Verification")}
<ol>
  <li>User arrives at <code>/auth/verify-email</code> with email pre-filled from query param</li>
  <li>User enters the 6-digit verification code sent to their email</li>
  <li>Frontend calls <code>POST /auth/confirm-email</code> with <code>{ email, code }</code></li>
  <li>On success → redirect to login page with success message</li>
  <li>"Resend code" button calls <code>POST /auth/resend-confirmation</code></li>
</ol>

${h(3, "Route Guard")}
<p>The <code>useRequireAuth()</code> hook protects all pages under <code>/app/*</code>:</p>
<ul>
  <li>If auth status is <code>idle</code>: initializes from persisted storage</li>
  <li>If status is <code>initializing</code> and no user: calls <code>loadMe()</code></li>
  <li>If <code>loadMe()</code> fails: redirects to <code>/auth/login?next=...</code></li>
  <li>If status is <code>unauthenticated</code>: redirects to login</li>
</ul>

${h(3, "Logout")}
<p>Logout clears all tokens, user data, and dev bypass session from the auth store, setting status back to <code>unauthenticated</code>.</p>

${h(3, "API Authentication Headers")}
${table(["Mode", "Header", "Value"], [
  ["Cognito", "<code>Authorization</code>", "<code>Bearer {accessToken}</code>"],
  ["Dev Bypass", "<code>x-dev-user-email</code>", "User email"],
  ["Dev Bypass", "<code>x-dev-user-role</code>", "Role (ORG_ADMIN, PM_STAFF, OWNER, TENANT)"],
  ["Dev Bypass", "<code>x-dev-org-id</code>", "Organization ID"],
])}
`;
}

function userFlowsParentContent() {
  return `
${h(2, "User Flows")}
<p>This section documents the step-by-step click paths for every major workflow in LeaseBase Web. Each flow includes the starting point, user actions, system responses, and final state.</p>
<ul>
  <li><strong>Login Flow</strong> — All authentication entry paths</li>
  <li><strong>Registration Flow</strong> — Account creation process</li>
  <li><strong>Dashboard Flow</strong> — Persona-specific dashboard experiences</li>
  <li><strong>Navigation Flow</strong> — AppShell navigation and routing</li>
</ul>
`;
}

function loginFlowContent() {
  return `
${toc()}
${h(2, "Login Flow")}

${h(3, "Standard Login (Email + Password)")}
${code("text", `
User visits /auth/login (or /login alias)
  │
  ├─ Enter email address
  ├─ Enter password
  ├─ Click "Sign in"
  │    │
  │    ├─ [Success] POST /auth/login → tokens returned
  │    │    ├─ authStore updated with tokens
  │    │    ├─ GET /auth/me → user profile loaded
  │    │    ├─ Persona mapped from role
  │    │    └─ Redirect to /dashboard (or ?next= param)
  │    │
  │    └─ [Error] Error message displayed
  │         ├─ "Login failed" (generic)
  │         ├─ "Invalid credentials" (wrong password)
  │         └─ "User not confirmed" (needs verification)
  │
  ├─ Click "Social login (coming soon)"
  │    └─ Shows "Social login is not configured" error
  │
  ├─ Click "Verify your email or resend the code"
  │    └─ Navigate to /auth/verify-email?email=...
  │
  ├─ Click "Sign up"
  │    └─ Navigate to /auth/register
  │
  └─ [Dev mode] Dev bypass section visible
       ├─ Enter dev email (or leave default pm@example.com)
       ├─ Enter dev org ID
       ├─ Select role (ORG_ADMIN, PM_STAFF, OWNER, TENANT)
       ├─ Click "Sign in with dev bypass"
       │    ├─ [Success] authStore updated → loadMe() → redirect
       │    └─ [Error] Error message displayed
       └─ (Only visible when NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true)
`)}

${h(3, "Redirect After Login")}
<p>The login page reads the <code>next</code> query parameter to determine where to redirect after successful authentication. Default is <code>/dashboard</code>.</p>
<p>Example: <code>/auth/login?next=/app/properties</code> → after login, user goes to Properties page.</p>

${h(3, "Post-Registration Login")}
<p>When arriving from registration, the login page shows a success message:</p>
<ul>
  <li>Query param: <code>?registered=true&amp;message=...</code></li>
  <li>Green success banner appears above the form</li>
</ul>
`;
}

function registrationFlowContent() {
  return `
${toc()}
${h(2, "Registration Flow")}

${h(3, "Complete Click Path")}
${code("text", `
User visits /auth/register
  │
  ├─ STEP 1: User Type Selection
  │    │
  │    ├─ Click "Property Manager"
  │    │    └─ "Manage properties for multiple owners and landlords"
  │    │
  │    ├─ Click "Landlord / Owner"
  │    │    └─ "Own and rent out your properties"
  │    │
  │    └─ Click "Tenant"
  │         └─ "Rent a property and manage your lease"
  │
  │    → Advances to Step 2
  │
  ├─ STEP 2: Registration Form
  │    │
  │    ├─ "← Back" button returns to Step 1
  │    ├─ Shows "Signing up as {selected type}" badge
  │    │
  │    ├─ Enter First Name (required)
  │    ├─ Enter Last Name (required)
  │    ├─ Enter Email (required)
  │    ├─ Enter Password (min 8 chars, required)
  │    ├─ Enter Confirm Password (must match, required)
  │    │
  │    ├─ Click "Create account"
  │    │    │
  │    │    ├─ [Validation errors]
  │    │    │    ├─ "Please select a user type"
  │    │    │    ├─ "Passwords do not match"
  │    │    │    └─ "Password must be at least 8 characters"
  │    │    │
  │    │    ├─ POST /auth/register → Success
  │    │    │    │
  │    │    │    ├─ [userConfirmed: true]
  │    │    │    │    └─ Redirect to /auth/login?registered=true&message=...
  │    │    │    │
  │    │    │    └─ [userConfirmed: false]
  │    │    │         └─ Redirect to /auth/verify-email?email=...
  │    │    │
  │    │    └─ [API Error]
  │    │         └─ Display error message (e.g., "Email already exists")
  │    │
  │    └─ Click "Sign in" link
  │         └─ Navigate to /auth/login
`)}

${h(3, "Registration Payload")}
${code("json", `{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "PROPERTY_MANAGER"  // or "OWNER" or "TENANT"
}`)}
`;
}

function dashboardFlowContent() {
  return `
${toc()}
${h(2, "Dashboard Flow")}
<p>After authentication, users are routed to the AppShell at <code>/app</code>. The dashboard displayed depends on the user's persona.</p>

${h(3, "Dashboard Routing")}
${code("text", `
User authenticated → /app
  │
  ├─ persona === "propertyManager"
  │    └─ Render PMDashboard
  │         ├─ Portfolio Overview heading
  │         ├─ KPI Grid (4 cards)
  │         │    ├─ Properties: 12 (+2 this month)
  │         │    ├─ Units: 48 (3 vacant)
  │         │    ├─ Occupancy: 93% (+1.5%)
  │         │    └─ Revenue MTD: $34,200
  │         ├─ Tasks & Follow-ups list
  │         │    ├─ Review lease renewal — Unit 4B [Due in 3 days]
  │         │    ├─ Approve vendor invoice — ABC Plumbing [New]
  │         │    └─ Follow up on tenant complaint — Unit 2A [Overdue]
  │         └─ Recent Maintenance list
  │              ├─ Fix leaking faucet — Unit 3C [In progress]
  │              ├─ Replace HVAC filter — Building A [Scheduled]
  │              └─ Paint touch-up — Unit 1A [Completed]
  │
  ├─ persona === "owner"
  │    └─ Render OwnerDashboard
  │         ├─ Owner Dashboard heading
  │         ├─ KPI Grid (3 cards)
  │         │    ├─ Monthly income: $8,450
  │         │    ├─ YTD income: $25,350
  │         │    └─ Properties: 3 (All occupied)
  │         ├─ Properties Summary list
  │         └─ Lease Status list
  │
  └─ persona === "tenant" (or unknown)
       └─ Render TenantDashboard
            ├─ Tenant Dashboard heading
            ├─ KPI Grid (3 cards)
            │    ├─ Next rent due: $1,450
            │    ├─ Lease ends: Aug 2026
            │    └─ Open requests: 1
            ├─ Rent Status section
            ├─ Maintenance Requests list
            └─ Messages list
`)}
`;
}

function navigationFlowContent() {
  return `
${toc()}
${h(2, "Navigation Flow")}

${h(3, "AppShell Structure")}
<p>The authenticated application uses a shell layout (<code>app/app/layout.tsx</code>) with:</p>
<ul>
  <li><strong>Top bar</strong> — Logo, global search, notifications bell, user avatar + name, logout button</li>
  <li><strong>Sidebar</strong> — Persona-filtered navigation links (desktop: always visible; mobile: hamburger menu)</li>
  <li><strong>Breadcrumbs</strong> — Auto-generated from the current URL path</li>
  <li><strong>Main content</strong> — Page content with loading skeleton</li>
</ul>

${h(3, "Navigation Items by Persona")}
${table(["Nav Item", "Path", "PM", "Owner", "Tenant"], [
  ["Dashboard", "<code>/app</code>", "✅", "✅", "✅"],
  ["Properties", "<code>/app/properties</code>", "✅", "✅", "—"],
  ["Units", "<code>/app/units</code>", "✅", "—", "—"],
  ["Leases", "<code>/app/leases</code>", "✅", "✅", "✅"],
  ["Tenants", "<code>/app/tenants</code>", "✅", "—", "—"],
  ["Payments", "<code>/app/payments</code>", "✅", "✅", "✅"],
  ["Maintenance", "<code>/app/maintenance</code>", "✅", "✅", "✅"],
  ["Messages", "<code>/app/messages</code>", "✅", "✅", "✅"],
  ["Reports", "<code>/app/reports</code>", "✅", "✅", "—"],
  ["Settings", "<code>/app/settings</code>", "✅", "✅", "✅"],
])}

${h(3, "Mobile Navigation")}
${code("text", `
Mobile (< md breakpoint):
  ┌─────────────────────────┐
  │ [☰] Leasebase    [🔔][👤]│  ← Hamburger + top bar
  ├─────────────────────────┤
  │ Page content             │
  │                          │
  └─────────────────────────┘

  Click ☰ hamburger →
  ┌────────┬────────────────┐
  │ Nav    │ Dimmed         │
  │ Menu   │ backdrop       │
  │        │ (click to      │
  │ Items  │  close)        │
  │        │                │
  └────────┴────────────────┘

  Close: Click backdrop, press Escape, or navigate
`)}

${h(3, "Breadcrumb Generation")}
<p>Breadcrumbs are auto-generated from the URL path. Example:</p>
<ul>
  <li><code>/app</code> → (no breadcrumbs)</li>
  <li><code>/app/properties</code> → Home &gt; Properties</li>
  <li><code>/app/properties/abc123</code> → Home &gt; Properties &gt; Abc123</li>
</ul>

${h(3, "Loading State")}
<p>While authentication is being verified, the AppShell shows a skeleton loader with animated pulse placeholders for the heading, description, and stat cards.</p>
`;
}

function useCasesParentContent() {
  return `
${h(2, "Use Cases")}
<p>Each use case document follows a structured format: Title, Actors, Description, Preconditions, Main Flow, Alternate Flows, Error Conditions, Permissions, API Dependencies, and UI Screens.</p>
<ul>
  <li><strong>Authentication</strong> — Login, registration, verification, logout</li>
  <li><strong>Properties</strong> — View, create, and manage properties</li>
  <li><strong>Leases</strong> — View, create, and manage leases</li>
  <li><strong>Maintenance</strong> — Create and track maintenance requests/work orders</li>
  <li><strong>Payments</strong> — View payment history, make payments</li>
  <li><strong>Documents</strong> — Upload, download, and manage documents</li>
  <li><strong>Reporting</strong> — Generate and view reports</li>
</ul>
`;
}

function ucAuthContent() {
  return `
${toc()}
${h(2, "Use Cases: Authentication")}

${h(3, "UC-AUTH-01: User Login")}
${table(["Field", "Details"], [
  ["Title", "User Login"],
  ["Actors", "Any user (PM, Owner, Tenant)"],
  ["Description", "User authenticates with email and password to access the platform"],
  ["Preconditions", "User has a registered and verified account"],
  ["API Dependencies", "<code>POST /auth/login</code>, <code>GET /auth/me</code>"],
  ["UI Screen", "<code>/auth/login</code>"],
  ["Permissions", "Public (no auth required)"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>User navigates to <code>/auth/login</code></li>
  <li>User enters email and password</li>
  <li>User clicks "Sign in"</li>
  <li>System sends credentials to backend</li>
  <li>Backend returns tokens</li>
  <li>System loads user profile via <code>/auth/me</code></li>
  <li>System redirects to dashboard or <code>next</code> URL</li>
</ol>
<p><strong>Alternate Flows:</strong></p>
<ul>
  <li><strong>A1: Dev Bypass</strong> — In dev mode, user can select a role and bypass Cognito</li>
  <li><strong>A2: Social Login</strong> — Placeholder for future OIDC/social login</li>
  <li><strong>A3: Post-Registration</strong> — Shows success message from query params</li>
</ul>
<p><strong>Error Conditions:</strong></p>
<ul>
  <li>Invalid credentials → "Login failed" error message</li>
  <li>Unconfirmed account → User directed to verification</li>
  <li>Network failure → Generic error message</li>
</ul>

${h(3, "UC-AUTH-02: User Registration")}
${table(["Field", "Details"], [
  ["Title", "User Registration"],
  ["Actors", "New user"],
  ["Description", "New user creates an account by selecting user type and providing credentials"],
  ["Preconditions", "None"],
  ["API Dependencies", "<code>POST /auth/register</code>"],
  ["UI Screen", "<code>/auth/register</code>"],
  ["Permissions", "Public"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>User navigates to <code>/auth/register</code></li>
  <li>User selects user type (Property Manager, Owner, or Tenant)</li>
  <li>User fills in: first name, last name, email, password, confirm password</li>
  <li>User clicks "Create account"</li>
  <li>System validates locally (password match, length)</li>
  <li>System calls <code>POST /auth/register</code></li>
  <li>If user auto-confirmed: redirect to login with message</li>
  <li>If not confirmed: redirect to email verification</li>
</ol>
<p><strong>Error Conditions:</strong></p>
<ul>
  <li>Passwords don't match → "Passwords do not match"</li>
  <li>Password too short → "Password must be at least 8 characters"</li>
  <li>Email already exists → Backend error message</li>
  <li>Network failure → "Registration failed"</li>
</ul>

${h(3, "UC-AUTH-03: Email Verification")}
${table(["Field", "Details"], [
  ["Title", "Email Verification"],
  ["Actors", "Newly registered user"],
  ["Description", "User enters the 6-digit code sent to their email to verify their account"],
  ["Preconditions", "User has just registered and was redirected here"],
  ["API Dependencies", "<code>POST /auth/confirm-email</code>, <code>POST /auth/resend-confirmation</code>"],
  ["UI Screen", "<code>/auth/verify-email</code>"],
  ["Permissions", "Public"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>User lands on <code>/auth/verify-email?email=...</code></li>
  <li>Email is pre-filled from query parameter</li>
  <li>User enters 6-digit verification code</li>
  <li>User clicks "Verify email"</li>
  <li>System calls <code>POST /auth/confirm-email</code></li>
  <li>On success: redirect to login with success message</li>
</ol>
<p><strong>Alternate Flows:</strong></p>
<ul>
  <li><strong>A1: Resend Code</strong> — User clicks "Resend code", system calls <code>POST /auth/resend-confirmation</code>, shows success message</li>
  <li><strong>A2: Back to Login</strong> — User clicks "Back to sign in" link</li>
</ul>

${h(3, "UC-AUTH-04: Logout")}
${table(["Field", "Details"], [
  ["Title", "User Logout"],
  ["Actors", "Any authenticated user"],
  ["Description", "User signs out, clearing all session data"],
  ["Preconditions", "User is authenticated"],
  ["UI Screen", "Logout button in AppShell top bar"],
  ["Permissions", "Authenticated"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>User clicks the logout button (arrow icon) in the top bar</li>
  <li>System clears authStore (tokens, user, devBypass)</li>
  <li>Status set to <code>unauthenticated</code></li>
  <li>useRequireAuth hook detects unauthenticated → redirects to <code>/auth/login</code></li>
</ol>
`;
}

function ucPropertiesContent() {
  return `
${toc()}
${h(2, "Use Cases: Properties")}

${h(3, "UC-PROP-01: View Properties List")}
${table(["Field", "Details"], [
  ["Title", "View Properties List"],
  ["Actors", "Property Manager, Owner"],
  ["Description", "View a list of all properties in the portfolio"],
  ["Preconditions", "User is authenticated with PM or Owner role"],
  ["API Dependencies", "<code>GET /pm/properties</code>"],
  ["UI Screen", "<code>/app/properties</code>"],
  ["Permissions", "propertyManager, owner personas"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>User clicks "Properties" in the sidebar navigation</li>
  <li>System navigates to <code>/app/properties</code></li>
  <li>System fetches property list from API</li>
  <li>DataTable renders with property data</li>
</ol>
<p><strong>Alternate Flows:</strong></p>
<ul>
  <li><strong>A1: Empty State</strong> — No properties → "No data available" message</li>
  <li><strong>A2: Loading</strong> — Skeleton rows shown while loading</li>
  <li><strong>A3: Error</strong> — Red error banner with API error message</li>
</ul>

${h(3, "UC-PROP-02: View Property Detail")}
${table(["Field", "Details"], [
  ["Title", "View Property Detail"],
  ["Actors", "Property Manager, Owner"],
  ["Description", "View detailed information about a specific property including units"],
  ["Preconditions", "Property exists in the system"],
  ["API Dependencies", "<code>GET /pm/properties/{propertyId}</code>"],
  ["UI Screen", "<code>/app/properties/[propertyId]</code>"],
])}

${h(3, "UC-PROP-03: Create Property")}
${table(["Field", "Details"], [
  ["Title", "Create Property"],
  ["Actors", "Property Manager"],
  ["Description", "Add a new property to the portfolio"],
  ["Preconditions", "User has PM role with org admin privileges"],
  ["API Dependencies", "<code>POST /pm/properties</code>"],
  ["UI Screen", "<code>/app/properties</code> (inline modal)"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>User clicks "New Property" button on properties page</li>
  <li>Modal opens with property creation form</li>
  <li>User fills in property details (name, address, type, etc.)</li>
  <li>User clicks "Create"</li>
  <li>System calls API to create property</li>
  <li>On success: toast notification, modal closes, list refreshes</li>
</ol>
`;
}

function ucLeasesContent() {
  return `
${toc()}
${h(2, "Use Cases: Leases")}

${h(3, "UC-LEASE-01: View Leases List")}
${table(["Field", "Details"], [
  ["Title", "View Leases List"],
  ["Actors", "Property Manager, Owner, Tenant"],
  ["Description", "View all leases (PM/Owner: all managed leases; Tenant: own lease)"],
  ["API Dependencies", "<code>GET /pm/leases</code> or <code>GET /tenant/dashboard</code>"],
  ["UI Screen", "<code>/app/leases</code>"],
  ["Permissions", "propertyManager, owner, tenant"],
])}

${h(3, "UC-LEASE-02: Create Lease")}
${table(["Field", "Details"], [
  ["Title", "Create Lease"],
  ["Actors", "Property Manager"],
  ["Description", "Create a new lease for a unit, assigning a tenant"],
  ["API Dependencies", "<code>POST /pm/leases</code>"],
  ["UI Screen", "<code>/app/leases/new</code>"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>PM navigates to lease creation form</li>
  <li>Selects property and unit</li>
  <li>Enters tenant information</li>
  <li>Sets lease terms (start date, end date, monthly rent)</li>
  <li>Submits the form</li>
  <li>System creates lease and associated ledger</li>
</ol>

${h(3, "UC-LEASE-03: View Lease Detail")}
${table(["Field", "Details"], [
  ["Title", "View Lease Detail"],
  ["Actors", "Property Manager, Owner, Tenant"],
  ["Description", "View detailed lease information including terms and ledger"],
  ["API Dependencies", "<code>GET /pm/leases/{leaseId}</code>"],
  ["UI Screen", "<code>/app/leases/[leaseId]</code>"],
])}

${h(3, "UC-LEASE-04: View Lease Ledger")}
${table(["Field", "Details"], [
  ["Title", "View Lease Ledger"],
  ["Actors", "Property Manager"],
  ["Description", "View the financial ledger for a lease (charges, payments, credits, balance)"],
  ["API Dependencies", "<code>GET /pm/leases/{leaseId}/ledger</code>"],
  ["UI Screen", "<code>/app/leases/[leaseId]/ledger</code>"],
])}
`;
}

function ucMaintenanceContent() {
  return `
${toc()}
${h(2, "Use Cases: Maintenance")}

${h(3, "UC-MAINT-01: View Maintenance Requests")}
${table(["Field", "Details"], [
  ["Title", "View Maintenance / Work Orders"],
  ["Actors", "Property Manager, Owner, Tenant"],
  ["Description", "View list of maintenance requests or work orders"],
  ["API Dependencies", "<code>GET /pm/work-orders</code> or <code>GET /tenant/maintenance</code>"],
  ["UI Screen", "<code>/app/maintenance</code>"],
  ["Permissions", "All authenticated personas"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>User clicks "Maintenance" in sidebar</li>
  <li>System fetches work orders / maintenance requests</li>
  <li>List displays with title, status badges, and submission dates</li>
</ol>

${h(3, "UC-MAINT-02: Create Maintenance Request (Tenant)")}
${table(["Field", "Details"], [
  ["Title", "Create Maintenance Request"],
  ["Actors", "Tenant"],
  ["Description", "Tenant submits a new maintenance request with description and optional photo"],
  ["API Dependencies", "<code>POST /tenant/maintenance</code>"],
  ["UI Screen", "<code>/app/maintenance/new</code>"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>Tenant clicks "New Request" on maintenance page</li>
  <li>Fills in description, urgency level</li>
  <li>Optionally attaches photo(s)</li>
  <li>Submits request</li>
  <li>System creates work order in backend</li>
  <li>Toast notification confirms submission</li>
</ol>

${h(3, "UC-MAINT-03: View Work Order Detail")}
${table(["Field", "Details"], [
  ["Title", "View Work Order Detail"],
  ["Actors", "Property Manager, Owner, Tenant"],
  ["Description", "View detailed work order with status history and comments"],
  ["API Dependencies", "<code>GET /pm/work-orders/{workOrderId}</code>"],
  ["UI Screen", "<code>/app/maintenance/[workOrderId]</code>"],
])}

${h(3, "UC-MAINT-04: Update Work Order Status (PM)")}
${table(["Field", "Details"], [
  ["Title", "Update Work Order Status"],
  ["Actors", "Property Manager"],
  ["Description", "PM updates the status of a work order (Open → In Progress → Scheduled → Completed)"],
  ["API Dependencies", "<code>PATCH /pm/work-orders/{workOrderId}</code>"],
])}
`;
}

function ucPaymentsContent() {
  return `
${toc()}
${h(2, "Use Cases: Payments")}

${h(3, "UC-PAY-01: View Payment History")}
${table(["Field", "Details"], [
  ["Title", "View Payment History"],
  ["Actors", "Property Manager, Owner, Tenant"],
  ["Description", "View list of past payments with amounts, dates, and status"],
  ["API Dependencies", "<code>GET /tenant/payments</code>"],
  ["UI Screen", "<code>/app/payments</code>"],
  ["Permissions", "All authenticated personas"],
])}

${h(3, "UC-PAY-02: Make Payment (Tenant)")}
${table(["Field", "Details"], [
  ["Title", "Make Rent Payment"],
  ["Actors", "Tenant"],
  ["Description", "Tenant initiates a rent payment"],
  ["API Dependencies", "<code>POST /tenant/payments</code>"],
  ["UI Screen", "<code>/app/payments</code>"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>Tenant views current balance and next due date on dashboard</li>
  <li>Navigates to Payments page</li>
  <li>Clicks "Pay Rent" or similar action</li>
  <li>Confirms payment amount</li>
  <li>System processes payment via backend (Stripe integration)</li>
  <li>Success/failure confirmation displayed</li>
</ol>

${h(3, "UC-PAY-03: View Billing Summary (PM)")}
${table(["Field", "Details"], [
  ["Title", "View Billing Summary"],
  ["Actors", "Property Manager (ORG_ADMIN)"],
  ["Description", "View organization billing, plan details, and unit count"],
  ["API Dependencies", "<code>GET /pm/billing/summary</code>"],
  ["UI Screen", "<code>/app/settings</code> (billing section)"],
])}
`;
}

function ucDocumentsContent() {
  return `
${toc()}
${h(2, "Use Cases: Documents")}

${h(3, "UC-DOC-01: View Documents")}
${table(["Field", "Details"], [
  ["Title", "View Documents"],
  ["Actors", "Property Manager, Owner, Tenant"],
  ["Description", "View list of uploaded documents (leases, receipts, etc.)"],
  ["API Dependencies", "<code>GET /pm/documents</code> or <code>GET /tenant/documents</code>"],
  ["UI Screen", "<code>/app/documents</code>"],
])}

${h(3, "UC-DOC-02: Upload Document (PM)")}
${table(["Field", "Details"], [
  ["Title", "Upload Document"],
  ["Actors", "Property Manager"],
  ["Description", "Upload a document with a signed URL flow via the API"],
  ["API Dependencies", "<code>POST /pm/documents/upload-url</code>, then direct S3 upload"],
])}
<p><strong>Main Flow:</strong></p>
<ol>
  <li>PM clicks "Upload" on documents page</li>
  <li>Selects file from local filesystem</li>
  <li>System requests a signed upload URL from the API</li>
  <li>File uploaded directly to S3 via signed URL</li>
  <li>System confirms upload to the API</li>
  <li>Document appears in the list</li>
</ol>

${h(3, "UC-DOC-03: Download Document")}
${table(["Field", "Details"], [
  ["Title", "Download Document"],
  ["Actors", "Property Manager, Owner, Tenant"],
  ["Description", "Download a document via signed URL"],
  ["API Dependencies", "<code>GET /pm/documents/{docId}/download-url</code>"],
])}
`;
}

function ucReportingContent() {
  return `
${toc()}
${h(2, "Use Cases: Reporting")}

${h(3, "UC-RPT-01: View Reports Dashboard")}
${table(["Field", "Details"], [
  ["Title", "View Reports"],
  ["Actors", "Property Manager, Owner"],
  ["Description", "Access the reporting section with available reports"],
  ["UI Screen", "<code>/app/reports</code>"],
  ["Permissions", "propertyManager, owner"],
])}

${h(3, "UC-RPT-02: Run Financial Report")}
${table(["Field", "Details"], [
  ["Title", "Run Financial Report"],
  ["Actors", "Property Manager, Owner"],
  ["Description", "Generate a financial report for a date range"],
])}
<p><strong>Planned Report Types:</strong></p>
<ul>
  <li>Income statement by property</li>
  <li>Rent roll</li>
  <li>Delinquency report</li>
  <li>Occupancy report</li>
  <li>Maintenance cost summary</li>
</ul>
`;
}

function pageRefParentContent() {
  return `
${h(2, "Page Reference")}
<p>Detailed documentation for every page in the application, including URL route, purpose, components, actions, API calls, and permissions.</p>
`;
}

function prLoginPageContent() {
  return `
${toc()}
${h(2, "Page: Login")}

${table(["Attribute", "Value"], [
  ["Route", "<code>/auth/login</code> (also <code>/login</code> alias)"],
  ["Type", "Client component (<code>\"use client\"</code>)"],
  ["Auth Required", "No"],
  ["Source File", "<code>app/auth/login/page.tsx</code>"],
])}

${h(3, "Purpose")}
<p>Primary authentication entry point for all users. Supports email/password login, social login (placeholder), and a development-only bypass mode.</p>

${h(3, "Components &amp; Inputs")}
${table(["Element", "Type", "Required", "Description"], [
  ["Email", "Input (email)", "Yes", "User's email address"],
  ["Password", "Input (password)", "Yes", "User's password"],
  ["Sign in", "Button (submit)", "—", "Submits credentials"],
  ["Social login", "Button", "—", "Placeholder for OIDC login (shows error)"],
  ["Verify email link", "Button/link", "—", "Navigates to email verification"],
  ["Sign up link", "Link", "—", "Navigates to <code>/auth/register</code>"],
  ["Dev email", "Input (email)", "No", "Dev bypass email (dev mode only)"],
  ["Dev org ID", "Input (text)", "No", "Dev bypass org ID (dev mode only)"],
  ["Dev role", "Select", "No", "Role selector: ORG_ADMIN, PM_STAFF, OWNER, TENANT"],
  ["Dev bypass button", "Button", "—", "Signs in via dev bypass (dev mode only)"],
])}

${h(3, "Query Parameters")}
${table(["Param", "Description"], [
  ["<code>next</code>", "URL to redirect to after login (default: <code>/dashboard</code>)"],
  ["<code>registered</code>", "If <code>true</code>, shows registration success message"],
  ["<code>message</code>", "URL-encoded success/info message to display"],
])}

${h(3, "API Calls")}
<ul>
  <li><code>POST /auth/login</code> — Standard login</li>
  <li><code>GET /auth/me</code> — Load user profile after login</li>
</ul>

${h(3, "Error States")}
<ul>
  <li>Invalid credentials → red error text</li>
  <li>Social login not configured → error message</li>
  <li>Dev bypass failure → error text</li>
</ul>
`;
}

function prRegisterPageContent() {
  return `
${toc()}
${h(2, "Page: Registration")}

${table(["Attribute", "Value"], [
  ["Route", "<code>/auth/register</code>"],
  ["Type", "Client component"],
  ["Auth Required", "No"],
  ["Source File", "<code>app/auth/register/page.tsx</code>"],
])}

${h(3, "Purpose")}
<p>Two-step registration flow. Step 1: user type selection. Step 2: account details form.</p>

${h(3, "Step 1: User Type Selection")}
${table(["Option", "Value", "Description"], [
  ["Property Manager", "<code>PROPERTY_MANAGER</code>", "Manage properties for multiple owners"],
  ["Landlord / Owner", "<code>OWNER</code>", "Own and rent out properties"],
  ["Tenant", "<code>TENANT</code>", "Rent a property and manage lease"],
])}

${h(3, "Step 2: Registration Form")}
${table(["Field", "Type", "Validation"], [
  ["First Name", "Text", "Required"],
  ["Last Name", "Text", "Required"],
  ["Email", "Email", "Required, valid email"],
  ["Password", "Password", "Required, min 8 characters"],
  ["Confirm Password", "Password", "Must match password"],
])}

${h(3, "API Calls")}
<ul>
  <li><code>POST /auth/register</code> — Body: <code>{ email, password, firstName, lastName, userType }</code></li>
</ul>

${h(3, "Navigation")}
<ul>
  <li>"← Back" button returns from Step 2 to Step 1</li>
  <li>"Sign in" link navigates to <code>/auth/login</code></li>
  <li>On success: redirects to <code>/auth/verify-email</code> or <code>/auth/login</code></li>
</ul>
`;
}

function prVerifyEmailContent() {
  return `
${toc()}
${h(2, "Page: Email Verification")}

${table(["Attribute", "Value"], [
  ["Route", "<code>/auth/verify-email</code>"],
  ["Type", "Client component"],
  ["Auth Required", "No"],
  ["Source File", "<code>app/auth/verify-email/page.tsx</code>"],
])}

${h(3, "Purpose")}
<p>Allows newly registered users to enter their email verification code (6-digit) to confirm their account.</p>

${h(3, "Components")}
${table(["Element", "Type", "Description"], [
  ["Email", "Input (email)", "Pre-filled from <code>?email=</code> query param"],
  ["Verification code", "Input (text)", "6-digit code, wide letter-spacing"],
  ["Verify email", "Button (submit)", "Submits the code"],
  ["Resend code", "Button", "Requests a new verification code"],
  ["Back to sign in", "Link", "Returns to <code>/auth/login</code>"],
])}

${h(3, "API Calls")}
<ul>
  <li><code>POST /auth/confirm-email</code> — Body: <code>{ email, code }</code></li>
  <li><code>POST /auth/resend-confirmation</code> — Body: <code>{ email }</code></li>
</ul>
`;
}

function prDashboardContent() {
  return `
${toc()}
${h(2, "Page: Dashboard")}

${table(["Attribute", "Value"], [
  ["Route", "<code>/app</code>"],
  ["Type", "Client component"],
  ["Auth Required", "Yes (via AppShell useRequireAuth)"],
  ["Source File", "<code>app/app/page.tsx</code>"],
])}

${h(3, "Purpose")}
<p>Persona-aware dashboard that renders a different component based on the user's role.</p>

${h(3, "Dashboard Variants")}
${table(["Persona", "Component", "Key Sections"], [
  ["propertyManager", "<code>PMDashboard</code>", "Portfolio KPIs (4 cards), Tasks list, Recent Maintenance list"],
  ["owner", "<code>OwnerDashboard</code>", "Income KPIs (3 cards), Properties Summary, Lease Status"],
  ["tenant", "<code>TenantDashboard</code>", "Rent/Lease KPIs (3 cards), Rent Status, Maintenance, Messages"],
  ["unknown/fallback", "<code>TenantDashboard</code>", "Safe fallback with least privilege"],
])}

${h(3, "PM Dashboard KPIs")}
${table(["Metric", "Example Value", "Trend"], [
  ["Properties", "12", "+2 this month"],
  ["Units", "48", "3 vacant"],
  ["Occupancy", "93%", "+1.5% vs last month"],
  ["Revenue (MTD)", "$34,200", "On track"],
])}

${h(3, "Owner Dashboard KPIs")}
${table(["Metric", "Example Value", "Trend"], [
  ["Monthly Income", "$8,450", "+$200 vs last month"],
  ["YTD Income", "$25,350", "On pace"],
  ["Properties", "3", "All occupied"],
])}

${h(3, "Tenant Dashboard KPIs")}
${table(["Metric", "Example Value", "Trend"], [
  ["Next Rent Due", "$1,450", "Due Mar 1, 2026"],
  ["Lease Ends", "Aug 2026", "7 months remaining"],
  ["Open Requests", "1", "1 in progress"],
])}
`;
}

function prAppShellContent() {
  return `
${toc()}
${h(2, "Page: AppShell Layout")}

${table(["Attribute", "Value"], [
  ["Route", "<code>/app/*</code> (layout wrapper)"],
  ["Type", "Client component"],
  ["Auth Required", "Yes"],
  ["Source File", "<code>app/app/layout.tsx</code>"],
])}

${h(3, "Purpose")}
<p>The authenticated application shell that wraps all <code>/app/*</code> pages. Provides the sidebar navigation, top bar, breadcrumbs, and toast notification system.</p>

${h(3, "Top Bar Elements")}
${table(["Element", "Description"], [
  ["Hamburger (mobile)", "Opens/closes mobile sidebar drawer"],
  ["Logo + Brand", "\"LB\" icon + \"Leasebase\" text, links to <code>/app</code>"],
  ["Global Search", "Search input (desktop only, placeholder)"],
  ["Notifications", "Bell icon button (placeholder)"],
  ["User Avatar", "Circle with first letter of user's name"],
  ["User Name + Role", "Displayed on desktop, truncated"],
  ["Logout Button", "Arrow icon, calls <code>authStore.logout()</code>"],
])}

${h(3, "Sidebar Navigation")}
<p>The sidebar renders navigation items filtered by the current user's persona via <code>filterNavForPersona()</code>. Each item shows an icon and label. The active item is highlighted.</p>

${h(3, "Accessibility Features")}
<ul>
  <li>"Skip to main content" link for keyboard users</li>
  <li><code>aria-label</code> on navigation regions</li>
  <li><code>aria-current="page"</code> on active nav item</li>
  <li><code>aria-expanded</code> on hamburger button</li>
  <li>Escape key closes mobile sidebar</li>
  <li>Focus management when mobile sidebar opens/closes</li>
</ul>
`;
}

function permissionsMatrixContent() {
  return `
${toc()}
${h(2, "Permissions Matrix")}

${h(3, "Navigation Access")}
${table(["Feature / Page", "PM (ORG_ADMIN)", "PM Staff", "Owner", "Tenant", "Agent*", "Vendor*"], [
  ["Dashboard", "✅", "✅", "✅", "✅", "—", "—"],
  ["Properties", "✅", "✅", "✅", "—", "—", "—"],
  ["Units", "✅", "✅", "—", "—", "—", "—"],
  ["Leases", "✅", "✅", "✅", "✅", "—", "—"],
  ["Tenants", "✅", "✅", "—", "—", "—", "—"],
  ["Payments", "✅", "✅", "✅", "✅", "—", "—"],
  ["Maintenance", "✅", "✅", "✅", "✅", "—", "—"],
  ["Messages", "✅", "✅", "✅", "✅", "—", "—"],
  ["Reports", "✅", "✅", "✅", "—", "—", "—"],
  ["Settings", "✅", "✅", "✅", "✅", "—", "—"],
  ["Showings*", "—", "—", "—", "—", "✅", "—"],
  ["Vendor Portal*", "—", "—", "—", "—", "—", "✅"],
])}
<p><em>* Agent and Vendor are future personas. Their nav items are defined but hidden (<code>isFuture: true</code>).</em></p>

${h(3, "Authentication Endpoints")}
${table(["Endpoint", "Auth Required", "Notes"], [
  ["<code>/auth/login</code>", "No", "Public login page"],
  ["<code>/auth/register</code>", "No", "Public registration"],
  ["<code>/auth/verify-email</code>", "No", "Public email verification"],
  ["<code>/auth/callback</code>", "No", "OAuth callback handler"],
  ["<code>/app/*</code>", "Yes", "Protected by useRequireAuth hook"],
])}

${h(3, "Route Guard Behavior")}
<ul>
  <li>The <code>useRequireAuth()</code> hook runs on every <code>/app/*</code> page load</li>
  <li>Unauthenticated users are redirected to <code>/auth/login?next={currentPath}</code></li>
  <li>Navigation items are filtered client-side by persona — unauthorized navigation items simply don't appear</li>
  <li>The API client (<code>apiRequest</code>) handles 401/403 responses by calling <code>logout("unauthorized")</code></li>
</ul>

${h(3, "API Authorization")}
<p>The <code>apiRequest()</code> function in <code>src/lib/api/client.ts</code> automatically attaches authorization headers based on the auth mode. If the API returns 401 or 403, the client triggers a forced logout.</p>
`;
}

function errorHandlingContent() {
  return `
${toc()}
${h(2, "Error Handling")}

${h(3, "Client-Side Error States")}
${table(["Error Type", "Location", "Behavior", "Recovery"], [
  ["Login failure", "Login page", "Red error text above form", "User can retry"],
  ["Registration failure", "Register page", "Red error text above form", "User can correct and retry"],
  ["Password mismatch", "Register page", "Inline validation error", "User corrects password"],
  ["Password too short", "Register page", "Inline validation error", "User enters longer password"],
  ["Verification failure", "Verify email page", "Red error text", "User can resend code"],
  ["Social login not configured", "Login page", "Error message displayed", "Use email/password instead"],
  ["Session expired", "Any /app/* page", "Redirect to login", "User re-authenticates"],
  ["API 401/403", "Any page with API calls", "Forced logout + redirect to login", "User re-authenticates"],
  ["API error (generic)", "Any data page", "Red error banner in DataTable", "User can refresh"],
  ["Empty data", "Any data page", "\"No data available\" message", "Normal state"],
  ["OAuth callback error", "Callback page", "Error message displayed", "User can retry login"],
])}

${h(3, "API Error Handling")}
<p>The <code>apiRequest()</code> client in <code>src/lib/api/client.ts</code> handles errors as follows:</p>
<ol>
  <li>HTTP 401/403 → calls <code>authStore.logout("unauthorized")</code> and throws "Unauthorized"</li>
  <li>Non-JSON response → returns raw text to caller</li>
  <li>JSON error response → parsed and thrown as an Error</li>
</ol>

${h(3, "Auth Store Error Recovery")}
<p>If <code>loadMe()</code> fails (e.g., expired token, network error), the auth store:</p>
<ol>
  <li>Clears all stored state (tokens, user, devBypass)</li>
  <li>Sets status to <code>unauthenticated</code></li>
  <li>Re-throws the error so the caller can handle navigation</li>
</ol>

${h(3, "Token Expiration")}
<p>On app initialization (<code>initializeFromStorage</code>), the auth store checks if the access token has expired by comparing <code>expiresAt</code> with <code>Date.now()</code>. If expired, all auth state is cleared.</p>

${h(3, "Network Error Handling")}
<p>All API calls use try/catch with error messages extracted from the response body when available. When the response is not JSON (e.g., HTML error page), the raw text is used or a fallback message is shown.</p>
`;
}

function apiIntegrationContent() {
  return `
${toc()}
${h(2, "API Integration")}

${h(3, "Base URL Configuration")}
<p>The API base URL is configured via <code>NEXT_PUBLIC_API_BASE_URL</code>. The <code>getApiBaseUrl()</code> function handles URL resolution:</p>
<ul>
  <li>If env var is set: uses it as-is (with normalization)</li>
  <li>If not set (client-side): defaults to <code>{window.location.origin}/api</code></li>
  <li>If same origin: auto-prepends <code>/api</code> path prefix</li>
  <li>Trailing slashes are stripped</li>
</ul>

${h(3, "API Client")}
<p>The typed API client lives in <code>src/lib/api/client.ts</code>. It provides a <code>apiRequest&lt;T&gt;()</code> function that:</p>
<ol>
  <li>Builds the full URL from base URL + relative path</li>
  <li>Attaches auth headers automatically (unless <code>anonymous: true</code>)</li>
  <li>Handles 401/403 with forced logout</li>
  <li>Parses JSON response (or returns raw text)</li>
</ol>

${h(3, "Backend API Endpoints")}
${table(["Endpoint", "Method", "Description", "Used By"], [
  ["<code>/auth/login</code>", "POST", "Authenticate with email/password", "Login page"],
  ["<code>/auth/me</code>", "GET", "Get current user profile", "Auth store (loadMe)"],
  ["<code>/auth/register</code>", "POST", "Register new user", "Registration page"],
  ["<code>/auth/confirm-email</code>", "POST", "Verify email with code", "Verify email page"],
  ["<code>/auth/resend-confirmation</code>", "POST", "Resend verification code", "Verify email page"],
  ["<code>/pm/dashboard</code>", "GET", "PM dashboard data", "PM Dashboard"],
  ["<code>/pm/properties</code>", "GET", "List properties", "Properties page"],
  ["<code>/pm/leases</code>", "GET", "List leases", "Leases page"],
  ["<code>/pm/work-orders</code>", "GET", "List work orders", "Maintenance page (PM)"],
  ["<code>/pm/documents</code>", "GET", "List documents", "Documents page (PM)"],
  ["<code>/pm/settings/org</code>", "GET", "Organization settings", "Settings page"],
  ["<code>/pm/billing/summary</code>", "GET", "Billing summary", "Billing page"],
  ["<code>/tenant/dashboard</code>", "GET", "Tenant dashboard data", "Tenant Dashboard"],
  ["<code>/tenant/payments</code>", "GET", "Tenant payments", "Payments page (Tenant)"],
  ["<code>/tenant/maintenance</code>", "GET", "Tenant maintenance requests", "Maintenance page (Tenant)"],
  ["<code>/tenant/documents</code>", "GET", "Tenant documents", "Documents page (Tenant)"],
])}

${h(3, "OpenAPI Spec")}
<p>A placeholder OpenAPI spec exists at <code>openapi/openapi.json</code>. When the real backend spec is available, run:</p>
${code("bash", "npm run api:generate")}
<p>This generates a typed client into <code>src/lib/api/generated/</code>.</p>

${h(3, "Request Headers")}
${table(["Header", "When Sent", "Value"], [
  ["<code>Authorization</code>", "Cognito mode", "<code>Bearer {accessToken}</code>"],
  ["<code>x-dev-user-email</code>", "Dev bypass mode", "User email"],
  ["<code>x-dev-user-role</code>", "Dev bypass mode", "Role string"],
  ["<code>x-dev-org-id</code>", "Dev bypass mode", "Org ID"],
  ["<code>Content-Type</code>", "POST/PUT/PATCH", "<code>application/json</code>"],
])}

${h(3, "Health Check")}
<p><code>GET /api/health</code> returns <code>{ "status": "ok" }</code> for container health monitoring.</p>
`;
}

function designSystemContent() {
  return `
${toc()}
${h(2, "Design System &amp; UI Components")}

${h(3, "Brand Colors")}
${table(["Token", "Hex", "Usage"], [
  ["brand-500", "#10b981", "Primary actions, active states, focus rings"],
  ["brand-600", "#059669", "Primary hover"],
  ["brand-400", "#34d399", "Active nav text, links"],
  ["slate-950", "#020617", "Page background"],
  ["slate-900", "#0f172a", "Card/input backgrounds"],
  ["slate-800", "#1e293b", "Borders, dividers"],
  ["success", "#10b981", "Positive status"],
  ["warning", "#f59e0b", "Caution status"],
  ["danger", "#ef4444", "Error/destructive"],
  ["info", "#3b82f6", "Informational"],
])}

${h(3, "Typography")}
<ul>
  <li><strong>Font family:</strong> Inter, system-ui fallback</li>
  <li><strong>Scale:</strong> text-xs (12px) through text-3xl (30px)</li>
  <li><strong>Weights:</strong> 400 (normal), 500 (medium), 600 (semibold), 700 (bold)</li>
</ul>

${h(3, "Component Inventory")}
<p>All components are in <code>src/components/ui/</code> and exported from the barrel file <code>src/components/ui/index.ts</code>.</p>

${h(4, "Button")}
<ul>
  <li><strong>Variants:</strong> primary, secondary, ghost, danger</li>
  <li><strong>Sizes:</strong> sm, md, lg</li>
  <li><strong>States:</strong> default, hover, disabled, loading (spinner animation)</li>
  <li><strong>Props:</strong> variant, size, loading, icon, disabled</li>
</ul>

${h(4, "Input")}
<ul>
  <li><strong>Props:</strong> label, error, helperText</li>
  <li>Shows red border on error, with error message below</li>
  <li>Accessible: <code>aria-invalid</code>, <code>aria-describedby</code></li>
</ul>

${h(4, "Select")}
<ul>
  <li>Same pattern as Input</li>
  <li><strong>Props:</strong> label, error, helperText</li>
</ul>

${h(4, "Checkbox")}
<ul>
  <li>Custom styled checkbox with label</li>
  <li>Auto-generated IDs for label association</li>
</ul>

${h(4, "Switch")}
<ul>
  <li>Toggle switch with <code>role="switch"</code></li>
  <li><code>aria-checked</code> for accessibility</li>
</ul>

${h(4, "Badge")}
<ul>
  <li><strong>Variants:</strong> success, warning, danger, info, neutral</li>
  <li>Pill-shaped with colored border and background</li>
</ul>

${h(4, "Card / CardHeader / CardBody / CardFooter")}
<ul>
  <li>Composable card with slot components</li>
  <li>Dark theme with slate border</li>
</ul>

${h(4, "DataTable")}
<ul>
  <li>Generic table with configurable columns</li>
  <li><strong>States:</strong> loading (skeleton rows), error (red banner), empty (message)</li>
  <li>Built-in client-side pagination</li>
</ul>

${h(4, "Modal")}
<ul>
  <li>Portal-rendered dialog</li>
  <li>Focus trap and Escape-to-close</li>
  <li>Backdrop click to dismiss</li>
  <li>Restores previous focus on close</li>
</ul>

${h(4, "Toast / ToastProvider / useToast")}
<ul>
  <li>Context-based toast notification system</li>
  <li><strong>Variants:</strong> success, error, info</li>
  <li>Auto-dismiss with configurable duration</li>
  <li>Bottom-right positioning</li>
</ul>

${h(4, "Tooltip")}
<ul>
  <li>Hover/focus triggered</li>
  <li>Accessible via <code>aria-describedby</code></li>
</ul>

${h(4, "PageHeader")}
<ul>
  <li>Title + description + optional action buttons</li>
  <li>Responsive layout</li>
</ul>

${h(4, "Icon")}
<ul>
  <li>Maps string keys to Lucide React icons</li>
  <li>Keys: dashboard, properties, units, leases, tenants, payments, maintenance, messages, reports, settings, showings, vendor</li>
</ul>

${h(4, "StatCard")}
<ul>
  <li>Dashboard metric card</li>
  <li>Label, large value, trend text, and optional icon</li>
  <li>Includes skeleton variant for loading state</li>
</ul>
`;
}

function testingScenariosContent() {
  return `
${toc()}
${h(2, "Testing Scenarios")}

${h(3, "Test Infrastructure")}
${table(["Tool", "Purpose", "Command"], [
  ["Jest", "Unit and component testing", "<code>npm test</code>"],
  ["Testing Library", "React component rendering and interaction", "via Jest"],
  ["Playwright", "End-to-end browser testing", "<code>npm run test:e2e</code>"],
])}

${h(3, "Existing Test Coverage")}

${h(4, "Unit Tests")}
${table(["Test File", "What It Tests"], [
  ["<code>Button.test.tsx</code>", "Button component rendering and variants"],
  ["<code>Input.test.tsx</code>", "Input component with labels, errors, and helper text"],
  ["<code>DataTable.empty.test.tsx</code>", "DataTable empty state rendering"],
  ["<code>Login.mockAuth.test.tsx</code>", "Login page with mocked authentication"],
  ["<code>VerifyEmail.flow.test.tsx</code>", "Email verification flow"],
  ["<code>pmDashboard.loading.test.tsx</code>", "PM Dashboard loading states"],
  ["<code>appNav.test.ts</code>", "Navigation filtering by persona"],
  ["<code>roles.guard.test.ts</code>", "Role-to-persona mapping logic"],
  ["<code>session.mock.test.ts</code>", "Session/auth store mocking"],
  ["<code>apiHeaders.test.ts</code>", "API request header attachment"],
])}

${h(4, "E2E Tests")}
${table(["Test File", "What It Tests"], [
  ["<code>smoke.spec.ts</code>", "Basic smoke test — app loads and key routes are accessible"],
])}

${h(3, "Recommended Test Scenarios")}

${h(4, "Authentication")}
<ul>
  <li>Successful login with valid credentials</li>
  <li>Login with invalid credentials shows error</li>
  <li>Login redirect preserves <code>next</code> parameter</li>
  <li>Dev bypass login creates proper session</li>
  <li>Logout clears all state and redirects</li>
  <li>Expired token triggers re-authentication</li>
  <li>Registration with all user types</li>
  <li>Registration validation (password mismatch, too short)</li>
  <li>Email verification success and failure</li>
  <li>Resend verification code</li>
</ul>

${h(4, "Navigation")}
<ul>
  <li>PM sees all 10 nav items</li>
  <li>Owner sees 8 nav items (no Units, no Tenants)</li>
  <li>Tenant sees 6 nav items</li>
  <li>Active nav item is highlighted</li>
  <li>Mobile sidebar opens and closes</li>
  <li>Escape key closes mobile sidebar</li>
  <li>Breadcrumbs reflect current path</li>
</ul>

${h(4, "Dashboard")}
<ul>
  <li>PM sees PMDashboard with 4 KPI cards</li>
  <li>Owner sees OwnerDashboard with 3 KPI cards</li>
  <li>Tenant sees TenantDashboard with 3 KPI cards</li>
  <li>Unknown persona falls back to TenantDashboard</li>
  <li>Loading skeleton appears during auth check</li>
</ul>

${h(4, "Error States")}
<ul>
  <li>API 401 triggers forced logout</li>
  <li>API 403 triggers forced logout</li>
  <li>Network failure shows error message</li>
  <li>DataTable error state renders correctly</li>
  <li>DataTable empty state renders correctly</li>
</ul>
`;
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLISH ORCHESTRATION
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 LeaseBase Web → Confluence Documentation Publisher\n");
  console.log(`   Space: ${SPACE_KEY}`);
  console.log(`   Target: ${BASE_URL}\n`);

  // 1. Root page
  console.log("📄 Publishing root page...");
  const root = await upsertPage("LeaseBase Web Documentation", rootPageContent());
  if (!root) { console.error("Failed to create root page. Aborting."); process.exit(1); }
  const rootId = root.id;

  // 2. Top-level pages
  console.log("\n📄 Publishing top-level pages...");
  const overview = await upsertPage("LB - Overview", overviewContent(), rootId);
  const arch = await upsertPage("LB - System Architecture", systemArchitectureContent(), rootId);
  const personas = await upsertPage("LB - Personas", personasContent(), rootId);
  const auth = await upsertPage("LB - Authentication", authenticationContent(), rootId);

  // 3. User Flows section
  console.log("\n📄 Publishing User Flows...");
  const ufParent = await upsertPage("LB - User Flows", userFlowsParentContent(), rootId);
  const ufId = ufParent?.id;
  if (ufId) {
    await upsertPage("LB - Login Flow", loginFlowContent(), ufId);
    await upsertPage("LB - Registration Flow", registrationFlowContent(), ufId);
    await upsertPage("LB - Dashboard Flow", dashboardFlowContent(), ufId);
    await upsertPage("LB - Navigation Flow", navigationFlowContent(), ufId);
  }

  // 4. Use Cases section
  console.log("\n📄 Publishing Use Cases...");
  const ucParent = await upsertPage("LB - Use Cases", useCasesParentContent(), rootId);
  const ucId = ucParent?.id;
  if (ucId) {
    await upsertPage("LB - UC Authentication", ucAuthContent(), ucId);
    await upsertPage("LB - UC Properties", ucPropertiesContent(), ucId);
    await upsertPage("LB - UC Leases", ucLeasesContent(), ucId);
    await upsertPage("LB - UC Maintenance", ucMaintenanceContent(), ucId);
    await upsertPage("LB - UC Payments", ucPaymentsContent(), ucId);
    await upsertPage("LB - UC Documents", ucDocumentsContent(), ucId);
    await upsertPage("LB - UC Reporting", ucReportingContent(), ucId);
  }

  // 5. Page Reference section
  console.log("\n📄 Publishing Page Reference...");
  const prParent = await upsertPage("LB - Page Reference", pageRefParentContent(), rootId);
  const prId = prParent?.id;
  if (prId) {
    await upsertPage("LB - Page Login", prLoginPageContent(), prId);
    await upsertPage("LB - Page Registration", prRegisterPageContent(), prId);
    await upsertPage("LB - Page Email Verification", prVerifyEmailContent(), prId);
    await upsertPage("LB - Page Dashboard", prDashboardContent(), prId);
    await upsertPage("LB - Page AppShell Layout", prAppShellContent(), prId);
  }

  // 6. Remaining top-level pages
  console.log("\n📄 Publishing remaining pages...");
  await upsertPage("LB - Permissions Matrix", permissionsMatrixContent(), rootId);
  await upsertPage("LB - Error Handling", errorHandlingContent(), rootId);
  await upsertPage("LB - API Integration", apiIntegrationContent(), rootId);
  await upsertPage("LB - Design System and UI Components", designSystemContent(), rootId);
  await upsertPage("LB - Testing Scenarios", testingScenariosContent(), rootId);

  // ── Summary ──────────────────────────────────────────────────────────────
  const total = stats.created + stats.updated;
  console.log("\n" + "═".repeat(60));
  console.log("📊 PUBLISH SUMMARY");
  console.log("═".repeat(60));
  console.log(`   Pages created:  ${stats.created}`);
  console.log(`   Pages updated:  ${stats.updated}`);
  console.log(`   Errors:         ${stats.errors}`);
  console.log(`   Total pages:    ${total}`);
  console.log(`   Space key:      ${SPACE_KEY}`);
  console.log(`   Root page:      ${BASE_URL}/spaces/${SPACE_KEY}/pages/${rootId}`);
  console.log("═".repeat(60));
  console.log("\n✅ Done.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
