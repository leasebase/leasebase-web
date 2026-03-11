# LeaseBase — WordPress Marketing Site

Modern, high-conversion SaaS landing page for LeaseBase. Built as a child theme of Twenty Twenty-Five using Gutenberg blocks and Full Site Editing (FSE).

**No plugins required.** Everything is implemented through the child theme (`leasebase-theme`).

---

## File Structure

```
wordpress-landing/
├── README.md                          ← this file
├── homepage-content.html              ← Gutenberg block markup (for WP Page Editor)
└── leasebase-theme/
    ├── style.css                      ← Child theme styles (v4.0.0)
    ├── functions.php                  ← SEO meta, fonts, performance
    ├── templates/
    │   └── front-page.html            ← FSE homepage template
    ├── parts/
    │   ├── header.html                ← Header with Sign Up / Sign In nav
    │   └── footer.html                ← Footer with product links
    └── assets/
        └── js/                        ← (empty — no client-side JS needed)
```

---

## Homepage Structure

The homepage follows a high-conversion SaaS flow:

1. **Hero** — headline, subheadline, Sign Up + Sign In CTAs
2. **Problem** — pain of spreadsheets, scattered tools, manual processes
3. **Platform overview** — LeaseBase as the operating system for rental management
4. **Feature grid** — 12 feature cards covering the full platform capability
5. **How it works** — 4-step onboarding flow
6. **Tenant experience** — portal, maintenance, payments, documents
7. **Final CTA** — Sign Up + Sign In conversion block

---

## CTA Routing

- **Sign Up** → `https://signup.leasebase.co`
- **Sign In** → `https://dev.leasebase.co`

Both appear in: header nav, hero, feature section, final CTA, and footer.

The application handles role selection (Owner / Tenant) after sign-in. No role selection on the WordPress site.

---

## Deployment Steps

### Step 1: Upload Theme Files

Upload the entire `leasebase-theme/` directory to the WordPress server.

```bash
scp -r leasebase-theme/ user@server:/var/www/html/wp-content/themes/leasebase-theme/
```

Or upload via **Appearance → Themes → Add New → Upload Theme** (zip the folder first).

### Step 2: Update Homepage Content (if using Page Editor)

1. Go to **WP Admin → Pages → Home** (page ID 5)
2. Switch to **Code editor** (⋮ menu)
3. Replace all content with the contents of `homepage-content.html`
4. Switch back to **Visual editor** to verify
5. Click **Update**

Note: If using the FSE template (`templates/front-page.html`), this step may not be needed as the template renders directly.

### Step 3: Verify

- [ ] Homepage loads with hero, problem, platform, features, how-it-works, tenant experience, and final CTA
- [ ] Header shows LeaseBase brand + Sign In link + Sign Up button
- [ ] Sign Up buttons link to `https://signup.leasebase.co`
- [ ] Sign In buttons link to `https://dev.leasebase.co`
- [ ] Page title: "LeaseBase — The Operating System for Rental Property Owners"
- [ ] View source shows `<meta name="description" ...>` and Open Graph tags
- [ ] Footer shows Product, Company, and Connect columns
- [ ] Mobile responsive layout works correctly
- [ ] No "early access", "pilot program", or "Property Manager" language visible

---

## How to Edit

### Page content
Go to **Pages → Home** (Gutenberg editor) or **Appearance → Editor** (FSE). Each section is a separate Group block.

### Styles
Modify `wp-content/themes/leasebase-theme/style.css`. All custom classes use the `lb-` prefix.

### Header / Footer
Edit `parts/header.html` or `parts/footer.html`, or use **Appearance → Editor → Template Parts**.

### View legacy signups
Go to **WP Admin → Early Access** to see historical form submissions.

---

## Architecture Notes

### SEO
- Title, meta description, canonical URL, Open Graph, and Twitter Card tags added via `functions.php`.
- If you install Yoast or RankMath later, remove the `leasebase_seo_meta()` function to avoid duplicates.

### Performance
- Emoji scripts removed (~10KB saved)
- WordPress version/RSD/shortlink headers removed
- Inter font loaded with `display=swap`
- No jQuery dependency
- No page builder plugins
- CSS custom properties for efficient theming

### Legacy: Early Access
- The CPT (`lb_submission`) and REST endpoint are preserved in `functions.php` for existing submission data.
- The front-end form and JS handler have been removed. All CTAs now link directly to the product.

---

## Next Steps

1. **Add product screenshots** to replace placeholder sections if desired
2. **Add Google Analytics / Plausible** for conversion tracking
3. **Create Privacy Policy and Terms** pages (footer already links to them)
4. **Add a favicon** via Appearance → Customize → Site Identity
5. **Update social media links** in the footer with real profiles
6. **Run Lighthouse audit** after deployment to baseline performance
