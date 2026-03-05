#!/usr/bin/env node
/**
 * publish-confluence-docs.mjs
 *
 * Creates or updates Confluence pages for the LeaseBase Design System.
 * Reads env vars: CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL,
 *   CONFLUENCE_API_TOKEN, CONFLUENCE_SPACE_KEY
 *
 * Usage:  node scripts/publish-confluence-docs.mjs
 *         npm run docs:confluence
 *
 * This script is idempotent — it searches for existing pages by title
 * and updates them in-place instead of creating duplicates.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Load env ────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const BASE_URL = process.env.CONFLUENCE_BASE_URL;
const EMAIL = process.env.CONFLUENCE_EMAIL;
const TOKEN = process.env.CONFLUENCE_API_TOKEN;
const SPACE_KEY = process.env.CONFLUENCE_SPACE_KEY;

if (!BASE_URL || !EMAIL || !TOKEN || !SPACE_KEY) {
  console.error("✗ Missing Confluence env vars. Need: CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN, CONFLUENCE_SPACE_KEY");
  process.exit(1);
}

const AUTH = Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");
const HEADERS = {
  Authorization: `Basic ${AUTH}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ── API helpers ─────────────────────────────────────────────────────
async function confluenceGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function confluencePost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function confluencePut(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Find a page by exact title in the space. Returns null or { id, version } */
async function findPage(title) {
  const encoded = encodeURIComponent(title);
  const data = await confluenceGet(
    `/rest/api/content?spaceKey=${SPACE_KEY}&title=${encoded}&type=page&expand=version`,
  );
  const match = data.results?.[0];
  if (!match) return null;
  return { id: match.id, version: match.version.number, title: match.title };
}

/** Create or update a page. Returns the page id. */
async function upsertPage(title, htmlBody, parentId = null) {
  const existing = await findPage(title);

  if (existing) {
    console.log(`  ↻ Updating "${title}" (id=${existing.id}, v${existing.version} → v${existing.version + 1})`);
    const body = {
      type: "page",
      title,
      version: { number: existing.version + 1 },
      body: { storage: { value: htmlBody, representation: "storage" } },
    };
    const updated = await confluencePut(`/rest/api/content/${existing.id}`, body);
    return updated.id;
  }

  console.log(`  + Creating "${title}"`);
  const body = {
    type: "page",
    title,
    space: { key: SPACE_KEY },
    body: { storage: { value: htmlBody, representation: "storage" } },
  };
  if (parentId) {
    body.ancestors = [{ id: parentId }];
  }
  const created = await confluencePost("/rest/api/content", body);
  return created.id;
}

// ── Read token files for content ────────────────────────────────────
function readTokenJson(name) {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, "tokens", name), "utf-8"));
  } catch {
    return null;
  }
}

function colorSwatches(colors) {
  if (!colors) return "<p><em>No colors.json found.</em></p>";
  let html = "";

  function renderPalette(name, obj) {
    html += `<h3>${name}</h3><table><tr><th>Token</th><th>Value</th><th>Swatch</th></tr>`;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object") {
        renderPalette(`${name}.${key}`, value);
      } else {
        html += `<tr><td><code>${name}.${key}</code></td><td><code>${value}</code></td>`;
        html += `<td style="background:${value};width:60px;height:24px;border:1px solid #ccc;border-radius:4px;"> </td></tr>`;
      }
    }
    html += "</table>";
  }

  const colorData = colors.color || colors;
  for (const [category, data] of Object.entries(colorData)) {
    if (category.startsWith("$")) continue;
    renderPalette(category, data);
  }
  return html;
}

// ── Page content ────────────────────────────────────────────────────
function designSystemOverviewHtml() {
  return `
<h2>LeaseBase Design System</h2>
<p>This is the central design system documentation for the LeaseBase web frontend.</p>

<h3>Architecture</h3>
<ul>
  <li><strong>Token Source of Truth</strong>: <code>tokens/*.json</code> in the <code>leasebase-web</code> repo</li>
  <li><strong>CSS Generation</strong>: <code>scripts/generate-tokens.mjs</code> → <code>src/design-system/tokens.css</code> (147 CSS custom properties)</li>
  <li><strong>Tailwind Integration</strong>: <code>tailwind.config.ts</code> references <code>--lb-*</code> CSS vars</li>
  <li><strong>Component Library</strong>: <code>src/components/ui/</code> — 22 primitives</li>
  <li><strong>Figma Sync</strong>: <code>npm run design:sync</code> pulls from Figma when a file key is configured</li>
</ul>

<h3>Quick Start</h3>
<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="language">bash</ac:parameter>
  <ac:plain-text-body><![CDATA[# Regenerate CSS tokens after editing token JSON
npm run tokens:generate

# Full sync from Figma + regenerate
npm run design:sync

# View component showcase
npm run dev  # then visit /dev/components
]]></ac:plain-text-body>
</ac:structured-macro>

<h3>Token Naming Convention</h3>
<p>All tokens use a dot-delimited hierarchy mapped to CSS custom properties with <code>--lb-</code> prefix:</p>
<ac:structured-macro ac:name="code">
  <ac:plain-text-body><![CDATA[color.brand.primary.500  →  --lb-color-brand-primary-500
typography.size.lg       →  --lb-typography-size-lg
spacing.4                →  --lb-spacing-4
radius.lg                →  --lb-radius-lg
shadow.md                →  --lb-shadow-md
]]></ac:plain-text-body>
</ac:structured-macro>

<h3>WCAG Accessibility</h3>
<p>All foreground/background color pairings target <strong>WCAG AA</strong> (≥ 4.5:1 for normal text, ≥ 3:1 for large text).</p>

<h3>Child Pages</h3>
<ul>
  <li><strong>Design Tokens</strong> — Color, typography, spacing, radius, and shadow token reference</li>
  <li><strong>UI Component Library</strong> — Complete component inventory</li>
  <li><strong>Wireframe Screens</strong> — All role-based skeleton pages and routes</li>
</ul>
`;
}

function designTokensHtml() {
  const colors = readTokenJson("colors.json");
  const typography = readTokenJson("typography.json");
  const spacing = readTokenJson("spacing.json");
  const radius = readTokenJson("radius.json");
  const shadows = readTokenJson("shadows.json");

  let html = `<h2>Design Tokens</h2>
<p>Canonical token reference generated from <code>tokens/*.json</code> in the leasebase-web repo.</p>
<p><em>Last updated: ${new Date().toISOString().split("T")[0]}</em></p>`;

  // Colors
  html += `<h2>Colors</h2>`;
  html += colorSwatches(colors);

  // Typography
  html += `<h2>Typography</h2>`;
  if (typography?.typography) {
    const t = typography.typography;
    if (t.font?.family) {
      html += `<h3>Font Families</h3><table><tr><th>Token</th><th>Value</th></tr>`;
      for (const [k, v] of Object.entries(t.font.family)) {
        html += `<tr><td><code>typography.font.family.${k}</code></td><td>${v}</td></tr>`;
      }
      html += `</table>`;
    }
    if (t.size) {
      html += `<h3>Sizes</h3><table><tr><th>Token</th><th>Value</th><th>Preview</th></tr>`;
      for (const [k, v] of Object.entries(t.size)) {
        html += `<tr><td><code>typography.size.${k}</code></td><td>${v}</td><td style="font-size:${v}">Aa</td></tr>`;
      }
      html += `</table>`;
    }
    if (t.weight) {
      html += `<h3>Weights</h3><table><tr><th>Token</th><th>Value</th></tr>`;
      for (const [k, v] of Object.entries(t.weight)) {
        html += `<tr><td><code>typography.weight.${k}</code></td><td>${v}</td></tr>`;
      }
      html += `</table>`;
    }
  }

  // Spacing
  html += `<h2>Spacing</h2>`;
  if (spacing?.spacing) {
    html += `<table><tr><th>Token</th><th>Value</th><th>Visual</th></tr>`;
    for (const [k, v] of Object.entries(spacing.spacing)) {
      html += `<tr><td><code>spacing.${k}</code></td><td>${v}</td>`;
      html += `<td><div style="background:#10b981;height:12px;width:${v};min-width:2px;border-radius:2px;"> </div></td></tr>`;
    }
    html += `</table>`;
  }

  // Radius
  html += `<h2>Border Radius</h2>`;
  if (radius?.radius) {
    html += `<table><tr><th>Token</th><th>Value</th><th>Preview</th></tr>`;
    for (const [k, v] of Object.entries(radius.radius)) {
      html += `<tr><td><code>radius.${k}</code></td><td>${v}</td>`;
      html += `<td><div style="width:40px;height:40px;background:#334155;border-radius:${v};border:2px solid #10b981;"> </div></td></tr>`;
    }
    html += `</table>`;
  }

  // Shadows
  html += `<h2>Shadows</h2>`;
  if (shadows?.shadow) {
    html += `<table><tr><th>Token</th><th>Value</th></tr>`;
    for (const [k, v] of Object.entries(shadows.shadow)) {
      html += `<tr><td><code>shadow.${k}</code></td><td><code>${v}</code></td></tr>`;
    }
    html += `</table>`;
  }

  return html;
}

function componentLibraryHtml() {
  const components = [
    { name: "Button", file: "Button.tsx", desc: "Primary, secondary, ghost, danger variants. sm/md/lg sizes. Loading + disabled states." },
    { name: "Input", file: "Input.tsx", desc: "Text input with label, error, helperText. aria-invalid + aria-describedby." },
    { name: "Textarea", file: "Textarea.tsx", desc: "Multi-line input. Same API as Input." },
    { name: "Select", file: "Select.tsx", desc: "Native select dropdown with label + error." },
    { name: "RadioGroup", file: "Radio.tsx", desc: "Radio button group. Vertical/horizontal orientation. Fieldset + legend." },
    { name: "Checkbox", file: "Checkbox.tsx", desc: "Checkbox with label." },
    { name: "Switch", file: "Switch.tsx", desc: "Toggle switch (role=switch, aria-checked)." },
    { name: "Badge", file: "Badge.tsx", desc: "Status badges: success, warning, danger, info, neutral." },
    { name: "Card", file: "Card.tsx", desc: "Card container with CardHeader, CardBody, CardFooter." },
    { name: "Modal", file: "Modal.tsx", desc: "Dialog with focus trap, Escape close, portal rendering." },
    { name: "Toast", file: "Toast.tsx", desc: "Toast notifications via ToastProvider + useToast hook." },
    { name: "DataTable", file: "DataTable.tsx", desc: "Table with column definitions, sorting, empty state." },
    { name: "Tabs", file: "Tabs.tsx", desc: "Tabbed interface. Arrow key navigation. aria-selected, tabpanel." },
    { name: "Tooltip", file: "Tooltip.tsx", desc: "Hover tooltip." },
    { name: "Breadcrumb", file: "Breadcrumb.tsx", desc: "Breadcrumb navigation with chevron separators." },
    { name: "Pagination", file: "Pagination.tsx", desc: "Page navigation with ellipsis. aria-current=page. Prev/next buttons." },
    { name: "EmptyState", file: "EmptyState.tsx", desc: "Placeholder for empty lists with icon, title, description, action." },
    { name: "Skeleton", file: "Skeleton.tsx", desc: "Loading skeleton. text/circular/rectangular variants. SkeletonCard, SkeletonTable presets." },
    { name: "Avatar", file: "Avatar.tsx", desc: "User avatar with initials fallback. xs/sm/md/lg/xl sizes." },
    { name: "DropdownMenu", file: "DropdownMenu.tsx", desc: "Dropdown menu with keyboard nav. Outside click + Escape close." },
    { name: "Icon", file: "Icon.tsx", desc: "Icon wrapper component." },
    { name: "PageHeader", file: "PageHeader.tsx", desc: "Page title + description + optional action slot." },
  ];

  let html = `<h2>UI Component Library</h2>
<p>All components live in <code>src/components/ui/</code> and are exported from <code>src/components/ui/index.ts</code>.</p>
<p>Visit <code>/dev/components</code> in the dev server for live demos.</p>
<p><em>Last updated: ${new Date().toISOString().split("T")[0]}</em></p>

<h3>Component Inventory (${components.length} components)</h3>
<table>
<tr><th>Component</th><th>File</th><th>Description</th></tr>`;

  for (const c of components) {
    html += `<tr><td><strong>${c.name}</strong></td><td><code>${c.file}</code></td><td>${c.desc}</td></tr>`;
  }
  html += `</table>

<h3>Shared Patterns</h3>
<ul>
  <li>All components use <code>"use client"</code> directive</li>
  <li>Form components use <code>forwardRef</code> and <code>useId</code></li>
  <li>Error states use <code>aria-invalid</code> and <code>role="alert"</code></li>
  <li>Interactive components support keyboard navigation</li>
  <li>Styling uses Tailwind classes referencing CSS custom property tokens (<code>--lb-*</code>)</li>
</ul>

<h3>Adding a New Component</h3>
<ol>
  <li>Create <code>src/components/ui/MyComponent.tsx</code></li>
  <li>Export from <code>src/components/ui/index.ts</code></li>
  <li>Add a showcase section in <code>app/dev/components/page.tsx</code></li>
  <li>Add unit tests in <code>tests/unit/</code></li>
</ol>`;

  return html;
}

function wireframeScreensHtml() {
  const screens = [
    { route: "/app", title: "Dashboard", personas: "PM, Owner, Tenant, Vendor" },
    { route: "/app/properties", title: "Properties", personas: "PM, Owner" },
    { route: "/app/properties/[id]", title: "Property Details", personas: "PM, Owner" },
    { route: "/app/units", title: "Units", personas: "PM" },
    { route: "/app/tenants", title: "Tenants", personas: "PM" },
    { route: "/app/tenants/[id]", title: "Tenant Profile", personas: "PM" },
    { route: "/app/leases", title: "Leases", personas: "PM, Owner, Tenant" },
    { route: "/app/leases/new", title: "New Lease Wizard", personas: "PM" },
    { route: "/app/rent-roll", title: "Rent Roll", personas: "PM" },
    { route: "/app/maintenance", title: "Maintenance Requests", personas: "PM, Owner, Tenant" },
    { route: "/app/maintenance/[id]", title: "Work Order Detail", personas: "PM, Owner, Tenant, Vendor" },
    { route: "/app/maintenance/new", title: "New Maintenance Request", personas: "Tenant" },
    { route: "/app/payments", title: "Payments / Ledger", personas: "PM, Owner" },
    { route: "/app/pay-rent", title: "Pay Rent", personas: "Tenant" },
    { route: "/app/payment-history", title: "Payment History", personas: "Tenant" },
    { route: "/app/documents", title: "Documents", personas: "PM, Owner, Tenant" },
    { route: "/app/notifications", title: "Notifications", personas: "PM, Owner, Tenant, Vendor" },
    { route: "/app/messages", title: "Messages", personas: "PM, Owner, Tenant" },
    { route: "/app/reports", title: "Reports", personas: "PM, Owner" },
    { route: "/app/vendor", title: "Vendor Dashboard", personas: "Vendor" },
    { route: "/app/vendor/[id]", title: "Vendor Work Order Detail", personas: "Vendor" },
    { route: "/app/settings", title: "Settings", personas: "PM, Owner, Tenant" },
    { route: "/app/showings", title: "Showings (Future)", personas: "Agent" },
  ];

  let html = `<h2>Wireframe Screens & Routes</h2>
<p>All skeleton pages are implemented as Next.js App Router routes under <code>app/app/</code>. Each page renders a <code>PageHeader</code> + <code>EmptyState</code> placeholder.</p>
<p><em>Last updated: ${new Date().toISOString().split("T")[0]}</em></p>

<h3>Route Map (${screens.length} screens)</h3>
<table>
<tr><th>Route</th><th>Screen</th><th>Personas</th></tr>`;

  for (const s of screens) {
    html += `<tr><td><code>${s.route}</code></td><td>${s.title}</td><td>${s.personas}</td></tr>`;
  }
  html += `</table>

<h3>Role-Based Navigation</h3>
<p>Navigation is persona-filtered via <code>src/lib/appNav.ts</code>. Each persona sees only their relevant routes in the sidebar.</p>
<ul>
  <li><strong>Property Manager</strong>: Full access to all management screens</li>
  <li><strong>Owner</strong>: Dashboard, Properties, Leases, Payments, Maintenance, Documents, Reports</li>
  <li><strong>Tenant</strong>: Dashboard, Leases, Pay Rent, Payment History, Maintenance, Documents, Messages</li>
  <li><strong>Vendor</strong>: Dashboard, Work Orders, Notifications</li>
  <li><strong>Agent</strong>: Showings (future)</li>
</ul>`;

  return html;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("Publishing design system docs to Confluence…");
  console.log(`  Space: ${SPACE_KEY}`);

  // 1. Create/update parent "Design System" page
  const parentId = await upsertPage(
    "Design System",
    designSystemOverviewHtml(),
  );
  console.log(`  ✓ Design System → id=${parentId}`);

  // 2. Create/update "Design Tokens" as child
  const tokensId = await upsertPage(
    "Design Tokens",
    designTokensHtml(),
    parentId,
  );
  console.log(`  ✓ Design Tokens → id=${tokensId}`);

  // 3. Update existing "UI Component Library" or create under Design System
  const componentId = await upsertPage(
    "UI Component Library",
    componentLibraryHtml(),
  );
  console.log(`  ✓ UI Component Library → id=${componentId}`);

  // 4. Create/update "Wireframe Screens" as child
  const screensId = await upsertPage(
    "Wireframe Screens",
    wireframeScreensHtml(),
    parentId,
  );
  console.log(`  ✓ Wireframe Screens → id=${screensId}`);

  console.log("\n✓ All Confluence pages published.");
  console.log(`  ${BASE_URL}/spaces/${SPACE_KEY}/pages/${parentId}`);
}

main().catch((err) => {
  console.error("✗ Confluence publish failed:", err.message);
  process.exit(1);
});
