# WordPress Marketing Site — Documentation

This directory documents how the LeaseBase WordPress marketing site (`leasebase.ai`) works, how to safely modify it, and how to deploy changes.

## Documents

- [Site Structure](site-structure.md) — file-by-file map of the WordPress theme repo area
- [Page Rendering Model](page-rendering-model.md) — how Home, Pricing, Contact, Demo actually render
- [Branding System](branding-system.md) — colors, typography, logos, design tokens
- [Deployment Notes](deployment-notes.md) — step-by-step deploy + validate workflow
- [Future Work Guidance](future-work-guidance.md) — recommended strategy for modifying the site

## Quick facts

- **Theme:** `leasebase-theme`, child of Twenty Twenty-Five
- **Rendering:** Full Site Editing (FSE) with slug-based template selection
- **Server:** AWS Lightsail (Bitnami WordPress), SSH via `lightsail-default.pem`
- **Repo path:** `wordpress-landing/leasebase-theme/`
- **Brand color:** `#2563eb` (blue), defined as CSS custom properties in `style.css`
- **Auth URLs:** Currently `.dev.leasebase.ai` — hardcoded across templates and content files
