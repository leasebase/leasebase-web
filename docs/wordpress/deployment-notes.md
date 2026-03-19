# Deployment Notes

## Server

- **Host:** AWS Lightsail (Bitnami WordPress stack)
- **Domain:** `leasebase.ai`
- **SSH key:** `~/.ssh/lightsail-default.pem`
- **User:** `bitnami`
- **Theme path:** `/opt/bitnami/wordpress/wp-content/themes/leasebase-theme/`
- **Services:** Apache + MariaDB + PHP-FPM, managed by `/opt/bitnami/ctlscript.sh`

## Deployment Workflow

### 1. Merge to develop

Ensure the feature branch is merged to `develop` via PR on GitHub.

### 2. Create server backup

```bash
ssh -i ~/.ssh/lightsail-default.pem bitnami@leasebase.ai \
  "cd /opt/bitnami/wordpress/wp-content/themes && \
   cp -r leasebase-theme leasebase-theme.bak-\$(date +%Y%m%d-%H%M%S)"
```

### 3. Upload theme files

rsync is not available on the server. Use scp:

```bash
# Root files
scp -i ~/.ssh/lightsail-default.pem \
  wordpress-landing/leasebase-theme/style.css \
  wordpress-landing/leasebase-theme/functions.php \
  wordpress-landing/leasebase-theme/theme.json \
  bitnami@leasebase.ai:/opt/bitnami/wordpress/wp-content/themes/leasebase-theme/

# Templates
scp -i ~/.ssh/lightsail-default.pem \
  wordpress-landing/leasebase-theme/templates/*.html \
  bitnami@leasebase.ai:/opt/bitnami/wordpress/wp-content/themes/leasebase-theme/templates/

# Parts (header/footer)
scp -i ~/.ssh/lightsail-default.pem \
  wordpress-landing/leasebase-theme/parts/*.html \
  bitnami@leasebase.ai:/opt/bitnami/wordpress/wp-content/themes/leasebase-theme/parts/

# Assets (only if changed)
scp -i ~/.ssh/lightsail-default.pem \
  wordpress-landing/leasebase-theme/assets/* \
  bitnami@leasebase.ai:/opt/bitnami/wordpress/wp-content/themes/leasebase-theme/assets/
```

### 4. Fix file permissions

```bash
ssh -i ~/.ssh/lightsail-default.pem bitnami@leasebase.ai \
  "cd /opt/bitnami/wordpress/wp-content/themes/leasebase-theme && \
   sudo chown -R bitnami:daemon . && \
   sudo find . -type f -exec chmod 664 {} \; && \
   sudo find . -type d -exec chmod 775 {} \;"
```

### 5. Flush caches

```bash
ssh -i ~/.ssh/lightsail-default.pem bitnami@leasebase.ai \
  "sudo /opt/bitnami/ctlscript.sh restart php-fpm"
```

### 6. Validate

Test each URL in incognito:

- `https://leasebase.ai/` — homepage
- `https://leasebase.ai/pricing/` — pricing page
- `https://leasebase.ai/contact/` — contact form page
- `https://leasebase.ai/demo/` — demo/Calendly page

## Validation Checklist

After every deployment, verify:

- [ ] All 4 pages return HTTP 200
- [ ] Homepage shows correct hero text and trust strip
- [ ] Navigation shows: Features | Pricing | Demo | Login | Start Free
- [ ] Pricing cards have correct CTA text and layout is intact
- [ ] Contact form submits successfully (check status message)
- [ ] Contact page is fully styled (not primitive/unstyled)
- [ ] Demo page loads Calendly widget
- [ ] Footer links are correct
- [ ] Brand color (blue) is visible on buttons and links
- [ ] No "Sign Up" text visible (should all be "Start Free")
- [ ] No tenant signup references (should say "via owner invitation")
- [ ] Mobile layout is responsive

## Historically Sensitive Pages

### Contact (`/contact/`)

This page has broken multiple times due to:
- Slug mismatch (e.g., `contact-us` instead of `contact`)
- Site Editor DB override replacing the theme template
- Missing template application causing unstyled rendering

**After every deploy**, specifically verify:
1. Page is styled with the LeaseBase contact form layout
2. Form submission works (POST to `/wp-json/leasebase/v1/contact`)
3. Sidebar cards (Email, Demo, Start Free) are visible

If it looks primitive/unstyled, check:
- WP Admin → Pages → Contact → verify slug is `contact`
- Appearance → Editor → Templates → Contact → check for "Reset to theme default"

### Demo (`/demo/`)

The Calendly embed depends on an external script. Verify it loads. If not:
- Check for CSP headers blocking `assets.calendly.com`
- A fallback direct link is provided below the embed

## Rollback

If something breaks, restore the backup:

```bash
ssh -i ~/.ssh/lightsail-default.pem bitnami@leasebase.ai \
  "cd /opt/bitnami/wordpress/wp-content/themes && \
   rm -rf leasebase-theme && \
   cp -r leasebase-theme.bak-YYYYMMDD-HHMMSS leasebase-theme && \
   sudo chown -R bitnami:daemon leasebase-theme && \
   sudo /opt/bitnami/ctlscript.sh restart php-fpm"
```

Replace `YYYYMMDD-HHMMSS` with the most recent backup timestamp. List available backups:

```bash
ssh -i ~/.ssh/lightsail-default.pem bitnami@leasebase.ai \
  "ls -d /opt/bitnami/wordpress/wp-content/themes/leasebase-theme.bak-*"
```
