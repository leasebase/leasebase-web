#!/usr/bin/env node
/**
 * generate-tokens.mjs
 *
 * Reads the canonical JSON token files in /tokens and writes:
 *   - src/design-system/tokens.css   (CSS custom properties under :root)
 *
 * Usage:  node scripts/generate-tokens.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TOKENS_DIR = resolve(ROOT, "tokens");
const OUT_DIR = resolve(ROOT, "src/design-system");

// ── helpers ────────────────────────────────────────────────────────
function readJson(name) {
  return JSON.parse(readFileSync(resolve(TOKENS_DIR, name), "utf-8"));
}

/** Recursively flatten a nested object to { "a-b-c": value } */
function flatten(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$")) continue; // skip meta keys
    const path = prefix ? `${prefix}-${key}` : key;
    if (typeof value === "object" && value !== null) {
      Object.assign(result, flatten(value, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}

// ── read tokens ────────────────────────────────────────────────────
const colors = flatten(readJson("colors.json"));
const typography = flatten(readJson("typography.json"));
const spacing = flatten(readJson("spacing.json"));
const radius = flatten(readJson("radius.json"));
const shadows = flatten(readJson("shadows.json"));

// ── generate CSS ───────────────────────────────────────────────────
function toCssVars(flatTokens) {
  return Object.entries(flatTokens)
    .map(([key, value]) => `  --lb-${key}: ${value};`)
    .join("\n");
}

const css = `/* ──────────────────────────────────────────────────────────────────
 * AUTO-GENERATED — do not edit manually.
 * Source: tokens/*.json → scripts/generate-tokens.mjs
 * ────────────────────────────────────────────────────────────────── */

:root {
  /* ── Colors ── */
${toCssVars(colors)}

  /* ── Typography ── */
${toCssVars(typography)}

  /* ── Spacing ── */
${toCssVars(spacing)}

  /* ── Radius ── */
${toCssVars(radius)}

  /* ── Shadows ── */
${toCssVars(shadows)}
}
`;

// ── write output ───────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
const outPath = resolve(OUT_DIR, "tokens.css");
writeFileSync(outPath, css, "utf-8");

console.log(`✓ Generated ${Object.keys({ ...colors, ...typography, ...spacing, ...radius, ...shadows }).length} CSS custom properties`);
console.log(`  → ${outPath}`);
