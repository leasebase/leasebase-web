# Page Rendering Model

## How WordPress FSE Templates Work

WordPress Full Site Editing (FSE) uses a **template hierarchy** to determine what renders for each URL. For page-type content:

1. WordPress looks for a template matching the page slug: `page-{slug}.html`
2. If no slug match, it falls back to `page.html`, then `index.html`
3. For the homepage (static front page), WordPress uses `front-page.html`

Templates are loaded from the **theme directory** (`leasebase-theme/templates/`). They include template parts (header, footer) via `<!-- wp:template-part {"slug":"header"} /-->`.

### Critical nuance: DB overrides

WordPress stores **customized** templates and template parts in the database (`wp_posts` table, `post_type = wp_template` or `wp_template_part`). If someone edits a template via Appearance → Editor (Site Editor), the DB version takes priority over the theme file.

This means: **uploading an updated theme file may not change what renders** if a DB override exists for that template.

## Page-by-Page Rendering

### Homepage (`/`)

| Aspect | Value |
|--------|-------|
| Template | `templates/front-page.html` |
| Selection | WordPress uses `front-page.html` when a static front page is configured |
| Content HTML fallback | `homepage-content.html` (older, drifted — not the live version) |
| WP Admin content | The page content in WP Admin is likely empty or minimal — the FSE template provides all markup |
| Template parts | header.html, footer.html |
| Inline JS | Analytics tracking script at bottom of template |

**Key risk:** If someone clears the "static front page" setting in WP Admin → Settings → Reading, the homepage will stop using `front-page.html` and fall back to the default blog/index template.

### Pricing (`/pricing/`)

| Aspect | Value |
|--------|-------|
| Template | `templates/page-pricing.html` |
| Selection | Slug match — WP page must have slug `pricing` |
| Content HTML fallback | `pricing-content.html` (synced with template) |
| Page body class | `lb-pricing-page` (set via main group className in template) |
| Template parts | header.html, footer.html |
| Sections | Hero + trust layer, pricing cards (3), feature comparison table, connected platform, why LeaseBase, FAQ, final CTA |

**Key risk:** If the WP page slug is changed from `pricing`, the template stops matching and the page renders with the generic page template — losing all custom layout.

### Contact (`/contact/`)

| Aspect | Value |
|--------|-------|
| Template | `templates/page-contact.html` |
| Selection | Slug match — WP page must have slug `contact` |
| Content HTML fallback | `contact-content.html` (synced with template) |
| Template parts | header.html, footer.html |
| Inline JS | Contact form submission handler (POST to `/wp-json/leasebase/v1/contact`) |
| Backend | REST endpoint in `functions.php`, stores as `lb_contact` CPT, emails admin |

**Key risk — historically the most fragile page.** If the template doesn't apply (slug mismatch, DB override, or WP bug), the page renders with just the raw page content — which may be empty, causing a "primitive" unstyled appearance. The contact form JS is embedded in the template, not in page content, so it also breaks.

### Demo (`/demo/`)

| Aspect | Value |
|--------|-------|
| Template | `templates/page-demo.html` |
| Selection | Slug match — WP page must have slug `demo` |
| Content HTML fallback | `demo-content.html` (synced with template) |
| External dependency | Calendly inline widget (`assets.calendly.com/assets/external/widget.js`) |
| Template parts | header.html, footer.html |

**Key risk:** The Calendly widget loads from an external script. If blocked by ad blockers or CSP, a fallback direct link to the Calendly page is provided.

### Header (template part)

| Aspect | Value |
|--------|-------|
| File | `parts/header.html` |
| Contains | Logo (SVG from assets/), nav links, Start Free CTA button |
| Included by | All 4 page templates via `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->` |
| Auth URLs | `signin.dev.leasebase.ai` (Login), `signup.dev.leasebase.ai` (Start Free) — hardcoded |

### Footer (template part)

| Aspect | Value |
|--------|-------|
| File | `parts/footer.html` |
| Contains | Brand description, Product/Company/Connect columns, copyright |
| Included by | All 4 page templates via `<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->` |
| Auth URLs | `signup.dev.leasebase.ai` (Start Free), `signin.dev.leasebase.ai` (Login) — hardcoded |

## Common Drift Scenarios

### 1. Site Editor DB override

**What happens:** Someone uses Appearance → Editor to customize a template or template part. WordPress saves the customized version to the database. Future theme file uploads are silently ignored for that template.

**How to detect:** In Site Editor, customized templates show a "Reset to theme default" option.

**How to fix:** In Site Editor, open the affected template and click "Reset to theme default" (three-dot menu). This deletes the DB override and makes WordPress use the theme file again.

### 2. Page slug mismatch

**What happens:** A page in WP Admin has a different slug than expected (e.g., `contact-us` instead of `contact`). The slug-based template doesn't match, and WordPress uses the generic page template.

**Symptoms:** Page renders with minimal/no content, missing navigation, or default Twenty Twenty-Five styling instead of custom LeaseBase styling.

### 3. Content drift between template and content HTML files

**What happens:** Someone updates the FSE template but not the corresponding content HTML file (or vice versa). They gradually diverge.

**Current state:** `homepage-content.html` has already significantly drifted from `front-page.html`. The other content files are roughly in sync.

### 4. Cache showing stale content

**What happens:** Theme files are updated on disk but PHP OPcache or a page caching plugin serves the old version.

**Fix:** Restart PHP-FPM (`sudo /opt/bitnami/ctlscript.sh restart php-fpm`) and clear any WP caching plugin.
