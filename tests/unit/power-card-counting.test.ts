import { JSDOM } from 'jsdom';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('Power Card Counting Logic', () => {

    describe('DOM-based counting for Available Cards', () => {
        let dom: JSDOM;
        let document: Document;

        beforeEach(() => {
            dom = new JSDOM(`
                <div class="card-category" data-type="power">
                    <div class="card-category-header">
                        <span>Power Cards (0)</span>
                    </div>
                    <div class="character-group">
                        <div class="character-group-header">
                            <span>Energy (0)</span>
                        </div>
                        <div class="card-category-content">
                            <div class="card-item">1 - Energy</div>
                            <div class="card-item">2 - Energy</div>
                            <div class="card-item">3 - Energy</div>
                            <div class="card-item">4 - Energy</div>
                            <div class="card-item">5 - Energy</div>
                            <div class="card-item">6 - Energy</div>
                            <div class="card-item">7 - Energy</div>
                            <div class="card-item">8 - Energy</div>
                        </div>
                    </div>
                    <div class="character-group">
                        <div class="character-group-header">
                            <span>Combat (0)</span>
                        </div>
                        <div class="card-category-content">
                            <div class="card-item">1 - Combat</div>
                            <div class="card-item">2 - Combat</div>
                            <div class="card-item">3 - Combat</div>
                            <div class="card-item">4 - Combat</div>
                            <div class="card-item">5 - Combat</div>
                            <div class="card-item">6 - Combat</div>
                            <div class="card-item">7 - Combat</div>
                            <div class="card-item">8 - Combat</div>
                        </div>
                    </div>
                    <div class="character-group">
                        <div class="character-group-header">
                            <span>Multi Power (0)</span>
                        </div>
                        <div class="card-category-content">
                            <div class="card-item">1 - Multi Power</div>
                            <div class="card-item">2 - Multi Power</div>
                            <div class="card-item">3 - Multi Power</div>
                        </div>
                    </div>
                    <div class="character-group">
                        <div class="character-group-header">
                            <span>Any-Power (0)</span>
                        </div>
                        <div class="card-category-content">
                            <div class="card-item">5 - Any-Power</div>
                            <div class="card-item">6 - Any-Power</div>
                            <div class="card-item">7 - Any-Power</div>
                            <div class="card-item">8 - Any-Power</div>
                        </div>
                    </div>
                </div>
            `, {
                url: 'http://localhost:3000',
                pretendToBeVisual: true,
                resources: 'usable'
            });

            document = dom.window.document;
            global.document = document;
            global.window = dom.window as any;
        });

        afterEach(() => {
            dom.window.close();
        });

        test('should count individual power type sections using DOM elements', () => {
            const powerCardsCategory = document.querySelector('.card-category[data-type="power"]');
            const powerTypeSections = powerCardsCategory?.querySelectorAll('.character-group') || [];
            
            powerTypeSections.forEach(section => {
                const header = section.querySelector('.character-group-header span');
                if (!header) return;

                const powerType = header.textContent.split(' (')[0];
                const powerTypeCount = section.querySelectorAll('.card-item').length;
                
                const originalText = header.textContent;
                const newText = originalText.replace(/\(\d+\)/, `(${powerTypeCount})`);
                header.textContent = newText;
            });

            const energyHeader = document.querySelectorAll('.character-group')[0]?.querySelector('.character-group-header span');
            expect(energyHeader?.textContent).toBe('Energy (8)');

            const combatHeader = document.querySelectorAll('.character-group')[1]?.querySelector('.character-group-header span');
            expect(combatHeader?.textContent).toBe('Combat (8)');

            const multiPowerHeader = document.querySelectorAll('.character-group')[2]?.querySelector('.character-group-header span');
            expect(multiPowerHeader?.textContent).toBe('Multi Power (3)');

            const anyPowerHeader = document.querySelectorAll('.character-group')[3]?.querySelector('.character-group-header span');
            expect(anyPowerHeader?.textContent).toBe('Any-Power (4)');
        });

        test('should calculate main Power Cards header total using DOM elements', () => {
            const powerCardsCategory = document.querySelector('.card-category[data-type="power"]');
            const powerTypeSections = powerCardsCategory?.querySelectorAll('.character-group') || [];
            const mainHeader = powerCardsCategory?.querySelector('.card-category-header span');

            if (mainHeader) {
                const totalPowerCardCount = Array.from(powerTypeSections).reduce((sum, section) => {
                    return sum + section.querySelectorAll('.card-item').length;
                }, 0);
                const originalText = mainHeader.textContent;
                const newText = originalText.replace(/\(\d+\)/, `(${totalPowerCardCount})`);
                mainHeader.textContent = newText;
            }

            expect(mainHeader?.textContent).toBe('Power Cards (23)'); // 8+8+3+4 = 23
        });

        test('should handle dynamic card additions and removals', () => {
            const powerCardsCategory = document.querySelector('.card-category[data-type="power"]');
            const powerTypeSections = powerCardsCategory?.querySelectorAll('.character-group') || [];
            
            // Add a new card
            const energySection = document.querySelectorAll('.character-group')[0]?.querySelector('.card-category-content');
            const newCard = document.createElement('div');
            newCard.className = 'card-item';
            newCard.textContent = '9 - Energy';
            energySection?.appendChild(newCard);

            // Update counts
            powerTypeSections.forEach(section => {
                const header = section.querySelector('.character-group-header span');
                if (!header) return;

                const powerType = header.textContent.split(' (')[0];
                const powerTypeCount = section.querySelectorAll('.card-item').length;
                
                const originalText = header.textContent;
                const newText = originalText.replace(/\(\d+\)/, `(${powerTypeCount})`);
                header.textContent = newText;
            });

            const energyHeader = document.querySelectorAll('.character-group')[0]?.querySelector('.character-group-header span');
            expect(energyHeader?.textContent).toBe('Energy (9)');

            // Remove a card
            const firstEnergyCard = document.querySelectorAll('.character-group')[0]?.querySelector('.card-item');
            firstEnergyCard?.remove();

            // Update counts again
            powerTypeSections.forEach(section => {
                const header = section.querySelector('.character-group-header span');
                if (!header) return;

                const powerType = header.textContent.split(' (')[0];
                const powerTypeCount = section.querySelectorAll('.card-item').length;
                
                const originalText = header.textContent;
                const newText = originalText.replace(/\(\d+\)/, `(${powerTypeCount})`);
                header.textContent = newText;
            });

            const energyHeaderAfterRemoval = document.querySelectorAll('.character-group')[0]?.querySelector('.character-group-header span');
            expect(energyHeaderAfterRemoval?.textContent).toBe('Energy (8)');
        });

        test('should handle empty sections correctly', () => {
            const powerCardsCategory = document.querySelector('.card-category[data-type="power"]');
            const powerTypeSections = powerCardsCategory?.querySelectorAll('.character-group') || [];
            
            // Remove all cards from Energy section
            const energySection = document.querySelectorAll('.character-group')[0]?.querySelector('.card-category-content');
            energySection?.querySelectorAll('.card-item').forEach(item => item.remove());

            // Update counts
            powerTypeSections.forEach(section => {
                const header = section.querySelector('.character-group-header span');
                if (!header) return;

                const powerType = header.textContent.split(' (')[0];
                const powerTypeCount = section.querySelectorAll('.card-item').length;
                
                const originalText = header.textContent;
                const newText = originalText.replace(/\(\d+\)/, `(${powerTypeCount})`);
                header.textContent = newText;
            });

            const energyHeader = document.querySelectorAll('.character-group')[0]?.querySelector('.character-group-header span');
            expect(energyHeader?.textContent).toBe('Energy (0)');
        });

        test('should demonstrate DOM-based counting vs data-based counting', () => {
            const powerCardsCategory = document.querySelector('.card-category[data-type="power"]');
            const powerTypeSections = powerCardsCategory?.querySelectorAll('.character-group') || [];

            // DOM-based counting (our new approach)
            const domBasedCount = Array.from(powerTypeSections).reduce((sum, section) => {
                return sum + section.querySelectorAll('.card-item').length;
            }, 0);

            expect(domBasedCount).toBe(23); // 8+8+3+4 = 23

            // This demonstrates that DOM-based counting works immediately
            // without needing to wait for data maps to be populated
        });
    });

    describe('Power card counting calculations', () => {
        test('should calculate correct power card counts for individual types', () => {
            const deckEditorCards = [
                { type: 'power', card_id: 'card1', quantity: 3 }, // Energy
                { type: 'power', card_id: 'card2', quantity: 2 }, // Combat
                { type: 'power', card_id: 'card3', quantity: 1 }, // Brute Force
                { type: 'power', card_id: 'card4', quantity: 4 }, // Intelligence
                { type: 'power', card_id: 'card5', quantity: 2 }, // Energy
                { type: 'power', card_id: 'card6', quantity: 1 }, // Combat
                { type: 'character', card_id: 'char1', quantity: 1 }, // Non-power card
            ];

            const availableCardsMap = new Map([
                ['power_card1', { id: 'card1', power_type: 'Energy' }],
                ['power_card2', { id: 'card2', power_type: 'Combat' }],
                ['power_card3', { id: 'card3', power_type: 'Brute Force' }],
                ['power_card4', { id: 'card4', power_type: 'Intelligence' }],
                ['power_card5', { id: 'card5', power_type: 'Energy' }],
                ['power_card6', { id: 'card6', power_type: 'Combat' }],
            ]);

            // Calculate Energy count
            const energyCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Energy';
                })
                .reduce((total, card) => total + card.quantity, 0);

            // Calculate Combat count
            const combatCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Combat';
                })
                .reduce((total, card) => total + card.quantity, 0);

            // Calculate Brute Force count
            const bruteForceCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Brute Force';
                })
                .reduce((total, card) => total + card.quantity, 0);

            // Calculate Intelligence count
            const intelligenceCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Intelligence';
                })
                .reduce((total, card) => total + card.quantity, 0);

            expect(energyCount).toBe(5); // 3 + 2
            expect(combatCount).toBe(3); // 2 + 1
            expect(bruteForceCount).toBe(1); // 1
            expect(intelligenceCount).toBe(4); // 4
        });

        test('should calculate correct total power card count', () => {
            const deckEditorCards = [
                { type: 'power', card_id: 'card1', quantity: 8 }, // Energy
                { type: 'power', card_id: 'card2', quantity: 7 }, // Combat
                { type: 'power', card_id: 'card3', quantity: 5 }, // Brute Force
                { type: 'power', card_id: 'card4', quantity: 4 }, // Intelligence
                { type: 'character', card_id: 'char1', quantity: 1 }, // Non-power card
            ];

            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(totalPowerCardCount).toBe(24); // 8 + 7 + 5 + 4
        });

        test('should handle empty deck editor cards', () => {
            const deckEditorCards: any[] = [];
            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(totalPowerCardCount).toBe(0);
        });

        test('should handle cards with no matching power type', () => {
            const deckEditorCards = [
                { type: 'power', card_id: 'unknown_card', quantity: 5 },
            ];

            const availableCardsMap = new Map(); // Empty map

            const energyCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Energy';
                })
                .reduce((total, card) => total + card.quantity, 0);

            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(energyCount).toBe(0); // No matching power types
            expect(totalPowerCardCount).toBe(5); // Total still counts all power cards
        });
    });

    describe('Deck type count calculation', () => {
        test('should calculate correct card count using quantities', () => {
            const typeCards = [
                { quantity: 3 },
                { quantity: 2 },
                { quantity: 1 },
                { quantity: 4 },
            ];

            const cardCount = typeCards.reduce((total, card) => total + (card.quantity || 1), 0);
            expect(cardCount).toBe(10); // 3 + 2 + 1 + 4
        });

        test('should handle cards without quantity property', () => {
            const typeCards = [
                { quantity: 3 },
                {}, // No quantity property
                { quantity: 2 },
            ];

            const cardCount = typeCards.reduce((total, card) => total + (card.quantity || 1), 0);
            expect(cardCount).toBe(6); // 3 + 1 + 2
        });

        test('should handle empty array', () => {
            const typeCards: any[] = [];
            const cardCount = typeCards.reduce((total, card) => total + (card.quantity || 1), 0);
            expect(cardCount).toBe(0);
        });

        test('should handle cards with zero quantity', () => {
            const typeCards = [
                { quantity: 3 },
                { quantity: 0 },
                { quantity: 2 },
            ];

            const cardCount = typeCards.reduce((total, card) => total + (card.quantity ?? 1), 0);
            expect(cardCount).toBe(5); // 3 + 0 + 2
        });
    });

    describe('Power card counting integration', () => {
        test('should match the specific scenario from user report', () => {
            // This test matches the exact scenario: Energy (8), Combat (7), Brute Force (5), Intelligence (4) = 24 total
            const deckEditorCards = [
                { type: 'power', card_id: 'energy1', quantity: 8 },
                { type: 'power', card_id: 'combat1', quantity: 7 },
                { type: 'power', card_id: 'brute1', quantity: 5 },
                { type: 'power', card_id: 'intel1', quantity: 4 },
            ];

            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(totalPowerCardCount).toBe(24);
        });

        test('should handle mixed card types correctly', () => {
            const deckEditorCards = [
                { type: 'power', card_id: 'power1', quantity: 5 },
                { type: 'character', card_id: 'char1', quantity: 1 },
                { type: 'power', card_id: 'power2', quantity: 3 },
                { type: 'special', card_id: 'special1', quantity: 2 },
                { type: 'power', card_id: 'power3', quantity: 2 },
            ];

            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(totalPowerCardCount).toBe(10); // 5 + 3 + 2
        });
    });
});
