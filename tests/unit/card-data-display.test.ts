/** @jest-environment jsdom */

/**
 * Card Data Display - Unit Tests
 *
 * Tests the data loading and display functions extracted from index.html:
 * - displayTeamwork() rendering
 * - displayAllyUniverse() rendering
 * - displayTraining() rendering
 * - displayBasicUniverse() rendering
 * - setupBasicUniverseSearch() event listener setup
 */

import fs from 'fs';
import path from 'path';

declare global {
    interface Window {
        loadMissions?: () => Promise<void>;
        loadEvents?: () => Promise<void>;
        loadAspects?: () => Promise<void>;
        loadAdvancedUniverse?: () => Promise<void>;
        loadTeamwork?: () => Promise<void>;
        displayTeamwork?: (data: any[]) => void;
        loadAllyUniverse?: () => Promise<void>;
        displayAllyUniverse?: (data: any[]) => void;
        loadTraining?: () => Promise<void>;
        displayTraining?: (data: any[]) => void;
        loadBasicUniverse?: () => Promise<void>;
        setupBasicUniverseSearch?: () => void;
        displayBasicUniverse?: (data: any[]) => void;
        loadPowerCards?: () => Promise<void>;
        missionsData?: any[];
        eventsData?: any[];
        mapImagePathToActualFile?: (path: string) => string;
        getCurrentUser?: () => any;
        showCardHoverModal?: (src: string, name: string) => void;
        hideCardHoverModal?: () => void;
        openModal?: (el: HTMLElement) => void;
        showDeckSelection?: (...args: any[]) => void;
        displayMissions?: (data: any[]) => void;
        displayEvents?: (data: any[]) => void;
        displayAspects?: (data: any[]) => void;
        displayAdvancedUniverse?: (data: any[]) => void;
        displayPowerCards?: (data: any[]) => void;
        applyBasicUniverseFilters?: () => Promise<void>;
        addCardToCollectionFromDatabase?: (id: string, type: string) => void;
    }
}

describe('Card Data Display', () => {
    let code: string;

    beforeEach(() => {
        const filePath = path.join(__dirname, '../../public/js/card-data-display.js');
        code = fs.readFileSync(filePath, 'utf-8');

        // Stub dependencies
        window.mapImagePathToActualFile = (p: string) => p;
        window.getCurrentUser = () => null;
        window.showCardHoverModal = jest.fn();
        window.hideCardHoverModal = jest.fn();
        window.openModal = jest.fn();
        window.showDeckSelection = jest.fn();
        window.applyBasicUniverseFilters = jest.fn();

        new Function(code)();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Module Loading', () => {
        it('should export all load functions to window', () => {
            expect(typeof window.loadMissions).toBe('function');
            expect(typeof window.loadEvents).toBe('function');
            expect(typeof window.loadAspects).toBe('function');
            expect(typeof window.loadAdvancedUniverse).toBe('function');
            expect(typeof window.loadTeamwork).toBe('function');
            expect(typeof window.loadAllyUniverse).toBe('function');
            expect(typeof window.loadTraining).toBe('function');
            expect(typeof window.loadBasicUniverse).toBe('function');
            expect(typeof window.loadPowerCards).toBe('function');
        });

        it('should export all display functions to window', () => {
            expect(typeof window.displayTeamwork).toBe('function');
            expect(typeof window.displayAllyUniverse).toBe('function');
            expect(typeof window.displayTraining).toBe('function');
            expect(typeof window.displayBasicUniverse).toBe('function');
        });
    });

    describe('displayTeamwork', () => {
        beforeEach(() => {
            document.body.innerHTML = '<table><tbody id="teamwork-tbody"></tbody></table>';
        });

        it('should show "no teamwork cards" when array is empty', () => {
            window.displayTeamwork!([]);
            const tbody = document.getElementById('teamwork-tbody')!;
            expect(tbody.innerHTML).toContain('No teamwork cards found');
        });

        it('should render teamwork card rows', () => {
            window.displayTeamwork!([
                { id: '1', image: 'test.png', card_type: 'Energy', to_use: '5 Energy', acts_as: 'Combat', followup_attack_types: 'None', first_attack_bonus: '+2', second_attack_bonus: '+1' },
            ]);
            const tbody = document.getElementById('teamwork-tbody')!;
            expect(tbody.querySelectorAll('tr').length).toBe(1);
            expect(tbody.innerHTML).toContain('5 Energy');
        });

        it('should sort by OverPower type order', () => {
            window.displayTeamwork!([
                { id: '2', image: 'b.png', card_type: 'Intelligence', to_use: '5 Intelligence', acts_as: '', followup_attack_types: '', first_attack_bonus: '', second_attack_bonus: '' },
                { id: '1', image: 'a.png', card_type: 'Energy', to_use: '5 Energy', acts_as: '', followup_attack_types: '', first_attack_bonus: '', second_attack_bonus: '' },
            ]);
            const tbody = document.getElementById('teamwork-tbody')!;
            const rows = tbody.querySelectorAll('tr');
            expect(rows[0].innerHTML).toContain('5 Energy');
            expect(rows[1].innerHTML).toContain('5 Intelligence');
        });
    });

    describe('displayTraining', () => {
        beforeEach(() => {
            document.body.innerHTML = '<table><tbody id="training-tbody"></tbody></table>';
        });

        it('should show "no training found" when empty', () => {
            window.displayTraining!([]);
            expect(document.getElementById('training-tbody')!.innerHTML).toContain('No training found');
        });

        it('should render training card rows', () => {
            window.displayTraining!([
                { id: '1', image: 'test.png', card_name: 'Training (Fire)', type_1: 'Energy', type_2: 'Combat', value_to_use: '5 or less', bonus: '+2' },
            ]);
            const rows = document.getElementById('training-tbody')!.querySelectorAll('tr');
            expect(rows.length).toBe(1);
            expect(rows[0].innerHTML).toContain('Fire');
        });
    });

    describe('displayBasicUniverse', () => {
        beforeEach(() => {
            document.body.innerHTML = '<table><tbody id="basic-universe-tbody"></tbody></table>';
        });

        it('should show "no basic universe cards" when empty', () => {
            window.displayBasicUniverse!([]);
            expect(document.getElementById('basic-universe-tbody')!.innerHTML).toContain('No basic universe cards found');
        });

        it('should render basic universe card rows sorted by type', () => {
            window.displayBasicUniverse!([
                { id: '2', image: 'b.png', card_name: 'Card B', type: 'Combat', value_to_use: '6 or greater', bonus: '+3' },
                { id: '1', image: 'a.png', card_name: 'Card A', type: 'Energy', value_to_use: '5 or greater', bonus: '+2' },
            ]);
            const rows = document.getElementById('basic-universe-tbody')!.querySelectorAll('tr');
            expect(rows.length).toBe(2);
            // Energy should come before Combat in OverPower order
            expect(rows[0].innerHTML).toContain('Card A');
            expect(rows[1].innerHTML).toContain('Card B');
        });
    });
});
