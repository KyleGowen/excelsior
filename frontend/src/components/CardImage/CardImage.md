# CardImage

Renders a single OverPower card image with loading/error handling. This is the **only**
sanctioned way to display card art — it routes paths through
[`lib/images/cardImages.ts`](../../lib/images/cardImages.ts) so CDN base and thumbnail rules
apply consistently (and keep working after the CDN cutover).

## Props
| Prop | Type | Default | Notes |
|---|---|---|---|
| `imagePath` | `string \| null` | – | Raw card path (`card.image_path` / `card.image`). |
| `alt` | `string` | – | Required alt text. |
| `useThumbnail` | `boolean` | `true` | Use the `/thumb/` variant (tiles, ribbons, lists). Set `false` for full art (detail panel). |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Native loading hint. |
| `className`, `style` | – | – | Passthrough. |
| `isFoil` | `boolean` | – | When true, wraps art in `FoilCard` prismatic laminate. |
| `showFoilEffect` | `boolean` | `true` | When false, suppresses the foil overlay even if `isFoil` is true. |
| `foilSeed`, `foilSize`, `foilEagerIntro` | – | – | Passed through to `FoilCard` when the overlay is shown. |

## Behavior
- Shows a loading state until the image fires `onLoad`.
- On error, swaps to `placeholderImageUrl()` (a neutral "No image" frame) — never a broken
  image icon.
- `decoding="async"`, `draggable={false}`.

## Notes
- Do not hardcode image URLs anywhere else; always go through this component or the
  `cardImages.ts` helpers.
- `.card-image--contain` modifier renders full art without cropping (used by the detail
  panel).


A session cache hit records a decoded URL, not completion of every mounted image
using it. If Draw Hand reveals a URL while a grid copy is offscreen, that grid copy
must still call the reveal helper when it approaches the viewport. The helper
attaches the cached URL and decodes this target without another network preload.
Keep the viewport guard: populating the session alone must not eagerly attach
full artwork to an offscreen grid card.
