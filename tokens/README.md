# LeaseBase Design Tokens

Canonical, platform-agnostic design tokens for the LeaseBase UI.

## Structure

| File | Contents |
|---|---|
| `colors.json` | Brand primary/secondary, neutral, semantic (success/warning/danger/info), surface |
| `typography.json` | Font families, sizes, weights, line-heights, letter-spacing |
| `spacing.json` | Spacing scale (0–64 units, 1 unit = 0.25 rem = 4 px) |
| `radius.json` | Border-radius scale (none → full) |
| `shadows.json` | Box-shadow scale (sm → 2xl), tuned for dark surfaces |

## Naming Conventions

Tokens follow a dot-delimited hierarchy:

```
color.brand.primary.500
color.semantic.danger.600
typography.size.lg
spacing.4
radius.lg
shadow.md
```

## CSS Custom Properties

Run the generator to produce CSS variables consumed by Tailwind:

```bash
node scripts/generate-tokens.mjs
```

Output: `src/design-system/tokens.css`

The generated file maps every token to a `--lb-*` CSS custom property:
- `--lb-color-brand-primary-500`
- `--lb-typography-size-lg`
- `--lb-spacing-4`
- `--lb-radius-lg`
- `--lb-shadow-md`

## Tailwind Integration

`tailwind.config.ts` references these CSS variables so updating a token JSON
and re-running the generator is enough — no manual Tailwind config edits needed.

## Adding / Changing Tokens

1. Edit the relevant JSON file in `tokens/`.
2. Run `node scripts/generate-tokens.mjs`.
3. Verify in the dev server (`npm run dev`) that components reflect the change.
4. Commit both the JSON and the generated CSS.

## WCAG Accessibility

All foreground/background color pairings in the default theme must meet
**WCAG AA** contrast (≥ 4.5 : 1 for normal text, ≥ 3 : 1 for large text).
When adding colors, verify with a contrast checker before committing.
