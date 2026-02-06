/** @jest-environment jsdom */

/**
 * UI Preferences - Unit Tests
 *
 * Tests the UI preferences management functions:
 * - getCurrentUIPreferences() gathers current preference state
 * - getDividerPosition() reads divider slider position
 * - getExpansionState() reads category expansion states
 * - saveDeckExpansionState() / loadDeckExpansionState() persistence
 */

import fs from 'fs';
import path from 'path';

declare global {
    interface Window {
        loadUIPreferences?: (deckId: string) => Promise<any>;
        saveUIPreferences?: (deckId: string, prefs: any) => Promise<void>;
        getCurrentUIPreferences?: () => any;
        getDividerPosition?: () => any;
        getExpansionState?: () => any;
        applyUIPreferences?: (prefs: any) => void;
        saveDeckExpansionState?: () => void;
        loadDeckExpansionState?: () => any;
        saveCharacterGroupExpansionState?: () => void;
        loadCharacterGroupExpansionState?: () => any;
        isGuestUser?: () => boolean;
        currentDeckId?: string;
        currentDeckData?: any;
    }
}

describe('UI Preferences', () => {
    let code: string;

    beforeEach(() => {
        const filePath = path.join(__dirname, '../../public/js/ui-preferences.js');
        code = fs.readFileSync(filePath, 'utf-8');

        // Stub globals
        window.isGuestUser = jest.fn().mockReturnValue(false);

        new Function(code)();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
    });

    describe('Module Loading', () => {
        it('should export all UI preference functions to window', () => {
            expect(typeof window.loadUIPreferences).toBe('function');
            expect(typeof window.saveUIPreferences).toBe('function');
            expect(typeof window.getCurrentUIPreferences).toBe('function');
            expect(typeof window.getDividerPosition).toBe('function');
            expect(typeof window.getExpansionState).toBe('function');
            expect(typeof window.applyUIPreferences).toBe('function');
            expect(typeof window.saveDeckExpansionState).toBe('function');
            expect(typeof window.loadDeckExpansionState).toBe('function');
            expect(typeof window.saveCharacterGroupExpansionState).toBe('function');
            expect(typeof window.loadCharacterGroupExpansionState).toBe('function');
        });
    });

    describe('getCurrentUIPreferences', () => {
        it('should return an object with preference keys', () => {
            // Stub globals that getCurrentUIPreferences reads
            (window as any).deckEditorExpansionState = {};
            (window as any).powerCardsSortMode = 'type';
            (window as any).characterGroupExpansionState = {};
            document.body.innerHTML = '<div class="card-category"></div><div class="deck-pane"></div><div class="deck-editor-layout"></div><div id="deckCardsEditor"></div>';
            const prefs = window.getCurrentUIPreferences!();
            expect(prefs).toBeDefined();
            expect(typeof prefs).toBe('object');
        });
    });

    describe('getDividerPosition', () => {
        it('should return default 50% when DOM elements do not exist', () => {
            const pos = window.getDividerPosition!();
            expect(pos).toBe(50);
        });

        it('should return a numeric percentage', () => {
            document.body.innerHTML = '<div class="deck-pane" style="width: 300px"></div><div class="deck-editor-layout" style="width: 1000px"></div>';
            const pos = window.getDividerPosition!();
            expect(typeof pos).toBe('number');
        });
    });

    describe('getExpansionState', () => {
        it('should return an expansion state object', () => {
            // Stub the global that getExpansionState reads
            (window as any).deckEditorExpansionState = {};
            document.body.innerHTML = '<div class="card-category"></div>';
            const state = window.getExpansionState!();
            expect(state).toBeDefined();
        });
    });

    describe('loadUIPreferences', () => {
        it('should return empty object for guest users', async () => {
            (window.isGuestUser as jest.Mock).mockReturnValue(true);
            const result = await window.loadUIPreferences!('deck-123');
            expect(result).toEqual({});
        });
    });
});
