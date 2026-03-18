/**
 * Canonical legal document metadata.
 *
 * This is the single source of truth for legal document slugs, versions,
 * titles, and public URLs used by the frontend (links, checkboxes) and
 * the API payload sent to the backend for acceptance persistence.
 *
 * Legal documents are hosted publicly on the WordPress marketing site
 * at leasebase.ai. The web app links to those URLs and persists
 * acceptance records keyed on slug/version/hash — never on the URL.
 */

/** Base URL of the public marketing site where legal docs are hosted. */
const LEGAL_BASE_URL = "https://leasebase.ai";

export interface LegalDocument {
  /** URL-safe identifier, e.g. "terms" */
  slug: string;
  /** Human-readable title */
  title: string;
  /** Semantic version string, e.g. "2026-03-v1" */
  version: string;
  /** ISO date when this version became effective */
  effectiveDate: string;
  /** Full public URL on the WordPress marketing site */
  publicUrl: string;
  /**
   * SHA-256 hash of the source markdown content.
   * Regenerate with: node scripts/compute-legal-hashes.mjs
   */
  contentHash: string;
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    version: "2026-03-v1",
    effectiveDate: "2026-03-16",
    publicUrl: `${LEGAL_BASE_URL}/terms-of-service/`,
    contentHash: "29b27b742fc794f684c55cf405fd7c9c5ef411b0c84f3248b210709ed9568a7d",
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    version: "2026-03-v1",
    effectiveDate: "2026-03-16",
    publicUrl: `${LEGAL_BASE_URL}/privacy-policy/`,
    contentHash: "4773b5b32e1fa06c111f91e2c0ba78d921723d622a98fbd7820c4a3207a4f6e1",
  },
  {
    slug: "payment-terms",
    title: "Payment Terms",
    version: "2026-03-v1",
    effectiveDate: "2026-03-16",
    publicUrl: `${LEGAL_BASE_URL}/payment-terms/`,
    contentHash: "d85a2b2a0df691c77395ddc4a8517ee95649fad1177b3b6746dfdecbfc0eb3a7",
  },
  {
    slug: "owner-agreement",
    title: "Property Owner Agreement",
    version: "2026-03-v1",
    effectiveDate: "2026-03-16",
    publicUrl: `${LEGAL_BASE_URL}/property-owner-agreement/`,
    contentHash: "03d192006d6e0d55d2ad7695746e183f579d1dc8b1eaadc1c1b607fd836188b6",
  },
  {
    slug: "tenant-agreement",
    title: "Tenant User Agreement",
    version: "2026-03-v1",
    effectiveDate: "2026-03-16",
    publicUrl: `${LEGAL_BASE_URL}/tenant-user-agreement/`,
    contentHash: "2cfe9121c97d0de47c2c1e6b56cd416a79e5ca875a6c49cff30cf389b5313f1e",
  },
];

/** Documents an owner must accept at signup. */
export function getOwnerSignupDocs(): LegalDocument[] {
  return LEGAL_DOCUMENTS.filter((d) =>
    ["terms", "privacy", "owner-agreement"].includes(d.slug),
  );
}

/** Documents a tenant must accept at invite acceptance. */
export function getTenantSignupDocs(): LegalDocument[] {
  return LEGAL_DOCUMENTS.filter((d) =>
    ["terms", "privacy", "tenant-agreement"].includes(d.slug),
  );
}

/** Acceptance payload item sent to the backend. */
export interface LegalAcceptanceItem {
  slug: string;
  version: string;
  hash?: string;
}

/** Build the legalAcceptance array for an API call. */
export function buildLegalAcceptancePayload(
  docs: LegalDocument[],
): LegalAcceptanceItem[] {
  return docs.map((d) => ({
    slug: d.slug,
    version: d.version,
    hash: d.contentHash,
  }));
}
