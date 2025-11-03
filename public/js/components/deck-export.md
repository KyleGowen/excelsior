# Deck Export Component

A standalone, encapsulated module for exporting deck configurations as JSON. This component provides functionality for all users (GUEST, USER, ADMIN) to export complete deck data including metadata, statistics, and all card information.

## Overview

The Deck Export component allows all users (GUEST, USER, ADMIN) to export their deck configurations in a structured JSON format. The export includes comprehensive deck information such as deck name, description, statistics (max stats, total threat), legality status, and all cards organized by category.

## File Structure

```
public/js/components/
├── deck-export.js          # Main export component module
└── deck-export.md          # This documentation file
```

## Dependencies

### Global Variables
- `currentUser` - Current authenticated user object with `role` property
- `window.availableCardsMap` - Map of all available cards keyed by card ID
- `window.deckEditorCards` - Array of cards currently in the deck editor
- `isDeckLimited` - Boolean indicating if deck is in limited format
- `currentDeckData` - Current deck data object with metadata

### Global Functions
- `loadAvailableCards()` - Loads card data into `window.availableCardsMap`
- `showNotification(message, type)` - Displays user notifications
- `validateDeck(cards)` - Validates deck and returns errors/warnings

### DOM Elements
- `#exportJsonOverlay` - Modal overlay for displaying exported JSON
- `#exportJsonContent` - `<pre>` element containing the JSON content
- `.copy-button` - Button for copying JSON to clipboard

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

## Usage

### Basic Export

The export button is automatically displayed for all users in the deck editor. Clicking the "Export" button triggers the export process:

```html
<button id="exportBtn" data-click-handler="exportDeckAsJson">Export</button>
```

### Programmatic Usage

```javascript
// Export current deck
await window.exportDeckAsJson();

// Show overlay with custom JSON
window.showExportOverlay(JSON.stringify(myData, null, 2));

// Close overlay
window.closeExportOverlay();

// Copy JSON to clipboard
window.copyJsonToClipboard();
```

## Integration

### HTML Structure

The export overlay is defined in `public/index.html`:

```html
<div id="exportJsonOverlay" class="export-overlay" style="display: none;">
    <div class="export-overlay-content">
        <div class="export-overlay-header">
            <h3>Deck Export</h3>
            <button class="export-close-btn" onclick="closeExportOverlay()">&times;</button>
        </div>
        <div class="export-overlay-body">
            <div class="json-container">
                <div class="copy-button" onclick="copyJsonToClipboard()" title="Copy to clipboard">
                    <!-- SVG icon -->
                </div>
                <pre id="exportJsonContent"></pre>
            </div>
        </div>
    </div>
</div>
```

### Script Loading

The component is loaded in `public/index.html`:

```html
<script src="/js/components/deck-export.js"></script>
```

All functions are automatically exported to the `window` object for backward compatibility.

### Button Visibility

Export button visibility is controlled in `deck-editor-core.js`:

```javascript
// Show/hide Export button based on admin role
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    if (currentUser && currentUser.role === 'ADMIN') {
        exportBtn.style.display = 'inline-block';
    } else {
        exportBtn.style.display = 'none';
    }
}
```

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

Located in `tests/unit/`:
- `export-functionality.test.ts` - Core export logic tests
- `export-overlay-functionality.test.ts` - UI interaction tests
- `export-and-draw-hand-button-styles.test.ts` - Button styling tests

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

Export-related styles are located in `public/css/index.css`:

- `.export-overlay` - Main overlay container
- `.export-overlay-content` - Content wrapper
- `.export-overlay-header` - Header section
- `.export-overlay-body` - Body section
- `.json-container` - JSON display container
- `.copy-button` - Copy button styles
- `.export-import-btn` - Export button styles

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

- `public/js/deck-editor-core.js` - Deck editor core functions
- `public/index.html` - HTML structure and button definitions
- `public/css/index.css` - Styling for export overlay and buttons
- `tests/unit/export-*.test.ts` - Unit tests
- `tests/integration/export-functionality-admin.test.ts` - Integration tests

