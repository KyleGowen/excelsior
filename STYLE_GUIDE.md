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
11. [Global Navigation](#global-navigation)
12. [Import/Export Button Styling](#importexport-button-styling)
13. [One Per Deck Card Dimming](#one-per-deck-card-dimming)
14. [Cataclysm Card Dimming](#cataclysm-card-dimming)
15. [Assist Card Dimming](#assist-card-dimming)
16. [Ambush Card Dimming](#ambush-card-dimming)
17. [Fortification Card Dimming](#fortification-card-dimming)
18. [Deck Editor Card View Styling](#deck-editor-card-view-styling)
19. [Deck Editor List View Styling](#deck-editor-list-view-styling)
20. [Export Modal Styling](#export-modal-styling)
21. [Import Modal Styling](#import-modal-styling)

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

#### Deck Editor Utility Buttons (Draw Hand / List View)
- **Class**: `.remove-all-btn`
- **Background**: `rgba(78, 205, 196, 0.2)`
- **Text Color**: `#4ecdc4`
- **Border**: `1px solid rgba(78, 205, 196, 0.3)`
- **Height**: `28px` (fixed)
- **Min-Height**: `28px`
- **Min-Width**: `80px`
- **Padding**: `4px 8px`
- **Display**: `inline-flex`; `align-items: center`; `justify-content: center`
- **Text Wrapping**: `white-space: nowrap` (prevents multi-line labels)
- **Border Radius**: `4px`
- **Font**: `0.8rem`, `500`
- **Hover**: `background: rgba(78, 205, 196, 0.3)`; `border-color: rgba(78, 205, 196, 0.4)`
- These specs keep Draw Hand and List View visually identical.

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
- **Search Bar Styling**: 
  - **Advanced Universe Card Effect Search**: 480px width with centered alignment
  - **Locations Special Ability Search**: 480px width with centered alignment
  - **Events Game Effect Search**: 320px width with centered alignment
  - **Aspects Search Bars**: 300px width with centered alignment (Name, Location, Card Effect)
  - **Aspects Table Layout**: Fixed table layout with percentage-based column widths
    - Image: 15% | Add to Deck: 8% | Card Name: 18% | Location: 12% | Card Effect: 25% | Fortifications: 10% | One Per Deck: 12%
  - **CSS Implementation**: `width: 300px !important; max-width: 300px !important; margin: 0 auto; display: block; box-sizing: border-box;`
  - **Table Layout**: `table-layout: fixed !important; width: 100% !important;`
  - **Specificity**: Inline styles in `index.html` for highest CSS specificity override
  - **Responsive**: Maintains consistent width across different screen sizes

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

## Global Navigation

### Structure
- **Components**: Logo (left), navigation links/tabs (center/left), user menu and status (right)
- **Z-Index**: `9999` to ensure nav, dropdowns, and tooltips always render above page content
- **Stacking Context**: Create a new stacking context on the nav container to avoid overlap issues with modals/content

### Layout
- **Container**: Full-width bar pinned to the top
- **Height**: 56–64px depending on content
- **Padding**: `0 16px`
- **Display**: `flex`; `align-items: center`; `justify-content: space-between`

### Colors
- **Background**: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
- **Borders/Dividers**: `1px solid rgba(255, 255, 255, 0.2)` at bottom edge
- **Primary Accent (active/hover)**: `#4ecdc4`
- **Inactive Link**: `#bdc3c7`
- **Notification/Badge**: Limited badge color `#d2b48c` on dark base

### Links & Tabs
- **Default**: `color: #bdc3c7`
- **Active**: `color: #4ecdc4`; underline or bottom border with `rgba(78, 205, 196, 0.4)`
- **Hover**: Lighter teal text with subtle glow `text-shadow: 0 0 4px rgba(78, 205, 196, 0.35)`

### Dropdowns & Tooltips
- **Z-Index**: `9999` (must be above main content)
- **Background**: `rgba(0,0,0,0.9)` or nav gradient
- **Border**: `1px solid rgba(78, 205, 196, 0.3)`
- **Shadow**: `0 10px 24px rgba(0, 0, 0, 0.45)`
- **Spacing**: Minimum 8px from trigger; pointer caret optional

### Buttons in Global Nav
- **Style**: Match page buttons (primary teal treatment) or limited-badge style for special actions
- **Sizing**: `28px` min-height; `white-space: nowrap`
- **Interaction**: Hover teal brighten; active press state with reduced translateY

### Accessibility
- **Contrast**: All nav text must meet WCAG AA on dark gradient
- **Focus**: Visible teal focus ring `0 0 0 2px rgba(78, 205, 196, 0.5)`
- **Hit Area**: Minimum 44px height for interactive items

## Import/Export Button Styling

### Overview
Import and Export buttons are utility buttons in the deck editor available to all users (GUEST, USER, ADMIN) that share identical styling for visual consistency.

### Grid Layout
- **Container**: `.deck-editor-actions` with `display: grid`
- **Grid Template**: `grid-template-columns: 88px 88px`, `grid-template-rows: 24.5px 24.5px`
- **Gap**: `8px 6px` between grid items
- **Export Button**: `grid-column: 1`, `grid-row: 1` (top-left)
- **Import Button**: `grid-column: 1`, `grid-row: 2` (bottom-left)

### Shared Styling
Both buttons use identical visual styling:

#### Base Properties
- **Background**: `rgba(78, 205, 196, 0.2)` (teal with 20% opacity - matches Draw Hand/List View)
- **Text Color**: `#4ecdc4` (bright teal - matches Draw Hand/List View)
- **Border**: `1px solid rgba(78, 205, 196, 0.3)` (teal border with 30% opacity - matches Draw Hand/List View)
- **Height**: `auto` with `min-height: 24px`
- **Padding**: `4px 8px`
- **Width**: `100%` of grid cell
- **Box Sizing**: `border-box`
- **Border Radius**: `4px`
- **Font**: `12px`, `500` weight
- **Cursor**: `pointer`

#### Visual Effects
- **Transition**: `background-color 0.2s ease, border-color 0.2s ease`

#### Hover States
- **Background**: `rgba(78, 205, 196, 0.3)` (teal with 30% opacity - matches Draw Hand/List View hover)
- **Border**: `rgba(78, 205, 196, 0.4)` (teal border with 40% opacity - matches Draw Hand/List View hover)

### CSS Selectors
```css
/* Export Button */
.deck-editor-actions #exportBtn {
    grid-column: 1 !important;
    grid-row: 1 !important;
    background: rgba(78, 205, 196, 0.2) !important; /* teal - matches Draw Hand/List View */
    color: #4ecdc4 !important; /* bright teal - matches Draw Hand/List View */
    border: 1px solid rgba(78, 205, 196, 0.3) !important; /* teal border - matches Draw Hand/List View */
    /* ... other properties ... */
}

/* Import Button */
.deck-editor-actions #importBtn {
    grid-column: 1 !important;
    grid-row: 2 !important;
    background: rgba(78, 205, 196, 0.2) !important; /* teal - matches Draw Hand/List View */
    color: #4ecdc4 !important; /* bright teal - matches Draw Hand/List View */
    border: 1px solid rgba(78, 205, 196, 0.3) !important; /* teal border - matches Draw Hand/List View */
    /* ... other properties ... */
}
```

### Visibility Control
- **All Users**: Both buttons are hidden by default (`display: none`)
- **Show Logic**: JavaScript shows buttons for all users (GUEST, USER, ADMIN) when the deck editor is opened
- **Display**: Set to `inline-block` when visible

## One Per Deck Card Dimming

### Overview
Cards marked with `one_per_deck=TRUE` in the database receive visual dimming when added to a deck, preventing multiple copies from being selected.

### Visual Dimming System
When a "One Per Deck" card is added to the deck, all available cards of that type with `one_per_deck=TRUE` are visually dimmed to indicate they cannot be selected again.

#### Dimmed State Styling
- **CSS Class**: `.disabled` applied to card elements
- **Opacity**: `0.5` (50% transparency)
- **Cursor**: `not-allowed` (indicates non-interactive)
- **Draggable**: Set to `false` (prevents drag operations)
- **Tooltip**: Shows "One Per Deck - already in deck" or "One Per Deck - limit reached"

#### Implementation Details
- **Function**: `updateOnePerDeckLimitStatus()` in `public/index.html`

## One Per Deck Text Formatting

### Overview
The "One Per Deck" label in card effect text must be consistently formatted across all card types with bold styling and proper line breaks.

### Consistent Styling Rules
- **Bold Text**: "One Per Deck" must be displayed in **bold** using `<strong>` tags
- **Line Placement**: Must appear on its own line below the main card effect text
- **Spacing**: Two line breaks (`<br><br>`) separate the main effect from the "One Per Deck" label
- **HTML Encoding**: Properly decode HTML entities in card effect text

### Implementation by Card Type

#### Special Cards
- **Function**: `formatSpecialCardEffect()` in `public/js/card-display.js`
- **Keywords**: Handles multiple keywords including **Fortifications!**, **Cataclysm!**, **Assist!**, **Ambush!**, and **One Per Deck**
- **Order**: "One Per Deck" appears last in the keyword list

#### Advanced Universe Cards
- **Function**: `formatAdvancedUniverseCardEffect()` in `public/js/card-display-functions.js`
- **Keywords**: Handles **One Per Deck** keyword
- **Auto-detection**: Automatically adds "One Per Deck" label if `cardData.is_one_per_deck === true`

#### Formatting Process
1. **HTML Entity Decoding**: Convert HTML entities to proper characters
2. **Keyword Detection**: Find special keywords in the text
3. **Text Separation**: Remove keywords from main text
4. **Keyword Formatting**: Convert `**keyword**` to `<strong>keyword</strong>`
5. **Final Assembly**: Combine main text + line breaks + formatted keywords

#### Example Output
```html
Main card effect text here.<br><br><strong>One Per Deck</strong>
```
- **Trigger**: Called after adding/removing cards and when displaying deck
- **Scope**: Affects all card types (characters, specials, powers, events, etc.)
- **Database Field**: Uses `one_per_deck` boolean column from card tables

### Card Type Coverage
The dimming system applies to ALL card types that have `one_per_deck=TRUE`:

#### Character Cards
- **Selector**: `.card-item[data-type="character"][data-id]`
- **Logic**: Dims when character limit (3) is reached OR when specific character is already in deck
- **Special Case**: Character cards also dim when deck has reached the 3-character limit

#### Special Cards
- **Selector**: `.card-item[data-type="special"][data-id]`
- **Logic**: Dims when the specific card is already in deck
- **Examples**: Grim Reaper, Universe: Advanced, Training, Teamwork

#### Power Cards
- **Selector**: `.card-item[data-type="power"][data-id]`
- **Logic**: Dims when the specific power card is already in deck
- **Examples**: Any-Power power cards, Universe power cards

#### Event Cards
- **Selector**: `.card-item[data-type="event"][data-id]`
- **Logic**: Dims when the specific event card is already in deck

#### Mission Cards
- **Selector**: `.card-item[data-type="mission"][data-id]`
- **Logic**: Dims when the specific mission card is already in deck

### Visual State Management
#### Adding Cards
1. Card is added to `window.deckEditorCards` array
2. `updateOnePerDeckLimitStatus()` is called
3. All matching cards in available section are dimmed
4. Tooltips are updated to show limit status

#### Removing Cards
1. Card is removed from `window.deckEditorCards` array
2. `updateOnePerDeckLimitStatus()` is called
3. Previously dimmed cards are re-enabled
4. Tooltips are cleared or updated

#### Deck Display
1. `displayDeckCardsForEditing()` is called
2. `updateOnePerDeckLimitStatus()` is called at the end
3. Ensures dimming state is consistent with current deck contents

### CSS Implementation
```css
.card-item.disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
}

.card-item.disabled:hover {
    /* Maintain dimmed appearance on hover */
    opacity: 0.5 !important;
}
```

### JavaScript Integration
```javascript
function updateOnePerDeckLimitStatus() {
    // Get all one-per-deck cards currently in deck
    const onePerDeckCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.one_per_deck === true) {
            onePerDeckCardsInDeck.add(card.cardId);
        }
    });

    // Update all card types for one-per-deck dimming
    const cardTypes = ['character', 'special', 'power', 'event', 'mission'];
    cardTypes.forEach(cardType => {
        const cardItems = document.querySelectorAll(`.card-item[data-type="${cardType}"][data-id]`);
        cardItems.forEach(cardElement => {
            const cardId = cardElement.getAttribute('data-id');
            if (cardId) {
                const cardData = window.availableCardsMap.get(cardId);
                const isOnePerDeck = cardData && cardData.one_per_deck === true;
                const isInDeck = onePerDeckCardsInDeck.has(cardId);

                if (isOnePerDeck && isInDeck) {
                    cardElement.classList.add('disabled');
                    cardElement.setAttribute('draggable', 'false');
                    cardElement.title = 'One Per Deck - already in deck';
                } else if (isOnePerDeck && !isInDeck) {
                    cardElement.classList.remove('disabled');
                    cardElement.setAttribute('draggable', 'true');
                    cardElement.title = '';
                }
            }
        });
    });
}
```

### User Experience
- **Immediate Feedback**: Cards dim instantly when added to deck
- **Clear Indication**: Dimmed cards are visually distinct and non-interactive
- **Informative Tooltips**: Hover text explains why card cannot be selected
- **Consistent Behavior**: Same dimming pattern across all card types
- **Reversible**: Cards become available again when removed from deck

### Integration Points
- **Backend Validation**: API prevents adding multiple one-per-deck cards
- **Frontend Validation**: UI prevents selection of dimmed cards
- **Toast Notifications**: Error messages when attempting to add duplicates
- **Deck Statistics**: One-per-deck cards count toward deck limits appropriately

## Cataclysm Card Dimming

### Overview
Special cards marked with `cataclysm=TRUE` in the database receive visual dimming when added to a deck, enforcing the "one cataclysm per deck" rule.

### Visual Dimming System
When a "Cataclysm" card is added to the deck, all available special cards with `cataclysm=TRUE` are visually dimmed to indicate they cannot be selected again.

#### Dimmed State Styling
- **CSS Class**: `.disabled` applied to card elements
- **Opacity**: `0.5` (50% transparency)
- **Cursor**: `not-allowed` (indicates non-interactive)
- **Draggable**: Set to `false` (prevents drag operations)
- **Tooltip**: Shows "Cataclysm - already in deck" or "Cataclysm - another cataclysm already selected"

#### Implementation Details
- **Function**: `updateCataclysmLimitStatus()` in `public/index.html`
- **Trigger**: Called after adding/removing cards and when displaying deck
- **Scope**: Affects only special cards with `cataclysm=TRUE`
- **Database Field**: Uses `cataclysm` boolean column from special_cards table

### Cataclysm Card Examples
The following special cards are marked as cataclysm cards:
- **Heimdall**: Any Character may avoid 1 attack made with a Special card
- **Lady of the Lake**: Draw three cards, discard duplicates
- **Robin Hood: Master Thief**: Discard one Special card to draw and reveal 4 cards
- **Tunupa: Mountain God**: Acts as level 10 MultiPower attack
- **Fairy Protection**: Any Character may avoid 1 attack, may not be attacked for remainder of battle
- **Loki**: Opponent is -3 to Venture Total, must reveal hand and play open handed

### Visual State Management
#### Adding Cards
1. Card is added to `window.deckEditorCards` array
2. `updateCataclysmLimitStatus()` is called
3. All cataclysm cards in available section are dimmed
4. Tooltips are updated to show limit status

#### Removing Cards
1. Card is removed from `window.deckEditorCards` array
2. `updateCataclysmLimitStatus()` is called
3. Previously dimmed cataclysm cards are re-enabled
4. Tooltips are cleared or updated

#### Deck Display
1. `displayDeckCardsForEditing()` is called
2. `updateCataclysmLimitStatus()` is called at the end
3. Ensures dimming state is consistent with current deck contents

### CSS Implementation
```css
.card-item.disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
}

.card-item.disabled:hover {
    /* Maintain dimmed appearance on hover */
    opacity: 0.5 !important;
}
```

### JavaScript Integration
```javascript
function updateCataclysmLimitStatus() {
    // Get all Cataclysm cards currently in the deck
    const cataclysmCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_cataclysm === true) {
            cataclysmCardsInDeck.add(card.cardId);
        }
    });
    
    // Update all special card items for cataclysm dimming
    const specialCardItems = document.querySelectorAll('.card-item[data-type="special"][data-id]');
    specialCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        
        if (cardId) {
            const cardData = window.availableCardsMap.get(cardId);
            const isCataclysm = cardData && cardData.is_cataclysm === true;
            const isInDeck = cataclysmCardsInDeck.has(cardId);
            const hasOtherCataclysm = cataclysmCardsInDeck.size > 0;
            
            if (isCataclysm && (isInDeck || hasOtherCataclysm)) {
                // This is a Cataclysm card and either it's in the deck or another cataclysm is in the deck - dim it
                cardElement.classList.add('disabled');
                cardElement.setAttribute('draggable', 'false');
                if (isInDeck) {
                    cardElement.title = 'Cataclysm - already in deck';
                } else {
                    cardElement.title = 'Cataclysm - another cataclysm already selected';
                }
            } else if (isCataclysm && !hasOtherCataclysm) {
                // This is a Cataclysm card but no cataclysm is in the deck - enable it
                cardElement.classList.remove('disabled');
                cardElement.setAttribute('draggable', 'true');
                cardElement.title = '';
            }
        }
    });
}
```

### Backend Validation
- **API Endpoint**: `/api/decks/:id/cards` (POST)
- **Validation Function**: `checkIfCardIsCataclysm()` in `src/index.ts`
- **Error Message**: "Cannot add more than 1 Cataclysm to a deck"
- **Database Query**: Checks `cataclysm` column in `special_cards` table

### Integration Points
- **Card Addition**: Called after `addCardToEditor()`
- **Card Removal**: Called after `removeCardFromEditor()`
- **Deck Display**: Called after `displayDeckCardsForEditing()`
- **Filter Updates**: Called after `updateSpecialCardsFilter()`

### Testing Coverage
- **Unit Tests**: `tests/unit/cataclysm-validation.test.ts`
- **Integration Tests**: `tests/unit/cataclysm-integration.test.ts`
- **Test Scenarios**: Adding/removing cataclysm cards, multiple cataclysm handling, visual state consistency

## Assist Card Dimming

### Overview
Special cards marked with `assist=TRUE` in the database receive visual dimming when added to a deck, enforcing the "one assist per deck" rule.

### Visual Dimming System
When an "Assist" card is added to the deck, all available special cards with `assist=TRUE` are visually dimmed to indicate they cannot be selected again.

#### Dimmed State Styling
- **CSS Class**: `.disabled` applied to card elements
- **Opacity**: `0.5` (50% transparency)
- **Cursor**: `not-allowed` (indicates non-interactive)
- **Draggable**: Set to `false` (prevents drag operations)
- **Tooltip**: Shows "Assist - already in deck" or "Assist - another assist already selected"

#### Implementation Details
- **Function**: `updateAssistLimitStatus()` in `public/index.html`
- **Trigger**: Called after adding/removing cards and when displaying deck
- **Scope**: Affects only special cards with `assist=TRUE`
- **Database Field**: Uses `assist` boolean column from special_cards table

### Assist Card Examples
The following special cards are marked as assist cards:
- **Teamwork**: Any Character may assist another Character in battle
- **Alliance**: Characters may share abilities and work together
- **Support**: Provides assistance to any Character in the deck
- **Cooperation**: Enables Character collaboration and mutual support
- **Unity**: Strengthens Character bonds and teamwork abilities

### Visual State Management
#### Adding Cards
1. Card is added to `window.deckEditorCards` array
2. `updateAssistLimitStatus()` is called
3. All assist cards in available section are dimmed
4. Tooltips are updated to show limit status

#### Removing Cards
1. Card is removed from `window.deckEditorCards` array
2. `updateAssistLimitStatus()` is called
3. Previously dimmed assist cards are re-enabled
4. Tooltips are cleared or updated

#### Deck Display
1. `displayDeckCardsForEditing()` is called
2. `updateAssistLimitStatus()` is called at the end
3. Ensures dimming state is consistent with current deck contents

### CSS Implementation
```css
.card-item.disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
}

.card-item.disabled:hover {
    /* Maintain dimmed appearance on hover */
    opacity: 0.5 !important;
}
```

### JavaScript Integration
```javascript
function updateAssistLimitStatus() {
    // Get all Assist cards currently in the deck
    const assistCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_assist === true) {
            assistCardsInDeck.add(card.cardId);
        }
    });

    // Update all special card items for assist dimming
    const specialCardItems = document.querySelectorAll('.card-item[data-type="special"][data-id]');
    specialCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');

        if (cardId) {
            const cardData = window.availableCardsMap.get(cardId);
            const isAssist = cardData && cardData.is_assist === true;
            const isInDeck = assistCardsInDeck.has(cardId);
            const hasOtherAssist = assistCardsInDeck.size > 0;

            if (isAssist && (isInDeck || hasOtherAssist)) {
                // This is an Assist card and either it's in the deck or another assist is in the deck - dim it
                cardElement.classList.add('disabled');
                cardElement.setAttribute('draggable', 'false');
                if (isInDeck) {
                    cardElement.title = 'Assist - already in deck';
                } else {
                    cardElement.title = 'Assist - another assist already selected';
                }
            } else if (isAssist && !hasOtherAssist) {
                // This is an Assist card but no assist is in the deck - enable it
                cardElement.classList.remove('disabled');
                cardElement.setAttribute('draggable', 'true');
                cardElement.title = '';
            }
        }
    });
}
```

### Backend Validation
- **API Endpoint**: `/api/decks/:id/cards` (POST)
- **Validation Function**: `checkIfCardIsAssist()` in `src/index.ts`
- **Error Message**: "Cannot add more than 1 Assist to a deck"
- **Database Query**: Checks `assist` column in `special_cards` table

### Integration Points
- **Card Addition**: Called after `addCardToEditor()`
- **Card Removal**: Called after `removeCardFromEditor()`
- **Deck Display**: Called after `displayDeckCardsForEditing()`
- **Filter Updates**: Called after `updateSpecialCardsFilter()`

### Testing Coverage
- **Unit Tests**: `tests/unit/assist-backend-validation.test.ts`
- **Integration Tests**: `tests/integration/assist-api-validation.test.ts`
- **Database Tests**: `tests/integration/assist-database-integration.test.ts`
- **Test Scenarios**: Adding/removing assist cards, multiple assist handling, visual state consistency

## Ambush Card Dimming

### Overview
Special cards marked with `ambush=TRUE` in the database receive visual dimming when added to a deck, enforcing the "one ambush per deck" rule.

### Visual Dimming System
When an "Ambush" card is added to the deck, all available special cards with `ambush=TRUE` are visually dimmed to indicate they cannot be selected again.

#### Dimmed State Styling
- **CSS Class**: `.disabled` applied to card elements
- **Opacity**: `0.5` (50% transparency)
- **Cursor**: `not-allowed` (indicates non-interactive)
- **Draggable**: Set to `false` (prevents drag operations)
- **Tooltip**: Shows "Ambush - already in deck" or "Ambush - another ambush already selected"

#### Implementation Details
- **Function**: `updateAmbushLimitStatus()` in `public/index.html`
- **Trigger**: Called after adding/removing cards and when displaying deck
- **Scope**: Affects only special cards with `ambush=TRUE`
- **Database Field**: Uses `ambush` boolean column from special_cards table

### Ambush Card Examples
The following special cards are marked as ambush cards:
- **Wrath of Ra**: Devastating attack that can be used as an ambush
- **Valkyrie Skeggjold**: Norse warrior ambush tactics
- **Oni and Succubus**: Demonic ambush combination
- **Bodhisattva: Enlightened One**: Spiritual ambush capabilities

### Visual State Management
#### Adding Cards
1. Card is added to `window.deckEditorCards` array
2. `updateAmbushLimitStatus()` is called
3. All ambush cards in available section are dimmed
4. Tooltips are updated to show limit status

#### Removing Cards
1. Card is removed from `window.deckEditorCards` array
2. `updateAmbushLimitStatus()` is called
3. Previously dimmed ambush cards are re-enabled
4. Tooltips are cleared or updated

#### Deck Display
1. `displayDeckCardsForEditing()` is called
2. `updateAmbushLimitStatus()` is called at the end
3. Ensures dimming state is consistent with current deck contents

### CSS Implementation
```css
.card-item.disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
}

.card-item.disabled:hover {
    /* Maintain dimmed appearance on hover */
    opacity: 0.5 !important;
}
```

### JavaScript Integration
```javascript
function updateAmbushLimitStatus() {
    // Get all Ambush cards currently in the deck
    const ambushCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_ambush === true) {
            ambushCardsInDeck.add(card.cardId);
        }
    });
    
    // Update all special card items for ambush dimming
    const specialCardItems = document.querySelectorAll('.card-item[data-type="special"][data-id]');
    specialCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        
        if (cardId) {
            const cardData = window.availableCardsMap.get(cardId);
            const isAmbush = cardData && cardData.is_ambush === true;
            const isInDeck = ambushCardsInDeck.has(cardId);
            const hasOtherAmbush = ambushCardsInDeck.size > 0;
            
            if (isAmbush && (isInDeck || hasOtherAmbush)) {
                // This is an Ambush card and either it's in the deck or another ambush is in the deck - dim it
                cardElement.classList.add('disabled');
                cardElement.setAttribute('draggable', 'false');
                if (isInDeck) {
                    cardElement.title = 'Ambush - already in deck';
                } else {
                    cardElement.title = 'Ambush - another ambush already selected';
                }
            } else if (isAmbush && !hasOtherAmbush) {
                // This is an Ambush card but no ambush is in the deck - enable it
                cardElement.classList.remove('disabled');
                cardElement.setAttribute('draggable', 'true');
                cardElement.title = '';
            }
        }
    });
}
```

### Backend Validation
- **API Endpoint**: `/api/decks/:id/cards` (POST)
- **Validation Function**: `checkIfCardIsAmbush()` in `src/index.ts`
- **Error Message**: "Cannot add more than 1 Ambush to a deck"
- **Database Query**: Checks `ambush` column in `special_cards` table

### Integration Points
- **Card Addition**: Called after `addCardToEditor()`
- **Card Removal**: Called after `removeCardFromEditor()`
- **Deck Display**: Called after `displayDeckCardsForEditing()`
- **Filter Updates**: Called after `updateSpecialCardsFilter()`

### Testing Coverage
- **Unit Tests**: `tests/unit/ambush-backend-validation.test.ts`
- **Frontend Tests**: `tests/unit/ambush-frontend-validation.test.ts`
- **Test Scenarios**: Adding/removing ambush cards, multiple ambush handling, visual state consistency
```

## Fortification Card Dimming

### Overview
Aspect cards marked with `fortifications=TRUE` in the database receive visual dimming when added to a deck, enforcing the "one fortification per deck" rule.

### Visual Dimming System
When a "Fortification" card is added to the deck, all available aspect cards with `fortifications=TRUE` are visually dimmed to indicate they cannot be selected again.

#### Dimmed State Styling
- **CSS Class**: `.disabled` applied to card elements
- **Opacity**: `0.5` (50% transparency)
- **Cursor**: `not-allowed` (indicates non-interactive)
- **Draggable**: Set to `false` (prevents drag operations)
- **Tooltip**: Shows "Fortification - already in deck" or "Fortification - another fortification already selected"

#### Implementation Details
- **Function**: `updateFortificationLimitStatus()` in `public/index.html`
- **Trigger**: Called after adding/removing cards and when displaying deck
- **Scope**: Affects only aspect cards with `fortifications=TRUE`
- **Database Field**: Uses `fortifications` boolean column from aspects table

### Fortification Card Examples
The following aspect cards are marked as fortification cards:
- **Amaru: Dragon Legend**: Legendary dragon fortification
- **Mallku**: Ancient fortification guardian
- **Supay**: Underworld fortification spirit
- **Cheshire Cat**: Mystical fortification entity
- **Isis**: Divine fortification goddess

### Visual State Management
#### Adding Cards
1. Card is added to `window.deckEditorCards` array
2. `updateFortificationLimitStatus()` is called
3. All fortification cards in available section are dimmed
4. Tooltips are updated to show limit status

#### Removing Cards
1. Card is removed from `window.deckEditorCards` array
2. `updateFortificationLimitStatus()` is called
3. Previously dimmed fortification cards are re-enabled
4. Tooltips are cleared or updated

#### Deck Display
1. `displayDeckCardsForEditing()` is called
2. `updateFortificationLimitStatus()` is called at the end
3. Ensures dimming state is consistent with current deck contents

### CSS Implementation
```css
.card-item.disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
}

.card-item.disabled:hover {
    /* Maintain dimmed appearance on hover */
    opacity: 0.5 !important;
}
```

### JavaScript Integration
```javascript
function updateFortificationLimitStatus() {
    // Get all Fortification cards currently in the deck
    const fortificationCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_fortification === true) {
            fortificationCardsInDeck.add(card.cardId);
        }
    });
    
    // Update all aspect card items for fortification dimming
    const aspectCardItems = document.querySelectorAll('.card-item[data-type="aspect"][data-id]');
    if (aspectCardItems && aspectCardItems.forEach) {
        aspectCardItems.forEach(cardElement => {
            const cardId = cardElement.getAttribute('data-id');
            
            if (cardId) {
                const cardData = window.availableCardsMap.get(cardId);
                const isFortification = cardData && cardData.is_fortification === true;
                const isInDeck = fortificationCardsInDeck.has(cardId);
                const hasOtherFortification = fortificationCardsInDeck.size > 0;
                
                if (isFortification && (isInDeck || hasOtherFortification)) {
                    // This is a Fortification card and either it's in the deck or another fortification is in the deck - dim it
                    cardElement.classList.add('disabled');
                    cardElement.setAttribute('draggable', 'false');
                    if (isInDeck) {
                        cardElement.title = 'Fortification - already in deck';
                    } else {
                        cardElement.title = 'Fortification - another fortification already selected';
                    }
                } else if (isFortification && !hasOtherFortification) {
                    // This is a Fortification card but no fortification is in the deck - enable it
                    cardElement.classList.remove('disabled');
                    cardElement.setAttribute('draggable', 'true');
                    cardElement.title = '';
                }
            }
        });
    }
}
```

### Backend Validation
- **API Endpoint**: `/api/decks/:id/cards` (POST)
- **Validation Function**: `checkIfCardIsFortification()` in `src/index.ts`
- **Error Message**: "Cannot add more than 1 Fortification to a deck"
- **Database Query**: Checks `fortifications` column in `aspects` table

### Integration Points
- **Card Addition**: Called after `addCardToEditor()`
- **Card Removal**: Called after `removeCardFromEditor()`
- **Deck Display**: Called after `displayDeckCardsForEditing()`
- **Filter Updates**: Called after `updateAspectCardsFilter()`

### Testing Coverage
- **Unit Tests**: `tests/unit/fortification-backend-validation.test.ts`
- **Frontend Tests**: `tests/unit/fortification-frontend-validation.test.ts`
- **Test Scenarios**: Adding/removing fortification cards, multiple fortification handling, visual state consistency

## Deck Editor Card View Styling

### Overview
The Card View is a deck visualization mode available to all users that displays cards in a unique card-centric layout with actual card images as the primary interface elements.

### Container Styling
- **Main Container**: `.deck-cards-editor.card-view`
- **Background**: `rgba(255, 255, 255, 0.05)` (standard secondary background)
- **Padding**: `20px`
- **Layout**: `display: flex !important` with `flex-direction: column !important`
- **Width**: `100%` with `min-width: 100%`
- **Box Sizing**: `border-box` for all child elements

### Card Item Styling
#### Portrait Cards (Default)
- **Container**: `.deck-card-card-view-item`
- **Dimensions**: `175px × 250px` (7:10 aspect ratio)
- **Background**: `rgba(255, 255, 255, 0.1)`
- **Border**: `1px solid rgba(255, 255, 255, 0.2)` (standard primary border)
- **Border Radius**: `8px`
- **Layout**: `display: flex`, `flex-direction: column`, `align-items: center`
- **Transition**: `all 0.2s ease`
- **Position**: `relative` (for absolute positioning of buttons)

#### Landscape Cards
- **Target Types**: `[data-type="character"]`, `[data-type="location"]`, `[data-type="event"]`
- **Dimensions**: `250px × 175px` (10:7 aspect ratio)
- **Layout**: `flex-direction: column`, `justify-content: flex-start`
- **Alignment**: `align-items: center`

### Hover Effects
- **Background**: `rgba(78, 205, 196, 0.2)` (teal highlight)
- **Border**: `#4ecdc4` (solid teal)
- **Transform**: `translateY(-2px)` (lift effect)
- **Box Shadow**: `0 4px 12px rgba(0, 0, 0, 0.3)` (depth shadow)

### Card Images
#### Portrait Image Styling
- **Class**: `.card-view-image` (portrait cards)
- **Width**: `115%` (15% larger than container)
- **Height**: `100%` (fills entire frame)
- **Margins**: `-7.5%` left/right (centers larger image)
- **Object Fit**: `cover`
- **Object Position**: `center top`
- **Border Radius**: `6px`

#### Landscape Image Styling
- **Width**: `100%` (full container width)
- **Object Position**: `center top`
- **Margin Bottom**: `8px` (space for buttons)
- **Flex Shrink**: `0`

### Action Buttons
#### Button Container
- **Class**: `.card-view-actions`
- **Layout**: `display: flex`, `flex-direction: row`
- **Gap**: `6px` between buttons
- **Alignment**: `justify-content: center`
- **Margin Top**: `auto` (pushes to bottom)

#### Portrait Card Button Positioning
- **Position**: `absolute`
- **Bottom**: `-27px` (outside card frame)
- **Left**: `50%` with `transform: translateX(-50%)` (centered)

#### Button Styling
- **Base Class**: `.card-view-btn`
- **Background**: `rgba(78, 205, 196, 0.2)` (teal)
- **Border**: `1px solid rgba(78, 205, 196, 0.3)`
- **Color**: `#4ecdc4` (teal text)
- **Font Size**: `10px`
- **Padding**: `3px 6px`
- **Min Width**: `32px`
- **Height**: `20px`
- **Border Radius**: `3px`
- **Transition**: `all 0.2s ease`

#### Button Hover Effects
- **Background**: `rgba(78, 205, 196, 0.3)`
- **Border**: `rgba(78, 205, 196, 0.4)`
- **Transform**: `translateY(-1px)`

#### Specialized Button Types
- **Alternate Art Button**: `.alternate-art-btn`
  - Font Size: `9px`
  - Padding: `2px 4px`
  - Min Width: `28px`
  - Height: `18px`
- **Quantity Buttons**: `.remove-one-btn`, `.add-one-btn`, `.quantity-btn`
  - Font Size: `11px`
  - Font Weight: `bold`
  - Min Width: `24px`
  - Height: `18px`

### Category Sections
#### Category Container
- **Class**: `.card-view-category-section`
- **Width**: `100%`
- **Margin Bottom**: `30px`
- **Display**: `block`
- **Clear**: `both`

#### Category Header
- **Class**: `.card-view-category-header`
- **Background**: `rgba(78, 205, 196, 0.1)` (teal tint)
- **Border**: `1px solid rgba(78, 205, 196, 0.3)`
- **Border Radius**: `6px`
- **Padding**: `12px 16px`
- **Margin Bottom**: `12px`
- **Layout**: `display: flex`, `justify-content: space-between`, `align-items: center`
- **Cursor**: `pointer` (clickable for collapse/expand)
- **Hover**: `rgba(78, 205, 196, 0.15)` background, `rgba(78, 205, 196, 0.4)` border
- **Transition**: `all 0.2s ease`

#### Category Name
- **Class**: `.card-view-category-name`
- **Color**: `#4ecdc4` (primary teal)
- **Font Weight**: `600`
- **Font Size**: `1.2rem`

#### Category Controls
- **Container**: `.card-view-category-controls`
- **Layout**: `display: flex`, `align-items: center`, `gap: 12px`

#### Category Count
- **Class**: `.card-view-category-count`
- **Color**: `#bdc3c7` (light gray)
- **Font Size**: `1rem`

#### Category Toggle Button
- **Class**: `.card-view-category-toggle`
- **Color**: `#4ecdc4` (primary teal)
- **Font Size**: `0.9rem`
- **Font Weight**: `bold`
- **Symbol**: `▼` (down arrow)
- **Transition**: `transform 0.2s ease`
- **User Select**: `none`
- **Collapsed State**: `transform: rotate(-90deg)` (rotates to `▶`)

#### Category Cards Container
- **Class**: `.card-view-category-cards`
- **Layout**: `display: flex`, `flex-wrap: wrap`
- **Gap**: `45px 15px` (vertical: 45px, horizontal: 15px)
- **Width**: `100%`
- **Transition**: `all 0.3s ease`
- **Overflow**: `hidden`
- **Collapsed State**: `max-height: 0`, `margin-bottom: 0`, `opacity: 0`

### Responsive Design
#### Breakpoint System (75% Scaling)
- **Desktop (Default)**: 175px × 250px (portrait), 250px × 175px (landscape)
- **Large Tablet (≤1200px)**: 160px × 229px, 225px × 137px
- **Tablet (≤1000px)**: 146px × 208px, 203px × 125px
- **Small Tablet (≤800px)**: 131px × 188px, 183px × 113px
- **Mobile (≤600px)**: 116px × 167px, 161px × 100px

### CSS Implementation
```css
/* Card View Container */
.deck-cards-editor.card-view {
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    width: 100%;
    min-width: 100%;
    box-sizing: border-box;
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
}

/* Individual Card View Item */
.deck-card-card-view-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 175px;
    height: 250px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    box-sizing: border-box;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
}

/* Landscape Cards */
.deck-card-card-view-item[data-type="character"],
.deck-card-card-view-item[data-type="location"],
.deck-card-card-view-item[data-type="event"] {
    width: 250px;
    height: 175px;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}

/* Card View Buttons */
.card-view-btn {
    font-size: 10px;
    padding: 3px 6px;
    min-width: 32px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid rgba(78, 205, 196, 0.3);
    background: rgba(78, 205, 196, 0.2);
    color: #4ecdc4;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

### Collapsible Categories
- **Toggle Function**: `toggleCardViewCategory(categoryType)` handles collapse/expand
- **Click Target**: Entire category header is clickable
- **Visual Feedback**: Arrow rotates from `▼` to `▶` when collapsed
- **Smooth Animation**: 0.3s ease transition for collapsing/expanding
- **State Management**: Uses CSS classes `.collapsed` for state tracking
- **Accessibility**: Clear visual indicators and smooth transitions

### Integration with View System
- **View Manager**: Integrates with ViewManager for view switching
- **Access Control**: Admin-only access with role validation
- **Data Dependencies**: Uses `window.deckEditorCards` and `window.availableCardsMap`
- **Event Handling**: Supports hover, click, and drag interactions

## Deck Editor List View Styling

### Overview
The List View displays deck cards in a vertical list format with quantity controls. This section documents the styling and layout fixes that prevent visual jumps when updating card quantities.

### List View Item Layout
- **Container**: `.deck-list-item`
- **Layout**: `display: flex`, `flex-direction: row`, `align-items: center`
- **Width**: `100%`
- **Flex Wrap**: `nowrap` (prevents wrapping)

### Quantity Element Styling (Critical Fix - 2025)
The quantity element was causing text to jump when quantities changed from single to double digits. This has been fixed with a fixed-width approach.

#### Problem
- Single-digit quantities (1, 3) caused the quantity element width to change when updated
- This caused all white text on screen to shift right then back left
- Double-digit quantities (13, 24, 32) remained stable because they already had sufficient width

#### Solution
Fixed width applied to quantity element to prevent layout shifts:

- **Class**: `.deck-list-item-quantity`
- **Fixed Width**: `40px` (accommodates 2-3 digits)
- **Min Width**: `40px`
- **Text Alignment**: `right` (numbers align consistently)
- **Flex Properties**: `flex: 0 0 40px` (prevents flex resizing)
- **Box Sizing**: `border-box`
- **Color**: `#4ecdc4` (primary teal)
- **Font Weight**: `600`
- **Margin Right**: `12px`

#### CSS Implementation
```css
.deck-list-item-quantity {
    font-weight: 600;
    color: #4ecdc4;
    margin-right: 12px;
    min-width: 40px;
    width: 40px;
    text-align: right;
    flex: 0 0 40px;
    box-sizing: border-box;
}
```

#### JavaScript Enforcement
The `enforceListViewHorizontalLayout()` function ensures fixed widths are applied:
- Sets `min-width: 40px` with `!important`
- Sets `width: 40px` with `!important`
- Sets `text-align: right` with `!important`
- Sets `flex: 0 0 40px` with `!important`
- Applied immediately after `replaceChildren()` in list view updates

#### Layout Preservation During Updates
- Column widths are locked before DOM updates to prevent flex recalculation
- Quantity element widths are enforced synchronously after `replaceChildren()`
- This prevents the "bouncing text" issue when clicking +/- buttons

### List View Item Components
- **Quantity**: Fixed 40px width, right-aligned, teal color
- **Card Name**: Flexible width (`flex: 1`), white text
- **Actions**: Fixed width buttons container with +/- quantity controls

### Debug Logging
Debug logging tracks quantity element widths during updates:
- Logs first 5 quantity elements after `replaceChildren()`
- Shows text content, `offsetWidth`, and computed `width`
- Helps verify fixed widths are properly applied

## Export Modal Styling

### Overview
The Export Modal displays exported deck JSON in a full-screen overlay with a dark theme and teal accents. It's designed for viewing and copying exported deck data.

### Modal Overlay Container
- **Class**: `.export-overlay`
- **Position**: `fixed`, `top: 0`, `left: 0`
- **Dimensions**: `width: 100%`, `height: 100%` (full viewport)
- **Background**: `rgba(0, 0, 0, 0.8)` (80% black overlay)
- **Z-Index**: `10000` (above all other content)
- **Layout**: `display: flex`, `align-items: center`, `justify-content: center`
- **Click-to-Close**: Clicking outside the content closes the modal

### Modal Content Container
- **Class**: `.export-overlay-content`
- **Background**: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)` (matches main app background)
- **Border**: `1px solid #4ecdc4` (primary teal)
- **Border Radius**: `12px`
- **Dimensions**: `width: 90%`, `max-width: 1200px`, `height: 80%`, `max-height: 900px`
- **Layout**: `display: flex`, `flex-direction: column`
- **Box Shadow**: `0 0 30px rgba(78, 205, 196, 0.4)` (teal glow)

### Modal Header
- **Class**: `.export-overlay-header`
- **Layout**: `display: flex`, `justify-content: space-between`, `align-items: center`
- **Padding**: `20px 24px`
- **Border Bottom**: `1px solid rgba(78, 205, 196, 0.3)` (teal divider)
- **Background**: `rgba(0, 0, 0, 0.2)` (subtle dark overlay)

#### Header Title
- **Element**: `h3` inside `.export-overlay-header`
- **Color**: `#4ecdc4` (primary teal)
- **Font Size**: `1.4rem`
- **Font Weight**: `600`
- **Margin**: `0`

#### Close Button
- **Class**: `.export-close-btn`
- **Background**: `none`
- **Border**: `none`
- **Color**: `#4ecdc4` (primary teal)
- **Font Size**: `28px`
- **Dimensions**: `32px × 32px`
- **Layout**: `display: flex`, `align-items: center`, `justify-content: center`
- **Border Radius**: `4px`
- **Cursor**: `pointer`
- **Hover**: `background: rgba(78, 205, 196, 0.2)` (teal tint)

### Modal Body
- **Class**: `.export-overlay-body`
- **Flex**: `1` (takes remaining space)
- **Padding**: `0`
- **Overflow**: `hidden`
- **Layout**: `display: flex`, `flex-direction: column`

### JSON Container
- **Class**: `.json-container`
- **Position**: `relative`
- **Flex**: `1` (fills body space)
- **Overflow**: `auto` (scrollable content)
- **Padding**: `20px`

#### Copy Button (Export Only)
- **Class**: `.copy-button`
- **Position**: `absolute`, `top: 20px`, `right: 20px`
- **Background**: `rgba(78, 205, 196, 0.2)` (teal)
- **Border**: `1px solid rgba(78, 205, 196, 0.4)`
- **Border Radius**: `6px`
- **Padding**: `8px 12px`
- **Cursor**: `pointer`
- **Z-Index**: `10`
- **Transition**: `all 0.2s ease`
- **Hover**: `background: rgba(78, 205, 196, 0.3)`, `border-color: rgba(78, 205, 196, 0.6)`

#### JSON Content Display (Export)
- **Element**: `#exportJsonContent` (`<pre>` tag)
- **Font**: `'Courier New', monospace`
- **Font Size**: `13px`
- **Line Height**: `1.5`
- **Color**: `#ffffff` (white text)
- **Background**: `rgba(0, 0, 0, 0.3)` (dark overlay)
- **Padding**: `20px`
- **Border Radius**: `6px`
- **Margin**: `0`
- **White Space**: `pre-wrap` (preserves formatting)
- **Word Wrap**: `break-word`
- **Overflow**: `auto`

### CSS Implementation
```css
.export-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.export-overlay-content {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid #4ecdc4;
    border-radius: 12px;
    width: 90%;
    max-width: 1200px;
    height: 80%;
    max-height: 900px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 30px rgba(78, 205, 196, 0.4);
}

.export-overlay-header h3 {
    margin: 0;
    color: #4ecdc4;
    font-size: 1.4rem;
    font-weight: 600;
}

.export-close-btn {
    background: none;
    border: none;
    color: #4ecdc4;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.export-close-btn:hover {
    background: rgba(78, 205, 196, 0.2);
}
```

## Import Modal Styling

### Overview
The Import Modal provides a textarea for pasting JSON and displays error messages when import fails. It shares the same overlay structure as the Export Modal but with different body content.

### Shared Overlay Styling
The Import Modal uses the same `.export-overlay` class and overlay structure as the Export Modal:
- Same overlay container, content wrapper, header, and close button
- Same dimensions, positioning, and z-index
- Only the body content differs

### Import Body Content

#### JSON Textarea
- **Element**: `#importJsonContent`
- **Class**: `.import-json-textarea`
- **Flex**: `1` (fills available space)
- **Background**: `rgba(0, 0, 0, 0.4)` (dark overlay)
- **Color**: `#ffffff` (white text)
- **Padding**: `20px`
- **Font**: `'Courier New', monospace`
- **Font Size**: `13px`
- **Line Height**: `1.5`
- **Border**: `none`
- **Outline**: `none`
- **Resize**: `vertical` (allows height adjustment)
- **Placeholder Color**: `rgba(255, 255, 255, 0.4)` (muted white)
- **Placeholder Text**: "Paste exported deck JSON here..."

#### Error Messages Container
- **Element**: `#importErrorMessages`
- **Class**: `.import-error-messages`
- **Display**: `none` (hidden by default, shown on errors)
- **Margin**: `20px`
- **Padding**: `15px`
- **Background**: `rgba(231, 76, 60, 0.2)` (red tint)
- **Border**: `1px solid rgba(231, 76, 60, 0.5)` (red border)
- **Border Radius**: `8px`
- **Color**: `#e74c3c` (danger red)
- **Font**: `'Courier New', monospace`
- **Font Size**: `13px`
- **Line Height**: `1.5`
- **Max Height**: `200px`
- **Overflow**: `auto` (scrollable if content is long)

##### Error List
- **Element**: `<ul>` inside error messages
- **Margin**: `0`
- **Padding Left**: `20px`

##### Error List Items
- **Element**: `<li>` inside error list
- **Margin**: `8px 0`

#### Import Actions Container
- **Class**: `.import-actions`
- **Padding**: `20px`
- **Border Top**: `1px solid rgba(78, 205, 196, 0.3)` (teal divider)
- **Layout**: `display: flex`, `justify-content: flex-end`
- **Gap**: `12px`

#### Import Button
- **Element**: `#importJsonButton`
- **Class**: `.import-button`
- **Background**: `rgba(78, 205, 196, 0.2)` (teal)
- **Border**: `1px solid rgba(78, 205, 196, 0.4)`
- **Border Radius**: `6px`
- **Padding**: `12px 24px`
- **Color**: `#4ecdc4` (primary teal)
- **Font Size**: `14px`
- **Font Weight**: `600`
- **Cursor**: `pointer`
- **Transition**: `all 0.2s ease`
- **Hover**: `background: rgba(78, 205, 196, 0.3)`, `border-color: rgba(78, 205, 196, 0.6)`
- **Disabled State**: `opacity: 0.5`, `cursor: not-allowed`
- **Text**: "Import Cards"

### CSS Implementation
```css
.import-json-textarea {
    flex: 1;
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    padding: 20px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    border: none;
    outline: none;
    resize: vertical;
}

.import-json-textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
}

.import-error-messages {
    margin: 20px;
    padding: 15px;
    background: rgba(231, 76, 60, 0.2);
    border: 1px solid rgba(231, 76, 60, 0.5);
    border-radius: 8px;
    color: #e74c3c;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    max-height: 200px;
    overflow: auto;
}

.import-actions {
    padding: 20px;
    border-top: 1px solid rgba(78, 205, 196, 0.3);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.import-button {
    background: rgba(78, 205, 196, 0.2);
    border: 1px solid rgba(78, 205, 196, 0.4);
    border-radius: 6px;
    padding: 12px 24px;
    color: #4ecdc4;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.import-button:hover:not(:disabled) {
    background: rgba(78, 205, 196, 0.3);
    border-color: rgba(78, 205, 196, 0.6);
}

.import-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### Shared Components
Both Export and Import modals use the same base structure:
- **Overlay**: `.export-overlay` (shared class name)
- **Content Container**: `.export-overlay-content`
- **Header**: `.export-overlay-header` with title and close button
- **Body**: `.export-overlay-body` with content-specific elements

This shared structure ensures visual consistency between export and import workflows.

### Responsive Design
- **Desktop**: Full-size modal (90% width, 80% height, max 1200px × 900px)
- **Tablet**: Maintains same proportions, adjusts to viewport
- **Mobile**: Modal fills most of screen (90% width), content scrolls internally
