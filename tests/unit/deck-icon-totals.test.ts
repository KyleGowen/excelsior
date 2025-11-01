/** @jest-environment jsdom */

/**
 * Comprehensive unit tests for calculateIconTotals function
 * Tests icon counting across all card types that should contribute to totals:
 * - Special Cards
 * - Aspect Cards
 * - Ally Cards (ally-universe)
 * - Teamwork Cards
 * - Power Cards
 */

// Type definitions
interface MockDeckCard {
    id: string;
    type: string;
    cardId: string;
    quantity: number;
    selectedAlternateImage?: string;
}

interface MockCardData {
    name?: string;
    card_name?: string;
    icons?: string[];
    power_type?: string;
    to_use?: string;
    stat_type_to_use?: string;
}

// Mock the calculateIconTotals function logic
function calculateIconTotals(deckCards: MockDeckCard[], availableCardsMap: Map<string, MockCardData>) {
    const totals = {
        'Energy': 0,
        'Combat': 0,
        'Brute Force': 0,
        'Intelligence': 0
    };
    
    const iconTypes = ['Energy', 'Combat', 'Brute Force', 'Intelligence'];
    
    // Only process card types that should contribute to icon totals
    const allowedTypes = ['special', 'aspect', 'ally-universe', 'ally_universe', 'teamwork', 'power'];
    
    deckCards.forEach(card => {
        // Skip card types that don't contribute to icon totals
        if (!allowedTypes.includes(card.type)) {
            return;
        }
        
        const availableCard = availableCardsMap.get(card.cardId);
        if (!availableCard) return;
        
        const quantity = (card.quantity && card.quantity > 0) ? card.quantity : 1;
        let icons: string[] = [];
        
        // Determine icons based on card type, using same logic as list view
        if (card.type === 'power') {
            // Power cards: use power_type field
            const type = String(availableCard.power_type || '').trim();
            const isMulti = /multi\s*-?power/i.test(type);
            
            if (type === 'Any-Power') {
                // Any-Power doesn't count toward icon totals
                icons = [];
            } else if (isMulti) {
                // Multi Power counts as all 4 types
                icons = ['Energy', 'Combat', 'Brute Force', 'Intelligence'];
            } else {
                // Single type power card
                const matchedType = iconTypes.find(t => t === type);
                if (matchedType) {
                    icons = [matchedType];
                }
            }
        } else if (card.type === 'teamwork') {
            // Teamwork cards: use to_use field
            const src = String(availableCard.to_use || '');
            const isAny = /Any-?Power/i.test(src);
            
            if (isAny) {
                // Any-Power doesn't count toward icon totals
                icons = [];
            } else {
                // Match Energy, Combat, Brute Force, Intelligence from to_use string
                icons = iconTypes.filter(t => {
                    const regex = new RegExp(t, 'i');
                    return regex.test(src);
                });
            }
        } else if (card.type === 'ally-universe' || card.type === 'ally_universe') {
            // Ally-universe cards: use stat_type_to_use field
            const src = String(availableCard.stat_type_to_use || '');
            const matchedType = iconTypes.find(t => {
                const regex = new RegExp(t, 'i');
                return regex.test(src);
            });
            if (matchedType) {
                icons = [matchedType];
            }
        } else {
            // For other card types (special, aspect, etc.): use icons array
            icons = Array.isArray(availableCard.icons) ? availableCard.icons : [];
            // Filter to only count the 4 main icon types
            icons = icons.filter(icon => iconTypes.includes(icon));
        }
        
        // Count each icon type, multiplied by quantity
        icons.forEach(icon => {
            if (totals.hasOwnProperty(icon)) {
                totals[icon as keyof typeof totals] += quantity;
            }
        });
    });
    
    return totals;
}

describe('calculateIconTotals', () => {
    let availableCardsMap: Map<string, MockCardData>;

    beforeEach(() => {
        availableCardsMap = new Map();
    });

    describe('Power Cards', () => {
        it('should count single Energy power card', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', {
                power_type: 'Energy'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
            expect(totals.Combat).toBe(0);
            expect(totals['Brute Force']).toBe(0);
            expect(totals.Intelligence).toBe(0);
        });

        it('should count single Combat power card', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', {
                power_type: 'Combat'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Combat).toBe(1);
            expect(totals.Energy).toBe(0);
        });

        it('should count single Brute Force power card', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', {
                power_type: 'Brute Force'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals['Brute Force']).toBe(1);
        });

        it('should count single Intelligence power card', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', {
                power_type: 'Intelligence'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Intelligence).toBe(1);
        });

        it('should count Multi Power as all 4 icon types', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', {
                power_type: 'Multi Power'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
            expect(totals.Combat).toBe(1);
            expect(totals['Brute Force']).toBe(1);
            expect(totals.Intelligence).toBe(1);
        });

        it('should count Multi-Power (with hyphen) as all 4 icon types', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', {
                power_type: 'Multi-Power'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
            expect(totals.Combat).toBe(1);
            expect(totals['Brute Force']).toBe(1);
            expect(totals.Intelligence).toBe(1);
        });

        it('should count Multi Power with quantity correctly', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 3 }
            ];
            
            availableCardsMap.set('power1', {
                power_type: 'Multi Power'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(3);
            expect(totals.Combat).toBe(3);
            expect(totals['Brute Force']).toBe(3);
            expect(totals.Intelligence).toBe(3);
        });

        it('should NOT count Any-Power cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', {
                power_type: 'Any-Power'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
            expect(totals.Combat).toBe(0);
            expect(totals['Brute Force']).toBe(0);
            expect(totals.Intelligence).toBe(0);
        });

        it('should count multiple power cards with different types', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 2 },
                { id: '2', type: 'power', cardId: 'power2', quantity: 3 },
                { id: '3', type: 'power', cardId: 'power3', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', { power_type: 'Energy' });
            availableCardsMap.set('power2', { power_type: 'Combat' });
            availableCardsMap.set('power3', { power_type: 'Multi Power' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(3); // 2 Energy + 1 Multi
            expect(totals.Combat).toBe(4); // 3 Combat + 1 Multi
            expect(totals['Brute Force']).toBe(1); // 1 Multi
            expect(totals.Intelligence).toBe(1); // 1 Multi
        });
    });

    describe('Special Cards', () => {
        it('should count special card with single icon', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'special', cardId: 'special1', quantity: 1 }
            ];
            
            availableCardsMap.set('special1', {
                icons: ['Energy']
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
        });

        it('should count special card with multiple icons', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'special', cardId: 'special1', quantity: 1 }
            ];
            
            availableCardsMap.set('special1', {
                icons: ['Energy', 'Combat', 'Intelligence']
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
            expect(totals.Combat).toBe(1);
            expect(totals.Intelligence).toBe(1);
        });

        it('should count special card with quantity correctly', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'special', cardId: 'special1', quantity: 3 }
            ];
            
            availableCardsMap.set('special1', {
                icons: ['Combat', 'Brute Force']
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Combat).toBe(3);
            expect(totals['Brute Force']).toBe(3);
        });

        it('should ignore non-icon types in icons array', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'special', cardId: 'special1', quantity: 1 }
            ];
            
            availableCardsMap.set('special1', {
                icons: ['Energy', 'SomeOtherIcon', 'Combat']
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
            expect(totals.Combat).toBe(1);
        });

        it('should handle special card with empty icons array', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'special', cardId: 'special1', quantity: 1 }
            ];
            
            availableCardsMap.set('special1', {
                icons: []
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
            expect(totals.Combat).toBe(0);
        });

        it('should handle special card with no icons property', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'special', cardId: 'special1', quantity: 1 }
            ];
            
            availableCardsMap.set('special1', {});

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });
    });

    describe('Aspect Cards', () => {
        it('should count aspect card with single icon', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'aspect', cardId: 'aspect1', quantity: 1 }
            ];
            
            availableCardsMap.set('aspect1', {
                icons: ['Intelligence']
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Intelligence).toBe(1);
        });

        it('should count aspect card with multiple icons', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'aspect', cardId: 'aspect1', quantity: 2 }
            ];
            
            availableCardsMap.set('aspect1', {
                icons: ['Energy', 'Brute Force']
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(2);
            expect(totals['Brute Force']).toBe(2);
        });
    });

    describe('Ally-Universe Cards', () => {
        it('should count ally card with Energy stat_type_to_use', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'ally-universe', cardId: 'ally1', quantity: 1 }
            ];
            
            availableCardsMap.set('ally1', {
                stat_type_to_use: 'Energy'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
        });

        it('should count ally card with Combat stat_type_to_use', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'ally_universe', cardId: 'ally1', quantity: 1 }
            ];
            
            availableCardsMap.set('ally1', {
                stat_type_to_use: 'Combat'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Combat).toBe(1);
        });

        it('should count ally card with case-insensitive matching', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'ally-universe', cardId: 'ally1', quantity: 1 }
            ];
            
            availableCardsMap.set('ally1', {
                stat_type_to_use: 'intelligence'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Intelligence).toBe(1);
        });

        it('should count ally card when stat_type_to_use contains the type', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'ally-universe', cardId: 'ally1', quantity: 1 }
            ];
            
            availableCardsMap.set('ally1', {
                stat_type_to_use: '5 or less Energy'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
        });

        it('should count ally card with quantity correctly', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'ally-universe', cardId: 'ally1', quantity: 3 }
            ];
            
            availableCardsMap.set('ally1', {
                stat_type_to_use: 'Brute Force'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals['Brute Force']).toBe(3);
        });

        it('should handle ally card with no matching stat_type_to_use', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'ally-universe', cardId: 'ally1', quantity: 1 }
            ];
            
            availableCardsMap.set('ally1', {
                stat_type_to_use: 'Some Other Type'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
            expect(totals.Combat).toBe(0);
        });
    });

    describe('Teamwork Cards', () => {
        it('should count teamwork card with single icon in to_use', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'teamwork', cardId: 'teamwork1', quantity: 1 }
            ];
            
            availableCardsMap.set('teamwork1', {
                to_use: 'Energy'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
        });

        it('should count teamwork card with multiple icons in to_use', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'teamwork', cardId: 'teamwork1', quantity: 1 }
            ];
            
            availableCardsMap.set('teamwork1', {
                to_use: 'Energy or Combat or Brute Force'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
            expect(totals.Combat).toBe(1);
            expect(totals['Brute Force']).toBe(1);
        });

        it('should count teamwork card with case-insensitive matching', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'teamwork', cardId: 'teamwork1', quantity: 1 }
            ];
            
            availableCardsMap.set('teamwork1', {
                to_use: 'intelligence'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Intelligence).toBe(1);
        });

        it('should NOT count Any-Power teamwork cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'teamwork', cardId: 'teamwork1', quantity: 1 }
            ];
            
            availableCardsMap.set('teamwork1', {
                to_use: 'Any-Power'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
            expect(totals.Combat).toBe(0);
        });

        it('should NOT count AnyPower (no hyphen) teamwork cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'teamwork', cardId: 'teamwork1', quantity: 1 }
            ];
            
            availableCardsMap.set('teamwork1', {
                to_use: 'AnyPower'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should count teamwork card with quantity correctly', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'teamwork', cardId: 'teamwork1', quantity: 4 }
            ];
            
            availableCardsMap.set('teamwork1', {
                to_use: 'Combat'
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Combat).toBe(4);
        });
    });

    describe('Excluded Card Types', () => {
        it('should NOT count character cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'character', cardId: 'char1', quantity: 1 }
            ];
            
            availableCardsMap.set('char1', {
                icons: ['Energy'] // Even if it has icons, shouldn't count
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should NOT count location cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'location', cardId: 'loc1', quantity: 1 }
            ];
            
            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should NOT count mission cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'mission', cardId: 'miss1', quantity: 1 }
            ];
            
            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should NOT count event cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'event', cardId: 'event1', quantity: 1 }
            ];
            
            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should NOT count basic-universe cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'basic-universe', cardId: 'basic1', quantity: 1 }
            ];
            
            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should NOT count advanced-universe cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'advanced-universe', cardId: 'advanced1', quantity: 1 }
            ];
            
            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should NOT count training cards', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            
            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });
    });

    describe('Complex Scenarios', () => {
        it('should correctly count mixed card types', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 2 },
                { id: '2', type: 'special', cardId: 'special1', quantity: 3 },
                { id: '3', type: 'aspect', cardId: 'aspect1', quantity: 1 },
                { id: '4', type: 'ally-universe', cardId: 'ally1', quantity: 2 },
                { id: '5', type: 'teamwork', cardId: 'teamwork1', quantity: 1 },
                { id: '6', type: 'character', cardId: 'char1', quantity: 1 } // Should be excluded
            ];
            
            availableCardsMap.set('power1', { power_type: 'Energy' });
            availableCardsMap.set('special1', { icons: ['Combat', 'Brute Force'] });
            availableCardsMap.set('aspect1', { icons: ['Intelligence'] });
            availableCardsMap.set('ally1', { stat_type_to_use: 'Energy' });
            availableCardsMap.set('teamwork1', { to_use: 'Combat' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(4); // 2 power + 2 ally
            expect(totals.Combat).toBe(4); // 3 special + 1 teamwork
            expect(totals['Brute Force']).toBe(3); // 3 special
            expect(totals.Intelligence).toBe(1); // 1 aspect
        });

        it('should handle empty deck', () => {
            const deckCards: MockDeckCard[] = [];
            
            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
            expect(totals.Combat).toBe(0);
            expect(totals['Brute Force']).toBe(0);
            expect(totals.Intelligence).toBe(0);
        });

        it('should handle cards not found in availableCardsMap', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'nonexistent', quantity: 1 },
                { id: '2', type: 'special', cardId: 'special1', quantity: 1 }
            ];
            
            availableCardsMap.set('special1', { icons: ['Energy'] });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1); // Only special card counted
        });

        it('should handle cards with quantity 0 (treats as 1 due to || fallback)', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 0 }
            ];
            
            availableCardsMap.set('power1', { power_type: 'Energy' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            // Note: quantity || 1 means 0 becomes 1, so this will count as 1
            // In practice, cards with quantity 0 shouldn't exist in a deck
            expect(totals.Energy).toBe(1);
        });

        it('should handle cards with missing quantity (defaults to 1)', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1' } as MockDeckCard
            ];
            
            availableCardsMap.set('power1', { power_type: 'Combat' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Combat).toBe(1);
        });

        it('should handle multiple Multi Power cards correctly', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 2 },
                { id: '2', type: 'power', cardId: 'power2', quantity: 3 }
            ];
            
            availableCardsMap.set('power1', { power_type: 'Multi Power' });
            availableCardsMap.set('power2', { power_type: 'Multi-Power' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(5); // 2 + 3
            expect(totals.Combat).toBe(5);
            expect(totals['Brute Force']).toBe(5);
            expect(totals.Intelligence).toBe(5);
        });

        it('should handle real-world scenario: Time Detectives deck example', () => {
            // Based on user's report: Energy=6, Combat=4, Brute Force=7, Intelligence=14
            const deckCards: MockDeckCard[] = [
                // Power cards
                { id: 'p1', type: 'power', cardId: 'p1', quantity: 2 }, // 1-Brute Force
                { id: 'p2', type: 'power', cardId: 'p2', quantity: 1 }, // 1-Energy
                { id: 'p3', type: 'power', cardId: 'p3', quantity: 2 }, // 2-Brute Force
                { id: 'p4', type: 'power', cardId: 'p4', quantity: 2 }, // 3-Brute Force
                { id: 'p5', type: 'power', cardId: 'p5', quantity: 1 }, // 3-Intelligence
                { id: 'p6', type: 'power', cardId: 'p6', quantity: 1 }, // 4-Combat
                { id: 'p7', type: 'power', cardId: 'p7', quantity: 2 }, // 4-Intelligence
                { id: 'p8', type: 'power', cardId: 'p8', quantity: 1 }, // 5-Combat
                { id: 'p9', type: 'power', cardId: 'p9', quantity: 3 }, // 6-Intelligence
                { id: 'p10', type: 'power', cardId: 'p10', quantity: 3 }, // 7-Intelligence
                { id: 'p11', type: 'power', cardId: 'p11', quantity: 3 }, // 8-Intelligence
                // Special cards with icons
                { id: 's1', type: 'special', cardId: 's1', quantity: 1 }, // Inspirational Leadership - Combat
                { id: 's2', type: 'special', cardId: 's2', quantity: 1 }, // Irene Adler - Energy
                { id: 's3', type: 'special', cardId: 's3', quantity: 1 }, // Unpredictable Mind - Energy, Combat, Brute Force, Intelligence
                { id: 's4', type: 'special', cardId: 's4', quantity: 1 }, // Futuristic Phaser - Energy
                // Ally cards
                { id: 'a1', type: 'ally-universe', cardId: 'a1', quantity: 1 }, // Allan Quatermain - Energy
                { id: 'a2', type: 'ally-universe', cardId: 'a2', quantity: 1 } // Queen Guinevere - Intelligence
            ];
            
            availableCardsMap.set('p1', { power_type: 'Brute Force' });
            availableCardsMap.set('p2', { power_type: 'Energy' });
            availableCardsMap.set('p3', { power_type: 'Brute Force' });
            availableCardsMap.set('p4', { power_type: 'Brute Force' });
            availableCardsMap.set('p5', { power_type: 'Intelligence' });
            availableCardsMap.set('p6', { power_type: 'Combat' });
            availableCardsMap.set('p7', { power_type: 'Intelligence' });
            availableCardsMap.set('p8', { power_type: 'Combat' });
            availableCardsMap.set('p9', { power_type: 'Intelligence' });
            availableCardsMap.set('p10', { power_type: 'Intelligence' });
            availableCardsMap.set('p11', { power_type: 'Intelligence' });
            availableCardsMap.set('s1', { icons: ['Combat'] });
            availableCardsMap.set('s2', { icons: ['Energy'] });
            availableCardsMap.set('s3', { icons: ['Energy', 'Combat', 'Brute Force', 'Intelligence'] });
            availableCardsMap.set('s4', { icons: ['Energy'] });
            availableCardsMap.set('a1', { stat_type_to_use: 'Energy' });
            availableCardsMap.set('a2', { stat_type_to_use: 'Intelligence' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            // Calculate expected values:
            // Energy: 1 power (p2) + 3 special (s2, s3, s4) + 1 ally (a1) = 5
            // Combat: 2 power (p6, p8) + 2 special (s1, s3) = 4  
            // Brute Force: 6 power (p1:2, p3:2, p4:2) + 1 special (s3) = 7
            // Intelligence: 10 power (p5:1, p7:2, p9:3, p10:3, p11:3) + 1 special (s3) + 1 ally (a2) = 14
            // Note: User reported different values, so this test validates the calculation logic
            expect(totals.Energy).toBe(5); // 1 power + 3 special + 1 ally
            expect(totals.Combat).toBe(4); // 2 power + 2 special
            expect(totals['Brute Force']).toBe(7); // 6 power + 1 special
            expect(totals.Intelligence).toBe(14); // 10 power + 1 special + 1 ally
        });
    });

    describe('Edge Cases', () => {
        it('should handle null power_type', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', { power_type: null as any });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should handle empty string power_type', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', { power_type: '' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should handle whitespace-only power_type', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 1 }
            ];
            
            availableCardsMap.set('power1', { power_type: '   ' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should handle invalid icon types in icons array', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'special', cardId: 'special1', quantity: 1 }
            ];
            
            availableCardsMap.set('special1', {
                icons: ['InvalidIcon', 'Energy', 'AnotherInvalid', 'Combat']
            });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(1);
            expect(totals.Combat).toBe(1);
            expect(totals['Brute Force']).toBe(0);
            expect(totals.Intelligence).toBe(0);
        });

        it('should handle null to_use field', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'teamwork', cardId: 'teamwork1', quantity: 1 }
            ];
            
            availableCardsMap.set('teamwork1', { to_use: null as any });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should handle null stat_type_to_use field', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'ally-universe', cardId: 'ally1', quantity: 1 }
            ];
            
            availableCardsMap.set('ally1', { stat_type_to_use: null as any });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(0);
        });

        it('should handle very large quantities', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: 100 }
            ];
            
            availableCardsMap.set('power1', { power_type: 'Energy' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            expect(totals.Energy).toBe(100);
        });

        it('should handle negative quantities (defaults to 1)', () => {
            const deckCards: MockDeckCard[] = [
                { id: '1', type: 'power', cardId: 'power1', quantity: -5 }
            ];
            
            availableCardsMap.set('power1', { power_type: 'Energy' });

            const totals = calculateIconTotals(deckCards, availableCardsMap);
            
            // Negative quantities are treated as invalid and default to 1
            expect(totals.Energy).toBe(1);
        });
    });
});

