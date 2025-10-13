/* ========================================
 * PHASE 7: LAYOUT MANAGER
 * ========================================
 * 
 * This file contains centralized layout management for deck editor views
 * created during Phase 7 of the refactoring project.
 * 
 * Purpose: Centralized layout management for deck editor views
 * Created: Phase 7 of 12-phase refactoring project
 * Contains: Handles tile view, list view, read-only modes, and layout enforcement
 * 
 * ======================================== */
class LayoutManager {
    constructor() {
        this.currentViewMode = 'tile'; // 'tile' or 'list'
        this.isReadOnlyMode = false;
        this.layoutSettings = {
            tile: 1,
            list: 1,
            readOnlyTile: 1,
            readOnlyList: 3
        };
    }
    
    /**
     * Get the current layout mode based on view and read-only state
     */
    getCurrentMode() {
        if (this.isReadOnlyMode) {
            return this.currentViewMode === 'list' ? 'readOnlyList' : 'readOnlyTile';
        }
        return this.currentViewMode;
    }
    
    /**
     * Get the current column count for the active mode
     */
    getCurrentColumnCount() {
        const mode = this.getCurrentMode();
        return this.layoutSettings[mode] || 1;
    }
    
    /**
     * Set the view mode (tile or list)
     */
    setViewMode(mode) {
        if (mode === 'tile' || mode === 'list') {
            this.currentViewMode = mode;
        }
    }
    
    /**
     * Set read-only mode
     */
    setReadOnlyMode(isReadOnly) {
        this.isReadOnlyMode = isReadOnly;
    }
    
    /**
     * Update layout settings for a specific mode
     */
    updateLayoutSettings(mode, columnCount) {
        if (this.layoutSettings.hasOwnProperty(mode)) {
            this.layoutSettings[mode] = columnCount;
        }
    }
    
    /**
     * Apply layout settings to the deck cards editor
     */
    applyLayoutSettings() {
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        if (!deckCardsEditor) return;
        
        const currentMode = this.getCurrentMode();
        const columnCount = this.getCurrentColumnCount();
        
        // Set appropriate layout class using generic function
        let layoutClass = 'one-column';
        if (columnCount === 2) layoutClass = 'two-column';
        else if (columnCount === 3) layoutClass = 'three-column';
        else if (columnCount === 4) layoutClass = 'four-column';
        
        manageDeckLayout('setLayout', { layout: layoutClass });
        
        // Force a reflow to ensure the grid layout is applied
        deckCardsEditor.offsetHeight;
    }
    
    /**
     * Render deck cards in tile view
     */
    renderTileView(cards) {
        // This will contain the tile view rendering logic
        // For now, we'll call the existing function to maintain behavior
        return this.renderDeckCardsForEditing(cards, 'tile');
    }
    
    /**
     * Render deck cards in list view
     */
    renderListView(cards) {
        // This will contain the list view rendering logic
        // For now, we'll call the existing function to maintain behavior
        return this.renderDeckCardsListView(cards);
    }
    
    /**
     * Unified render function that handles both view modes
     */
    renderDeckCards(cards) {
        if (this.currentViewMode === 'list') {
            return this.renderListView(cards);
        } else {
            return this.renderTileView(cards);
        }
    }
    
    /**
     * Placeholder for tile view rendering - will be extracted from displayDeckCardsForEditing
     */
    renderDeckCardsForEditing(cards, viewMode) {
        // This will be implemented by extracting logic from the existing function
        // For now, return empty to avoid breaking existing behavior
        return '';
    }
    
    /**
     * Placeholder for list view rendering - will be extracted from renderDeckCardsListView
     */
    renderDeckCardsListView(cards) {
        // This will be implemented by extracting logic from the existing function
        // For now, return empty to avoid breaking existing behavior
        return '';
    }
}

// Create global layout manager instance
const layoutManager = new LayoutManager();
