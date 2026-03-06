import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

/* ── Path helpers ─────────────────────────────────────────────── */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the leasebase-web repository (parent of docs-engine/). */
export const REPO_ROOT = resolve(__dirname, "..");

/** Resolve a path relative to the repository root. */
export function repoPath(...segments: string[]): string {
  return resolve(REPO_ROOT, ...segments);
}

/* ── File helpers ─────────────────────────────────────────────── */

/** Read a file relative to the repo root. Returns empty string if missing. */
export function readRepoFile(...segments: string[]): string {
  const p = repoPath(...segments);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf-8");
}

/* ── HTML / Confluence helpers ────────────────────────────────── */

const ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape a string for safe inclusion in HTML / Confluence storage format. */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => ENTITY_MAP[ch] ?? ch);
}

/** Wrap content in a Confluence storage-format structured macro (e.g. code, info). */
export function confluenceMacro(
  name: string,
  body: string,
  params: Record<string, string> = {},
): string {
  const paramTags = Object.entries(params)
    .map(([k, v]) => `<ac:parameter ac:name="${escapeHtml(k)}">${escapeHtml(v)}</ac:parameter>`)
    .join("\n");
  return `<ac:structured-macro ac:name="${escapeHtml(name)}" ac:schema-version="1">
${paramTags}
<ac:plain-text-body><![CDATA[${body}]]></ac:plain-text-body>
</ac:structured-macro>`;
}

/* ── Git helpers ──────────────────────────────────────────────── */

/** Get the current short commit SHA. */
export function getCommitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: REPO_ROOT, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

/** Get the current ISO timestamp. */
export function nowISO(): string {
  return new Date().toISOString();
}
