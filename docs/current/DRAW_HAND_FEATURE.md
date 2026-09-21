# Draw Hand Feature Documentation

## Table of Contents

1. [Overview](#overview)
2. [User Experience](#user-experience)
3. [Code Organization](#code-organization)
4. [Draw Rules](#draw-rules)
5. [Catalog Resolution](#catalog-resolution)
6. [Tests](#tests)
7. [Visual Design](#visual-design)
8. [Simulate KO Integration](#simulate-ko-integration)
9. [Troubleshooting](#troubleshooting)
10. [Related Documentation](#related-documentation)

---

## Overview

**Draw Hand** simulates drawing a random opening hand from a deck. It excludes characters, locations, and missions from the draw pile, draws **8** playable cards by default, and may draw a **9th** when an event is in the first eight and the pile has more than eight cards.

### Key characteristics

| Property | Value |
|----------|--------|
| **Persistence** | None — in-memory only; resets on close or page refresh |
| **Availability** | All visitors (signed-out read-only decks included) when the deck has **≥8 playable** cards |
| **Venture / duplicate analysis** | **ADMIN or entitled Supporter USER only**; absent from ordinary USER, GUEST, and signed-out DOM/UI |
| **KO interaction** | Drawn cards dim when Simulate KO makes them unusable (no re-randomize on KO toggle) |
| **Pre-placed / `exclude_from_draw`** | Full row quantity counts toward the 8-card enable threshold; one physical copy from a flagged aggregate row is **omitted** from the draw pile |
| **HTTP API** | None — client-only |

---

## User Experience

Route: `/users/:userId/decks/:deckId` — [`DeckEditorPage.tsx`](../../frontend/src/features/deck-editor/DeckEditorPage.tsx).

1. **Draw Hand** button in the sticky header (`.deck-editor__actions`). Disabled with tooltip when playable count &lt; 8.
2. First click **opens** the panel and draws; button gets `.is-active`. Second click, **×**, or backdrop **closes** and clears the hand.
3. After each draw or redraw, cards are **sorted for display** by deck-editor section order (`DECK_EDITOR_SECTION_ORDER`), then by the same within-type sort as the deck grid (power: value/type; special: character then name; others: name A→Z). Random selection is unchanged; manual drag reorder on desktop overrides until the next draw/redraw.
4. **Drawn Hand** panel: **Desktop** — slides down from the top (`SlideOutPanel` `side="top"`, `position="absolute"`); deck grid remains visible behind blurred scrim. **Mobile** — full-viewport overlay (`position="fixed"`, `100dvh`); deck chrome hidden behind opaque panel. The consolidated header layout—title, **Draw again**, and close—is shared by every viewer. For ADMIN and entitled Supporter USER viewers, it also contains a panel-centered **Hand analysis** module grouping the informational **Venture total** and **Duplicates** metrics beneath an “After duplicate rules” caption. On mobile, analysis spans the full padded width on the first header row, while **Drawn Hand**, **Draw again**, and close share the second row. Other viewers receive no analysis prop, markup, or duplicate styling.
5. **Desktop**: single horizontal row of 8–9 cards at deck-editor portrait width; `ResizeObserver` scales the intrinsic-width, non-shrinking rail when the panel is narrower than the full hand so neither edge card is clipped. Drag-and-drop reorder on fine pointers.
6. **Mobile** (`.layout-mobile`): vertical scroll through a **2-column grid** in the panel body; equal half-width portrait slots with 5% art inset; full-width **Draw again** footer.
7. **Events** display landscape art rotated 90° CCW inside the portrait slot (draw-hand only).
8. **Draw again** in the panel header redraws without closing.
9. Tapping a drawn card opens **CardDetailPanel** when catalog data resolves. While card detail
   is open, it exclusively owns `Escape`: the first press returns to the still-open hand, and a
   second press closes Draw Hand and returns to the deck.
10. ADMIN and entitled Supporter USER duplicate groups receive a restrained red warning glow. The count is the number of unkeepable extra copies, while the glow marks every card in an over-limit group so the relationship is visible.

Full feature notes: [`DeckEditorPage.md`](../../frontend/src/features/deck-editor/DeckEditorPage.md).

---

## Code Organization

| File | Role |
|------|------|
| [`DeckEditorPage.tsx`](../../frontend/src/features/deck-editor/DeckEditorPage.tsx) | `drawHandOpen`, `drawnCards`, toggle/redraw/reorder handlers |
| [`drawHand.ts`](../../frontend/src/lib/decks/drawHand.ts) | `countPlayableCards`, `canDrawHand`, `buildDrawPile`, `drawRandomHand`, `sortDrawnHandCards` |
| [`drawHandAnalysis.ts`](../../frontend/src/lib/decks/drawHandAnalysis.ts) | Admin gate, Venture-value calculation, normal duplicate groups, and character/card duplicate allowances |
| [`DrawHandPanel.tsx`](../../frontend/src/features/deck-editor/DrawHandPanel.tsx) | Top overlay UI, KO dimming, card detail wiring |
| [`DrawHandPanel.css`](../../frontend/src/features/deck-editor/DrawHandPanel.css) | Row, scale, event rotation, portrait frame fill, mobile carousel |
| [`deckEditorCardImage.ts`](../../frontend/src/features/deck-editor/deckEditorCardImage.ts) | Shared `CardImage` loading props (grid + draw hand) |
| [`useDrawHandScale.ts`](../../frontend/src/features/deck-editor/useDrawHandScale.ts) | Desktop `ResizeObserver` scale |
| [`deckCardCatalog.ts`](../../frontend/src/lib/decks/deckCardCatalog.ts) | Catalog index build + `resolveDeckCatalogCard`, `deckCardDisplayName` |
| [`CardImage`](../../frontend/src/components/CardImage/CardImage.tsx) | Thumb → full-res fallback; `onImageFailed` for missing-art label |
| [`SlideOutPanel`](../../frontend/src/components/SlideOutPanel/SlideOutPanel.tsx) | `side="top"`, `position="absolute"` overlay |

---

## Draw Rules

Implemented in [`drawHand.ts`](../../frontend/src/lib/decks/drawHand.ts).

**Non-playable types** (never in pile): `character`, `location`, `mission`.

**Playable types**: power, special, event, aspect, advanced-universe, teamwork, ally-universe, training, basic-universe (and legacy underscore variants in deck rows).

**Pile construction**: one pile slot per physical copy (`quantity` expanded); a grouped row with `exclude_from_draw === true` omits exactly one slot because the pre-placed-card rules allow only one marked copy of each card.

**Draw algorithm**:
1. Pick up to **8** unique random pile indices.
2. If any drawn card is an **event** and the pile has **>8** cards and fewer than **9** drawn, attempt one more unique draw.
3. **Display sort** (`sortDrawnHandCards`): reorder the drawn set by [`DECK_EDITOR_SECTION_ORDER`](../../frontend/src/lib/decks/deckEditorSectionOrder.ts), then within-type deck-editor sort (power value/type, special character+name, others by catalog name). Does not change which cards were drawn.

### ADMIN and Supporter Venture and duplicate analysis

Implemented in [`drawHandAnalysis.ts`](../../frontend/src/lib/decks/drawHandAnalysis.ts). `canAccessDrawHandAnalysis` returns true for role `ADMIN`, or for an authenticated `USER` whose central `isSupporter` entitlement is true. The parent computes and passes analysis only when that gate succeeds; `GUEST`, ordinary `USER`, and signed-out viewers receive no analysis markup or duplicate styling.

- **Normal duplicate identity:** Power cards duplicate by printed numerical value regardless of Power Type. Other cards group by their logical catalog identity, so foil/alternate printings of the same card do not evade duplicate detection. A numerical Special and same-value Power card are not duplicates.
- **Duplicate count:** `group size - copies allowed`, summed across groups. A pair of 5 Power cards and a pair of 3 Power cards reports `2`; two 5s and three 3s reports `3`.
- **Allowances:** Named-Special allowances are read from the starting characters' `special_abilities` text, including numbered wording (for example, Zeus may have one duplicate Thunderbolt) and older unlimited wording (for example, Gambit may have duplicate Charge Object Specials). A card-specific “may keep N duplicates of this Special” allowance is also honored. Allowed copies contribute to Venture total and do not glow.
- **Glow:** When a group exceeds its allowance, every card in that group is marked so users can identify the relationship; the count still includes only unkeepable extras.
- **Venture value:** Reads catalog numerical fields rather than image text: `value` for Power/Special/Aspect cards, `acts_as` for Teamwork, and `attack_value` for Ally Universe. Basic and Training Universe bonuses contribute zero because bonuses do not normally count as damage or Venture Total. When an older Special row is missing `value`, the analyzer falls back to its printed `Acts as a level N` effect; explicit `does not count to/toward Venture Total` text still contributes zero. Nonnumerical cards contribute zero. Values are summed only for the copies the hand may keep after duplicate rules. See [`VENTURE_TOTAL.md`](VENTURE_TOTAL.md) for the Modern rules and the analyzer's scope.
- **Interpretation:** This is an informational hand total. It does not predict which attacks will be playable or successful during a battle.

---

## Catalog Resolution

Deck rows from `GET /decks/:id/full` carry only `{ type, cardId, quantity }` — no `name` or `image`. Draw Hand resolves display data from the catalog index built in `DeckEditorPage`.

[`deckCardCatalog.ts`](../../frontend/src/lib/decks/deckCardCatalog.ts):

- **`normalizeDeckCardType`** — `ally_universe` → `ally-universe`, etc.
- **`buildDeckCardIndex`** — keys: `` `${normalizedType}:${id}` ``, raw type alias, and **`cardId` alone** (UUID fallback).
- **`resolveDeckCatalogCard`** — tries normalized key, raw key, then id-only.
- **`deckCardDisplayName`** — `entry.name` → catalog name → `Unknown {Type} card` (never generic `"Card"`).

**Images**: `entry.defaultImage` (alternate art on instance) → `imagePathFromCard(catalog)` → `CardImage` with the same loading policy as the deck grid via [`deckEditorCardImage.ts`](../../frontend/src/features/deck-editor/deckEditorCardImage.ts): portrait types use progressive thumb → full-res (`progressive`, `progressiveSessionScope="deck-editor"`, `card-image--contain`); locations/events use full-res only. Events in Draw Hand use single-layer full-res inside `.draw-hand__event-rotate` (rotation, not progressive).

**Missing art**: `.draw-hand__missing-art` shows the resolved card name under the tile; `title` / `aria-label` on the image button match.

---

## Tests

| File | Coverage |
|------|----------|
| `tests/unit/draw-hand-v2.test.ts` | Pile build, enable threshold, 8/9 draw logic, display sort, role gate, duplicate rules/allowances, and Venture totals |
| `tests/unit/deck-card-catalog.test.ts` | Type normalization, index lookup, display names |
| `tests/unit/simulate-ko.test.ts` | KO dimming rules (shared with draw hand via `shouldDimDeckCard`) |

```bash
npm run test:unit -- draw-hand-v2.test.ts deck-card-catalog.test.ts simulate-ko.test.ts
```

---

## Visual Design

See [`STYLE_GUIDE_V2.md`](../../STYLE_GUIDE_V2.md) — **Deck Editor — Draw Hand**.

Summary:

| Element | Spec |
|---------|------|
| Trigger | `.deck-editor__actions .btn-ghost`; `.is-active` when open (accent border/background) |
| Panel | `.draw-hand-slideout` on `SlideOutPanel`; `max-height: 70vh` desktop, `55vh` mobile |
| Card width | `--deck-editor-portrait-col`: **210px** desktop, **165px** mobile |
| Row scale | `--draw-hand-scale` via `useDrawHandScale` (desktop only) |
| Event rotate | `.draw-hand__event-rotate` — `rotate(-90deg)` inside portrait slot |
| Missing art | `.draw-hand__missing-art` — `font-size-xs`, muted, ellipsis |
| Redraw | `.draw-hand__redraw` — compact accent-outline action in the header rail |
| ADMIN / Supporter analysis | `.draw-hand__analysis` — compact summary surface centered against the full desktop panel within the header rail, with an eyebrow/caption region and two evenly structured metrics; Venture uses `--color-accent-bright`, while only a nonzero duplicate value uses `--color-danger`; wraps beneath the title/action row within the mobile header |
| Duplicate warning | `.draw-hand__card--duplicate` — subtle `--color-danger` border/ring/glow on all cards in an over-limit group |

---

## Simulate KO Integration

When **Simulate KO** marks characters as knocked out, drawn cards that would be unusable in the main grid are dimmed in the hand:

- **Logic**: `shouldDimDeckCard(entry, catalogCard, koCtx)` from [`simulateKo.ts`](../../frontend/src/lib/decks/simulateKo.ts).
- **Presentation**: `.deck-editor__card--ko-dimmed` on `.deck-editor__card-media` (art only).
- **Refresh**: `drawHandKoCtx` is recomputed when `koCharacterIds` changes; the hand is **not** re-randomized.

Full KO spec: [`SIMULATE_KO_FEATURE.md`](SIMULATE_KO_FEATURE.md).

---

## Troubleshooting

### Tooltip or label says "Unknown … card"

Catalog lookup failed for that `type` + `cardId`. Check:

1. Deck row `type` — underscore universe types should normalize (if not, file a bug).
2. `cardId` matches catalog `id` (stale/orphan deck row).
3. Catalog query for that type still loading (rare race on first paint).

### Grey placeholder image

1. Confirm the same card in the **deck grid** — if grid art loads, draw hand should too (shared `CardImage` + catalog).
2. Check network for thumbnail vs full-res 404.
3. Read `.draw-hand__missing-art` under the tile for the card name.

### Draw Hand button disabled

Deck has fewer than **8 playable** cards (characters/locations/missions do not count; `exclude_from_draw` rows **do** count toward the threshold).

---

## Related Documentation

- **Deck editor**: [`frontend/src/features/deck-editor/DeckEditorPage.md`](../../frontend/src/features/deck-editor/DeckEditorPage.md)
- **Simulate KO**: [`SIMULATE_KO_FEATURE.md`](SIMULATE_KO_FEATURE.md)
- **Architecture**: [`FRONTEND_V2.md`](FRONTEND_V2.md)
- **Visual tokens**: [`STYLE_GUIDE_V2.md`](../../STYLE_GUIDE_V2.md)

---

*Last updated: 2026-09-14*
