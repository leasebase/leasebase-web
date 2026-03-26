/**
 * Stripe appearance configuration shared across all Stripe Elements
 * and Connect integrations. Keeps the brand color in sync with
 * the LeaseBase design system (brand.css).
 *
 * If the brand primary changes, update ONLY this file.
 */

/** Brand primary — must match --lb-color-brand-primary-500 in brand.css */
export const STRIPE_BRAND_COLOR = "#22C55E";

export const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: STRIPE_BRAND_COLOR,
    borderRadius: "8px",
  },
};
