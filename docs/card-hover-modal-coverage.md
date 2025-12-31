# Card Hover Modal - Code Locations and Coverage Metrics

## Code Locations

### Core Implementation

#### Main Functions (`public/index.html`)

1. **`showCardHoverModal(imagePath, cardName)`**
   - **Location**: Lines 9111-9400
   - **Lines of Code**: ~290 lines
   - **Purpose**: Displays card hover modal with positioning and button avoidance logic
   - **Key Components**:
     - Timeout management (lines 9130-9134)
     - DOM element retrieval (lines 9136-9138)
     - Image loading handlers (lines 9144-9150)
     - `positionModal()` inner function (lines 9168-9381)
     - Mouse tracking setup (lines 9390-9396)

2. **`hideCardHoverModal()`**
   - **Location**: Lines 9398-9420
   - **Lines of Code**: ~23 lines
   - **Purpose**: Hides modal with delay and cleanup
   - **Key Components**:
     - Timeout management (lines 9404-9407)
     - Event listener cleanup (lines 9410-9413)
     - Modal hiding (line 9414)

3. **`positionModal(event)` Inner Function**
   - **Location**: Lines 9168-9381
   - **Lines of Code**: ~214 lines
   - **Purpose**: Calculates optimal modal position
   - **Key Sections**:
     - Initial positioning (lines 9169-9170)
     - Collection card handling (lines 9184-9262)
     - Deck editor card handling (lines 9265-9324)
     - Available card handling (lines 9327-9354)
     - Minimum distance check (lines 9357-9365)
     - Viewport boundary constraints (lines 9367-9377)

#### HTML Structure (`public/index.html`)

- **Modal Container**: Lines 1439-1445
  - Element ID: `#cardHoverModal`
  - Child elements: `#cardHoverImage`, `#cardHoverCaption`
  - Classes: `.card-hover-modal`, `.card-hover-content`, `.card-hover-image`, `.card-hover-caption`

#### CSS Styling (`public/css/index.css`)

- **Location**: Lines 673-707
- **Lines of Code**: ~35 lines
- **Selectors**:
  - `.card-hover-modal` (lines 674-684)
  - `.card-hover-content` (lines 686-691)
  - `.card-hover-image` (lines 693-701)
  - `.card-hover-caption` (lines 703-707)

#### Integration Points

1. **Card Browser (`src/public/js/card-browser.js`)**
   - **Location**: Lines 290-291, 402-430
   - **Integration Type**: Delegates to global functions
   - **Methods**: `showCardHover()`, `hideCardHover()`

2. **Usage in HTML Templates**
   - **Total Usage Locations**: ~50 instances in `public/index.html`
   - **Pattern**: `onmouseenter="showCardHoverModal(...)"` / `onmouseleave="hideCardHoverModal()"`
   - **Contexts**:
     - Deck editor cards (`.deck-card-editor-item`)
     - Collection view cards (`.collection-card-item`)
     - Available cards (`.card-item`)
     - All cards display view

### Code Statistics

| Component | File | Lines | Complexity |
|-----------|------|-------|------------|
| `showCardHoverModal()` | `public/index.html` | ~290 | High |
| `hideCardHoverModal()` | `public/index.html` | ~23 | Low |
| `positionModal()` inner | `public/index.html` | ~214 | Very High |
| HTML Structure | `public/index.html` | 7 | Low |
| CSS Styles | `public/css/index.css` | ~35 | Low |
| Card Browser Integration | `src/public/js/card-browser.js` | ~29 | Low |
| **Total Implementation** | | **~598 lines** | |

## Test Coverage Metrics

### Current Test Coverage

#### Unit Tests

1. **`tests/unit/card-view-functionality.test.ts`**
   - **Test**: "should render cards with hover event handlers" (lines 401-415)
   - **Coverage Type**: Mock verification only
   - **What it tests**: 
     - Verifies `showCardHoverModal` is a function
     - Checks that rendering doesn't throw errors
   - **What it doesn't test**:
     - Actual function execution
     - Positioning logic
     - Button avoidance
     - Viewport constraints
     - Mouse tracking

2. **`tests/unit/deck-display-functionality.test.ts`**
   - **Test**: "should render card with hover event handlers" (lines 401-407)
   - **Coverage Type**: HTML string verification
   - **What it tests**:
     - Verifies HTML contains `showCardHoverModal` and `hideCardHoverModal` strings
   - **What it doesn't test**:
     - Function execution
     - Modal display/hide behavior
     - Event handling

3. **`tests/frontend/all-cards-display.test.ts`**
   - **Mocks**: `mockShowCardHoverModal`, `mockHideCardHoverModal` (lines 99-100)
   - **Usage**: HTML template verification (lines 880-881)
   - **Coverage Type**: Mock setup only, no actual testing

4. **Other Test Files** (Mock Setup Only)
   - `tests/unit/card-view-special-card-sorting.test.ts` (lines 36-37)
   - `tests/unit/guest-user-button-disabling.test.ts` (lines 57-58)
   - `tests/unit/list-view-buttons.test.ts` (lines 10-11, 21-22, 30-31)
   - All only mock the functions, don't test functionality

### Coverage Summary

| Aspect | Coverage Status | Notes |
|--------|----------------|-------|
| **Function Existence** | ✅ Covered | Tests verify functions exist |
| **HTML Integration** | ✅ Covered | Tests verify HTML contains function names |
| **Function Execution** | ❌ Not Covered | No tests actually call the functions |
| **Positioning Algorithm** | ❌ Not Covered | No tests for positioning logic |
| **Button Avoidance** | ❌ Not Covered | No tests for button detection/avoidance |
| **Viewport Constraints** | ❌ Not Covered | No tests for boundary checking |
| **Mouse Tracking** | ❌ Not Covered | No tests for mousemove event handling |
| **Timeout Management** | ❌ Not Covered | No tests for hide delay mechanism |
| **Event Listener Cleanup** | ❌ Not Covered | No tests for cleanup on hide |
| **Image Loading** | ❌ Not Covered | No tests for image load/error handlers |
| **Card Type Handling** | ❌ Not Covered | No tests for different card contexts |
| **Error Handling** | ❌ Not Covered | No tests for missing DOM elements |

### Coverage Percentage

**Estimated Overall Coverage: ~5-10%**

- **HTML Integration**: 100% (verified in HTML strings)
- **Function Existence**: 100% (verified as functions)
- **Functional Behavior**: 0% (no actual execution tests)
- **Edge Cases**: 0% (no edge case testing)
- **Integration**: 0% (no integration tests)

## Test Coverage Gaps

### Critical Missing Tests

1. **Function Execution Tests**
   - Test `showCardHoverModal()` actually displays modal
   - Test `hideCardHoverModal()` actually hides modal
   - Test timeout clearing behavior
   - Test event listener attachment/removal

2. **Positioning Algorithm Tests**
   - Test initial positioning (mouse + 80px offset)
   - Test viewport boundary constraints
   - Test minimum distance from cursor (100px)
   - Test positioning for each card type:
     - Deck editor cards
     - Collection cards
     - Available cards

3. **Button Avoidance Tests**
   - Test detection of buttons near cursor
   - Test repositioning priority (left → below → above → right)
   - Test buffer zones (120px for deck/collection, 60px for plus buttons)
   - Test overlap detection and correction

4. **Mouse Tracking Tests**
   - Test mousemove event listener attachment
   - Test position updates on mouse movement
   - Test listener cleanup on hide

5. **Edge Case Tests**
   - Test with missing DOM elements
   - Test with invalid image paths
   - Test rapid show/hide cycles
   - Test at screen edges
   - Test with multiple buttons
   - Test with very small viewport

6. **Integration Tests**
   - Test actual browser interaction
   - Test with real card elements
   - Test across different view contexts

## Recommendations

### High Priority

1. **Add Functional Unit Tests**
   - Create test file: `tests/unit/card-hover-modal.test.ts`
   - Test actual function execution with jsdom
   - Mock DOM elements and events
   - Test positioning calculations

2. **Add Integration Tests**
   - Create test file: `tests/integration/card-hover-modal.test.ts`
   - Use Puppeteer or Playwright for browser testing
   - Test actual hover interactions
   - Test button avoidance in real scenarios

### Medium Priority

3. **Add Edge Case Tests**
   - Test error conditions
   - Test boundary cases
   - Test performance with many cards

4. **Add Visual Regression Tests**
   - Screenshot comparisons for positioning
   - Verify modal appears correctly in all contexts

### Low Priority

5. **Add Performance Tests**
   - Measure positioning calculation time
   - Test with many simultaneous hovers

## Files Requiring Test Coverage

| File | Lines | Priority | Estimated Test Lines |
|------|-------|----------|---------------------|
| `public/index.html` (showCardHoverModal) | 9111-9400 | High | ~200-300 |
| `public/index.html` (hideCardHoverModal) | 9398-9420 | High | ~50-100 |
| `src/public/js/card-browser.js` (integration) | 402-430 | Medium | ~50-100 |

## Conclusion

The card hover modal feature has **minimal test coverage** (~5-10%). While the functions are verified to exist and are referenced in HTML templates, there are **no tests that actually execute the functions** or verify their behavior. The complex positioning and button avoidance logic is completely untested.

**Recommendation**: Prioritize adding functional unit tests and integration tests to ensure the hover modal works correctly across all contexts and edge cases.

