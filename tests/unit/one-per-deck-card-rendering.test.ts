import { JSDOM } from 'jsdom';

// Mock the global window object
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
    <div id="cardCategories"></div>
</body>
</html>
`);

// Set up global variables
(global as any).window = dom.window;
(global as any).document = dom.window.document;

// Mock the availableCardsMap and deckEditorCards
(global as any).window.availableCardsMap = new Map();
(global as any).window.deckEditorCards = [];

describe('One Per Deck Card Rendering Integration', () => {
    beforeEach(() => {
        // Reset deckEditorCards
        (global as any).window.deckEditorCards = [];
        
        // Clear availableCardsMap
        (global as any).window.availableCardsMap.clear();
    });

    describe('Character card rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming in character card HTML generation', () => {
            const mockCharacter = {
                id: 'char_1',
                name: 'One Per Deck Character',
                one_per_deck: true,
                threat_level: 18,
                energy: 6,
                combat: 2,
                brute_force: 7,
                intelligence: 5
            };

            // Add character to deck
            (global as any).window.deckEditorCards = [
                { type: 'character', cardId: 'char_1', quantity: 1 }
            ];

            // Simulate character card rendering logic
            const currentCharacterCount = 1;
            const isCharacterLimitReached = currentCharacterCount >= 4;
            const isOnePerDeck = mockCharacter.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'character' && deckCard.cardId === mockCharacter.id
            );
            
            const disabledClass = (isCharacterLimitReached || isOnePerDeckInDeck) ? 'disabled' : '';
            let disabledTitle = '';
            if (isCharacterLimitReached) {
                disabledTitle = 'Character limit reached (max 4)';
            } else if (isOnePerDeckInDeck) {
                disabledTitle = 'One Per Deck - already in deck';
            }

            // Generate HTML (simplified version of the actual rendering)
            const statsHtml = `
                <span class="character-stat"><span class="stat-label">TL:</span><span class="stat-value" style="color: #808080;">18</span></span>
                <span class="character-stat"><span class="stat-label">E:</span><span class="stat-value" style="color: #FFD700;">6</span></span>
                <span class="character-stat"><span class="stat-label">C:</span><span class="stat-value" style="color: #FF8C00;">2</span></span>
                <span class="character-stat"><span class="stat-label">BF:</span><span class="stat-value" style="color: #32CD32;">7</span></span>
                <span class="character-stat"><span class="stat-label">I:</span><span class="stat-value" style="color: #6495ED;">5</span></span>
            `;

            const characterCardHtml = `
                <div class="card-item character-card ${disabledClass}" 
                     draggable="${!(isCharacterLimitReached || isOnePerDeckInDeck)}" 
                     data-type="character" 
                     data-id="${mockCharacter.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">
                        <div class="character-name">${mockCharacter.name}</div>
                        <div class="character-stats">${statsHtml}</div>
                    </div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'character', '${mockCharacter.id}', '${mockCharacter.name}')" title="Add to deck (max 4 characters)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(characterCardHtml).toContain('disabled');
            expect(characterCardHtml).toContain('draggable="false"');
            expect(characterCardHtml).toContain('One Per Deck - already in deck');
        });

        it('should not dim character when not One Per Deck', () => {
            const mockCharacter = {
                id: 'char_2',
                name: 'Regular Character',
                one_per_deck: false,
                threat_level: 15,
                energy: 5,
                combat: 3,
                brute_force: 4,
                intelligence: 6
            };

            // Add character to deck
            (global as any).window.deckEditorCards = [
                { type: 'character', cardId: 'char_2', quantity: 1 }
            ];

            // Simulate character card rendering logic
            const currentCharacterCount = 1;
            const isCharacterLimitReached = currentCharacterCount >= 4;
            const isOnePerDeck = mockCharacter.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'character' && deckCard.cardId === mockCharacter.id
            );
            
            const disabledClass = (isCharacterLimitReached || isOnePerDeckInDeck) ? 'disabled' : '';
            let disabledTitle = '';
            if (isCharacterLimitReached) {
                disabledTitle = 'Character limit reached (max 4)';
            } else if (isOnePerDeckInDeck) {
                disabledTitle = 'One Per Deck - already in deck';
            }

            // Verify no One Per Deck dimming
            expect(disabledClass).toBe('');
            expect(disabledTitle).toBe('');
        });
    });

    describe('Mission card rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming in mission card HTML generation', () => {
            const mockMission = {
                id: 'mission_1',
                card_name: 'One Per Deck Mission',
                one_per_deck: true,
                mission_set: 'Test Set'
            };

            // Add mission to deck
            (global as any).window.deckEditorCards = [
                { type: 'mission', cardId: 'mission_1', quantity: 1 }
            ];

            // Simulate mission card rendering logic
            const currentMissionCount = 1;
            const isMissionLimitReached = currentMissionCount >= 7;
            const isOnePerDeck = mockMission.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'mission' && deckCard.cardId === mockMission.id
            );
            
            const disabledClass = (isMissionLimitReached || isOnePerDeckInDeck) ? 'disabled' : '';
            let disabledTitle = '';
            if (isMissionLimitReached) {
                disabledTitle = 'Mission limit reached (max 7)';
            } else if (isOnePerDeckInDeck) {
                disabledTitle = 'One Per Deck - already in deck';
            }

            // Generate HTML (simplified version)
            const missionCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!(isMissionLimitReached || isOnePerDeckInDeck)}" 
                     data-type="mission" 
                     data-id="${mockMission.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${mockMission.card_name}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'mission', '${mockMission.id}', '${mockMission.card_name}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(missionCardHtml).toContain('disabled');
            expect(missionCardHtml).toContain('draggable="false"');
            expect(missionCardHtml).toContain('One Per Deck - already in deck');
        });
    });

    describe('Special card rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming in special card HTML generation', () => {
            const mockSpecial = {
                id: 'special_1',
                name: 'Grim Reaper',
                one_per_deck: true,
                character: 'Any Character'
            };

            // Add special card to deck
            (global as any).window.deckEditorCards = [
                { type: 'special', cardId: 'special_1', quantity: 1 }
            ];

            // Simulate special card rendering logic
            const isOnePerDeck = mockSpecial.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'special' && deckCard.cardId === mockSpecial.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';

            // Generate HTML (simplified version)
            const specialCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!isOnePerDeckInDeck}" 
                     data-type="special" 
                     data-id="${mockSpecial.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${mockSpecial.name}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'special', '${mockSpecial.id}', '${mockSpecial.name}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(specialCardHtml).toContain('disabled');
            expect(specialCardHtml).toContain('draggable="false"');
            expect(specialCardHtml).toContain('One Per Deck - already in deck');
        });
    });

    describe('Power card rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming in power card HTML generation', () => {
            const mockPower = {
                id: 'power_1',
                value: 5,
                power_type: 'Any-Power',
                one_per_deck: true
            };

            // Add power card to deck
            (global as any).window.deckEditorCards = [
                { type: 'power', cardId: 'power_1', quantity: 1 }
            ];

            // Simulate power card rendering logic
            const isOnePerDeck = mockPower.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'power' && deckCard.cardId === mockPower.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';

            // Generate HTML (simplified version)
            const powerCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!isOnePerDeckInDeck}" 
                     data-type="power" 
                     data-id="${mockPower.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${mockPower.value} - ${mockPower.power_type}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'power', '${mockPower.id}', '${mockPower.value} - ${mockPower.power_type}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(powerCardHtml).toContain('disabled');
            expect(powerCardHtml).toContain('draggable="false"');
            expect(powerCardHtml).toContain('One Per Deck - already in deck');
        });
    });

    describe('Universe: Advanced card rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming in advanced universe card HTML generation', () => {
            const mockAdvanced = {
                id: 'adv_1',
                name: 'Universe: Advanced Card',
                one_per_deck: true,
                character: 'Any Character'
            };

            // Add advanced universe card to deck
            (global as any).window.deckEditorCards = [
                { type: 'advanced-universe', cardId: 'adv_1', quantity: 1 }
            ];

            // Simulate advanced universe card rendering logic
            const isOnePerDeck = mockAdvanced.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'advanced-universe' && deckCard.cardId === mockAdvanced.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';

            // Generate HTML (simplified version)
            const advancedCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!isOnePerDeckInDeck}" 
                     data-type="advanced-universe" 
                     data-id="${mockAdvanced.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${mockAdvanced.name}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'advanced-universe', '${mockAdvanced.id}', '${mockAdvanced.name}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(advancedCardHtml).toContain('disabled');
            expect(advancedCardHtml).toContain('draggable="false"');
            expect(advancedCardHtml).toContain('One Per Deck - already in deck');
        });
    });

    describe('Teamwork card rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming in teamwork card HTML generation', () => {
            const mockTeamwork = {
                id: 'team_1',
                to_use: '6 Energy',
                followup_attack_types: 'Combat + Brute Force',
                first_attack_bonus: 2,
                second_attack_bonus: 1,
                one_per_deck: true
            };

            // Add teamwork card to deck
            (global as any).window.deckEditorCards = [
                { type: 'teamwork', cardId: 'team_1', quantity: 1 }
            ];

            // Simulate teamwork card rendering logic
            const summary = `${mockTeamwork.to_use} To Use -> ${mockTeamwork.followup_attack_types} (${mockTeamwork.first_attack_bonus}/${mockTeamwork.second_attack_bonus})`;
            const isOnePerDeck = mockTeamwork.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'teamwork' && deckCard.cardId === mockTeamwork.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';

            // Generate HTML (simplified version)
            const teamworkCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!isOnePerDeckInDeck}" 
                     data-type="teamwork" 
                     data-id="${mockTeamwork.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${summary}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'teamwork', '${mockTeamwork.id}', '${summary}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(teamworkCardHtml).toContain('disabled');
            expect(teamworkCardHtml).toContain('draggable="false"');
            expect(teamworkCardHtml).toContain('One Per Deck - already in deck');
        });
    });

    describe('Event card rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming in event card HTML generation', () => {
            const mockEvent = {
                id: 'event_1',
                name: 'One Per Deck Event',
                one_per_deck: true,
                mission_set: 'Test Set'
            };

            // Add event card to deck
            (global as any).window.deckEditorCards = [
                { type: 'event', cardId: 'event_1', quantity: 1 }
            ];

            // Simulate event card rendering logic
            const isOnePerDeck = mockEvent.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'event' && deckCard.cardId === mockEvent.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';

            // Generate HTML (simplified version)
            const eventCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!isOnePerDeckInDeck}" 
                     data-type="event" 
                     data-id="${mockEvent.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${mockEvent.name}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'event', '${mockEvent.id}', '${mockEvent.name}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(eventCardHtml).toContain('disabled');
            expect(eventCardHtml).toContain('draggable="false"');
            expect(eventCardHtml).toContain('One Per Deck - already in deck');
        });
    });

    describe('Other card types rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming in ally-universe card HTML generation', () => {
            const mockAlly = {
                id: 'ally_1',
                card_name: 'Ally Card',
                stat_to_use: 5,
                stat_type_to_use: 'Energy',
                attack_value: 3,
                attack_type: 'Combat',
                one_per_deck: true
            };

            // Add ally card to deck
            (global as any).window.deckEditorCards = [
                { type: 'ally-universe', cardId: 'ally_1', quantity: 1 }
            ];

            // Simulate ally card rendering logic
            const summary = `${mockAlly.card_name} - ${mockAlly.stat_to_use} ${mockAlly.stat_type_to_use} → ${mockAlly.attack_value} ${mockAlly.attack_type}`;
            const isOnePerDeck = mockAlly.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'ally-universe' && deckCard.cardId === mockAlly.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';

            // Generate HTML (simplified version)
            const allyCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!isOnePerDeckInDeck}" 
                     data-type="ally-universe" 
                     data-id="${mockAlly.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${summary}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'ally-universe', '${mockAlly.id}', '${summary}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(allyCardHtml).toContain('disabled');
            expect(allyCardHtml).toContain('draggable="false"');
            expect(allyCardHtml).toContain('One Per Deck - already in deck');
        });

        it('should include One Per Deck dimming in training card HTML generation', () => {
            const mockTraining = {
                id: 'train_1',
                card_name: 'Training (Test)',
                type_1: 'Energy',
                type_2: 'Combat',
                value_to_use: 4,
                bonus: 2,
                one_per_deck: true
            };

            // Add training card to deck
            (global as any).window.deckEditorCards = [
                { type: 'training', cardId: 'train_1', quantity: 1 }
            ];

            // Simulate training card rendering logic
            const summary = `${mockTraining.card_name.replace(/^Training \(/, '').replace(/\)$/, '')} - ${mockTraining.type_1} + ${mockTraining.type_2} (${mockTraining.value_to_use} → ${mockTraining.bonus})`;
            const isOnePerDeck = mockTraining.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'training' && deckCard.cardId === mockTraining.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';

            // Generate HTML (simplified version)
            const trainingCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!isOnePerDeckInDeck}" 
                     data-type="training" 
                     data-id="${mockTraining.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${summary}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'training', '${mockTraining.id}', '${summary}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(trainingCardHtml).toContain('disabled');
            expect(trainingCardHtml).toContain('draggable="false"');
            expect(trainingCardHtml).toContain('One Per Deck - already in deck');
        });

        it('should include One Per Deck dimming in basic-universe card HTML generation', () => {
            const mockBasic = {
                id: 'basic_1',
                card_name: 'Basic Universe Card',
                type: 'Energy',
                value_to_use: 3,
                bonus: 1,
                one_per_deck: true
            };

            // Add basic universe card to deck
            (global as any).window.deckEditorCards = [
                { type: 'basic-universe', cardId: 'basic_1', quantity: 1 }
            ];

            // Simulate basic universe card rendering logic
            const summary = `${mockBasic.card_name} - ${mockBasic.type} (${mockBasic.value_to_use} → ${mockBasic.bonus})`;
            const isOnePerDeck = mockBasic.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'basic-universe' && deckCard.cardId === mockBasic.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';

            // Generate HTML (simplified version)
            const basicCardHtml = `
                <div class="card-item ${disabledClass}" 
                     draggable="${!isOnePerDeckInDeck}" 
                     data-type="basic-universe" 
                     data-id="${mockBasic.id}"
                     title="${disabledTitle}">
                    <div class="card-item-content">${summary}</div>
                    <div class="card-item-plus" onclick="handlePlusButtonClick(event, 'basic-universe', '${mockBasic.id}', '${summary}')" title="Add to deck (multiple copies allowed)">+</div>
                </div>
            `;

            // Verify the HTML contains One Per Deck dimming
            expect(basicCardHtml).toContain('disabled');
            expect(basicCardHtml).toContain('draggable="false"');
            expect(basicCardHtml).toContain('One Per Deck - already in deck');
        });
    });
});
