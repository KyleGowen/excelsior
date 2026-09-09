# Add Cards Panel

Feature context for [`AddCardsPanel.tsx`](AddCardsPanel.tsx), the deck-editor drawer used to browse and add catalog cards to the current deck.

## UX Goals

- Make it easier to build a deck without relying on memory of card text or character stats.
- Keep card images large enough to inspect at normal laptop zoom.
- Preserve the user’s working context while they compare cards, switch tabs, close/reopen the drawer, and adjust quantities.
- Keep the right-side card grid fast for adding cards; use hover/context panes for inspection instead of changing click behavior.

## Desktop Context Pane

On desktop viewports wider than 1200px, the Add Cards drawer uses a contextual pane beside the results grid. Below 1200px, preserve the single-pane flow.

- Team summary rows should show up to four character slots plus a fifth Location row. Filled character rows show character name plus readable generated stat badges for Energy, Combat, Brute Force, Intelligence, and Threat Value. Grid-changing inherent abilities use their effective team value here (for example, Michonne shows Combat 8 when Rick Grimes and Alexandria are both present). The Location row shows the selected homebase name plus only its Threat Value, aligned with the character Threat Value column; when no location is selected, it reads `No Location Set` with no stat badge. Empty character rows use subtle placeholders. A deck should never show more than four character rows.
- The Team heading shows `Threat: {total}` for the current characters plus location, using the shared tournament legal cap from `TOURNAMENT_LEGAL_THREAT_LIMIT`. When total threat exceeds the cap, show the total in red followed by `/ 76`.
- Stat icons must be readable on a laptop without browser zoom. If there is spare space in the row, use it for icon size and spacing before adding decoration.
- The fourth character row should visually match rows 1-3, including its divider, with clear buffer before the filter area.
- Hovering a team row previews the selected printing/art for that character in the preview area.

## Filters

- Search matches card name, linked character, mission-set name, and card text. Mission-set
  matches apply consistently in All, Missions, and Events results.
- Filters are dynamic to the active Add Cards tab and should hide impossible options.
- The Add Cards tab row includes an Add Cards-only `Any-Char` tab immediately after `Special`. It reuses the `special-cards` catalog/deck type, but filters results to specials whose linked character is exactly `Any Character`. The `Special` tab excludes those true Any Character specials and shows character-specific specials.
- Do not show MP for Training cards when no MP Training cards exist.
- Location filters should include Threat Value and may give that control slightly more room since it is often the only location-specific numeric filter.
- Character numeric filters should fit in two rows in the context pane. Do not allow them to overlap the preview image or require horizontal scrolling.
- Special card filters should place Type on row 1 and Function on row 2, left-aligned with stable label/control columns. The same filters apply on `Special` and `Any-Char`.
- Use selected control states plus a nearby Clear action. Do not add active filter pills that restate the visible selections.
- Filter state should persist while the user remains in the same deck-editor session: closing/reopening Add Cards and switching tabs should restore search, active tab, set, hide-unusable, page/quantity state, and type-specific dynamic filters. Resetting on deck-editor exit or deck change is acceptable.

## Hover Preview

- The hover preview area should be image-only. Do not include details, text blocks, or buttons that reduce available image space.
- Placeholder text should stay minimal: `Hover for full image.`
- Hovering a card in the results grid or a filled team row should show the full card image scaled to fit the preview area.
- Clicking a result card still adds it. Hover preview should remain on the last hovered card after add and clear only when hovering off the card/team row.

## Verification

For Add Cards UI changes, verify with browser screenshots at a laptop-sized desktop viewport and a wider desktop viewport.

Check:

- Stat icons are readable.
- Filters wrap inside the context pane without overlap or horizontal scroll.
- Section dividers have breathing room around character rows and filters.
- Vertical cards use the available preview area well.
- Close/reopen and tab switching preserve filters and quantity/page state within the deck edit session.
