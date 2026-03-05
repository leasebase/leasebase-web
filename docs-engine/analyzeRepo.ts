#!/usr/bin/env node
/**
 * LeaseBase Documentation Engine
 *
 * Scans the leasebase-web codebase and either:
 * - Updates Confluence pages (default / push to main)
 * - Outputs a preview summary (PR mode / DOCS_PREVIEW_ONLY=true)
 *
 * Usage:
 *   npx tsx docs-engine/analyzeRepo.ts              # update Confluence
 *   DOCS_PREVIEW_ONLY=true npx tsx docs-engine/analyzeRepo.ts  # preview only
 */

import { extractRoutes } from "./extractRoutes.js";
import { extractPermissions } from "./extractPermissions.js";
import { extractFlows } from "./extractFlows.js";
import { extractUseCases } from "./extractUseCases.js";
import { generateConfluencePages } from "./generateConfluencePages.js";
import { updateConfluencePages } from "./updateConfluence.js";
import { getCommitSha, nowISO } from "./utils.js";

/* ── Preview output ───────────────────────────────────────────── */

function generatePreviewMarkdown(
  routes: ReturnType<typeof extractRoutes>,
  permissions: ReturnType<typeof extractPermissions>,
  flows: ReturnType<typeof extractFlows>,
  useCases: ReturnType<typeof extractUseCases>,
): string {
  const lines: string[] = [];
  lines.push("## 📖 Documentation Preview");
  lines.push("");
  lines.push(`Generated at \`${nowISO()}\` from commit \`${getCommitSha()}\``);
  lines.push("");

  // Routes summary
  lines.push("### Routes Detected");
  lines.push("");
  const activeRoutes = routes.filter((r) => !r.isRedirect);
  const redirectRoutes = routes.filter((r) => r.isRedirect);
  lines.push(`- **${activeRoutes.length}** active routes`);
  lines.push(`- **${redirectRoutes.length}** redirect routes`);
  lines.push("");
  lines.push("| Route | File | Auth Required |");
  lines.push("|-------|------|---------------|");
  for (const r of routes) {
    const auth = r.isRedirect ? "redirect" : r.requiresAuth ? "✅" : "—";
    lines.push(`| \`${r.route}\` | \`${r.filePath}\` | ${auth} |`);
  }
  lines.push("");

  // Flows
  lines.push("### Flow Diagrams");
  lines.push("");
  for (const flow of flows) {
    lines.push(`<details><summary>${flow.title}</summary>`);
    lines.push("");
    lines.push("```mermaid");
    lines.push(flow.mermaid);
    lines.push("```");
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  // Use cases
  lines.push("### Use Cases");
  lines.push("");
  for (const uc of useCases) {
    lines.push(`- **${uc.title}** (${uc.category}) — ${uc.actors.join(", ")}`);
  }
  lines.push("");

  // Permissions
  lines.push("### Permissions Matrix");
  lines.push("");
  const personas = permissions.personas;
  lines.push("| Route | " + personas.join(" | ") + " |");
  lines.push("|" + "------|".repeat(personas.length + 1));
  for (const entry of permissions.entries) {
    const cells = personas.map((p) => (entry.personas.includes(p) ? "✅" : "—"));
    lines.push(`| \`${entry.route}\` | ${cells.join(" | ")} |`);
  }
  lines.push("");

  // Pages that would be updated
  lines.push("### Confluence Pages");
  lines.push("");
  lines.push("The following pages would be created/updated:");
  lines.push("");
  const pages = generateConfluencePages(routes, permissions, flows, useCases);
  for (const page of pages) {
    const parent = page.parentTitle ? ` (child of "${page.parentTitle}")` : " (root)";
    lines.push(`- **${page.title}**${parent}`);
  }
  lines.push("");

  return lines.join("\n");
}

/* ── Main ─────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  console.log("🔍 LeaseBase Documentation Engine\n");

  // Step 1: Extract
  console.log("  Extracting routes...");
  const routes = extractRoutes();
  console.log(`  → Found ${routes.length} routes`);

  console.log("  Extracting permissions...");
  const permissions = extractPermissions(routes);
  console.log(`  → Found ${permissions.entries.length} permission entries, ${permissions.personas.length} personas`);

  console.log("  Extracting flows...");
  const flows = extractFlows(routes, permissions);
  console.log(`  → Generated ${flows.length} flow diagrams`);

  console.log("  Extracting use cases...");
  const useCases = extractUseCases(routes, permissions);
  console.log(`  → Derived ${useCases.length} use cases`);

  // Step 2: Check mode
  const isPreview =
    process.env.DOCS_PREVIEW_ONLY === "true" ||
    process.env.GITHUB_EVENT_NAME === "pull_request";

  if (isPreview) {
    console.log("\n📋 Preview mode — generating markdown summary...\n");
    const preview = generatePreviewMarkdown(routes, permissions, flows, useCases);
    // Write preview to stdout for CI to capture
    console.log("---PREVIEW_START---");
    console.log(preview);
    console.log("---PREVIEW_END---");
    return;
  }

  // Step 3: Generate Confluence pages
  console.log("\n  Generating Confluence pages...");
  const pages = generateConfluencePages(routes, permissions, flows, useCases);
  console.log(`  → Generated ${pages.length} pages`);

  // Step 4: Update Confluence
  await updateConfluencePages(pages);
}

main().catch((err) => {
  console.error("\n❌ Documentation engine failed:", err.message || err);
  process.exit(1);
});
