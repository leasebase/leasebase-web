#!/usr/bin/env node
/**
 * Compute SHA-256 content hashes of legal markdown documents.
 *
 * Usage:
 *   node scripts/compute-legal-hashes.mjs
 *
 * Output: JSON mapping slug → sha256 hash.
 * Use these hashes to update the `contentHash` values in src/lib/legal.ts
 * whenever a legal document's content changes.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(__dirname, '../../docs/legal');

const docs = [
  { slug: 'terms', file: 'terms-of-service.md' },
  { slug: 'privacy', file: 'privacy-policy.md' },
  { slug: 'payment-terms', file: 'payment-terms.md' },
  { slug: 'owner-agreement', file: 'owner-agreement.md' },
  { slug: 'tenant-agreement', file: 'tenant-agreement.md' },
];

const hashes = {};
for (const doc of docs) {
  const content = readFileSync(resolve(docsDir, doc.file), 'utf-8');
  const hash = createHash('sha256').update(content).digest('hex');
  hashes[doc.slug] = hash;
}

console.log(JSON.stringify(hashes, null, 2));
