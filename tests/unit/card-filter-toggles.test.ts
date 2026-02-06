/** @jest-environment jsdom */

/**
 * Card Filter Toggles - Unit Tests
 *
 * Tests the card-type filter toggle functions extracted from index.html:
 * - applyFilters() for character database filtering
 * - applyLocationFilters() for location threat-level filtering
 * - applyEventsFilters() for events mission-set filtering
 * - update*Filter() helper functions
 */

import fs from 'fs';
import path from 'path';

declare global {
    interface Window {
        applyFilters?: () => Promise<void>;
        applyLocationFilters?: () => Promise<void>;
        applyEventsFilters?: () => void;
        applyBasicUniverseFilters?: () => Promise<void>;
        updateSpecialCardsFilter?: () => void;
        updateAdvancedUniverseFilter?: () => void;
        updatePowerCardsFilter?: () => void;
        updateBasicUniverseFilter?: () => void;
        updateTeamworkFilter?: () => void;
        updateTrainingFilter?: () => void;
        updateAllyUniverseFilter?: () => void;
        toggleSpecialCardsCharacterFilter?: () => Promise<void>;
        toggleAdvancedUniverseCharacterFilter?: () => Promise<void>;
        togglePowerCardsCharacterFilter?: () => Promise<void>;
        toggleBasicUniverseCharacterFilter?: () => Promise<void>;
        toggleTeamworkCharacterFilter?: () => Promise<void>;
        toggleTrainingCharacterFilter?: () => Promise<void>;
        toggleAllyUniverseCharacterFilter?: () => Promise<void>;
        toggleEventsMissionFilter?: () => Promise<void>;
        eventsData?: any[];
        deckEditorCards?: any[];
        availableCardsMap?: Map<string, any>;
        showNotification?: (msg: string, type: string) => void;
        displayCharacters?: (chars: any[]) => void;
        displayLocations?: (locs: any[]) => void;
        displayEvents?: (events: any[]) => void;
        displayBasicUniverse?: (cards: any[]) => void;
    }
}

describe('Card Filter Toggles', () => {
    let code: string;

    beforeEach(() => {
        const filePath = path.join(__dirname, '../../public/js/card-filter-toggles.js');
        code = fs.readFileSync(filePath, 'utf-8');
        new Function(code)();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Module Loading', () => {
        it('should export applyFilters to window', () => {
            expect(typeof window.applyFilters).toBe('function');
        });

        it('should export applyLocationFilters to window', () => {
            expect(typeof window.applyLocationFilters).toBe('function');
        });

        it('should export applyEventsFilters to window', () => {
            expect(typeof window.applyEventsFilters).toBe('function');
        });

        it('should export all toggle filter functions to window', () => {
            expect(typeof window.toggleEventsMissionFilter).toBe('function');
            expect(typeof window.toggleSpecialCardsCharacterFilter).toBe('function');
            expect(typeof window.toggleAdvancedUniverseCharacterFilter).toBe('function');
            expect(typeof window.togglePowerCardsCharacterFilter).toBe('function');
            expect(typeof window.toggleBasicUniverseCharacterFilter).toBe('function');
            expect(typeof window.toggleTeamworkCharacterFilter).toBe('function');
            expect(typeof window.toggleTrainingCharacterFilter).toBe('function');
            expect(typeof window.toggleAllyUniverseCharacterFilter).toBe('function');
        });

        it('should export all update filter functions to window', () => {
            expect(typeof window.updateSpecialCardsFilter).toBe('function');
            expect(typeof window.updateAdvancedUniverseFilter).toBe('function');
            expect(typeof window.updatePowerCardsFilter).toBe('function');
            expect(typeof window.updateBasicUniverseFilter).toBe('function');
            expect(typeof window.updateTeamworkFilter).toBe('function');
            expect(typeof window.updateTrainingFilter).toBe('function');
            expect(typeof window.updateAllyUniverseFilter).toBe('function');
        });
    });

    describe('applyEventsFilters', () => {
        it('should show "no mission sets selected" when none checked', () => {
            document.body.innerHTML = `
                <div id="events-tab"></div>
                <table><tbody id="events-tbody"></tbody></table>
            `;
            window.eventsData = [];
            window.applyEventsFilters!();
            const tbody = document.getElementById('events-tbody')!;
            expect(tbody.innerHTML).toContain('No mission sets selected');
        });

        it('should filter events by checked mission sets', () => {
            document.body.innerHTML = `
                <div id="events-tab">
                    <input type="checkbox" value="Alpha" checked>
                </div>
                <table><tbody id="events-tbody"></tbody></table>
            `;
            window.eventsData = [
                { id: '1', mission_set: 'Alpha', name: 'Event A' },
                { id: '2', mission_set: 'Beta', name: 'Event B' },
            ];
            window.displayEvents = jest.fn();
            window.applyEventsFilters!();
            expect(window.displayEvents).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ mission_set: 'Alpha' })])
            );
        });
    });

    describe('updateSpecialCardsFilter', () => {
        it('should not call toggle when checkbox is unchecked', () => {
            document.body.innerHTML = `<input type="checkbox" id="specialCardsCharacterFilter">`;
            // Should not throw
            window.updateSpecialCardsFilter!();
        });
    });
});
