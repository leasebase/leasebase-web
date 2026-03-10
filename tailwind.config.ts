import type { Config } from "tailwindcss";

/**
 * Tailwind theme wired to CSS custom properties generated from tokens/*.json.
 * Run `node scripts/generate-tokens.mjs` after editing token files.
 *
 * Shorthand helper:  var(--lb-<category>-<key>)
 */
const v = (name: string) => `var(--lb-${name})`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  v("color-brand-primary-50"),
          100: v("color-brand-primary-100"),
          200: v("color-brand-primary-200"),
          300: v("color-brand-primary-300"),
          400: v("color-brand-primary-400"),
          500: v("color-brand-primary-500"),
          600: v("color-brand-primary-600"),
          700: v("color-brand-primary-700"),
          800: v("color-brand-primary-800"),
          900: v("color-brand-primary-900"),
          950: v("color-brand-primary-950"),
        },
        secondary: {
          50:  v("color-brand-secondary-50"),
          100: v("color-brand-secondary-100"),
          200: v("color-brand-secondary-200"),
          300: v("color-brand-secondary-300"),
          400: v("color-brand-secondary-400"),
          500: v("color-brand-secondary-500"),
          600: v("color-brand-secondary-600"),
          700: v("color-brand-secondary-700"),
          800: v("color-brand-secondary-800"),
          900: v("color-brand-secondary-900"),
          950: v("color-brand-secondary-950"),
        },
        surface: {
          DEFAULT: v("color-surface-default"),
          base:    v("color-surface-base"),
          raised:  v("color-surface-raised"),
          overlay: v("color-surface-overlay"),
        },
        /* ── Semantic text / border colors ── */
        content: {
          primary:   v("color-neutral-900"),
          secondary: v("color-neutral-600"),
          muted:     v("color-neutral-400"),
          inverted:  v("color-neutral-0"),
        },
        border: {
          DEFAULT: v("color-neutral-200"),
          strong:  v("color-neutral-300"),
          muted:   v("color-neutral-100"),
        },
        success: {
          DEFAULT: v("color-semantic-success-500"),
          light:   v("color-semantic-success-100"),
          50:  v("color-semantic-success-50"),
          600: v("color-semantic-success-600"),
          700: v("color-semantic-success-700"),
        },
        warning: {
          DEFAULT: v("color-semantic-warning-500"),
          light:   v("color-semantic-warning-100"),
          50:  v("color-semantic-warning-50"),
          600: v("color-semantic-warning-600"),
          700: v("color-semantic-warning-700"),
        },
        danger: {
          DEFAULT: v("color-semantic-danger-500"),
          light:   v("color-semantic-danger-100"),
          50:  v("color-semantic-danger-50"),
          600: v("color-semantic-danger-600"),
          700: v("color-semantic-danger-700"),
        },
        info: {
          DEFAULT: v("color-semantic-info-500"),
          light:   v("color-semantic-info-100"),
          50:  v("color-semantic-info-50"),
          600: v("color-semantic-info-600"),
          700: v("color-semantic-info-700"),
        },
      },
      fontFamily: {
        sans: [v("typography-font-family-sans")],
        mono: [v("typography-font-family-mono")],
      },
      spacing: {
        "sp-xs":  v("spacing-semantic-xs"),
        "sp-sm":  v("spacing-semantic-sm"),
        "sp-md":  v("spacing-semantic-md"),
        "sp-lg":  v("spacing-semantic-lg"),
        "sp-xl":  v("spacing-semantic-xl"),
        "sp-2xl": v("spacing-semantic-2xl"),
        "sp-3xl": v("spacing-semantic-3xl"),
      },
      borderRadius: {
        DEFAULT: v("radius-md"),
        sm:  v("radius-sm"),
        lg:  v("radius-lg"),
        xl:  v("radius-xl"),
        "2xl": v("radius-2xl"),
        "3xl": v("radius-3xl"),
        full: v("radius-full"),
      },
      boxShadow: {
        sm:    v("shadow-sm"),
        card:  v("shadow-md"),
        lg:    v("shadow-lg"),
        xl:    v("shadow-xl"),
        modal: v("shadow-2xl"),
      },
      ringWidth: {
        focus: "2px",
      },
      ringColor: {
        focus: v("color-brand-primary-500"),
      },
    },
  },
  plugins: [],
};

export default config;
