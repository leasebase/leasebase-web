# LeaseBase Design System

This document defines the visual language and component inventory for the LeaseBase web application. It serves as the source of truth for both code implementation and Figma design work.

## Brand Tokens

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| brand-500 | #10b981 | Primary actions, active states, focus rings |
| brand-600 | #059669 | Primary hover |
| brand-400 | #34d399 | Active nav text, links |
| slate-950 | #020617 | Page background |
| slate-900 | #0f172a | Card/input backgrounds, topbar |
| slate-800 | #1e293b | Borders, dividers |
| slate-400 | #94a3b8 | Secondary text |
| slate-200 | #e2e8f0 | Primary text on dark |
| success | #10b981 | Positive status |
| warning | #f59e0b | Caution status |
| danger | #ef4444 | Error/destructive |
| info | #3b82f6 | Informational |

### Typography

- **Font family**: Inter, system-ui fallback
- **Scale**: text-xs (12px), text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px), text-3xl (30px)
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing

Uses Tailwind default scale: 0.5 (2px), 1 (4px), 1.5 (6px), 2 (8px), 2.5 (10px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px).

### Radii

- `rounded` (default): 6px — inputs, buttons
- `rounded-lg`: 8px — cards, modals
- `rounded-xl`: 12px — large modals
- `rounded-full`: pills, avatars

### Shadows

- `shadow-card`: subtle card depth
- `shadow-modal`: elevated dialog

## Component Inventory

All components live in `src/components/ui/` and are exported from the barrel `src/components/ui/index.ts`.

### Form Controls
- **Button** — Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. States: loading, disabled.
- **Input** — With label, error, helperText. Focus ring, aria-invalid on error.
- **Select** — Same pattern as Input.
- **Checkbox** — With label. Accessible via htmlFor.
- **Switch** — Toggle with role="switch", aria-checked.

### Display
- **Badge** — Variants: success, warning, danger, info, neutral. Pill shape.
- **Card / CardHeader / CardBody / CardFooter** — Composable card with slot components.
- **DataTable** — Generic table with column config, empty/loading/error states, client-side pagination.
- **PageHeader** — Title + description + optional action buttons.

### Overlays
- **Modal** — Focus trap, Escape to close, portal-rendered, backdrop click to dismiss.
- **Toast / ToastProvider / useToast** — Context-based toast system. Variants: success, error, info. Auto-dismiss.
- **Tooltip** — Hover/focus triggered, accessible with aria-describedby.

### Navigation
- **Icon** — Maps string keys to Lucide React icons. Used in sidebar nav.
- **Breadcrumbs** — Auto-generated from route path (built into AppShell).

## Layout Architecture

```
app/
├── layout.tsx          — Root layout (html, body, globals.css)
├── page.tsx            — Redirects to /app
├── auth/
│   ├── login/page.tsx  — Login with email/password + dev bypass
│   ├── callback/page.tsx
│   ├── register/page.tsx
│   └── verify-email/page.tsx
├── app/
│   ├── layout.tsx      — AppShell (sidebar + topbar + breadcrumbs + ToastProvider)
│   └── page.tsx        — Persona-aware dashboard (PM / Owner / Tenant)
└── dashboard/page.tsx  — Legacy redirect → /app
```

## Figma File Structure (for manual creation)

When creating the Figma file "LeaseBase Web — UI Kit", use this page structure:

1. **01 Foundations** — Color styles, text styles, effect styles (shadows), grid definitions
2. **02 Components** — Auto-layout component sets with variants for each UI primitive
3. **03 Layouts** — AppShell frame (sidebar + topbar), page header, table layout, card grid
4. **04 Screens — Property Manager** — PM dashboard, properties list (skeleton)
5. **05 Screens — Owner** — Owner dashboard, properties summary
6. **06 Screens — Tenant** — Tenant dashboard, maintenance request
7. **99 Prototype** — Click flow: Login → Dashboard → Properties list

### Component naming convention
Use `ComponentName/Variant/Size/State` — e.g. `Button/Primary/Medium/Default`, `Button/Primary/Medium/Hover`.

## Accessibility Guidelines

- All interactive elements must have visible focus indicator (2px brand-500 ring)
- Icon-only buttons require `aria-label`
- Color contrast minimum 4.5:1 for normal text, 3:1 for large text
- Modal must trap focus and close on Escape
- Skip-to-content link at top of AppShell
- All form inputs must have associated labels
