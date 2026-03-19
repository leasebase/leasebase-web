# Future Work Guidance

## Source of Truth

| What | Source of truth | Where |
|------|----------------|-------|
| Page layout and structure | FSE template files | `templates/*.html` |
| Header/footer | Template parts | `parts/header.html`, `parts/footer.html` |
| All visual styling | CSS custom properties + classes | `style.css` |
| WordPress design tokens | theme.json | `theme.json` |
| SEO meta, document titles | PHP | `functions.php` |
| Contact form backend | PHP REST endpoint | `functions.php` |

**Do not treat the WP Admin page content as source of truth.** The FSE templates in the repo are authoritative.

## When to Edit What

### Changing copy/text on a page

Edit the corresponding FSE template in `templates/`. Examples:
- Homepage hero text → `templates/front-page.html`
- Pricing card descriptions → `templates/page-pricing.html`
- Contact hero heading → `templates/page-contact.html`

Optionally also update the corresponding content HTML file (`*-content.html`) if it exists, but the template is what renders.

### Changing navigation links

Edit `parts/header.html` and `parts/footer.html`.

### Changing colors, spacing, typography

Edit `style.css` CSS custom properties in `:root`. If the change affects primary/accent/text colors, also update `theme.json`.

### Changing CTA button styles

All CTA buttons use CSS classes defined in `style.css`:
- `.lb-nav-btn` — header nav button
- `.wp-block-button__link` — Gutenberg button blocks (styled per context)
- `.lb-pricing-card-cta` / `.lb-pricing-card-cta--primary` — pricing card buttons
- `.lb-contact-submit` — contact form submit
- `.lb-dashboard-cta` — (legacy, in homepage-content.html)

Edit the CSS class, not individual button elements.

### Adding a new page

1. Create a new FSE template: `templates/page-{slug}.html`
2. Include header/footer parts using `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->`
3. Add page-specific CSS to `style.css` with a scoping class (e.g., `.lb-newpage {}`)
4. In WP Admin, create a Page with the matching slug
5. Optionally create a content HTML fallback file

### Changing SEO meta or page titles

Edit `functions.php` — the `leasebase_seo_meta()` and `leasebase_document_title()` functions.

### Changing auth URLs (dev → prod)

Update `signup.dev.leasebase.ai` / `signin.dev.leasebase.ai` in all files listed in `site-structure.md` → Auth URLs section. This is currently a multi-file find-and-replace operation.

## Recommended Workflow

1. **Branch** from `develop` (e.g., `feat/pricing-copy-update`)
2. **Edit** the relevant template/CSS/PHP files in `wordpress-landing/leasebase-theme/`
3. **Update** the corresponding content HTML file if it exists and you want it in sync
4. **Commit** with a clear message describing the change
5. **Push** and create a PR to `develop`
6. After merge, **deploy** per `deployment-notes.md`
7. **Validate** all 4 pages after deploy — always check Contact

## How to Avoid Regressions

### Don't use the Site Editor for persistent changes

If you use Appearance → Editor (Site Editor) in WP Admin to test something, **reset to theme default** when done. Otherwise WordPress stores a DB override that silently blocks future theme file updates.

### Don't edit page content in WP Admin for template-rendered pages

The FSE templates provide all the markup. Editing the page content in WP Admin is unnecessary and may cause confusing double-rendering.

### Keep content HTML files in sync (or deprecate them)

The `*-content.html` files at the root of `wordpress-landing/` are fallbacks. If you're maintaining them, keep them in sync with templates. If they're not being used, consider adding a note that they're deprecated.

**Current state:** `homepage-content.html` has drifted significantly from `front-page.html` and should be considered legacy. The other three content files are roughly in sync.

### Always restart PHP-FPM after deploying

PHP OPcache may serve stale `functions.php` output. Always run:

```bash
ssh -i ~/.ssh/lightsail-default.pem bitnami@leasebase.ai \
  "sudo /opt/bitnami/ctlscript.sh restart php-fpm"
```

### Test Contact page after every deploy

This has been the most fragile page historically. If it renders unstyled, the template isn't being applied — check slug and Site Editor overrides.

## Architecture Decisions

### Why FSE templates instead of classic page templates?

FSE templates render the entire page (including header/footer) from the theme file alone, without depending on WP Admin page content. This makes the repo the single source of truth and reduces drift risk.

### Why do content HTML files still exist?

They serve as a fallback for cases where the FSE template doesn't apply (slug mismatch, new page setup). They also serve as human-readable documentation of what each page should contain.

### Why are auth URLs hardcoded instead of using PHP constants?

FSE template files are static HTML (Gutenberg block markup). They cannot execute PHP. The `LEASEBASE_SIGNIN_URL` / `LEASEBASE_SIGNUP_URL` constants in `functions.php` exist as documentation but aren't consumed by templates. A future improvement could use a `wp_footer` script to dynamically replace URLs, but the current approach is simpler and sufficient.
