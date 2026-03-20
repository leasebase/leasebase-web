# WordPress Site Structure

## Overview

The WordPress marketing site lives in `wordpress-landing/`. It consists of:

1. **The theme** (`leasebase-theme/`) — deployed to the server, controls all rendering
2. **Content HTML files** (root of `wordpress-landing/`) — Gutenberg block markup for manual paste into WP Admin
3. **README.md** — operational docs (legacy, partially outdated by this docs directory)

## Theme (`leasebase-theme/`)

This is a **child theme of Twenty Twenty-Five**, using WordPress Full Site Editing (FSE).

### Core files

| File | Role | Scope |
|------|------|-------|
| `style.css` | All custom CSS + CSS custom properties (design tokens). Also contains the required WordPress theme header comment. | Global — loaded on every page |
| `theme.json` | WordPress design tokens: color palette, font families, font sizes, spacing scale, element defaults. Consumed by Gutenberg editor and frontend. | Global |
| `functions.php` | PHP: enqueues styles/fonts, SEO meta tags, document titles, Early Access CPT, Contact form REST endpoint, performance optimizations. | Global |

### Templates (`templates/`)

FSE page templates. WordPress selects these by **slug matching** — a page with slug `pricing` automatically gets `page-pricing.html`.

| File | Page | Selection |
|------|------|-----------|
| `front-page.html` | Homepage | WordPress built-in: applied when a page is set as the static front page |
| `page-pricing.html` | `/pricing/` | Slug match: WordPress page with slug `pricing` |
| `page-contact.html` | `/contact/` | Slug match: WordPress page with slug `contact` |
| `page-demo.html` | `/demo/` | Slug match: WordPress page with slug `demo` |

Each template includes the header and footer via `<!-- wp:template-part -->` references.

### Parts (`parts/`)

FSE template parts — reusable fragments included by templates.

| File | Role |
|------|------|
| `header.html` | Site header: logo, nav links (Features, Pricing, Demo, Login, Start Free) |
| `footer.html` | Site footer: brand blurb, Product/Company/Connect link columns, copyright |

### Assets (`assets/`)

Static SVG files for the logo in various formats:

- `leasebase-logo-mark.svg` — used in header (40×40)
- `leasebase-logo-icon.svg` — used in footer (32×32)
- `leasebase-logo-full.svg` — full horizontal logo
- `leasebase-logo-white.svg` — white version for dark backgrounds
- `favicon.svg` — browser favicon

Logo paths are hardcoded in `header.html` and `footer.html` as `/wp-content/themes/leasebase-theme/assets/...`.

## Content HTML Files (root)

These are **Gutenberg block markup** files intended for manual paste into the WP Admin Page Editor (Code Editor mode). They exist as a fallback mechanism.

| File | Purpose |
|------|---------|
| `homepage-content.html` | Original Gutenberg block content for the homepage. **Note:** this is a legacy version that predates the FSE template `front-page.html` and contains older sections (dashboard mockup, tenant experience, etc.) not present in the current FSE template. |
| `pricing-content.html` | Gutenberg paste-in content for the Pricing page. Mirrors `page-pricing.html` template content. |
| `contact-content.html` | Gutenberg paste-in content for the Contact page. Mirrors `page-contact.html` template content. |
| `demo-content.html` | Gutenberg paste-in content for the Demo page. Mirrors `page-demo.html` template content. |

### Template vs Content HTML — which is source of truth?

**The FSE template files (`templates/*.html`) are the source of truth for rendering.** When deployed as theme files, WordPress uses them automatically based on slug matching. The content HTML files are a fallback for cases where the template doesn't apply (e.g., slug mismatch, or if someone needs to paste content directly into the WP Editor).

**Important:** `homepage-content.html` has drifted from `front-page.html` — it contains older, more verbose markup (12 feature cards, dashboard mockup, etc.) while the current FSE template uses a streamlined conversion-focused layout. The FSE template is the live version.

## Auth URLs

Signup/signin URLs are currently hardcoded as `https://signup.dev.leasebase.ai` and `https://signin.dev.leasebase.ai` across **all** of these files:

- `parts/header.html`
- `parts/footer.html`
- `templates/front-page.html`
- `templates/page-pricing.html`
- `templates/page-contact.html`
- `homepage-content.html`
- `pricing-content.html`
- `contact-content.html`
- `functions.php` (as PHP constants — currently unused by templates since URLs are inline in HTML)

**When switching to production URLs**, every file above must be updated. The PHP constants (`LEASEBASE_SIGNIN_URL` / `LEASEBASE_SIGNUP_URL`) in `functions.php` are not currently consumed by templates — they exist as documentation/future use.
