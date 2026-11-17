# CardDetailPanel

Slide-out panel showing full detail for a catalog card: full art, type/set/rarity/number
chips, an action slot, an Ability section, an auto-generated Details key/value list, and
linked official errata at the bottom.

## Props
| Prop | Type | Notes |
|---|---|---|
| `card` | `CatalogCard \| null` | The card; renders nothing when null. |
| `type` | `CatalogType \| null` | Drives the type label. |
| `open` | `boolean` | Visibility (wraps `SlideOutPanel`). |
| `onClose` | `() => void` | Close handler. |
| `actions` | `ReactNode` | Action area under the header (e.g. Add to Deck button, or a collection `QuantityStepper`). |
| `hasFoil` | `boolean` | When set, renders **Has Foil** Yes/No in Details (foil variant exists). |
| `isFoil` | `boolean` | When set, renders **Is Foil** Yes/No in Details (this row is a foil printing). |
| `showFoilEffect` | `boolean` | When false, suppresses the prismatic foil overlay on the hero image (default true). Metadata rows unchanged. |
| `setDisplayName` | `string` | Friendly set name for the **Set** Details row (falls back to `card.set` code when omitted). |
| `prePlaced` | `boolean` | Shows the active **Pre-Placed** status and Draw Hand explanation for every viewer when true. |
| `prePlacedEligible` + `onTogglePrePlaced` | `boolean` + callback | Makes that status pill editable for an eligible deck owner; read-only viewers see the status but no control. |

## Details list
The **Artist** row below **Set** uses the credit for the selected printing. The row appears when a
credit is available.

Auto-built from the card's own fields, minus a `HIDDEN_FIELDS` set (ids, image paths,
stats, ability/effect fields, timestamps, `is_foil`, `threat_level`, `set`). Keys are humanized
(`set_number` → "Set Number"); booleans render Yes/No; arrays join with commas; empty
values are skipped. Pass `hasFoil` to show foil availability from the foil-card map.

**Any Character special flags:** `is_cataclysm`, `is_assist`, and `is_ambush` render as
**Is Cataclysm**, **Is Assist**, and **Is Ambush** only when `type === 'special-cards'`
and the linked character is **Any Character** (`cardCharacterName` + `isAnyCharacterName`).
Character-linked specials omit these rows. Logic lives in `cardDetailFields.ts`
(`shouldShowCardDetailField`).

**Collapsed secondary metadata:** `one_per_deck` / `is_one_per_deck`, all function-icon
booleans, and `banned` live in a native `<details>` disclosure labeled **More**. It is
collapsed whenever a card is opened and uses the browser's built-in keyboard and screen
reader semantics. Set, foil state/availability, character, set number, rarity, and every
other eligible row remain visible.

## Official errata
Catalog cards linked through `card_errata` carry an ordered `errata` array. The panel
renders every linked entry after Details with its title, card-scoped plain text (shared
guidance retained and paragraph breaks preserved), and canonical **View official errata**
deep link. The database can narrow a multi-card source entry for each association without
changing the canonical transcription. Cards without errata do not render an empty section.
Entries use the same flat panel surface and horizontal dividers as the surrounding detail
rows; they intentionally avoid nested cards, accent rails, tinted fills, and gradients so
long rulings remain easy to scan.

## Mobile scrolling
The card-detail drawer adds bottom scroll clearance equal to the fixed mobile navigation,
the device safe-area inset, and the panel's standard spacing. This keeps the final detail or
errata row fully visible above the bottom navigation at the end of the drawer without changing
desktop spacing or other slide-out panels.

## Landscape art frames (characters, locations, events)
- **Characters**: `.card-detail__image--characters` — `aspect-ratio: 380 / 280` (matches DB grid `CardTile`).
- **Locations & events**: `.card-detail__image--locations` / `.card-detail__image--events` — `aspect-ratio: 236 / 151` (matches DB grid `CardTile`).
- **All other types**: default portrait `.card-detail__image` — `aspect-ratio: 5 / 7`.
- Full art uses `CardImage` with `useThumbnail={false}` + `.card-image--contain`.

## Notes
- Uses `cardAbilityText` from `catalogTypeMap` so ability extraction is consistent across card types.
- Primary stats (Energy, Combat, Brute Force, Intelligence, Threat) are shown on character card art — no duplicate stat row in the slide-out.
- A pre-placed card's status is part of the deck instance, not the catalog card: public/read-only deck detail must expose it even though only the owner can toggle it.
