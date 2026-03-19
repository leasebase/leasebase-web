# Branding System

## Architecture

Branding is implemented through three layers:

1. **CSS custom properties** in `style.css` `:root` — the primary source of truth (~50 variables)
2. **theme.json palette** — WordPress design tokens (6 colors), used by Gutenberg editor UI and wp-block defaults
3. **Hardcoded values** — a few rgba() values and gradient hex codes in `style.css`, plus hex values in `theme.json`

The CSS custom properties in `style.css` are the main design system. `theme.json` duplicates a subset for Gutenberg compatibility. When rebranding, both must be updated.

## Color System

### Primary (Blue)

| Variable | Value | Usage |
|----------|-------|-------|
| `--lb-primary` | `#2563eb` | Buttons, links, nav CTA, step numbers, pricing badge |
| `--lb-primary-dark` | `#1d4ed8` | Hover states |
| `--lb-primary-light` | `#dbeafe` | Feature card icon backgrounds, capability tags |
| `--lb-primary-lighter` | `#eff6ff` | Subtle backgrounds |
| `--lb-primary-hover` | `#1d4ed8` | Alias for hover (same as dark) |

### Accent (Green)

| Variable | Value | Usage |
|----------|-------|-------|
| `--lb-accent` | `#22c55e` | Checkmarks, success states, pricing check icons |
| `--lb-accent-dark` | `#16a34a` | Hover/dark variant |
| `--lb-accent-light` | `#dcfce7` | Success backgrounds, dashboard badges |

### Neutrals (Slate scale)

| Variable | Value |
|----------|-------|
| `--lb-dark` | `#0F172A` |
| `--lb-gray-900` | `#1E293B` |
| `--lb-gray-700` | `#334155` |
| `--lb-gray-500` | `#64748B` |
| `--lb-gray-300` | `#CBD5E1` |
| `--lb-gray-200` | `#E2E8F0` |
| `--lb-gray-100` | `#F1F5F9` |
| `--lb-gray-50` | `#F8FAFC` |
| `--lb-white` | `#FFFFFF` |

### Semantic

| Variable | Value | Usage |
|----------|-------|-------|
| `--lb-success` | `#5EEA7A` | (Legacy — accent green is now preferred) |
| `--lb-warning` | `#F59E0B` | Amber dot indicators |
| `--lb-danger` | `#EF4444` | Required field markers, error states |

### Dark surfaces

| Variable | Value |
|----------|-------|
| `--lb-color-bg-dark` | `#05070B` |
| `--lb-color-base` | `#0D1320` |
| `--lb-color-surface-dark` | `#111827` |

Used for footer background and dark section variants.

## Typography

| Token | Value |
|-------|-------|
| `--lb-font` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Font weights used | 400, 500, 600, 700, 800 |
| Loaded from | Google Fonts CDN (`functions.php`) |
| theme.json family | `inter-system` |

Inter is loaded with `display=swap` for performance.

## Shape

| Variable | Value | Usage |
|----------|-------|-------|
| `--lb-radius` | `8px` | Buttons, inputs, small cards |
| `--lb-radius-lg` | `16px` | Large cards, browser frames, pricing cards |

## Layout

| Variable | Value |
|----------|-------|
| `--lb-max-width` | `1120px` |

All sections use `max-width: var(--lb-max-width)` with `margin: 0 auto`.

## Logos

SVG files in `leasebase-theme/assets/`:

- `leasebase-logo-mark.svg` — the icon/symbol (header)
- `leasebase-logo-icon.svg` — simplified icon (footer, favicon contexts)
- `leasebase-logo-full.svg` — full horizontal logo with wordmark
- `leasebase-logo-white.svg` — white variant for dark backgrounds
- `favicon.svg` — browser tab icon

## theme.json Tokens

`theme.json` defines a subset of the branding for Gutenberg:

- 6 colors: primary (`#2563eb`), secondary (`#0D1320`), accent (`#22c55e`), background, surface, text
- 1 font family: Inter/System
- 5 font sizes: small through 2XL
- Button defaults: 8px radius, primary background, white text
- Heading line-height: 1.2

**These must be kept in sync with `style.css` variables.** Currently they are aligned.

## Hardcoded Values (not via variables)

These values appear directly in CSS rather than through variables:

- `rgba(37, 99, 235, 0.15)` — focus ring shadow on form inputs (derived from primary)
- `rgba(37, 99, 235, 0.18)` — popular pricing card shadow
- Gradient hex values in `--lb-gradient-brand` definition
- Problem card icon backgrounds: `#FEF2F2` (red-50), `#DC2626` (red-600) — hardcoded for visual contrast
- Various `rgba(255,255,255,...)` values in footer for text opacity

These are acceptable since they are either derived from the primary color or are intentionally independent of the brand palette.

## How to Rebrand

### Changing primary brand color

1. Update `--lb-primary` and related vars in `style.css` `:root`
2. Update `rgba()` shadows that reference the primary color (search for the RGB values)
3. Update `theme.json` palette `primary` entry
4. Update `--lb-gradient-brand` definition
5. Deploy theme and clear caches

### Changing typography

1. Update `--lb-font` in `style.css`
2. Update `theme.json` `fontFamilies`
3. Update `functions.php` Google Fonts URL (or remove if using a system font)

### Changing logo

1. Replace SVG files in `leasebase-theme/assets/`
2. If filenames change, update paths in `parts/header.html` and `parts/footer.html`

### Rebranding is well-supported

The CSS variable system means a color rebrand requires editing only 2 files (`style.css` + `theme.json`) and zero template changes. The design was specifically built for this.
