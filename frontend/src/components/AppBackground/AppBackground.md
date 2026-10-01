# AppBackground

Full-viewport nebula background image with a darkening veil. Decorative only
(`aria-hidden`), sits behind page content.

## Props
| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'hero' \| 'subtle'` | `'subtle'` | `hero` = brighter, eager-loaded variant; `subtle` = dimmed, lazy (site-wide). |
| `className` | `string` | – | Extra classes merged onto the root. |

## Notes
- Renders `.app-bg` → `.app-bg__image` (the art) + `.app-bg__veil` (overlay). Styling/darkness
  is CSS-only in [`AppBackground.css`](./AppBackground.css), which also holds the `.app-root`
  layout helpers used by [`RootLayout`](../../app/RootLayout.tsx).
- Image asset `src/resources/images/login/login-bg.png` resolved via `assetUrl()` (CDN base),
  never a hardcoded path.
- Mount points: `RootLayout` renders `subtle` on every route. `hero` remains available for
  visual previews.
- When tuning darkness, adjust the `subtle` brightness/opacity/veil values. See also
  [`.cursorrules`](./.cursorrules).
