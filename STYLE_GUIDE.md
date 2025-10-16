# Overpower Deckbuilder Style Guide

## Table of Contents
1. [Overview](#overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [UI Components](#ui-components)
5. [Screen-Specific Styling](#screen-specific-styling)
6. [Images and Assets](#images-and-assets)
7. [Layout and Spacing](#layout-and-spacing)
8. [Deck Editor Layout Specifications (2025)](#deck-editor-layout-specifications-2025)
9. [Interactive States](#interactive-states)
10. [Responsive Design](#responsive-design)

## Overview

The Overpower Deckbuilder follows a dark, modern design aesthetic with a focus on card game theming. The design uses a consistent color palette of teals, golds, and dark backgrounds to create an immersive gaming experience.

## Color Palette

### Primary Colors

#### Background Colors
- **Primary Background**: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
  - Used for: Main page backgrounds across all screens
  - Hex equivalent: `#1a1a2e` to `#16213e`
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #1a1a2e; border: 1px solid #ccc; vertical-align: middle; margin-right: 4px;"></span><span style="display: inline-block; width: 20px; height: 20px; background-color: #16213e; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Secondary Background**: `rgba(255, 255, 255, 0.1)`
  - Used for: Card containers, modal backgrounds, section backgrounds
  - Provides subtle transparency over main background
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle; margin-right: 4px;"></span> (10% opacity)

- **Card Background**: `rgba(52, 73, 94, 0.8)`
  - Used for: Deck editor cards, database cards, modal content
  - Hex equivalent: `#34495e` with 80% opacity
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #34495e; border: 1px solid #ccc; vertical-align: middle;"></span>

#### Accent Colors

- **Primary Teal**: `#4ecdc4`
  - Used for: Primary buttons, active states, highlights, text accents
  - Gradient: `linear-gradient(135deg, #4ecdc4, #2cb1a6)`
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #4ecdc4; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Secondary Teal**: `#2cb1a6`
  - Used for: Hover states, gradient combinations
  - Often paired with primary teal in gradients
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #2cb1a6; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Gold/Yellow**: `#ffd700`
  - Used for: Section titles, stat values, important text
  - Gradient: `linear-gradient(45deg, #ffd700, #ffed4e)`
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffd700; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Red Accent**: `#ff6b6b`
  - Used for: Danger states, threat indicators, error messages
  - Gradient: `linear-gradient(45deg, #ff6b6b, #4ecdc4)`
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #ff6b6b; border: 1px solid #ccc; vertical-align: middle;"></span>

#### Text Colors

- **Primary Text**: `#ffffff`
  - Used for: Main body text, headings, labels
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Secondary Text**: `#bdc3c7`
  - Used for: Subtext, descriptions, secondary information
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #bdc3c7; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Muted Text**: `rgba(255, 255, 255, 0.6)`
  - Used for: Placeholders, disabled states, subtle text
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle;"></span> (60% opacity)

- **Dark Text**: `#1a1a2e`
  - Used for: Text on light backgrounds (buttons, cards)
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #1a1a2e; border: 1px solid #ccc; vertical-align: middle;"></span>

#### Status Colors

- **Success Green**: `#27ae60`
  - Used for: Success states, positive actions
  - Gradient: `linear-gradient(135deg, #27ae60, #2ecc71)`
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #27ae60; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Danger Red**: `#e74c3c`
  - Used for: Error states, delete actions, warnings
  - Gradient: `linear-gradient(135deg, #e74c3c, #c0392b)`
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #e74c3c; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Warning Yellow**: `#feca57`
  - Used for: Warning states, medium threat levels
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #feca57; border: 1px solid #ccc; vertical-align: middle;"></span>

- **Info Blue**: `#48dbfb`
  - Used for: Information states, low threat levels
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #48dbfb; border: 1px solid #ccc; vertical-align: middle;"></span>

#### Border Colors

- **Primary Border**: `rgba(255, 255, 255, 0.2)`
  - Used for: Card borders, input borders, general borders
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle;"></span> (20% opacity)

- **Accent Border**: `rgba(78, 205, 196, 0.3)`
  - Used for: Active states, focused elements, teal accents
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #4ecdc4; border: 1px solid #ccc; vertical-align: middle;"></span> (30% opacity)

- **Gold Border**: `rgba(255, 215, 0, 0.3)`
  - Used for: Section dividers, important borders
  - <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffd700; border: 1px solid #ccc; vertical-align: middle;"></span> (30% opacity)

## Typography

### Font Family
- **Primary**: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- Used consistently across all screens and components

### Font Sizes
- **Large Headings**: `2.5rem` (40px)
- **Section Headings**: `1.8rem` (28.8px)
- **Subsection Headings**: `1.5rem` (24px)
- **Body Text**: `1rem` (16px)
- **Small Text**: `0.9rem` (14.4px)
- **Tiny Text**: `0.8rem` (12.8px)

### Font Weights
- **Bold**: `700` - Used for headings, important text
- **Semi-bold**: `600` - Used for buttons, labels
- **Medium**: `500` - Used for secondary headings
- **Regular**: `400` - Used for body text

## UI Components

### Buttons

#### Primary Button
- **Background**: `linear-gradient(135deg, #4ecdc4, #2cb1a6)`
- **Text Color**: `#1a1a2e`
- **Border**: `1px solid #4ecdc4`
- **Padding**: `8px 16px`
- **Border Radius**: `6px`
- **Hover**: Lighter gradient with `translateY(-1px)` transform
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #4ecdc4; border: 1px solid #ccc; vertical-align: middle; margin-right: 4px;"></span> → <span style="display: inline-block; width: 20px; height: 20px; background-color: #2cb1a6; border: 1px solid #ccc; vertical-align: middle;"></span>

#### Secondary Button
- **Background**: `rgba(255, 255, 255, 0.1)`
- **Text Color**: `#ffffff`
- **Border**: `1px solid rgba(255, 255, 255, 0.2)`
- **Hover**: `rgba(255, 255, 255, 0.2)`
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle;"></span> (10% opacity)

#### Danger Button
- **Background**: `linear-gradient(135deg, #e74c3c, #c0392b)`
- **Text Color**: `#ffffff`
- **Border**: `1px solid #e74c3c`
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #e74c3c; border: 1px solid #ccc; vertical-align: middle; margin-right: 4px;"></span> → <span style="display: inline-block; width: 20px; height: 20px; background-color: #c0392b; border: 1px solid #ccc; vertical-align: middle;"></span>

### Cards

#### Main Card Container
- **Background**: `rgba(52, 73, 94, 0.8)`
- **Border Radius**: `10px`
- **Padding**: `1.5rem`
- **Box Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)`
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #34495e; border: 1px solid #ccc; vertical-align: middle;"></span> (80% opacity)

#### Card Item
- **Background**: `rgba(255, 255, 255, 0.1)`
- **Border**: `1px solid rgba(255, 215, 0, 0.3)`
- **Border Radius**: `8px`
- **Padding**: `1rem`
- **Hover**: `rgba(255, 215, 0, 0.2)` background with `#ffd700` border
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle; margin-right: 4px;"></span> (10% opacity) + <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffd700; border: 1px solid #ccc; vertical-align: middle;"></span> border

### Modals

#### Modal Overlay
- **Background**: `rgba(0, 0, 0, 0.8)`
- **Z-index**: `1000`
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #000000; border: 1px solid #ccc; vertical-align: middle;"></span> (80% opacity)

#### Modal Content
- **Background**: `rgba(52, 73, 94, 0.95)`
- **Border Radius**: `10px`
- **Padding**: `2rem`
- **Box Shadow**: `0 8px 32px rgba(0, 0, 0, 0.5)`
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #34495e; border: 1px solid #ccc; vertical-align: middle;"></span> (95% opacity)

### Input Fields

#### Text Input
- **Background**: `rgba(255, 255, 255, 0.9)`
- **Text Color**: `#1a1a2e`
- **Border**: `none`
- **Border Radius**: `5px`
- **Padding**: `0.75rem`
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle;"></span> (90% opacity)

#### Select Dropdown
- **Background**: `rgba(255, 255, 255, 0.9)`
- **Text Color**: `#1a1a2e`
- **Border**: `none`
- **Border Radius**: `5px`
- **Padding**: `0.75rem`
- <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle;"></span> (90% opacity)

## Screen-Specific Styling

### Main Dashboard (index.html)
- **Background**: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
- **Header**: Unified header with logo, navigation tabs, and user menu
- **Deck Cards**: Grid layout with teal accents and gold highlights
- **Statistics**: Gold text for values, teal for labels

### Database View (database.html)
- **Character Cards**: Teal borders with gold text for character names
- **Stat Cards**: `rgba(255, 255, 255, 0.1)` background with teal numbers
- **Tab Navigation**: Teal active states with white inactive states
- **Search Results**: Gold highlights for matching text

### Deck Builder (deck-builder.html)
- **Two-Column Layout**: Card browser and deck viewer side by side
- **Card Categories**: Collapsible sections with gold headers
- **Deck Statistics**: Gold text for values, teal for labels
- **Drag and Drop**: Teal borders for drop zones

### Deck Editor Modal Layout (Latest Design - 2025)
- **Single Row Header Layout**: All elements in one horizontal row
- **Left Section**: Deck title and description
- **Center Section**: Summary statistics (perfectly centered in window width)
- **Right Section**: Action buttons (Save/Cancel stacked vertically)
- **Search Bar**: Replaces "Available Cards" text above card list
- **Default Divider Position**: 67% deck pane / 33% available cards pane
- **Minimal Spacing**: Reduced padding and margins for compact layout

### Database Management (database-view.html)
- **Admin Interface**: Similar to database view with additional controls
- **User Management**: Red accents for danger actions
- **Data Tables**: Alternating row colors for readability

## Images and Assets

### Logo
- **Primary Logo**: `/src/resources/images/logo/logo5.png`
- **Usage**: Header navigation, login modals, main branding
- **Sizing**: Max-width 300px for main display, 120px for header

### Icons
- **Threat Icon**: `/resources/images/icons/threat.png`
- **Stat Icons**: 
  - Brute Force: `/src/resources/images/icons/brute_force.png`
  - Combat: `/src/resources/images/icons/combat.png`
  - Energy: `/src/resources/images/icons/energy.png`
  - Intelligence: `/src/resources/images/icons/intelligence.png`

### Card Images
- **Character Cards**: `/src/resources/cards/images/characters/[character_name].webp`
- **Mission Cards**: `/src/resources/cards/images/missions/[mission_name]/[card_name].webp`
- **Power Cards**: `/src/resources/cards/images/power-cards/[card_name].webp`
- **Special Cards**: `/src/resources/cards/images/specials/[card_name].webp`
- **Placeholder**: `/src/resources/cards/images/placeholder.webp`

### Image Usage by Screen

#### Main Dashboard
- Logo in header navigation
- Character card images in deck displays
- Threat icons in deck statistics

#### Database View
- Logo in header
- Character card images in search results
- Stat icons in character details

#### Deck Builder
- Character card images in card browser
- Deck card images in deck viewer
- Placeholder images for missing cards

## Layout and Spacing

### Grid Systems
- **Main Container**: Max-width 1400px, centered
- **Card Grids**: `repeat(auto-fill, minmax(150px, 1fr))`
- **Deck Builder**: Two-column layout with `1fr 1fr`

### Spacing Scale
- **Extra Small**: `0.25rem` (4px)
- **Small**: `0.5rem` (8px)
- **Medium**: `1rem` (16px)
- **Large**: `1.5rem` (24px)
- **Extra Large**: `2rem` (32px)

### Padding and Margins
- **Card Padding**: `1rem` to `1.5rem`
- **Section Margins**: `1rem` to `2rem`
- **Button Padding**: `6px 12px` to `8px 16px`

## Deck Editor Layout Specifications (2025)

### Modal Header Layout
- **Container**: `.modal-header` with `display: flex`, `flex-direction: column`
- **Top Row**: `.deck-editor-top-row` with `display: flex`, `justify-content: space-between`
- **Padding**: `12px 20px 5px 20px` (reduced bottom padding for compact layout)
- **Margin Bottom**: `4px` (minimal spacing below header)
- **Gap**: `15px` between header elements
- **Border Bottom**: `1px solid rgba(255, 255, 255, 0.2)` (horizontal divider)

### Three-Section Layout
#### Left Section - Deck Title & Description
- **Container**: `.deck-editor-title-section`
- **Flex Properties**: `flex: 0 0 auto` (fixed width, no growing)
- **Margin Right**: `20px`
- **Min Width**: `200px` (ensures adequate space for title)
- **Content**: Deck title with validation badges, description text

#### Center Section - Summary Statistics
- **Container**: `.deck-summary-section`
- **Positioning**: `position: absolute`, `left: 50%`, `transform: translateX(-50%)`
- **Purpose**: Perfect centering in window width regardless of left/right content
- **Content**: Draw Hand/List View buttons (left of stats), deck statistics (centered)
- **Layout**: `.deck-summary-content` with `display: flex`, `justify-content: center`, `gap: 30px`

#### Right Section - Action Buttons
- **Container**: `.deck-editor-actions`
- **Flex Properties**: `flex: 0 0 auto`, `margin-left: auto` (pushes to right)
- **Layout**: `display: flex`, `flex-direction: column` (stacked vertically)
- **Gap**: `8px` between Save and Cancel buttons
- **Max Width**: `200px`

### Button Specifications
#### Action Buttons (Save/Cancel)
- **Base Class**: `.action-btn`
- **Height**: `auto` with `min-height: 24px`
- **Padding**: `4px 8px`
- **Box Sizing**: `border-box`
- **Width**: `100%` of container
- **Text Align**: `center`

#### Save Button Styling
- **Class**: `.action-btn.save-btn`
- **Background**: `rgba(78, 205, 196, 0.2)` (teal/cyan)
- **Color**: `#4ecdc4`
- **Border**: `1px solid rgba(78, 205, 196, 0.3)`
- **Hover**: `rgba(78, 205, 196, 0.3)` background, `rgba(78, 205, 196, 0.4)` border

#### Cancel Button Styling
- **Class**: `.action-btn.cancel-btn`
- **Background**: `rgba(255, 255, 255, 0.1)` (black and white look)
- **Color**: `#ffffff`
- **Border**: `1px solid rgba(255, 255, 255, 0.2)`
- **Hover**: `rgba(255, 255, 255, 0.2)` background, `rgba(255, 255, 255, 0.3)` border

### Search Bar Integration
- **Location**: Inside `.card-selector-pane`, replaces "Available Cards" heading
- **Container**: `.deck-editor-search-container`
- **Margins**: `margin-top: 7px`, `margin-bottom: 0px` (minimal spacing)
- **Flex Properties**: `flex-shrink: 0`

### Divider Configuration
- **Default Position**: 67% deck pane / 33% available cards pane
- **CSS Flex Values**: `.deck-pane` = `flex: 2`, `.card-selector-pane` = `flex: 1`
- **Draggable**: Resizable divider with security checks for ownership
- **Min Width**: Card selector pane has `min-width: 0` and `overflow: hidden`

### Read-Only Mode Badges
- **Limited Badge**: Inline with deck title
- **Read-Only Badge**: Inline to the right of Limited badge
- **Container**: `.deck-title-with-validation` with `display: flex`, `align-items: center`, `gap: 10px`
- **Flex Wrap**: `nowrap` to keep badges on same line
- **Badge Styling**: Content-based width (no fixed min-width)

### CSS Specificity Requirements
- **High Specificity**: Use `.modal-header .deck-editor-actions .action-btn.save-btn` for Save button
- **Important Declarations**: All button styling uses `!important` for proper override
- **Consistent Heights**: Both Save and Cancel buttons must have identical computed heights
- **Responsive Properties**: Maintain layout integrity across different screen sizes

## Interactive States

### Hover States
- **Cards**: Background change to `rgba(255, 215, 0, 0.2)` with gold border
- **Buttons**: Lighter gradient with `translateY(-1px)` transform
- **Links**: Color change to teal accent

### Focus States
- **Inputs**: Teal border with glow effect
- **Buttons**: Enhanced shadow and border
- **Cards**: Teal border with `rgba(78, 205, 196, 0.4)` glow

### Active States
- **Navigation**: Teal background with dark text
- **Buttons**: Pressed state with `translateY(0)`
- **Tabs**: Teal background with gold text

### Disabled States
- **Opacity**: `0.5` for disabled elements
- **Cursor**: `not-allowed` for disabled buttons
- **Colors**: Muted versions of normal states

## Responsive Design

### Breakpoints
- **Mobile**: `max-width: 768px`
- **Tablet**: `max-width: 900px`
- **Desktop**: `min-width: 901px`

### Mobile Adaptations
- **Single Column**: Deck builder switches to single column
- **Stacked Navigation**: Header elements stack vertically
- **Smaller Text**: Reduced font sizes for mobile
- **Touch Targets**: Minimum 44px for touch elements

### Tablet Adaptations
- **Flexible Grids**: Auto-fit columns with minimum widths
- **Adjusted Spacing**: Reduced padding and margins
- **Responsive Images**: Max-width constraints

## Accessibility

### Color Contrast
- **Text on Dark**: White text on dark backgrounds meets WCAG AA standards
- **Text on Light**: Dark text on light backgrounds for readability
- **Focus Indicators**: High contrast teal borders for keyboard navigation

### Interactive Elements
- **Minimum Touch Targets**: 44px minimum for mobile
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper alt text and ARIA labels

## Implementation Notes

### CSS Custom Properties
Consider implementing CSS custom properties for easier theme management:

```css
:root {
  --primary-teal: #4ecdc4;        /* <span style="display: inline-block; width: 16px; height: 16px; background-color: #4ecdc4; border: 1px solid #ccc; vertical-align: middle;"></span> */
  --secondary-teal: #2cb1a6;      /* <span style="display: inline-block; width: 16px; height: 16px; background-color: #2cb1a6; border: 1px solid #ccc; vertical-align: middle;"></span> */
  --gold: #ffd700;                /* <span style="display: inline-block; width: 16px; height: 16px; background-color: #ffd700; border: 1px solid #ccc; vertical-align: middle;"></span> */
  --red-accent: #ff6b6b;          /* <span style="display: inline-block; width: 16px; height: 16px; background-color: #ff6b6b; border: 1px solid #ccc; vertical-align: middle;"></span> */
  --dark-bg: #1a1a2e;             /* <span style="display: inline-block; width: 16px; height: 16px; background-color: #1a1a2e; border: 1px solid #ccc; vertical-align: middle;"></span> */
  --card-bg: rgba(52, 73, 94, 0.8); /* <span style="display: inline-block; width: 16px; height: 16px; background-color: #34495e; border: 1px solid #ccc; vertical-align: middle;"></span> */
  --text-primary: #ffffff;        /* <span style="display: inline-block; width: 16px; height: 16px; background-color: #ffffff; border: 1px solid #ccc; vertical-align: middle;"></span> */
  --text-secondary: #bdc3c7;      /* <span style="display: inline-block; width: 16px; height: 16px; background-color: #bdc3c7; border: 1px solid #ccc; vertical-align: middle;"></span> */
}
```

### Z-Index Management
- **Global Navigation**: `9999`
- **Modals**: `1000`
- **Header**: `100`
- **Cards**: `10`

### Animation Guidelines
- **Transitions**: `0.2s ease` for most interactions
- **Hover Effects**: `translateY(-1px)` for lift effect
- **Loading States**: Smooth opacity transitions
- **Modal Animations**: `slideIn` keyframes for notifications

---

*This style guide should be updated as the application evolves and new components are added.*
