# LeaseBase — WordPress Marketing Site

Modern, high-conversion SaaS landing page for LeaseBase. Built as a child theme of Twenty Twenty-Five using Gutenberg blocks and Full Site Editing (FSE).

**No plugins required.** Everything is implemented through the child theme (`leasebase-theme`).

---

## File Structure

```
wordpress-landing/
├── README.md                          ← this file
├── homepage-content.html              ← Gutenberg block markup (for WP Page Editor)
├── contact-content.html               ← Contact page block markup (for WP Page Editor fallback)
├── pricing-content.html               ← Gutenberg block markup for Pricing page
├── demo-content.html                  ← Demo page block markup (for WP Page Editor fallback)
└── leasebase-theme/
    ├── style.css                      ← Child theme styles (v5.0.0)
    ├── functions.php                  ← SEO meta, fonts, performance, REST endpoints
    ├── templates/
    │   ├── front-page.html            ← FSE homepage template
    │   ├── page-contact.html          ← FSE Contact Us page template
    │   ├── page-pricing.html          ← FSE Pricing page template
    │   └── page-demo.html             ← FSE Demo page template (Calendly booking)
    ├── parts/
    │   ├── header.html                ← Header with Pricing / Schedule Demo / Contact / Sign In / Sign Up nav
    │   └── footer.html                ← Footer with product & company links
    └── assets/
        └── js/                        ← (empty — inline JS in templates)
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
7. **Pricing CTA** — link to pricing page
8. **Final CTA** — Sign Up + Sign In conversion block

---

## Demo Page Structure

The demo page (`/demo/`) follows this structure:

1. **Hero** — H1 "Book a LeaseBase Demo", supporting copy, Schedule Your Demo + Contact Us CTAs
2. **Inline Calendly scheduler** — embedded at `https://calendly.com/leasebase/leasebase-product-demo`
3. **Fallback link** — direct link to Calendly for users with scheduler issues
4. **What you'll see** — 4 feature preview cards (Owner Dashboard, Lease Workflows, Rent Collection, Maintenance)
5. **Final CTA** — Schedule Demo + Contact Us conversion block

---

## Pricing Page Structure

The pricing page (`/pricing/`) follows this structure:

1. **Hero** — headline, subheadline, Get Started + Contact Us CTAs
2. **Pricing cards** — Starter (Free), Growth ($9/unit/mo, highlighted), Portfolio (Contact Us)
3. **Feature comparison** — grid comparing features across plans
4. **Connected platform** — Owner + Tenant value propositions
5. **Why LeaseBase** — 5 benefit cards
6. **FAQ** — 7 expandable questions using native `<details>` elements
7. **Final CTA** — Get Started + Contact Us conversion block

---

## CTA Routing

> **Temporary DEV links** — update to production URLs when PROD goes live.
> Auth URL constants are defined in `leasebase-theme/functions.php` at the top of the file.

- **Sign Up** → `https://signup.dev.leasebase.ai`
- **Sign In** → `https://signin.dev.leasebase.ai`
- **Contact Us** → `/contact/` (LeaseBase-hosted contact form)
- **Schedule Demo** → `/demo/` (Calendly inline embed)

> **No `mailto:` CTA links remain in the theme.** The email address `info@leasebase.ai` is displayed as a plain text link in the Contact page sidebar and in the footer Connect column, but all CTA buttons and nav links point to `/contact/` or `/demo/`.

Both auth links appear in: header nav, hero, feature section, dashboard CTA, final CTA, and footer.

The application handles role selection (Owner / Tenant) after sign-in. No role selection on the WordPress site.

### Contact Form

The `/contact/` page is powered by:

- **FSE template**: `leasebase-theme/templates/page-contact.html` — applied automatically to any WP page with slug `contact`.
- **REST endpoint**: `POST /wp-json/leasebase/v1/contact` — stores submissions as `lb_contact` CPT posts and sends email notification to the site admin.
- **Admin view**: WP Admin → Contact Messages (stores all submissions with Name, Email, Subject, Date columns).
- **Rate limiting**: 5 submissions per IP per hour.

Form fields: Full Name, Email Address, Subject (dropdown), Message.

---

## Deployment Steps

### Step 1: Upload Theme Files

Upload the entire `leasebase-theme/` directory to the WordPress server.

```bash
scp -r leasebase-theme/ user@server:/var/www/html/wp-content/themes/leasebase-theme/
```

Or upload via **Appearance → Themes → Add New → Upload Theme** (zip the folder first).

### Step 2: Create the Demo Page in WP Admin

1. Go to **WP Admin → Pages → Add New**
2. Set the title to **Demo** and the slug to **demo** (check the URL field in the sidebar)
3. The FSE template `page-demo.html` should apply automatically since the slug matches.
4. If the template does **not** apply automatically:
   - Switch to **Code editor** (⋮ menu → Code editor)
   - Paste the contents of `demo-content.html`
   - Switch back to **Visual editor** to verify the Calendly widget renders
5. Set **Status** to Published and click **Publish**
6. Verify the page is live at `https://leasebase.ai/demo/`
7. Confirm the Calendly scheduler loads inline.

### Step 3: Create the Contact Us Page in WP Admin

1. Go to **WP Admin → Pages → Add New**
2. Set the title to **Contact Us** and the slug to **contact** (check the URL field in the sidebar)
3. The FSE template `page-contact.html` should apply automatically since the slug matches.
4. If the template does **not** apply automatically:
   - Switch to **Code editor** (⋮ menu → Code editor)
   - Paste the contents of `contact-content.html`
   - Switch back to **Visual editor** to verify the form renders
5. Set **Status** to Published and click **Publish**
6. Verify the page is live at `https://leasebase.ai/contact/`

### Step 4: Update Homepage Content (if using Page Editor)

1. Go to **WP Admin → Pages → Home** (page ID 5)
2. Switch to **Code editor** (⋮ menu)
3. Replace all content with the contents of `homepage-content.html`
4. Switch back to **Visual editor** to verify
5. Click **Update**

Note: If using the FSE template (`templates/front-page.html`), this step may not be needed as the template renders directly.
### Step 5: Create Pricing Page

1. Go to **WP Admin → Pages → Add New**
2. Title: **Pricing** / Slug: `pricing`
3. Switch to **Code editor** (⋮ menu)
4. Paste the contents of `pricing-content.html`
5. Switch back to **Visual editor** to verify
6. Set Template to **Pricing** if available in the Page Attributes sidebar
7. Click **Publish**

Note: If using FSE templates, the `templates/page-pricing.html` template will auto-apply to the page with slug `pricing`.
### Step 6: Verify

- [ ] Homepage loads with hero, problem, platform, features, trust, pricing CTA, and final CTA
- [ ] Homepage final CTA has both "Create Your Owner Account" and "Schedule a Demo" buttons
- [ ] Header shows LeaseBase brand + **Pricing** / **Schedule Demo** / **Contact** / **Sign In** / **Sign Up** nav
- [ ] Header "Schedule Demo" link points to `/demo/`
- [ ] Header "Contact" link points to `/contact/`
- [ ] Footer Company column: "Contact Us" link points to `/contact/` (not mailto:)
- [ ] Sign Up buttons link to `https://signup.dev.leasebase.ai`
- [ ] Sign In buttons link to `https://signin.dev.leasebase.ai`
- [ ] Page title: "LeaseBase — The Operating System for Rental Property Owners"
- [ ] View source shows `<meta name="description" ...>` and Open Graph tags
- [ ] Footer shows Product, Company, and Connect columns
- [ ] Mobile responsive layout works correctly
- [ ] No "early access", "pilot program", or "Property Manager" language visible
- [ ] `/demo/` page loads with correct H1 "Book a LeaseBase Demo" and LeaseBase styling
- [ ] Calendly inline widget loads on `/demo/`
- [ ] Fallback Calendly link is present on `/demo/`
- [ ] Demo page title: "LeaseBase Demo | Book a Product Demo"
- [ ] `/contact/` page loads with form, correct H1 "Get in Touch", and LeaseBase styling
- [ ] Contact page sidebar shows "Book a Demo" card linking to `/demo/`
- [ ] Contact form submission returns success message (verify `POST /wp-json/leasebase/v1/contact`)
- [ ] WP Admin → Contact Messages shows submitted messages
- [ ] Pricing page hero "Contact Us" CTA points to `/contact/` (not mailto:)
- [ ] Pricing page Portfolio card "Contact Us" CTA points to `/contact/` (not mailto:)
- [ ] Pricing page final CTA "Contact Us" points to `/contact/` (not mailto:)
- [ ] Pricing page Growth card has "Schedule a demo" link pointing to `/demo/`
- [ ] No `mailto:` links remain in any CTA button or nav element

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
7. **Configure SMTP/SES** on the WordPress server so `wp_mail()` delivers contact form notifications reliably (e.g., via WP Mail SMTP plugin or server-level SMTP config). Verify by submitting a test contact message and checking the admin inbox.
8. **Update pricing page** — all `mailto:` CTAs have been replaced with `/contact/` links. No further action needed.
