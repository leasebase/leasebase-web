# Owner Portfolio — Screen Map

## Routes

```
/app/properties            → Properties list (PropertiesTable + empty state)
/app/properties/new        → Create property (PropertyForm)
/app/properties/[id]       → Property detail (Overview / Units / Edit tabs)
/app/units/[id]            → Unit detail (owner branch with edit modal)
```

## Component Hierarchy

```
app/(dashboard)/app/properties/page.tsx
├── OwnerPropertiesPage
│   ├── PropertiesSkeleton              (loading state)
│   ├── PropertiesEmptyState            (zero properties)
│   └── PropertiesTable                 (DataTable with columns)
│       ├── Column: Property (link)
│       ├── Column: Address
│       ├── Column: Units (count)
│       ├── Column: Occupancy (Badge)
│       └── Column: Status (Badge)
└── PMPropertiesPage                    (existing PM branch, unchanged)

app/(dashboard)/app/properties/new/page.tsx
└── PropertyForm                        (create mode)
    ├── Input: Property Name
    ├── Input: Address Line 1
    ├── Input: Address Line 2
    ├── Input: City
    ├── Select: State
    └── Input: ZIP Code

app/(dashboard)/app/properties/[id]/page.tsx
├── OwnerPropertyDetail
│   ├── Breadcrumb: Properties → {name}
│   ├── Tab: Overview
│   │   ├── Address card
│   │   ├── Occupancy stats
│   │   ├── Scheduled rent
│   │   └── Details (status, country, dates)
│   ├── Tab: Units
│   │   ├── UnitsTable
│   │   │   ├── Column: Unit (link)
│   │   │   ├── Column: Bed / Bath
│   │   │   ├── Column: Sq Ft
│   │   │   ├── Column: Rent
│   │   │   └── Column: Status (Badge)
│   │   └── Modal: Add Unit (UnitForm)
│   └── Tab: Edit
│       └── PropertyForm (edit mode)
└── PMPropertyDetail                    (existing PM branch, unchanged)

app/(dashboard)/app/units/[id]/page.tsx
└── OwnerUnitDetail
    ├── Breadcrumb: Properties → {property} → Unit {number}
    ├── Unit info cards
    └── Modal: Edit Unit (UnitForm)
```

## Navigation Flow

```
Owner Dashboard
  └─→ Properties List (/app/properties)
        ├─→ Add Property (/app/properties/new)
        └─→ Property Detail (/app/properties/[id])
              ├─→ Overview tab (default)
              ├─→ Units tab
              │     ├─→ Add Unit modal
              │     └─→ Unit Detail (/app/units/[id])
              │           └─→ Edit Unit modal
              └─→ Edit tab (inline property edit)
```

## Deferred Screens

- `/app/units` (owner units list) — No org-scoped `GET /api/units` endpoint exists. Units are accessed property-first only.
- Nav item for Units remains PM-only in `appNav.ts`.
