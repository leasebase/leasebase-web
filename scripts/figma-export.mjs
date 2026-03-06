#!/usr/bin/env node
/**
 * figma-export.mjs
 *
 * Pulls design tokens (variables) and SVG icons from a Figma file.
 * Requires:  FIGMA_TOKEN  and  FIGMA_FILE_KEY  in .env.local (or env vars).
 *
 * Usage:  node scripts/figma-export.mjs
 *         npm run design:sync
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TOKENS_OUT = resolve(ROOT, "src/design-system/tokens");
const ICONS_OUT = resolve(ROOT, "public/assets/icons");
const CACHE_FILE = resolve(ROOT, "node_modules/.cache/figma-export-meta.json");

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

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!FIGMA_TOKEN) {
  console.error("✗ FIGMA_TOKEN not set. Add it to .env.local");
  process.exit(1);
}

if (!FIGMA_FILE_KEY) {
  console.warn("⚠ FIGMA_FILE_KEY not set. Skipping Figma export.");
  console.warn("  Create a Figma file, copy the file key from the URL, and add FIGMA_FILE_KEY to .env.local.");
  console.warn("  File URL format: https://www.figma.com/file/<FILE_KEY>/...");
  process.exit(0);
}

// ── Figma API helpers ───────────────────────────────────────────────
const API = "https://api.figma.com/v1";
const headers = { "X-Figma-Token": FIGMA_TOKEN };

async function figmaGet(path) {
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ── Cache helpers ───────────────────────────────────────────────────
function readCache() {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeCache(data) {
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching file metadata for ${FIGMA_FILE_KEY}…`);

  const cache = readCache();
  const file = await figmaGet(`/files/${FIGMA_FILE_KEY}?depth=1`);
  const lastModified = file.lastModified;

  if (cache.lastModified === lastModified) {
    console.log("✓ File unchanged since last export — nothing to do.");
    return;
  }

  // ── Export variables (tokens) ──
  console.log("Fetching variables…");
  try {
    const vars = await figmaGet(`/files/${FIGMA_FILE_KEY}/variables/local`);
    mkdirSync(TOKENS_OUT, { recursive: true });
    writeFileSync(
      resolve(TOKENS_OUT, "figma-variables.json"),
      JSON.stringify(vars, null, 2),
      "utf-8",
    );
    console.log(`  → ${TOKENS_OUT}/figma-variables.json`);
  } catch (err) {
    console.warn(`  ⚠ Could not fetch variables: ${err.message}`);
  }

  // ── Export icons (SVG from components named icon/*) ──
  console.log("Searching for icon components…");
  const fullFile = await figmaGet(`/files/${FIGMA_FILE_KEY}?depth=3`);
  const iconNodes = [];

  function walk(node) {
    if (
      node.type === "COMPONENT" &&
      (node.name.toLowerCase().startsWith("icon/") ||
        node.name.toLowerCase().startsWith("icons/"))
    ) {
      iconNodes.push(node.id);
    }
    if (node.children) node.children.forEach(walk);
  }
  fullFile.document.children.forEach(walk);

  if (iconNodes.length > 0) {
    console.log(`  Found ${iconNodes.length} icon components. Exporting SVGs…`);
    const idsParam = iconNodes.join(",");
    const images = await figmaGet(
      `/images/${FIGMA_FILE_KEY}?ids=${idsParam}&format=svg`,
    );

    mkdirSync(ICONS_OUT, { recursive: true });

    for (const [nodeId, url] of Object.entries(images.images || {})) {
      if (!url) continue;
      try {
        const svgRes = await fetch(url);
        const svg = await svgRes.text();
        const safeName = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
        writeFileSync(resolve(ICONS_OUT, `${safeName}.svg`), svg, "utf-8");
      } catch (err) {
        console.warn(`  ⚠ Failed to download icon ${nodeId}: ${err.message}`);
      }
    }
    console.log(`  → ${ICONS_OUT}/`);
  } else {
    console.log("  No icon components found (name pattern: icon/* or icons/*).");
  }

  // ── Update cache ──
  writeCache({ lastModified, exportedAt: new Date().toISOString() });
  console.log("✓ Figma export complete.");
}

main().catch((err) => {
  console.error("✗ Export failed:", err.message);
  process.exit(1);
});
