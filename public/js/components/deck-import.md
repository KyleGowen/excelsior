# Deck Import Component Documentation

## Overview

The Deck Import Component (`deck-import.js`) provides functionality for ADMIN users to import decks from JSON format. This module was refactored from `deck-export.js` to create a clean separation of concerns between export and import functionality.

## Location

- **Module**: `public/js/components/deck-import.js`
- **CSS**: `public/css/index.css` (section: "DECK IMPORT COMPONENT STYLES")
- **Documentation**: `public/js/components/deck-import.md`

## Dependencies

### Global Variables
- `window.currentUser` - Current user object (must have `role: 'ADMIN'`)
- `window.currentDeckId` - Current deck ID (can be `"new"` for new decks)
- `window.availableCardsMap` - Map of all available cards (keyed by name or ID)
- `window.deckEditorCards` - Array of cards currently in the deck editor

### Global Functions
- `loadAvailableCards()` - Loads card data into `availableCardsMap`
- `showNotification(message, type)` - Shows user notifications
- `validateDeck(deckCards)` - Validates deck according to rules
- `addCardToEditor(type, cardId, cardName, selectedAlternateImage)` - Adds a card to the deck editor

### DOM Elements
- `#importJsonOverlay` - The import modal overlay container
- `#importJsonContent` - Textarea for JSON input
- `#importErrorMessages` - Container for error messages
- `#importJsonButton` - Import button

## Functions

### `importDeckFromJson()`

Entry point for the import feature. Called when the Import button is clicked.

**Security**: Only ADMIN users can import decks.

**Deck Validation**: Checks that:
- Deck editor modal is open, OR
- `currentDeckId` is set (including `"new"`), OR
- There are cards already in the deck

**Behavior**:
- Validates user permissions
- Validates deck context
- Opens the import overlay via `showImportOverlay()`

---

### `showImportOverlay()`

Displays the import modal overlay with an empty textarea.

**Behavior**:
- Clears previous import content
- Hides error messages
- Enables the import button
- Sets up click-outside-to-close functionality
- Focuses the textarea after a short delay

---

### `closeImportOverlay()`

Closes the import modal overlay.

**Behavior**:
- Hides the overlay
- Cleans up event listeners

---

### `processImportDeck()`

Processes the JSON input and adds cards to the deck.

**Flow**:
1. Validates UI elements exist
2. Parses JSON input
3. Validates JSON structure (must have `cards` section)
4. Extracts cards from JSON structure
5. Ensures `availableCardsMap` is loaded
6. Converts card names to card IDs
7. Prevents duplicate imports (especially characters)
8. Validates the deck would be legal after import
9. Adds cards to the deck one by one
10. Reports success/failure

**Special Handling**:
- **Character Limit**: Enforces 4-character maximum
- **Duplicate Detection**: Prevents adding characters/locations already in deck or in import list
- **Alternate Images**: Automatically selects the first alternate image if available (for special cards, missions, events, aspects, advanced-universe, teamwork, ally-universe, training, basic-universe, and power cards)
- **51-Card Rule**: Filters out the minimum deck size validation error during import
- **Threat Level Validation**: Filters out threat level validation errors during import (can be adjusted after)
- **View Mode Preservation**: Preserves the user's current deck view (Card View or List View) after successful import
- **Error Reporting**: Shows detailed error messages for unresolved cards or validation failures

**Supported Card Types**: All 12 card types are fully supported:
- Characters (with duplicate detection)
- Special cards (allows duplicates, auto-selects alternate images)
- Locations (with duplicate detection)
- Missions (grouped by mission set, allows duplicates)
- Events (grouped by mission set, allows duplicates)
- Aspects (allows duplicates)
- Advanced Universe (grouped by character, allows duplicates)
- Teamwork (with field matching)
- Ally Universe (with field matching)
- Training (with field matching)
- Basic Universe (with field matching)
- Power cards (with value and power type matching)

---

### `extractCardsFromImportData(cardsData)`

Extracts card names and types from the nested JSON structure and flattens them into an array.

**Input**: The `cards` section of the import JSON
**Output**: Array of card objects with `name`, `type`, and optional field-specific properties

**Fully Implemented Card Types**:

1. **Characters** (`characters`)
   - Format: Array of strings
   - Example: `["Captain Nemo", "Count of Monte Cristo"]`

2. **Special Cards** (`special_cards`)
   - Format: Object grouped by character name
   - Example: `{ "Captain Nemo": ["The Nautilus"], "Any Character": ["Preternatural Healing"] }`

3. **Locations** (`locations`)
   - Format: Array of strings
   - Example: `["Event Horizon: The Future"]`

4. **Missions** (`missions`)
   - Format: Object grouped by mission set name
   - Example: `{ "Time Wars: Rise of the Gods": ["Battle at Olympus"] }`

5. **Events** (`events`)
   - Format: Object grouped by mission set name
   - Example: `{ "Time Wars: Rise of the Gods": ["Getting Our Hands Dirty"] }`

6. **Aspects** (`aspects`)
   - Format: Array of strings
   - Example: `["Supay"]`

7. **Advanced Universe** (`advanced_universe`)
   - Format: Object grouped by character name
   - Example: `{ "Ra": ["Shards of the Staff"] }`

8. **Teamwork** (`teamwork`)
   - Format: Array of strings with optional field info
   - Parsing: Extracts base name and `followup_attack_types` from format like `"6 Combat - Brute Force + Energy"`
   - Example: `["6 Combat", "7 Combat - Brute Force + Intelligence"]`

9. **Ally Universe** (`allies`)
   - Format: Array of strings with optional field info
   - Parsing: Extracts base name, `stat_to_use`, and `stat_type_to_use` from format like `"Little John - Intelligence 5 or less"`
   - Example: `["Little John", "Hera - Combat 7 or greater"]`

10. **Training** (`training`)
    - Format: Array of strings with optional field info
    - Parsing: Extracts base name, `type_1`, `type_2`, and `bonus` from format like `"Training (Leonidas) - Combat + Intelligence +4"`
    - Example: `["Training (Cultists)", "Training (Leonidas) - Combat + Intelligence +4"]`

11. **Basic Universe** (`basic_universe`)
    - Format: Array of strings with optional field info
    - Parsing: Extracts base name, stat type, `value_to_use`, and `bonus` from format like `"Secret Identity - Intelligence 6 or greater +2"`
    - Example: `["Secret Identity", "Longbow - Combat 7 or greater +3"]`

12. **Power Cards** (`power_cards`)
    - Format: Array of formatted strings
    - Format: `"<value> - <power_type>"` (e.g., `"5 - Energy"`, `"8 - Any-Power"`)
    - Example: `["1 - Combat", "2 - Energy", "5 - Multi Power", "6 - Any-Power"]`

---

### `findCardIdByName(cardName, cardType)`

Finds a card's UUID in `availableCardsMap` by matching the card name and type.

**Parameters**:
- `cardName` (string) - The card name to search for
- `cardType` (string) - The card type to filter by (e.g., `'character'`, `'power'`)

**Returns**: Card UUID (string) or `null` if not found

**Search Strategy**:
1. **Power Cards**: Special parsing for formatted names like `"5 - Energy"`
   - Extracts numeric `value` and `powerType` from the string (regex: `/^(\d+)\s*-\s*(.+)$/`)
   - Matches by `card.value` and `card.power_type` properties (exact match)
   - Example: `"5 - Energy"` matches a card with `value: 5` and `power_type: "Energy"`
2. **Direct Lookup**: Tries direct map lookup by card name
3. **Iterative Search**: Searches through all cards in the map
   - Filters by card type if specified
   - Normalizes type names (e.g., `'ally-universe'` → `'ally'`)
   - Requires exact name match

**Type Normalization**:
- Handles variations like `'ally-universe'` vs `'ally'`
- Ensures type filtering works correctly

**Specialized Lookup Functions**:

For cards with additional matching fields, specialized lookup functions are used:

- **`findTeamworkCardIdByName(cardName, followupTypes)`**: Matches teamwork cards by name and `followup_attack_types`
- **`findAllyCardIdByName(cardName, statToUse, statTypeToUse)`**: Matches ally cards by name, `stat_to_use`, and `stat_type_to_use`
- **`findTrainingCardIdByName(cardName, type1, type2, bonus)`**: Matches training cards by name, `type_1`, `type_2`, and `bonus`
- **`findBasicUniverseCardIdByName(cardName, typeField, valueToUse, bonus)`**: Matches basic universe cards by name, stat type, `value_to_use`, and `bonus`

---

## CSS Classes

All import-related CSS is located in `public/css/index.css` under the "DECK IMPORT COMPONENT STYLES" section.

### `.import-json-textarea`
- Textarea for JSON input
- Dark theme with monospace font
- Scrollable, resizable

### `.import-error-messages`
- Error message container
- Red theme with border
- Scrollable list

### `.import-actions`
- Container for import button
- Flexbox layout

### `.import-button`
- Import action button
- Cyan/teal theme
- Disabled state support

### `#importBtn`
- Import button in deck editor actions
- Same styling as export button
- Dark modal theme

---

## JSON Import Format

The import expects JSON in this format:

```json
{
  "name": "Deck Name",
  "description": "Deck Description",
  "cards": {
    "characters": [
      "Captain Nemo",
      "Count of Monte Cristo",
      "Korak",
      "Angry Mob (Industrial Age)"
    ],
    "special_cards": {
      "Captain Nemo": [
        "The Nautilus",
        "Weapons of Wrath and Hatred"
      ],
      "Any Character": [
        "Preternatural Healing",
        "Legendary Escape"
      ]
    },
    "locations": [
      "Event Horizon: The Future"
    ],
    "missions": {
      "Time Wars: Rise of the Gods": [
        "Battle at Olympus",
        "Divine Retribution"
      ]
    },
    "events": {
      "Time Wars: Rise of the Gods": [
        "Getting Our Hands Dirty",
        "Ready for War"
      ]
    },
    "aspects": [
      "Supay"
    ],
    "advanced_universe": {
      "Ra": [
        "Shards of the Staff",
        "Staff Fragments"
      ]
    },
    "teamwork": [
      "6 Combat",
      "7 Combat"
    ],
    "allies": [
      "Little John",
      "Hera"
    ],
    "training": [
      "Training (Cultists)",
      "Training (Leonidas)"
    ],
    "basic_universe": [
      "Secret Identity",
      "Longbow"
    ],
    "power_cards": [
      "5 - Energy",
      "6 - Combat",
      "7 - Any-Power"
    ]
  }
}
```

**All Card Types Supported**: The import feature fully supports all 12 card types listed above. Cards are extracted from their respective JSON structures and matched using specialized lookup functions when additional fields are required.

---

## Error Handling

### JSON Parsing Errors
- Invalid JSON format is caught and displayed
- Shows the specific parsing error message

### Missing Cards Section
- Validates that `cards` object exists
- Shows error if missing

### Unresolved Cards
- Cards that can't be found in `availableCardsMap` are reported
- Shows list of up to 10 unresolved cards
- Import is aborted if any cards are unresolved

### Validation Errors
- Deck is validated before adding cards
- The 51-card minimum rule is ignored during import
- Other validation errors (e.g., too many characters) are shown
- Import is aborted if validation fails

### Add Card Errors
- Individual card addition failures are tracked
- Shows success count and list of errors
- Partial success is possible

### Missing Dependencies
- Checks for `addCardToEditor` function availability
- Checks for `validateDeck` function availability
- Shows appropriate error messages

---

## Testing

### Unit Tests

**Main Test File**: `tests/unit/deck-import-character.test.ts`
- `extractCardsFromImportData()` - Comprehensive tests for all card types
- `findCardIdByName()` - Tests for various card types including power cards
- `processImportDeck()` - Full import flow tests

**Power Cards Test File**: `tests/unit/deck-import-power-cards.test.ts`
- `extractCardsFromImportData()` - Power card extraction tests
- `findCardIdByName()` - Power card parsing and lookup tests
- `processImportDeck()` - Power card import flow including view mode preservation

**Total**: Extensive test coverage across all card types and import scenarios.

### Test Coverage
- JSON parsing and validation
- All 12 card type extraction and lookup
- Duplicate detection (characters and locations)
- Character limit enforcement
- Field-based matching (teamwork, ally, training, basic-universe)
- Power card value and type matching
- Alternate image handling
- View mode preservation (Card View vs List View)
- Error handling and reporting
- Button state management
- Card data loading
- Validation error filtering

---

## Usage Example

```javascript
// User clicks Import button
// Triggers: importDeckFromJson()

// Opens modal, user pastes JSON
// User clicks "Import Cards"
// Triggers: processImportDeck()

// Function flow:
// 1. Parse JSON
// 2. Extract characters from cards.characters array
// 3. Look up each character by name
// 4. Validate deck would be legal
// 5. Add each character to deck
// 6. Show success/error messages
```

---

## View Mode Preservation

After a successful import, the system preserves the user's current deck view:

1. **Detection**: Reads the `#viewMode` hidden input field to determine current view mode
2. **Re-rendering**: Calls the appropriate rendering function:
   - `renderDeckCardsCardView()` if mode is `"card"`
   - `renderDeckCardsListView()` if mode is `"list"`
   - Defaults to Card View if mode cannot be determined
3. **User Experience**: Maintains visual consistency - users don't lose their preferred view after import

This feature ensures that users who prefer List View aren't forced back to Card View after importing cards.

## Future Enhancements

1. **Batch Import Optimization**: Optimize adding multiple cards at once for faster imports
2. **Progress Indicator**: Show import progress for large decks
3. **Import Preview**: Show what cards would be imported before confirming
4. **Conflict Resolution**: Handle cards that already exist in deck with merge options
5. **Undo Support**: Allow undoing an import operation
6. **Partial Import**: Allow importing even if some cards fail (currently aborts on unresolved cards)

---

## Related Files

- `public/js/components/deck-export.js` - Export functionality (separate module)
- `public/js/components/deck-export.md` - Export documentation
- `tests/unit/deck-import-character.test.ts` - Unit tests
- `public/css/index.css` - Import styles (section: "DECK IMPORT COMPONENT STYLES")
- `public/index.html` - HTML structure for import overlay

---

## Version History

- **v1.0** (2025-01-XX): Initial refactoring from `deck-export.js`
  - Separated import functionality into standalone module
  - Added comprehensive unit test coverage
  - Documented all functions and CSS classes

- **v2.0** (2025-01-XX): Full card type support
  - Added support for all 12 card types (characters, special, locations, missions, events, aspects, advanced-universe, teamwork, ally-universe, training, basic-universe, power)
  - Implemented specialized lookup functions for cards with additional fields
  - Added power card parsing (value and power type matching)
  - Implemented view mode preservation after import
  - Enhanced error handling and validation
  - Added alternate image auto-selection for applicable card types

