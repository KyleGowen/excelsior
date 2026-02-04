# Draw Hand Feature

The Draw Hand feature allows users to simulate drawing a random hand from their deck, excluding characters, locations, and missions. This is useful for testing deck composition and understanding card draw probabilities.

## Overview

The Draw Hand feature provides a visual interface for drawing random hands from a deck. It draws 8 cards by default, or 9 cards if event cards are present in the first 8 cards drawn.

## Features

- **Random Hand Drawing**: Draws 8 random cards from playable cards (powers, specials, events, training, etc.)
- **Event Card Bonus**: Draws a 9th card if event cards are present in the initial 8 cards
- **Card Exclusion**: Supports excluding Training cards from Draw Hand when Spartan Training Ground location is selected
- **Drag and Drop Reordering**: Reorder drawn cards by dragging and dropping
- **KO Integration**: Automatically dims cards that become unusable when characters are KO'd
- **Button State Management**: Button is enabled only when deck has 8+ playable cards
- **Visual Feedback**: Cards display with images, tooltips, and proper styling

## Files

- **JavaScript Module**: `public/js/components/draw-hand.js`
- **CSS Styles**: `public/css/draw-hand.css`
- **Unit Tests**: 
  - `tests/unit/draw-hand-module.test.ts` (35 tests)
  - `tests/unit/draw-hand-ui-wrappers.test.ts` (8 tests)
  - `tests/unit/draw-hand-ko-integration.test.ts` (9 tests)

## Usage

### Basic Usage

```javascript
// Draw a new random hand
window.DrawHand.drawHand();

// Toggle the draw hand pane visibility
window.DrawHand.toggle();

// Close the draw hand pane
window.DrawHand.close();

// Update button state when deck changes
window.DrawHand.updateButtonState(deckCards);

// Get current drawn cards
const cards = window.DrawHand.getDrawnCards();

// Refresh display (used by KO feature)
window.DrawHand.refresh();
```

### HTML Integration

The Draw Hand feature is integrated into `index.html`:

```html
<!-- Draw Hand Button -->
<button id="drawHandBtn" data-click-handler="toggleDrawHand">
  Draw Hand
</button>

<!-- Draw Hand Section -->
<div class="draw-hand-section" id="drawHandSection" style="display: none;">
  <div class="draw-hand-header">
    <h4>Draw Hand</h4>
    <button class="draw-hand-close" data-click-handler="closeDrawHand">×</button>
  </div>
  <div class="draw-hand-content" id="drawHandContent">
    <!-- Drawn cards will be displayed here -->
  </div>
</div>
```

### CSS Integration

Include the Draw Hand stylesheet:

```html
<link rel="stylesheet" href="/css/draw-hand.css">
```

### JavaScript Integration

Include the Draw Hand module:

```html
<script src="/js/components/draw-hand.js"></script>
```

## API Reference

### `window.DrawHand`

The Draw Hand module exposes a public API on `window.DrawHand`:

#### `init()`
Initializes the module state. Called automatically on page load.

```javascript
window.DrawHand.init();
```

#### `drawHand()`
Draws a random hand of 8 cards (9 if events are present) from playable cards.

**Behavior:**
- Filters out characters, locations, and missions
- Filters out cards with `exclude_from_draw: true` (Pre-Placed Training cards)
- Draws 8 random cards from the remaining cards
- If event cards are present in the first 8, draws a 9th card
- Handles decks with fewer than 8 playable cards gracefully
- Prevents infinite loops with safety checks

```javascript
window.DrawHand.drawHand();
```

#### `displayDrawnCards(cards)`
Displays cards in the draw hand pane.

**Parameters:**
- `cards` (Array): Array of card objects to display

**Features:**
- Renders cards with images and tooltips
- Applies KO dimming if SimulateKO is available
- Makes cards draggable for reordering
- Adds `event-card` class for horizontal orientation

```javascript
window.DrawHand.displayDrawnCards([
  { type: 'power', cardId: 'power-1', quantity: 1 },
  { type: 'event', cardId: 'event-1', quantity: 1 }
]);
```

#### `toggle()`
Toggles the draw hand pane visibility.

**Behavior:**
- Shows pane and draws hand if hidden
- Draws new hand if pane is already visible
- Updates button text accordingly

```javascript
window.DrawHand.toggle();
```

#### `close()`
Closes the draw hand pane.

**Behavior:**
- Hides the pane
- Resets button text to "Draw Hand"

```javascript
window.DrawHand.close();
```

#### `updateButtonState(deckCards)`
Updates the button enable/disable state based on playable card count.

**Parameters:**
- `deckCards` (Array): Array of deck cards

**Behavior:**
- Enables button when deck has 8+ playable cards
- Disables button when deck has less than 8 playable cards
- Excludes characters, locations, and missions from count
- Handles cards with quantity > 1

```javascript
window.DrawHand.updateButtonState(deckEditorCards);
```

#### `getDrawnCards()`
Returns the current array of drawn cards.

**Returns:**
- `Array`: Current drawn cards array

```javascript
const cards = window.DrawHand.getDrawnCards();
```

#### `refresh()`
Refreshes the draw hand display. Used by the KO feature to update dimming.

**Behavior:**
- Re-displays current drawn cards with updated dimming
- Called automatically when characters are KO'd/un-KO'd

```javascript
window.DrawHand.refresh();
```

## Dependencies

### Global Variables

- `window.deckEditorCards` - Array of deck cards
- `window.availableCardsMap` - Map of card data (cardId -> card object)
- `window.SimulateKO` - KO feature module (optional, for dimming)
- `window.drawnCards` - Global array of drawn cards (backward compatibility)
- `window.displayDrawnCards` - Global function (backward compatibility)

### Global Functions

- `getCardImagePath(card, type)` - Returns the image path for a card

## Integration with Other Features

### KO Feature Integration

The Draw Hand feature integrates with the Simulate KO feature:

- **Automatic Refresh**: When characters are KO'd, the draw hand automatically refreshes
- **Card Dimming**: Cards that become unusable due to KO'd characters are visually dimmed
- **Fallback Support**: Falls back to global `displayDrawnCards` if module unavailable

### Event Binder Integration

The Draw Hand feature integrates with the event binder system:

- **Button Handler**: `toggleDrawHand` function exposed on `window` for `data-click-handler`
- **Close Handler**: `closeDrawHand` function exposed on `window` for `data-click-handler`

## Styling

The Draw Hand feature follows the application's dark theme with teal accents and gold highlights. All styles are defined in `public/css/draw-hand.css`.

### Draw Hand Button Styling

The Draw Hand button uses the same styling as other deck editor utility buttons (List View, Export, Import):

#### Base Properties
- **Class**: `.remove-all-btn` (shared with List View button)
- **Background**: `rgba(78, 205, 196, 0.2)` (teal with 20% opacity)
- **Text Color**: `#4ecdc4` (bright teal)
- **Border**: `1px solid rgba(78, 205, 196, 0.3)` (teal border with 30% opacity)
- **Height**: `auto` with `min-height: 24px` (matches Save/Cancel buttons)
- **Min-Height**: `24px`
- **Min-Width**: `80px`
- **Padding**: `4px 8px`
- **Display**: `inline-flex`; `align-items: center`; `justify-content: center`
- **Text Wrapping**: `white-space: nowrap` (prevents multi-line labels)
- **Border Radius**: `4px`
- **Font**: `0.8rem`, `500` weight
- **Cursor**: `pointer`

#### Hover States
- **Background**: `rgba(78, 205, 196, 0.3)` (teal with 30% opacity)
- **Border**: `rgba(78, 205, 196, 0.4)` (teal border with 40% opacity)

#### Disabled State
- **Opacity**: `0.5`
- **Cursor**: `not-allowed`
- **Tooltip**: "Deck must contain at least 8 playable cards."

**Visual Consistency**: These specs keep Draw Hand and List View buttons visually identical and match the size of Save/Cancel buttons.

### Draw Hand Section Container

#### Main Container (`.draw-hand-section`)
- **Background**: `rgba(255, 255, 255, 0.05)` (standard secondary background)
- **Border**: `1px solid rgba(78, 205, 196, 0.3)` (teal border with 30% opacity)
- **Border Radius**: `8px`
- **Margin**: `20px`
- **Padding**: `15px`
- **Display**: `none` by default (shown when active)

### Draw Hand Header

#### Header Container (`.draw-hand-header`)
- **Layout**: `display: flex`
- **Justify Content**: `space-between`
- **Align Items**: `center`
- **Margin Bottom**: `15px`

#### Header Title (`.draw-hand-header h4`)
- **Color**: `#4ecdc4` (primary teal)
- **Margin**: `0`
- **Font Size**: `18px`
- **Font Weight**: `600`

#### Close Button (`.draw-hand-close`)
- **Background**: `none`
- **Border**: `none`
- **Color**: `#888` (gray)
- **Font Size**: `24px`
- **Cursor**: `pointer`
- **Padding**: `0`
- **Dimensions**: `30px × 30px`
- **Display**: `flex`; `align-items: center`; `justify-content: center`
- **Border Radius**: `50%` (circular)
- **Transition**: `all 0.3s ease`

#### Close Button Hover
- **Background**: `rgba(255, 255, 255, 0.1)` (subtle white overlay)
- **Color**: `#fff` (white)

### Draw Hand Content Area

#### Content Container (`.draw-hand-content`)
- **Layout**: `display: flex`
- **Gap**: `10px` between cards
- **Flex Wrap**: `wrap` (allows cards to wrap to new lines)
- **Justify Content**: `center` (centers cards horizontally)

#### Drag Over State (`.draw-hand-content.drag-over`)
- **Background**: `rgba(78, 205, 196, 0.1)` (teal tint)
- **Border**: `2px dashed #4ecdc4` (teal dashed border)

### Drawn Card Styling

#### Portrait Cards (`.drawn-card`)
- **Dimensions**: `132px × 185px` (standard card aspect ratio)
- **Border Radius**: `6px`
- **Background Size**: `cover`
- **Background Position**: `center`
- **Background Repeat**: `no-repeat`
- **Border**: `2px solid rgba(78, 205, 196, 0.3)` (teal border)
- **Transition**: `all 0.3s ease`
- **Cursor**: `grab` (indicates draggable)
- **Position**: `relative` (for absolute positioning)

#### Event Cards (`.drawn-card.event-card`)
- **Dimensions**: `185px × 132px` (landscape orientation)
- **Same styling as portrait cards but rotated dimensions**

#### Card Hover Effects
- **Transform**: `translateY(-12px) scale(1.984)` (lifts and enlarges card)
- **Z-Index**: `10` (brings card to front)
- **Box Shadow**: `0 12px 24px rgba(78, 205, 196, 0.4)` (teal glow)
- **Border Color**: `rgba(78, 205, 196, 0.8)` (brighter teal)

#### Card Hover Interaction
When hovering over one card, other cards recede:
- **Transform**: `scale(0.85)` (shrinks other cards)
- **Opacity**: `0.7` (dimmed appearance)

#### Active/Dragging State (`.drawn-card:active`, `.drawn-card.dragging`)
- **Cursor**: `grabbing` (indicates active drag)
- **Opacity**: `0.5` (semi-transparent)
- **Transform**: `rotate(5deg) scale(1.1)` (rotated and slightly enlarged)
- **Z-Index**: `1000` (above all other content)
- **Box Shadow**: `0 8px 25px rgba(0, 0, 0, 0.3)` (depth shadow)

### KO Dimming Integration

#### Dimmed Card State (`.drawn-card.ko-dimmed`)
- **Opacity**: `0.5` (50% transparency)
- **Visual Effect**: Cards become visually dimmed when associated characters are KO'd
- **Applied By**: `SimulateKO.shouldDimCard()` function
- **Integration**: Automatically applied during `displayDrawnCards()` rendering

## Card Exclusion from Draw Hand

### Overview

The Draw Hand feature supports excluding specific cards from being drawn. This is primarily used for Training cards when the "Spartan Training Ground" location is selected in the deck.

### When Cards Are Excluded

Cards are excluded from Draw Hand when:
- **Training Cards**: When "Spartan Training Ground" location is in the deck, Training cards can be marked as "Pre-Placed" (excluded from Draw Hand)
- **User Action**: Users click the "Pre-Placed" button on Training cards in Card View to toggle exclusion
- **Persistent State**: Exclusion state is saved to the database and persists across sessions

### Why Cards Are Excluded

The exclusion feature supports game mechanics:
- **Spartan Training Ground**: According to the location's special ability, "At the beginning of the game, place three unique Training Universe cards, excluding 'Any-Power,' under Spartan Training Ground. Once per battle, you may remove one of these cards to combine it with a legal attack or defense."
- **Pre-Placed Cards**: Training cards marked as "Pre-Placed" represent cards that are already placed under Spartan Training Ground at game start
- **Draw Hand Accuracy**: Excluding pre-placed cards ensures Draw Hand simulations reflect the actual available draw pile

### How Cards Are Excluded

#### Database Storage

- **Column**: `exclude_from_draw` (boolean) in `deck_cards` table
- **Default**: `FALSE` (cards are included by default)
- **Migration**: Added in V205 migration

#### User Interface

1. **Pre-Placed Button**: Appears below Training cards in Card View when Spartan Training Ground is in the deck
2. **Toggle Action**: Clicking the button toggles the `exclude_from_draw` flag
3. **Visual Feedback**: Button shows active/dimmed state when card is excluded
4. **Card Remains**: Excluded cards remain in the deck (not removed)

#### Implementation

**Frontend:**
- Button rendered in Card View for Training cards when location is present
- `drawTrainingCard(cardId, index)` function toggles `exclude_from_draw` flag
- Flag is included when saving deck cards to database

**Backend:**
- `exclude_from_draw` column stored in `deck_cards` table
- Flag is loaded when deck is retrieved
- Flag is saved when deck cards are updated

**Draw Hand Filtering:**
- `drawHand()` function filters out cards with `exclude_from_draw: true`
- Excluded cards are not added to the draw pile
- Exclusion happens before random selection

### Pre-Placed Button Styling

The "Pre-Placed" button appears below Training cards in Card View when Spartan Training Ground is selected.

#### Base Styling (`.draw-training-btn`)
- **Background**: `rgba(72, 219, 251, 0.2)` (Info Blue #48dbfb with 20% opacity)
- **Text Color**: `#48dbfb` (Info Blue)
- **Border**: `1px solid rgba(72, 219, 251, 0.3)` (Info Blue with 30% opacity)
- **Border Radius**: `3.3px`
- **Padding**: `3.3px 6.6px`
- **Font Size**: `11px`
- **Font Family**: `monospace`
- **Cursor**: `pointer`
- **Transition**: `all 0.3s ease`
- **Text**: "Pre-Placed"

#### Hover State
- **Background**: `rgba(72, 219, 251, 0.3)` (Info Blue with 30% opacity)
- **Border Color**: `rgba(72, 219, 251, 0.5)` (Info Blue with 50% opacity)

#### Active State (`.draw-training-btn.active`)
When a card is marked as Pre-Placed (excluded), the button shows a dimmed appearance:
- **Background**: `rgba(72, 219, 251, 0.15)` (Info Blue with 15% opacity - dimmed)
- **Border Color**: `rgba(72, 219, 251, 0.25)` (Info Blue with 25% opacity - dimmed)
- **Text Color**: `rgba(72, 219, 251, 0.6)` (Info Blue with 60% opacity - dimmed)
- **Opacity**: `0.7` (overall dimming effect)
- **Visual Effect**: Similar to KO button and reserve button active states

#### Active Hover State
- **Background**: `rgba(72, 219, 251, 0.2)` (slightly brighter but still dimmed)
- **Border Color**: `rgba(72, 219, 251, 0.3)` (slightly brighter but still dimmed)
- **Text Color**: `rgba(72, 219, 251, 0.7)` (slightly brighter but still dimmed)

#### CSS Implementation

```css
/* Draw Training button styling - Blue button for Spartan Training Ground */
.draw-training-btn {
    background: rgba(72, 219, 251, 0.2);
    color: #48dbfb;
    border: 1px solid rgba(72, 219, 251, 0.3);
    border-radius: 3.3px;
    padding: 3.3px 6.6px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    font-family: monospace;
    box-sizing: border-box;
    line-height: 1;
}

.draw-training-btn:hover {
    background: rgba(72, 219, 251, 0.3);
    border-color: rgba(72, 219, 251, 0.5);
}

/* Dimmed state when Pre-Placed is active (similar to KO and reserve buttons) */
.draw-training-btn.active {
    background: rgba(72, 219, 251, 0.15);
    border-color: rgba(72, 219, 251, 0.25);
    color: rgba(72, 219, 251, 0.6);
    opacity: 0.7;
}

.draw-training-btn.active:hover {
    background: rgba(72, 219, 251, 0.2);
    border-color: rgba(72, 219, 251, 0.3);
    color: rgba(72, 219, 251, 0.7);
}
```

### Usage Example

```javascript
// Training card with exclude_from_draw flag
const trainingCard = {
    type: 'training',
    cardId: 'training-123',
    quantity: 1,
    exclude_from_draw: true  // This card will be excluded from Draw Hand
};

// Draw Hand automatically filters out excluded cards
window.DrawHand.drawHand();  // Excluded cards are not included in draw pile
```

### Integration Points

- **Card View Rendering**: Button appears conditionally based on location presence
- **Deck Loading**: `exclude_from_draw` flag is loaded from database
- **Deck Saving**: Flag is persisted when deck is saved
- **Draw Hand Logic**: Filtering happens in `drawHand()` function before random selection

### CSS Implementation

```css
/* Draw Hand Section */
.draw-hand-section {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(78, 205, 196, 0.3);
    border-radius: 8px;
    margin: 20px;
    padding: 15px;
}

.draw-hand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.draw-hand-header h4 {
    color: #4ecdc4;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.draw-hand-close {
    background: none;
    border: none;
    color: #888;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.draw-hand-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.draw-hand-content {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
}

.drawn-card {
    width: 132px;
    height: 185px;
    border-radius: 6px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border: 2px solid rgba(78, 205, 196, 0.3);
    transition: all 0.3s ease;
    cursor: grab;
    position: relative;
}

.drawn-card.event-card {
    width: 185px;
    height: 132px;
}

.drawn-card:hover {
    transform: translateY(-12px) scale(1.984);
    z-index: 10;
    box-shadow: 0 12px 24px rgba(78, 205, 196, 0.4);
    border-color: rgba(78, 205, 196, 0.8);
}

.draw-hand-content:hover .drawn-card:not(:hover) {
    transform: scale(0.85);
    opacity: 0.7;
}

.drawn-card:active {
    cursor: grabbing;
}

.drawn-card.dragging {
    opacity: 0.5;
    transform: rotate(5deg) scale(1.1);
    z-index: 1000;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.draw-hand-content.drag-over {
    background-color: rgba(78, 205, 196, 0.1);
    border: 2px dashed #4ecdc4;
}
```

### CSS Classes Reference

| Class | Purpose | Key Properties |
|-------|---------|----------------|
| `.draw-hand-section` | Main container | Background, border, padding, margin |
| `.draw-hand-header` | Header section | Flex layout, spacing |
| `.draw-hand-header h4` | Section title | Teal color, font size |
| `.draw-hand-close` | Close button | Circular button, hover effects |
| `.draw-hand-content` | Content area | Flex layout, gap, wrap |
| `.draw-hand-content.drag-over` | Drag target state | Teal background, dashed border |
| `.drawn-card` | Individual card | Dimensions, border, transitions |
| `.drawn-card.event-card` | Event card (landscape) | Rotated dimensions |
| `.drawn-card:hover` | Card hover state | Lift, scale, glow effects |
| `.drawn-card.dragging` | Card being dragged | Opacity, rotation, shadow |
| `.drawn-card.ko-dimmed` | KO dimmed card | Reduced opacity |
| `.draw-training-btn` | Pre-Placed button (Training cards) | Info Blue styling, monospace font |
| `.draw-training-btn.active` | Pre-Placed active state | Dimmed appearance when excluded |

### Color Values

- **Primary Teal**: `#4ecdc4` - Used for borders, text, accents
- **Teal Opacity Variants**:
  - `rgba(78, 205, 196, 0.2)` - 20% opacity (backgrounds)
  - `rgba(78, 205, 196, 0.3)` - 30% opacity (borders)
  - `rgba(78, 205, 196, 0.4)` - 40% opacity (hover borders, shadows)
  - `rgba(78, 205, 196, 0.8)` - 80% opacity (active borders)
- **Info Blue**: `#48dbfb` - Used for Pre-Placed button (Spartan Training Ground feature)
- **Info Blue Opacity Variants**:
  - `rgba(72, 219, 251, 0.2)` - 20% opacity (button background)
  - `rgba(72, 219, 251, 0.3)` - 30% opacity (button border, hover background)
  - `rgba(72, 219, 251, 0.5)` - 50% opacity (hover border)
  - `rgba(72, 219, 251, 0.15)` - 15% opacity (active state background - dimmed)
  - `rgba(72, 219, 251, 0.25)` - 25% opacity (active state border - dimmed)
  - `rgba(72, 219, 251, 0.6)` - 60% opacity (active state text - dimmed)
  - `rgba(72, 219, 251, 0.7)` - 70% opacity (active hover text - dimmed)
- **Background**: `rgba(255, 255, 255, 0.05)` - 5% white overlay
- **Text**: `#888` (gray) for close button, `#fff` (white) on hover

## Backward Compatibility

The module maintains backward compatibility with existing code:

- `window.drawnCards` - Global array maintained for compatibility
- `window.displayDrawnCards` - Global function maintained for KO feature
- Wrapper functions in `ui-utility-functions.js` delegate to the module

## Testing

Comprehensive unit tests cover all functionality:

- **Module Tests**: 35 tests covering core functionality
- **Wrapper Tests**: 8 tests for UI wrapper functions
- **Integration Tests**: 9 tests for KO feature integration

Run tests with:
```bash
npm run test:unit -- draw-hand-module.test.ts draw-hand-ui-wrappers.test.ts draw-hand-ko-integration.test.ts
```

## Architecture

The Draw Hand feature is implemented as a self-contained module:

```
draw-hand.js
├── Private State
│   ├── drawnCards (array)
│   └── draggedIndex (number)
├── Core Functions
│   ├── init()
│   ├── drawHand()
│   ├── displayDrawnCards()
│   └── refresh()
├── UI Functions
│   ├── toggle()
│   ├── close()
│   └── updateButtonState()
├── Drag & Drop Handlers
│   ├── handleDragStart()
│   ├── handleDragEnd()
│   ├── handleDragOver()
│   ├── handleDrop()
│   ├── handleContainerDragOver()
│   └── handleContainerDrop()
└── Public API
    └── window.DrawHand
```

## Error Handling

The module handles edge cases gracefully:

- **Empty Deck**: Returns empty array, doesn't throw
- **Insufficient Cards**: Draws only available cards (prevents infinite loops)
- **Missing Elements**: Logs warnings, doesn't throw
- **Unknown Cards**: Uses placeholder image and "Unknown Card" tooltip

## Performance Considerations

- **Efficient Drawing**: Uses Set for O(1) index lookups
- **Safety Checks**: Prevents infinite loops with attempt limits
- **Minimal DOM Updates**: Only updates changed elements
- **Event Delegation**: Uses efficient event listeners

## Future Enhancements

Potential improvements:

- **Hand History**: Track multiple drawn hands
- **Statistics**: Show draw probabilities and card distribution
- **Export Hand**: Export drawn hand as image or text
- **Custom Hand Size**: Allow users to specify hand size
- **Undo/Redo**: Undo last draw or redo previous hand

## Related Documentation

- [Draw Hand Refactoring Plan](../../../docs/history/DRAW_HAND_REFACTORING_PLAN.md)
- [Draw Hand Test Coverage Summary](../../../docs/history/DRAW_HAND_TEST_COVERAGE_SUMMARY.md)
- [Simulate KO Feature](./simulate-ko.js)

