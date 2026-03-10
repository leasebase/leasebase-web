# LeaseBase — WordPress Landing Page Deployment

This directory contains all files needed to transform the leasebase.ai homepage into a high-conversion SaaS landing page.

**No new plugins required.** Everything is implemented through the child theme (`leasebase-theme`) and Gutenberg blocks.

---

## File Structure

```
wordpress-landing/
├── README.md                          ← this file
├── homepage-content.html              ← Gutenberg block markup for the homepage
└── leasebase-theme/
    ├── style.css                      ← Updated child theme styles (v2.0.0)
    ├── functions.php                  ← SEO meta, form handler, CPT, performance
    └── assets/
        └── js/
            └── early-access-form.js   ← Form AJAX handler
```

---

## Deployment Steps

### Step 1: Upload Theme Files

Upload the entire `leasebase-theme/` directory to the WordPress server, replacing the existing child theme.

**Option A — via SFTP / SSH:**

```bash
# Replace with your actual server credentials and path
scp -r leasebase-theme/ user@server:/var/www/html/wp-content/themes/leasebase-theme/
```

**Option B — via WordPress Admin (zip upload):**

1. Zip the `leasebase-theme/` folder
2. Go to **Appearance → Themes → Add New → Upload Theme**
3. Upload the zip and activate

**Option C — via File Manager (cPanel/Lightsail):**

1. Navigate to `wp-content/themes/leasebase-theme/`
2. Upload/replace all files

### Step 2: Update Homepage Content

1. Go to **WP Admin → Pages → Home** (page ID 5)
2. Click the **⋮** (three dots) menu in the top-right
3. Select **Code editor**
4. **Select all** existing content and **delete** it
5. Open `homepage-content.html` and copy its entire content
6. Paste into the code editor
7. Switch back to **Visual editor** to verify the layout
8. Click **Update**

### Step 3: Verify

After deployment, verify:

- [ ] Homepage loads with the new hero, features, target customer, preview, social proof, CTA, and footer sections
- [ ] The "Request Early Access" form submits successfully
- [ ] Form submissions appear in **WP Admin → Early Access** (left sidebar)
- [ ] Email notification is received at the admin email
- [ ] Page title shows "LeaseBase — Property Management Software"
- [ ] View page source shows `<meta name="description" ...>` and Open Graph tags
- [ ] Mobile responsive layout works correctly
- [ ] Smooth scroll works when clicking "Request Early Access" or "See the Product" buttons

---

## How to Edit Going Forward

### Edit page content
Go to **Pages → Home** and use the Gutenberg visual editor. Each section is a separate Group block — click to edit text, rearrange, or add new blocks.

### Edit styles
Modify `wp-content/themes/leasebase-theme/style.css`. All custom classes use the `lb-` prefix to avoid conflicts.

### Edit form behavior
Modify `wp-content/themes/leasebase-theme/assets/js/early-access-form.js`.

### View signups
Go to **WP Admin → Early Access** to see all form submissions with name, email, role, and units.

### Add product screenshots
Replace the placeholder in Section 4 with an `<img>` tag. The CSS class `lb-preview img` will automatically style it with rounded corners and shadow.

### Update footer links
Edit the footer HTML block in the homepage content (Section 7), or modify it via **Appearance → Editor → Template Parts → Footer** for site-wide changes.

### Add a Privacy Policy page
Create a new page at `/privacy-policy/` — the footer already links to it.

---

## Architecture Notes

### Form Handling
- **No form plugin needed.** The form uses a custom WP REST API endpoint (`POST /wp-json/leasebase/v1/early-access`).
- Submissions are stored as a custom post type (`lb_submission`) visible under **Early Access** in the admin sidebar.
- Email notifications are sent to the WordPress admin email via `wp_mail()`.
- Rate limiting: max 3 submissions per IP per hour (via transients).
- Duplicate emails are detected and handled gracefully.

### SEO
- Title tag, meta description, canonical URL, Open Graph, and Twitter Card tags are added via `functions.php` — no SEO plugin needed.
- If you later install Yoast or RankMath, remove the `leasebase_seo_meta()` function and `leasebase_document_title()` filter to avoid duplicate tags.

### Performance
- Emoji scripts removed (~10KB saved)
- WordPress version/RSD/shortlink headers removed
- Inter font loaded with `display=swap`
- No jQuery dependency — vanilla JS only
- No page builder plugins
- CSS uses CSS custom properties for efficient theming

---

## Recommended Next Steps

1. **Add real product screenshots** to Section 4
2. **Replace placeholder testimonials** with real early-user quotes
3. **Set up transactional email** (e.g., Amazon SES or SMTP plugin) for reliable form notifications
4. **Add Google Analytics / Plausible** for conversion tracking
5. **Create Privacy Policy and Terms** pages
6. **Add a favicon** via Appearance → Customize → Site Identity
7. **Update social media links** in the footer with real profiles
8. **Consider adding a blog** for SEO content marketing
9. **Run Lighthouse audit** after deployment to baseline performance
10. **Set up a staging environment** for testing future changes
