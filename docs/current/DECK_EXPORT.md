# Deck Export — JSON contract (v2)

> **Implementation:** `frontend/src/lib/decks/buildDeckExportJson.ts`. UI: `frontend/src/features/deck-editor/ExportDeckPanel.tsx` and deck selection actions menu.

## Overview

The deck export flow produces structured v2.0 JSON including metadata, statistics, and all cards organized by category.

## Dependencies (v2)

### React / API
- [`buildDeckExportJson.ts`](../../frontend/src/lib/decks/buildDeckExportJson.ts) — export payload builder
- [`ExportDeckPanel.tsx`](../../frontend/src/features/deck-editor/ExportDeckPanel.tsx) — deck editor export UI
- Catalog index from TanStack Query + `/api/v1/catalog/*`
- Deck metadata and cards from deck editor state / `GET /api/v1/decks/:id/full`

### Permissions
- Export is available to all signed-in users (GUEST, USER, ADMIN) in the v2 deck editor.

## Functions

### `exportDeckAsJson()`

**Purpose:** Main export function that generates and displays deck JSON

**Returns:** `Promise<void>`

**Process:**
1. Available to all users (GUEST, USER, ADMIN)
2. Ensures `availableCardsMap` is loaded
3. Extracts deck name and description from `currentDeckData` or DOM
4. Calculates deck statistics:
   - Total cards (excluding mission, character, location)
   - Max Energy, Combat, Brute Force, Intelligence from characters
   - Total icon counts (total_energy_icons, total_combat_icons, total_brute_force_icons, total_intelligence_icons)
     - Only counts icons from: special, aspect, ally-universe, teamwork, and power cards
   - Total Threat from characters and locations (with reserve character adjustments)
5. Organizes cards by category with quantity repetition
6. Validates deck legality
7. Creates export data structure
8. Displays JSON in modal overlay

**Export Data Structure:**
```javascript
{
  name: string,
  description: string,
  total_cards: number,
  max_energy: number,
  max_combat: number,
  max_brute_force: number,
  max_intelligence: number,
  total_energy_icons: number,
  total_combat_icons: number,
  total_brute_force_icons: number,
  total_intelligence_icons: number,
  total_threat: number,
  legal: boolean,
  limited: boolean,
  export_timestamp: string (ISO 8601),
  exported_by: string,
  reserve_character: string | null,
  cataclysm_special: string | null,
  assist_special: string | null,
  ambush_special: string | null,
  cards: {
    characters: string[],
    special_cards: { [characterName: string]: string[] },
    locations: string[],
    missions: { [missionSet: string]: string[] },
    events: { [missionSet: string]: string[] },
    aspects: string[],
    advanced_universe: { [characterName: string]: string[] },
    teamwork: string[],
    allies: string[],
    training: string[],
    basic_universe: string[],
    power_cards: string[]
  }
}
```

**Note**: The data structure was simplified in v2.0 - metadata fields are now at the root level (not nested in a `data` object), and the cards are in a `cards` object (not `Cards`).

**Card Categories:**
- All card types are represented in the `cards` object
- Cards are repeated based on their `quantity` value
- Card names use exact database names for import compatibility

**Special Grouping:**
- **special_cards**: Object grouped by character name (e.g., `"Captain Nemo": [...]`, `"Any Character": [...]`)
- **missions**: Object grouped by mission set name (e.g., `"Battle at Olympus": [...]`, `"Divine Retribution": [...]`)
- **events**: Object grouped by mission set name (e.g., `"Getting Our Hands Dirty": [...]`, `"Ready for War": [...]`)
- **advanced_universe**: Object grouped by character name (e.g., `"Ra": [...]`, `"Unknown Character": [...]`)

**Special Card Attributes** (Root Level):
- **reserve_character**: Name of the reserve character (if set), or `null`
- **cataclysm_special**: Name of the cataclysm special card (if any), or `null`
- **assist_special**: Name of the assist special card (if any), or `null`
- **ambush_special**: Name of the ambush special card (if any), or `null`

These fields export the first occurrence of each special card type that has the corresponding flag set in the database.

**Power Cards Format**:
- Power cards are exported as formatted strings: `"<value> - <power_type>"`
- Examples: `"1 - Combat"`, `"2 - Energy"`, `"5 - Multi Power"`, `"8 - Any-Power"`
- Cards are sorted by value (ascending), then by power type (alphabetically)
- Multiple copies of the same power card appear as separate entries in the array

### `showExportOverlay(jsonString)`

**Purpose:** Displays the export overlay modal with JSON content

**Parameters:**
- `jsonString` (string): The formatted JSON string to display

**Behavior:**
- Sets overlay display to `flex`
- Populates `#exportJsonContent` with JSON
- Stores JSON in overlay `dataset` for clipboard copying
- Adds click-outside-to-close handler

### `closeExportOverlay()`

**Purpose:** Closes the export overlay modal

**Behavior:**
- Hides the overlay (`display: none`)
- Removes click event listener
- Cleans up overlay state

### `copyJsonToClipboard()`

**Purpose:** Copies the exported JSON to the user's clipboard

**Behavior:**
- Reads JSON from overlay `dataset`
- Uses `navigator.clipboard.writeText()` API
- Provides visual feedback (button highlight and title change)
- Resets feedback after 1 second
- Shows error notification on failure

### `importDeckFromJson()`

**Purpose:** Placeholder for future import functionality

**Current Status:** Disabled - shows notification that import is unavailable

## Usage (v2)

Export is triggered from the deck editor actions menu → **Export** → [`ExportDeckPanel`](../../frontend/src/features/deck-editor/ExportDeckPanel.tsx) shows formatted JSON with copy-to-clipboard.

## Security

### User Access

The export functionality is available to all users (GUEST, USER, ADMIN). No role restrictions are applied.

### Data Privacy

The export includes:
- Deck name and description
- Card configurations
- Deck statistics
- Export timestamp and user information

All data is displayed in-browser and can be copied to clipboard. No data is sent to external servers during export.

## Card Type Handling

### Supported Card Types

All 12 card types are supported in exports:

1. **characters** - Character cards
2. **special_cards** - Special ability cards
3. **locations** - Location cards
4. **missions** - Mission cards
5. **events** - Event cards
6. **aspects** - Aspect cards
7. **advanced_universe** - Advanced Universe cards
8. **teamwork** - Teamwork cards
9. **allies** - Ally Universe cards (ally-universe)
10. **training** - Training cards
11. **basic_universe** - Basic Universe cards
12. **power_cards** - Power cards

### Quantity Handling

Cards with `quantity > 1` are repeated in the export array. For example, a power card with `quantity: 3` appears three times in the `power_cards` array.

### Card Name Resolution

Card names are resolved using this priority:
1. `availableCard.name` (primary)
2. `availableCard.card_name` (fallback)
3. `'Unknown Card'` (if card not found in map)

## Error Handling

### Card Data Not Loaded

If `availableCardsMap` is empty:
- Attempts to load cards via `loadAvailableCards()`
- Waits 1 second for loading to complete
- Shows error notification if still empty
- Prevents export from proceeding

### Missing Card Data

If a card is not found in `availableCardsMap`:
- Logs warning to console
- Uses `'Unknown Card'` as fallback name
- Export continues with partial data

### Clipboard Failures

If clipboard copy fails:
- Logs error to console
- Shows error notification to user
- Export overlay remains open for manual copying

### Validation Errors

Deck validation errors do not prevent export. The `legal` field in export data reflects validation status.

## Testing

### Unit Tests

Located in `tests/unit/frontend-v2/`:
- `buildDeckExportJson.test.ts` — core export logic

### Integration Tests

Located in `tests/integration/`:
- `export-functionality-admin.test.ts` - End-to-end export tests with database

### Test Coverage

Tests cover:
- Export data structure validation
- Card quantity repetition
- Deck statistics calculation
- Legality badge removal from deck names
- Available to all user roles
- Overlay display and interaction
- Clipboard copy functionality
- Empty deck handling
- Error scenarios

## Styling

Export panel styles: [`ExportDeckPanel.css`](../../frontend/src/features/deck-editor/ExportDeckPanel.css). See [`STYLE_GUIDE_V2.md`](../../STYLE_GUIDE_V2.md).

## Special Features

### Reserve Character Export
If a deck has a reserve character set, it's exported in the `reserve_character` field at the root level. This is the name of the character card that serves as the reserve.

### Special Card Type Flags
The export captures the first occurrence of special cards with specific flags:
- **Cataclysm**: Special cards with `cataclysm=TRUE` or `is_cataclysm=TRUE`
- **Assist**: Special cards with `assist=TRUE` or `is_assist=TRUE`
- **Ambush**: Special cards with `ambush=TRUE` or `is_ambush=TRUE`

These are exported as single string values (not arrays) because decks can only have one of each type.

### Power Card Sorting
Power cards are sorted intelligently:
1. First by numeric `value` (ascending: 1, 2, 3, ...)
2. Then by `power_type` alphabetically (e.g., "Any-Power", "Combat", "Energy", "Multi Power")

This ensures consistent export output that's easy to read and compare.

## Known Issues

1. **Available to All Users**: Export functionality is available to GUEST, USER, and ADMIN roles.

2. **Card Loading Race Condition**: If cards aren't loaded, export waits 1 second. May need improvement for slow connections.

## Future Enhancements

1. **No Role Restrictions**: Export is available to all users
2. **Import Functionality**: Implement JSON import feature
3. **Export Formats**: Add support for other export formats (CSV, XML)
4. **Download File**: Add option to download JSON as file
5. **Export History**: Track export history for users
6. **Compressed Exports**: Option for compressed/minified JSON

## Version History

- **v1.0** (Refactored): Extracted from `deck-editor-core.js` into standalone component module

## Related Files

- [`buildDeckExportJson.ts`](../../frontend/src/lib/decks/buildDeckExportJson.ts)
- [`ExportDeckPanel.tsx`](../../frontend/src/features/deck-editor/ExportDeckPanel.tsx)
- [`docs/current/DECK_IMPORT.md`](DECK_IMPORT.md)
- `tests/unit/frontend-v2/buildDeckExportJson.test.ts`


## TopDeck text export

The shared export panel defaults to TopDeck each time it opens; JSON remains selectable and unchanged. The server returns `topDeck` alongside the existing JSON `deck` from the same evaluated catalog snapshot. The frontend displays and copies that text without calculating game rules.

Text follows [the past-year Modern template](../../TOPDECK_OVERPOWER_MODERN_FORMAT.md): card/threat totals, printing codes, reserve/frontline roles, mission-set summaries, compact Universe and Power labels, Any Character codes, and location/Battleground attachments. Aspects use Other Cards. Public lists establish a convention; TopDeck submission validation remains unverified.
