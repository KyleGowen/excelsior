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
- **Duplicate Detection**: Prevents adding characters already in deck or in import list
- **Alternate Images**: Automatically selects the first alternate image if available
- **51-Card Rule**: Filters out the minimum deck size validation error during import
- **Error Reporting**: Shows detailed error messages for unresolved cards or validation failures

**Current Limitation**: Only processes character cards. Other card types are commented out in `extractCardsFromImportData()`.

---

### `extractCardsFromImportData(cardsData)`

Extracts card names and types from the nested JSON structure and flattens them into an array.

**Input**: The `cards` section of the import JSON
**Output**: Array of `{ name: string, type: string }` objects

**Current Implementation**:
- Only extracts `characters` (array of strings)
- Other card types are commented out for future implementation

**Planned Support** (currently commented):
- `special_cards` (object grouped by character name)
- `locations` (array of strings)
- `missions` (object grouped by mission set)
- `events` (object grouped by mission set)
- `aspects` (array of strings)
- `advanced_universe` (object grouped by character)
- `teamwork` (array of strings)
- `allies` (array of strings)
- `training` (array of strings)
- `basic_universe` (array of strings)
- `power_cards` (array of formatted strings like `"5 - Energy"`)

---

### `findCardIdByName(cardName, cardType)`

Finds a card's UUID in `availableCardsMap` by matching the card name and type.

**Parameters**:
- `cardName` (string) - The card name to search for
- `cardType` (string) - The card type to filter by (e.g., `'character'`, `'power'`)

**Returns**: Card UUID (string) or `null` if not found

**Search Strategy**:
1. **Power Cards**: Special parsing for formatted names like `"5 - Energy"`
   - Matches by `value` and `power_type` properties
2. **Direct Lookup**: Tries direct map lookup by card name
3. **Iterative Search**: Searches through all cards in the map
   - Filters by card type if specified
   - Normalizes type names (e.g., `'ally-universe'` → `'ally'`)
   - Requires exact name match

**Type Normalization**:
- Handles variations like `'ally-universe'` vs `'ally'`
- Ensures type filtering works correctly

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

**Note**: Currently only `characters` are processed. Other card types will be enabled in the future.

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
Located in `tests/unit/deck-import-character.test.ts`:
- `extractCardsFromImportData()` - 5 tests
- `findCardIdByName()` - 6 tests
- `processImportDeck()` - 31 tests

**Total**: 42 tests covering all import functionality.

### Test Coverage
- JSON parsing and validation
- Character extraction and lookup
- Duplicate detection
- Character limit enforcement
- Alternate image handling
- Error handling
- Button state management
- Card data loading

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

## Future Enhancements

1. **Support All Card Types**: Re-enable extraction for all card categories
2. **Batch Import**: Optimize adding multiple cards at once
3. **Progress Indicator**: Show import progress for large decks
4. **Import Preview**: Show what cards would be imported before confirming
5. **Conflict Resolution**: Handle cards that already exist in deck
6. **Undo Support**: Allow undoing an import operation

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

