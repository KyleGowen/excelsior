# CardTile

Grid tile for a single catalog card: card art + name + set/rarity, with optional
overlay and footer slots. Used by the Database and Collection grids.

## Props
| Prop | Type | Default | Notes |
|---|---|---|---|
| `card` | `CatalogCard` | – | The card to render. |
| `onClick` | `() => void` | – | Fires on the art button (opens detail panel). |
| `overlay` | `ReactNode` | – | Top-right overlay (e.g. owned `x2` badge). |
| `footer` | `ReactNode` | – | Footer slot (e.g. `QuantityStepper` or +Deck button). |
| `dimmed` | `boolean` | `false` | Dims art (unowned cards in Collection). |
| `showMeta` | `boolean` | `true` | Toggle the name/set line. |
| `catalogType` | `CatalogType` | – | Database grid: landscape vs portrait art frame + `contain` fit. |
| `progressive` | `boolean` | `Boolean(catalogType)` | Upgrade a thumbnail to full-size art. Database browse grids pass `false`; detail panels still use full-size art. |
| `hasFoilVersion` | `boolean` | `false` | Silver ✦ at the right of the card-name row (`title="has foil"`). |
| `showFoilEffect` | `boolean` | `true` | When false, suppresses the prismatic foil overlay on foil printings. |

## Notes
- Name comes from `cardDisplayName(card)`; art path from `card.image_path || card.image`.
- With `catalogType`, characters use `380:280` landscape; locations/battlegrounds/events use `236:151`; other types use `5:7` portrait. Images use `card-image--contain` (no crop). Database grids keep thumbnails until a card is opened; other consumers retain the default progressive upgrade. Missing thumbnails retain the shared full-art fallback.
- The name row keeps the silver foil indicator beside the name. The metadata row below
  shows `{set} {set_number}` on the left and rarity on the right.
- The art is a `<button>` labelled `View {name}` for keyboard/AT access.
- Owned/selected emphasis and dimming are CSS-only (`.card-tile--dimmed`).
