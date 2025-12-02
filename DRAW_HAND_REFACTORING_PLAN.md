# Draw Hand Feature Refactoring Plan

## Overview
This plan outlines a conservative, step-by-step approach to extract the Draw Hand feature from `index.html` into its own encapsulated module, following the pattern established by `simulate-ko.js`.

## Goals
- Extract all Draw Hand functionality into a self-contained module
- Preserve all existing functionality and styling exactly as-is
- Maintain backward compatibility with existing code
- Follow existing code patterns and conventions
- Enable incremental testing at each step

## Current State Analysis

### Code Locations
1. **HTML Structure** (`public/index.html` lines 1504-1513)
   - Draw Hand section markup
   - Button element (line 1440)

2. **CSS Styling** (`public/css/index.css` lines 1456-1548)
   - `.draw-hand-section` and related styles
   - `.drawn-card` styles and hover effects

3. **JavaScript Logic** (`public/index.html` lines 5147-5313)
   - `drawHand()` - Main drawing logic
   - `displayDrawnCards()` - Card rendering
   - 6 drag-and-drop handler functions
   - Button state management (lines 5448-5470)

4. **UI Utility Functions** (`public/js/ui-utility-functions.js` lines 20-39)
   - `toggleDrawHand()` - Toggle pane visibility
   - `closeDrawHand()` - Close pane

### Dependencies
- `window.deckEditorCards` - Deck cards array
- `window.availableCardsMap` - Card data map
- `window.SimulateKO` - KO feature integration
- `getCardImagePath()` - Image path function (global)
- `updateDeckSummary()` - Updates button state (called from multiple places)

## Refactoring Plan

### Phase 1: Create Module Structure (No Functionality Changes)
**Goal**: Set up the module files without changing any behavior

#### Step 1.1: Create Draw Hand Module File
- **File**: `public/js/components/draw-hand.js`
- **Structure**: Follow `simulate-ko.js` pattern
  - Private state variables
  - Private helper functions
  - Public API exposed on `window.DrawHand`
- **Initial Content**: 
  - Module structure with init function
  - Placeholder functions that call existing code
  - Comments marking what will be moved

#### Step 1.2: Create CSS Module File
- **File**: `public/css/draw-hand.css`
- **Content**: Copy all draw-hand related CSS from `index.css`
- **Note**: Keep original CSS in `index.css` until Phase 3

#### Step 1.3: Update HTML to Include New Files
- Add `<script>` tag for `draw-hand.js` (after simulate-ko.js)
- Add `<link>` tag for `draw-hand.css` (after index.css)
- **No changes to existing HTML structure yet**

**Verification**: 
- Page loads without errors
- All functionality works exactly as before
- No visual changes

---

### Phase 2: Extract Core Drawing Logic (Incremental)
**Goal**: Move drawing logic to module while maintaining exact behavior

#### Step 2.1: Move `drawHand()` Function
- Move function to `draw-hand.js` as private function
- Expose as `window.DrawHand.drawHand()`
- Update `toggleDrawHand()` in `ui-utility-functions.js` to call module function
- Keep original function in `index.html` commented out for reference

**Verification**:
- Draw hand button works
- Cards are drawn correctly
- Same random behavior

#### Step 2.2: Move `displayDrawnCards()` Function
- Move function to `draw-hand.js` as private function
- Expose as `window.DrawHand.displayDrawnCards()`
- Update `drawHand()` to call internal version
- Keep `window.displayDrawnCards` for backward compatibility (calls module)

**Verification**:
- Cards display correctly
- KO dimming still works
- Event cards display horizontally
- Tooltips work

#### Step 2.3: Move Drag and Drop Handlers
- Move all 6 drag-and-drop functions to `draw-hand.js`
- Keep them as private functions
- Update `displayDrawnCards()` to attach handlers
- Maintain `window.drawnCards` global for compatibility

**Verification**:
- Drag and drop works
- Card reordering works
- Visual feedback during drag works

---

### Phase 3: Extract Button State Management
**Goal**: Move button enable/disable logic to module

#### Step 3.1: Create Button State Function
- Create `updateButtonState(deckCards)` in `draw-hand.js`
- Move logic from `updateDeckSummary()` (lines 5448-5470)
- Expose as `window.DrawHand.updateButtonState()`

#### Step 3.2: Update Call Sites
- Update `updateDeckSummary()` to call `window.DrawHand.updateButtonState()`
- Keep original logic commented for reference

**Verification**:
- Button enables/disables correctly
- Tooltip updates correctly
- Button state updates when cards are added/removed

---

### Phase 4: Extract UI Functions
**Goal**: Move toggle/close functions to module

#### Step 4.1: Move Toggle Functions
- Move `toggleDrawHand()` and `closeDrawHand()` to `draw-hand.js`
- Expose as `window.DrawHand.toggle()` and `window.DrawHand.close()`
- Update `ui-utility-functions.js` to call module functions

**Verification**:
- Toggle button works
- Close button works
- Button text updates correctly

---

### Phase 5: Extract CSS
**Goal**: Move CSS to separate file and remove from index.css

#### Step 5.1: Verify CSS File Works
- Ensure `draw-hand.css` is loaded correctly
- Verify all styles apply correctly

#### Step 5.2: Remove from index.css
- Remove draw-hand CSS from `index.css`
- Keep backup comment with line numbers

**Verification**:
- All visual styling preserved
- Hover effects work
- Drag states display correctly

---

### Phase 6: Cleanup and Documentation
**Goal**: Remove commented code and add documentation

#### Step 6.1: Remove Commented Code
- Remove all commented-out original code from `index.html`
- Remove commented code from `ui-utility-functions.js`
- Clean up any temporary code

#### Step 6.2: Add Module Documentation
- Add JSDoc comments to all public functions
- Document dependencies and requirements
- Add usage examples

#### Step 6.3: Update Related Documentation
- Update `SIMULATE_KO_FEATURE.md` if needed
- Update any other docs referencing draw hand

**Verification**:
- Code is clean and documented
- All tests pass
- No console errors

---

## File Structure After Refactoring

```
public/
├── js/
│   ├── components/
│   │   ├── draw-hand.js          [NEW] - Main module
│   │   └── simulate-ko.js         [EXISTING]
│   └── ui-utility-functions.js   [MODIFIED] - Calls module
├── css/
│   ├── draw-hand.css             [NEW] - Draw hand styles
│   └── index.css                 [MODIFIED] - Draw hand CSS removed
└── index.html                     [MODIFIED] - Logic removed, HTML kept
```

## Module API Design

### `window.DrawHand` Public API

```javascript
{
  // Initialization
  init(): void
  
  // Main functions
  drawHand(): void
  displayDrawnCards(cards: Array): void
  toggle(): void
  close(): void
  
  // Button state management
  updateButtonState(deckCards: Array): void
  
  // State access (for compatibility)
  getDrawnCards(): Array
}
```

## Dependencies Handling

### Required Globals (Maintained for Compatibility)
- `window.deckEditorCards` - Deck cards array
- `window.availableCardsMap` - Card data map
- `window.SimulateKO` - KO feature integration
- `getCardImagePath()` - Image path function

### Module State
- `window.drawnCards` - Current drawn cards (maintained for compatibility)
- Private state for drag-and-drop tracking

## Testing Strategy

### After Each Phase
1. **Manual Testing**:
   - Open deck editor
   - Click "Draw Hand" button
   - Verify cards are drawn
   - Test drag and drop
   - Test KO dimming integration
   - Test button enable/disable

2. **Automated Testing**:
   - Run existing draw-hand tests
   - Verify no regressions
   - Check console for errors

### Test Files to Verify
- `tests/unit/draw-hand-ko-dimming.test.ts`
- `tests/unit/draw-hand-button-logic.test.ts`
- `tests/unit/draw-hand-button-initialization.test.ts`
- `tests/unit/draw-hand-button-tooltip.test.ts`
- `tests/unit/draw-hand-button-css-styles.test.ts`
- `tests/unit/export-and-draw-hand-button-styles.test.ts`
- `tests/unit/deck-editor-close-draw-hand.test.ts`

## Risk Mitigation

### Conservative Approach
1. **Keep Original Code**: Comment out, don't delete until Phase 6
2. **Backward Compatibility**: Maintain `window.displayDrawnCards` and `window.drawnCards`
3. **Incremental Changes**: One small change at a time
4. **Test After Each Step**: Verify functionality before proceeding
5. **Rollback Plan**: Git commit after each successful phase

### Potential Issues
1. **Timing**: Module must initialize before use
   - **Solution**: Load script early, init on DOMContentLoaded
   
2. **Dependencies**: Functions may be called before module loads
   - **Solution**: Maintain global function wrappers during transition
   
3. **State Management**: `window.drawnCards` used by KO feature
   - **Solution**: Keep as global, sync with module state

## Success Criteria

- ✅ All Draw Hand functionality works identically
- ✅ No visual changes
- ✅ All tests pass
- ✅ No console errors
- ✅ Code is cleaner and more maintainable
- ✅ Module follows existing patterns (`simulate-ko.js`)
- ✅ Documentation is updated

## Timeline Estimate

- **Phase 1**: 30 minutes (setup)
- **Phase 2**: 1-2 hours (core logic)
- **Phase 3**: 30 minutes (button state)
- **Phase 4**: 30 minutes (UI functions)
- **Phase 5**: 15 minutes (CSS)
- **Phase 6**: 30 minutes (cleanup)

**Total**: ~3-4 hours with testing

## Notes

- This plan prioritizes safety over speed
- Each phase can be done independently
- Can pause between phases for testing/review
- Follows existing code patterns exactly
- Maintains all backward compatibility

