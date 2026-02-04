# Deck Editor Card View Documentation

## Overview

The Card View is an advanced deck visualization mode in the Overpower Deckbuilder that provides a unique card-centric display of deck contents. This view is available to all users and offers a completely different visual experience compared to the standard Tile View and List View modes.

## Table of Contents

1. [Architecture & Design](#architecture--design)
2. [Access Control & Security](#access-control--security)
3. [Visual Layout System](#visual-layout-system)
4. [Card Rendering Logic](#card-rendering-logic)
5. [Interactive Features](#interactive-features)
6. [CSS Styling System](#css-styling-system)
7. [Responsive Design](#responsive-design)
8. [Integration Points](#integration-points)
9. [Debug Logging & Monitoring](#debug-logging--monitoring)
10. [Testing Coverage](#testing-coverage)
11. [Performance Considerations](#performance-considerations)
12. [Future Enhancements](#future-enhancements)

## Architecture & Design

### Core Function
The Card View is implemented through the `renderDeckCardsCardView()` function located in `public/index.html` (lines 3832-3967). This function is completely independent from the Tile View and List View rendering systems.

### Key Design Principles
- **Universal Access**: Available to all user roles (ADMIN, USER, GUEST)
- **Visual Card Focus**: Displays actual card images as the primary interface element
- **Category-Based Organization**: Groups cards by type with clear visual separation
- **Responsive Layout**: Adapts to different screen sizes with proportional scaling
- **Independent Rendering**: No dependencies on other view systems

### Data Flow
```
window.deckEditorCards → renderDeckCardsCardView() → HTML Generation → DOM Update
```

## Access Control & Security

### User Role Validation
```javascript
// Card View is now available to all users
// No role-based restrictions
```

### Security Features
- **Universal Access**: All user roles can access Card View
- **Client-Side Validation**: Immediate feedback for unauthorized access
- **Server-Side Enforcement**: Backend APIs maintain role-based restrictions
- **Graceful Degradation**: Non-admin users see warning and fallback to other views

## Visual Layout System

### Container Structure
The Card View uses a hierarchical container system:

```
.deck-cards-editor.card-view
├── .card-view-category-section (per card type)
│   ├── .card-view-category-header
│   │   ├── .card-view-category-name
│   │   └── .card-view-category-count
│   └── .card-view-category-cards
│       └── .deck-card-card-view-item (per card)
│           ├── .card-view-image
│           └── .card-view-actions
│               ├── .alternate-art-btn (conditional)
│               ├── .remove-one-btn (conditional)
│               ├── .add-one-btn (conditional)
│               └── .quantity-btn (conditional)
```

### Layout Independence
The Card View completely overrides the standard deck editor layout:
```css
.deck-cards-editor.card-view .deck-column,
.deck-cards-editor.card-view .deck-type-section {
    display: none !important;
}
```

## Card Rendering Logic

### Card Grouping Algorithm
Cards are grouped by type with special handling for universe cards:

```javascript
// Group cards by type - Card View specific logic
const cardsByType = {};
window.deckEditorCards.forEach((card, index) => {
    let type = card.type;
    // Convert underscore format to hyphen format for consistency
    if (type === 'ally_universe') {
        type = 'ally-universe';
    } else if (type === 'basic_universe') {
        type = 'basic-universe';
    } else if (type === 'advanced_universe') {
        type = 'advanced-universe';
    }
    
    if (!cardsByType[type]) {
        cardsByType[type] = [];
    }
    cardsByType[type].push({ ...card, originalIndex: index });
});
```

### Type Ordering System
Cards are displayed in a specific order optimized for deck building:

```javascript
const typeOrder = [
    'character', 'location', 'mission', 'event', 'special', 
    'aspect', 'advanced-universe', 'teamwork', 'ally-universe', 
    'training', 'basic-universe', 'power'
];
```

### Display Names Mapping
Each card type has a user-friendly display name:

```javascript
const typeDisplayNames = {
    'character': 'Characters',
    'location': 'Locations', 
    'mission': 'Missions',
    'event': 'Events',
    'special': 'Special Cards',
    'aspect': 'Aspects',
    'advanced-universe': 'Universe: Advanced',
    'teamwork': 'Universe: Teamwork',
    'ally-universe': 'Universe: Ally',
    'training': 'Universe: Training',
    'basic-universe': 'Universe: Basic',
    'power': 'Power Cards'
};
```

## Interactive Features

### Card Hover System
Each card supports hover interactions for enhanced user experience:

```javascript
onmouseenter="showCardHoverModal('${cardImagePath}', '${cardName}')"
onmouseleave="hideCardHoverModal()"
```

**Detailed Documentation**: See [Card Hover Modal Documentation](../docs/card-hover-modal.md) for comprehensive details on:
- Function API and parameters
- Positioning algorithm (mouse tracking, viewport boundaries, button avoidance)
- Button avoidance logic for different card contexts
- Usage examples and implementation details

**Key Features**:
- **Smart Positioning**: Modal follows mouse cursor while avoiding buttons and staying within viewport
- **Button Avoidance**: Automatically repositions to avoid overlapping with interactive buttons (120px buffer for deck cards, 60px for plus buttons)
- **Mouse Tracking**: Continuously updates position via `mousemove` event listener
- **Delayed Hide**: 100ms timeout prevents flickering on rapid mouse movements
- **Universal Support**: Works across deck editor, collection view, and card browser contexts

### Quantity Management
Different card types have different quantity control patterns:

#### Multi-Quantity Cards (Power, Special, Event, Aspect, Universe, Training)
```javascript
quantityButtons = `
    <button class="remove-one-btn card-view-btn" onclick="removeOneCardFromEditor(${index})">-1</button>
    <button class="add-one-btn card-view-btn" onclick="addOneCardToEditor(${index})">+1</button>
`;
```

#### Single-Quantity Cards (Character, Location, Mission)
```javascript
quantityButtons = `<button class="quantity-btn card-view-btn" onclick="removeCardFromEditor(${index})">-</button>`;
```

### Alternate Art Support
Cards with alternate images display a "Change Art" button. The Card View uses the same logic as the Tile View to detect alternate arts by checking if multiple cards exist in `availableCardsMap` with matching characteristics:

- **Characters**: Matched by name and universe
- **Special Cards**: Matched by character name and card name
- **Power Cards**: Matched by value, universe, and power type

```javascript
// Check if this card has alternate arts (same logic as tile view)
let hasAlternateArts = false;
if (availableCard && window.availableCardsMap) {
    if (card.type === 'character') {
        const name = (availableCard.name || '').trim();
        const universe = (availableCard.universe || 'ERB').trim() || 'ERB';
        let count = 0;
        window.availableCardsMap.forEach((c, id) => {
            const cardType = c.cardType || c.type || '';
            if ((cardType === 'character' || id.startsWith('char_')) && 
                (c.name || '').trim() === name && 
                (c.universe || 'ERB').trim() === universe) {
                count++;
            }
        });
        hasAlternateArts = count > 1;
    } else if (card.type === 'special') {
        // Similar logic for special cards...
    } else if (card.type === 'power') {
        // Similar logic for power cards...
    }
}

// Create Change Art button if card has alternate arts
const changeArtButton = hasAlternateArts ? 
    `<button class="alternate-art-btn card-view-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>` : '';
```

The Change Art button appears before the quantity buttons in the card actions section.

## CSS Styling System

### Card Dimensions
The Card View uses two distinct card layouts:

#### Portrait Cards (Default)
- **Width**: 175px
- **Height**: 250px
- **Aspect Ratio**: 7:10 (portrait)
- **Used for**: Power, Special, Event, Aspect, Universe, Training cards

#### Landscape Cards
- **Width**: 250px
- **Height**: 175px
- **Aspect Ratio**: 10:7 (landscape)
- **Used for**: Character, Location, Mission cards

### Visual Effects
```css
.deck-card-card-view-item:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

### Button Styling
Card View buttons use a consistent teal color scheme:

```css
.card-view-btn {
    font-size: 10px;
    padding: 3px 6px;
    min-width: 32px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid rgba(78, 205, 196, 0.3);
    background: rgba(78, 205, 196, 0.2);
    color: #4ecdc4;
}
```

### Category Headers
Each card type section has a distinctive header:

```css
.card-view-category-header {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 12px;
}
```

## Responsive Design

### Breakpoint System
The Card View implements a comprehensive responsive design with 75% scaling at each breakpoint:

#### Desktop (Default)
- Portrait: 175px × 250px
- Landscape: 250px × 175px

#### Large Tablet (≤1200px)
- Portrait: 160px × 229px (75% scaling)
- Landscape: 225px × 137px (75% scaling)

#### Tablet (≤1000px)
- Portrait: 146px × 208px (75% scaling)
- Landscape: 203px × 125px (75% scaling)

#### Small Tablet (≤800px)
- Portrait: 131px × 188px (75% scaling)
- Landscape: 183px × 113px (75% scaling)

#### Mobile (≤600px)
- Portrait: 116px × 167px (75% scaling)
- Landscape: 161px × 100px (75% scaling)

### Flexible Layout
Cards use flexbox for responsive behavior:

```css
.card-view-category-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 30px; /* horizontal gap: 10px, vertical gap: 30px */
    width: 100%;
}
```

## Integration Points

### View Manager Integration
The Card View integrates with the ViewManager system:

```javascript
// ViewManager methods for Card View
switchToCardView() {
    this.currentView = 'card';
    // Disconnect layout observer when switching to card view
    // ... implementation details
}
```

### Card Data Integration
The Card View relies on global data structures:

- `window.deckEditorCards`: Array of cards in the current deck
- `window.availableCardsMap`: Map of all available cards by ID
- `currentUser`: Current user object for role validation

### Function Dependencies
Key functions used by Card View:

- `getCardImagePath()`: Generates card image URLs
- `showCardHoverModal()`: Displays card hover preview
- `hideCardHoverModal()`: Hides card hover preview
- `showAlternateArtSelectionForExistingCard()`: Opens alternate art selection
- `removeOneCardFromEditor()`: Removes one copy of a card
- `addOneCardToEditor()`: Adds one copy of a card
- `removeCardFromEditor()`: Removes entire card from deck

## Debug Logging & Monitoring

### Warning Messages
The Card View includes strategic debug logging:

```javascript
// Admin access warning
console.warn('Card View is only available to ADMIN users');

// Missing card data warning
console.warn('Card not found in availableCardsMap:', card);
```

### Error Handling
Robust error handling for missing data:

```javascript
if (!availableCard) {
    console.warn('Card not found in availableCardsMap:', card);
    return; // Skip rendering this card
}
```

### Empty State Handling
Graceful handling of empty decks:

```javascript
if (window.deckEditorCards.length === 0) {
    deckCardsEditor.innerHTML = `
        <div class="empty-deck-message">
            <p>No cards in this deck yet.</p>
            <p>Drag cards from the right panel to add them!</p>
        </div>
    `;
    return;
}
```

## Testing Coverage

### Unit Tests
The Card View functionality is covered by comprehensive unit tests:

#### View Components Core Tests (`tests/unit/view-components-core.test.ts`)
- Card grouping logic validation
- HTML generation verification
- Global function integration testing
- View mode logic testing
- Error handling validation

#### Deck Display Functionality Tests (`tests/unit/deck-display-functionality.test.ts`)
- Empty deck display testing
- Card addition and display validation
- Visual element rendering verification
- Interactive element testing
- Multiple card handling
- Error state management

### Test Scenarios Covered
- **Empty Deck State**: Proper empty message display
- **Card Addition**: Visual rendering of added cards
- **Card Grouping**: Correct type-based organization
- **Interactive Elements**: Button functionality and hover effects
- **Error Handling**: Missing card data scenarios
- **Multiple Cards**: Layout with various card types
- **Responsive Behavior**: Different screen size adaptations

## Performance Considerations

### Rendering Optimization
- **Efficient DOM Updates**: Single innerHTML assignment for entire view
- **Minimal Re-renders**: Only re-renders when deck contents change
- **Image Loading**: Lazy loading support for card images
- **Memory Management**: Proper cleanup of event handlers

### Scalability
- **Large Deck Support**: Handles decks with many cards efficiently
- **Responsive Scaling**: Maintains performance across device sizes
- **Category Virtualization**: Could be implemented for very large decks

### Browser Compatibility
- **Modern CSS**: Uses flexbox and CSS Grid for layout
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Touch Support**: Optimized for touch interactions on mobile devices

## Future Enhancements

### Potential Improvements
1. **Card Sorting Options**: Allow users to sort cards within categories
2. **Search Integration**: Add search functionality within Card View
3. **Drag and Drop**: Enable drag-and-drop reordering of cards
4. **Bulk Operations**: Add bulk add/remove functionality
5. **Export Features**: Export Card View as image or PDF
6. **Customization**: Allow users to customize card sizes and layouts
7. **Animation**: Add smooth transitions between view modes
8. **Accessibility**: Enhanced screen reader support and keyboard navigation

### Technical Debt
1. **Code Organization**: Extract Card View logic into separate module
2. **CSS Optimization**: Consolidate responsive breakpoints
3. **Performance**: Implement virtual scrolling for large decks
4. **Testing**: Add integration tests for Card View interactions

## Conclusion

The Card View represents a sophisticated and well-designed feature that provides ADMIN users with a unique and visually appealing way to interact with their decks. Its independent architecture, comprehensive responsive design, and robust error handling make it a valuable addition to the Overpower Deckbuilder application.

The implementation demonstrates best practices in:
- **Separation of Concerns**: Independent rendering system
- **User Experience**: Intuitive visual interface
- **Accessibility**: Role-based access control
- **Maintainability**: Clear code structure and comprehensive testing
- **Performance**: Efficient rendering and responsive design

This documentation serves as a comprehensive guide for developers working with or extending the Card View functionality.
