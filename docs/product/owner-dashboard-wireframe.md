# Owner Dashboard — Wireframe / Layout Specification

## Desktop Layout (≥1280px)

```
┌─────────────────────────────────────────────────────────────────────┐
│  PageHeader: "Owner dashboard"  +  description                      │
│  "Track income, occupancy, and operations across your portfolio."   │
├─────────────────────────────────────────────────────────────────────┤
│                        KPI GRID (4 columns)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │Properties│ │  Units   │ │ Occupied │ │ Vacancy  │               │
│  │    12    │ │    48    │ │    44    │ │   8.3%   │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │Scheduled │ │Collected │ │ Overdue  │ │Open Maint│               │
│  │ $42,000  │ │ $38,200  │ │  $3,800  │ │    5     │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
├──────────────────────────────┬──────────────────────────────────────┤
│       ALERTS PANEL           │       QUICK ACTIONS                  │
│  ┌─ 🔴 2 late rent          │  [+ Add Property] [+ Add Unit]      │
│  ├─ 🟡 3 leases expiring    │  [+ Invite Tenant] [+ Create Lease] │
│  ├─ 🟡 1 aging maintenance  │  [+ Enable Payments]                │
│  └─ 🔵 Setup: add tenants   │  [+ Upload Document]                │
├──────────────────────────────┴──────────────────────────────────────┤
│                     MAIN CONTENT (2 columns)                        │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐ │
│  │   PORTFOLIO HEALTH       │  │   RECENT ACTIVITY                │ │
│  │                          │  │                                  │ │
│  │  Occupancy   ████████░░  │  │  • Payment received — $1,450    │ │
│  │              91.7%       │  │    Alice Johnson · 2h ago       │ │
│  │                          │  │  • Maintenance created           │ │
│  │  Collection  ██████░░░░  │  │    Unit 3C · Leaking faucet     │ │
│  │              90.9%       │  │  • Lease renewed                 │ │
│  │                          │  │    Bob Smith · Unit 1A           │ │
│  │  Open Work   5 orders    │  │  • Tenant invited               │ │
│  │  Orders      ░░░░░░░░░░  │  │    carol@email.com · 1d ago    │ │
│  │                          │  │                                  │ │
│  └──────────────────────────┘  └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                    PROPERTIES SUMMARY                                │
│  ┌─ 123 Main St          4 units   4/4 occupied   [100%] ✅       │
│  ├─ 456 Elm Ave          2 units   2/2 occupied   [100%] ✅       │
│  ├─ 789 Oak Blvd         8 units   6/8 occupied   [ 75%] ⚠️       │
│  └─ 321 Pine Dr          1 unit    0/1 occupied   [  0%] 🔴       │
└─────────────────────────────────────────────────────────────────────┘
```

## Card Ordering (top to bottom)

1. **PageHeader** — always visible
2. **KPI Grid** — 8 cards, 4×2 on desktop
3. **Alerts + Quick Actions** — side by side on desktop
4. **Portfolio Health + Activity Feed** — side by side on desktop
5. **Properties Summary** — full-width table at bottom

## Tablet Layout (768px–1279px)

- KPI Grid: 2 columns × 4 rows
- Alerts + Quick Actions: stacked vertically (alerts first)
- Portfolio Health + Activity Feed: stacked vertically
- Properties Summary: full width, horizontal scroll for narrow viewports

## Mobile Layout (<768px)

- KPI Grid: 2 columns × 4 rows (compact cards)
- Alerts: full width, collapsible
- Quick Actions: 2×3 grid of icon buttons
- Portfolio Health: full width
- Activity Feed: full width
- Properties Summary: card layout (one property per card, not table rows)

## Breakpoints (Tailwind classes)

- `sm:` — 640px (minor adjustments)
- `md:` — 768px (tablet: 2-col KPIs, stacked sections)
- `lg:` — 1024px (wide tablet: side-by-side sections begin)
- `xl:` — 1280px (desktop: full 4-col KPI grid)

## Component Sizing

- **StatCard**: min-height 100px, padding 16px
- **Alert item**: height ~40px, left color accent bar (4px)
- **Activity item**: height ~56px, avatar + text + timestamp
- **Property row**: height ~48px, hover highlight
- **Quick Action button**: 120px × 72px, icon + label, ghost variant

## Color Accents

- KPI icons: `brand-400` (emerald)
- Danger alerts: `danger` (red-500)
- Warning alerts: `warning` (amber-500)
- Info alerts: `info` (blue-500)
- Success badges: `success` (emerald-500)
- Progress bars: `brand-500` fill on `slate-800` track

## Empty State Layout

When `totalProperties === 0`:
```
┌─────────────────────────────────────────────────────────────────────┐
│  PageHeader: "Owner dashboard"                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│              🏢  (Building icon, 64px, slate-500)                  │
│                                                                     │
│           Welcome to Leasebase                                      │
│     Add your first property to get started.                        │
│     We'll help you set up units, tenants,                          │
│     and start collecting rent.                                      │
│                                                                     │
│              [ + Add Property ]  (primary button)                   │
│                                                                     │
│     Setup checklist:                                                │
│     ○ Add a property                                                │
│     ○ Add units                                                     │
│     ○ Invite tenants                                                │
│     ○ Create leases                                                 │
│     ○ Enable payments                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Notes for Figma Implementation

- Use the LeaseBase design token system (see `src/design-system/tokens.css`)
- Dark theme only — `slate-950` base, `slate-900` surfaces, `slate-800` borders
- Font: Inter (via tokens), weights: 400/500/600/700
- Cards use `shadow-card` token (`--lb-shadow-md`)
- All interactive elements must have `focus-visible:ring-2 ring-brand-500`
- Minimum touch target: 44×44px for mobile
- Use lucide-react icon set (already in project)
- Progress bars: 8px height, rounded-full, brand-500 fill
