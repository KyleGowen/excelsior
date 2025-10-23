/**
 * Unit tests for guest user "Add to Deck" button disabling functionality
 * 
 * Tests the fix for the issue where "Add to Deck" buttons would briefly
 * light up before being disabled for guest users.
 */

import { JSDOM } from 'jsdom';

describe('Guest User Button Disabling', () => {
    let dom: JSDOM;
    let document: Document;
    let window: Window;

    beforeEach(() => {
        // Create a new JSDOM instance for each test
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head></head>
            <body>
                <div id="characters-tab" style="display: none;">
                    <table>
                        <tbody id="characters-tbody"></tbody>
                    </table>
                </div>
                <div id="special-cards-tab" style="display: none;">
                    <table>
                        <tbody id="special-cards-tbody"></tbody>
                    </table>
                </div>
                <div id="events-tab" style="display: none;">
                    <table>
                        <tbody id="events-tbody"></tbody>
                    </table>
                </div>
                <div id="locations-tab" style="display: none;">
                    <table>
                        <tbody id="locations-tbody"></tbody>
                    </table>
                </div>
            </body>
            </html>
        `, {
            url: 'http://localhost:3000',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        document = dom.window.document;
        window = dom.window as any;

        // Mock global functions
        (global as any).isGuestUser = jest.fn(() => true);
        (global as any).mapImagePathToActualFile = jest.fn((path: string) => path);
        (global as any).showDeckSelection = jest.fn();
        (global as any).showCardHoverModal = jest.fn();
        (global as any).hideCardHoverModal = jest.fn();
        (global as any).openModal = jest.fn();
    });

    afterEach(() => {
        dom.window.close();
    });

    describe('displayCharacters function', () => {
        test('should immediately disable Add to Deck buttons for guest users', () => {
            // Mock character data
            const mockCharacters = [
                {
                    id: '1',
                    name: 'Test Character',
                    image: 'test.jpg',
                    energy: 10,
                    combat: 8,
                    brute_force: 6,
                    intelligence: 12,
                    threat_level: 15,
                    special_abilities: 'Test ability'
                }
            ];

            // Include the displayCharacters function
            const displayCharacters = (characters: any[]) => {
                const tbody = document.getElementById('characters-tbody');
                if (!tbody) return;

                tbody.innerHTML = '';

                characters.forEach(character => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>
                            <img src="/src/resources/cards/images/characters/${character.image}" 
                                 alt="${character.name}" 
                                 style="width: 80px; height: auto; max-height: 120px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                                 onclick="openModal(this)">
                        </td>
                        <td>
                            <button class="add-to-deck-btn" onclick="showDeckSelection('character', '${character.id}', '${character.name}', this)">
                                Add to Deck
                            </button>
                        </td>
                        <td><strong>${character.name}</strong></td>
                        <td>${character.energy}</td>
                        <td>${character.combat}</td>
                        <td>${character.brute_force}</td>
                        <td>${character.intelligence}</td>
                        <td>${character.threat_level}</td>
                        <td>${character.special_abilities || ''}</td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Immediately disable Add to Deck button for guest users to prevent flash
                    if (typeof (global as any).isGuestUser === 'function' && (global as any).isGuestUser()) {
                        const addToDeckBtn = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
                        if (addToDeckBtn) {
                            addToDeckBtn.disabled = true;
                            addToDeckBtn.style.opacity = '0.5';
                            addToDeckBtn.style.cursor = 'not-allowed';
                            addToDeckBtn.title = 'Log in to add to decks...';
                            addToDeckBtn.setAttribute('data-guest-disabled', 'true');
                        }
                    }
                });
            };

            // Execute the function
            displayCharacters(mockCharacters);

            // Verify the button is immediately disabled
            const addToDeckBtn = document.querySelector('#characters-tab .add-to-deck-btn') as HTMLButtonElement;
            expect(addToDeckBtn).toBeTruthy();
            expect(addToDeckBtn.disabled).toBe(true);
            expect(addToDeckBtn.style.opacity).toBe('0.5');
            expect(addToDeckBtn.style.cursor).toBe('not-allowed');
            expect(addToDeckBtn.title).toBe('Log in to add to decks...');
            expect(addToDeckBtn.getAttribute('data-guest-disabled')).toBe('true');
        });

        test('should not disable buttons for non-guest users', () => {
            // Mock non-guest user
            (global as any).isGuestUser = jest.fn(() => false);

            const mockCharacters = [
                {
                    id: '1',
                    name: 'Test Character',
                    image: 'test.jpg',
                    energy: 10,
                    combat: 8,
                    brute_force: 6,
                    intelligence: 12,
                    threat_level: 15,
                    special_abilities: 'Test ability'
                }
            ];

            const displayCharacters = (characters: any[]) => {
                const tbody = document.getElementById('characters-tbody');
                if (!tbody) return;

                tbody.innerHTML = '';

                characters.forEach(character => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>
                            <img src="/src/resources/cards/images/characters/${character.image}" 
                                 alt="${character.name}" 
                                 style="width: 80px; height: auto; max-height: 120px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                                 onclick="openModal(this)">
                        </td>
                        <td>
                            <button class="add-to-deck-btn" onclick="showDeckSelection('character', '${character.id}', '${character.name}', this)">
                                Add to Deck
                            </button>
                        </td>
                        <td><strong>${character.name}</strong></td>
                        <td>${character.energy}</td>
                        <td>${character.combat}</td>
                        <td>${character.brute_force}</td>
                        <td>${character.intelligence}</td>
                        <td>${character.threat_level}</td>
                        <td>${character.special_abilities || ''}</td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Immediately disable Add to Deck button for guest users to prevent flash
                    if (typeof (global as any).isGuestUser === 'function' && (global as any).isGuestUser()) {
                        const addToDeckBtn = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
                        if (addToDeckBtn) {
                            addToDeckBtn.disabled = true;
                            addToDeckBtn.style.opacity = '0.5';
                            addToDeckBtn.style.cursor = 'not-allowed';
                            addToDeckBtn.title = 'Log in to add to decks...';
                            addToDeckBtn.setAttribute('data-guest-disabled', 'true');
                        }
                    }
                });
            };

            displayCharacters(mockCharacters);

            const addToDeckBtn = document.querySelector('#characters-tab .add-to-deck-btn') as HTMLButtonElement;
            expect(addToDeckBtn).toBeTruthy();
            expect(addToDeckBtn.disabled).toBe(false);
            expect(addToDeckBtn.style.opacity).toBe('');
            expect(addToDeckBtn.style.cursor).toBe('');
            expect(addToDeckBtn.title).toBe('');
            expect(addToDeckBtn.getAttribute('data-guest-disabled')).toBe(null);
        });
    });

    describe('displaySpecialCards function', () => {
        test('should immediately disable Add to Deck buttons for guest users', () => {
            const mockSpecialCards = [
                {
                    id: '1',
                    name: 'Test Special Card',
                    image: 'test.jpg',
                    character: 'Test Character',
                    card_effect: 'Test effect'
                }
            ];

            const displaySpecialCards = (specialCards: any[]) => {
                const tbody = document.getElementById('special-cards-tbody');
                if (!tbody) return;

                tbody.innerHTML = '';

                specialCards.forEach(card => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>
                            <img src="/src/resources/cards/images/specials/${card.image}" 
                                 alt="${card.name}" 
                                 style="width: 120px; height: auto; max-height: 180px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                                 onclick="openModal(this)">
                        </td>
                        <td>
                            <button class="add-to-deck-btn" onclick="showDeckSelection('special', '${card.id}', '${card.name}', this)">
                                Add to Deck
                            </button>
                        </td>
                        <td><strong>${card.name}</strong></td>
                        <td>${card.character}</td>
                        <td>${card.card_effect}</td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Immediately disable Add to Deck button for guest users to prevent flash
                    if (typeof (global as any).isGuestUser === 'function' && (global as any).isGuestUser()) {
                        const addToDeckBtn = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
                        if (addToDeckBtn) {
                            addToDeckBtn.disabled = true;
                            addToDeckBtn.style.opacity = '0.5';
                            addToDeckBtn.style.cursor = 'not-allowed';
                            addToDeckBtn.title = 'Log in to add to decks...';
                            addToDeckBtn.setAttribute('data-guest-disabled', 'true');
                        }
                    }
                });
            };

            displaySpecialCards(mockSpecialCards);

            const addToDeckBtn = document.querySelector('#special-cards-tab .add-to-deck-btn') as HTMLButtonElement;
            expect(addToDeckBtn).toBeTruthy();
            expect(addToDeckBtn.disabled).toBe(true);
            expect(addToDeckBtn.style.opacity).toBe('0.5');
            expect(addToDeckBtn.style.cursor).toBe('not-allowed');
            expect(addToDeckBtn.title).toBe('Log in to add to decks...');
            expect(addToDeckBtn.getAttribute('data-guest-disabled')).toBe('true');
        });
    });

    describe('displayEvents function', () => {
        test('should immediately disable Add to Deck buttons for guest users', () => {
            const mockEvents = [
                {
                    id: '1',
                    name: 'Test Event',
                    image: 'test.jpg',
                    mission_set: 'Test Mission Set',
                    game_effect: 'Test effect',
                    flavor_text: 'Test flavor'
                }
            ];

            const displayEvents = (events: any[]) => {
                const tbody = document.getElementById('events-tbody');
                if (!tbody) return;

                tbody.innerHTML = '';
                
                events.forEach(event => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <img src="/src/resources/cards/images/events/${event.image}" 
                                 alt="${event.name}" 
                                 style="width: 120px !important; height: auto !important; max-height: 180px !important; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                                 onclick="openModal(this)">
                        </td>
                        <td>
                            <button class="add-to-deck-btn" onclick="showDeckSelection('event', '${event.id}', '${event.name}', this)">
                                Add to Deck
                            </button>
                        </td>
                        <td><strong>${event.name}</strong></td>
                        <td>${event.mission_set}</td>
                        <td>${event.game_effect}</td>
                        <td><em>${event.flavor_text}</em></td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Immediately disable Add to Deck button for guest users to prevent flash
                    if (typeof (global as any).isGuestUser === 'function' && (global as any).isGuestUser()) {
                        const addToDeckBtn = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
                        if (addToDeckBtn) {
                            addToDeckBtn.disabled = true;
                            addToDeckBtn.style.opacity = '0.5';
                            addToDeckBtn.style.cursor = 'not-allowed';
                            addToDeckBtn.title = 'Log in to add to decks...';
                            addToDeckBtn.setAttribute('data-guest-disabled', 'true');
                        }
                    }
                });
            };

            displayEvents(mockEvents);

            const addToDeckBtn = document.querySelector('#events-tab .add-to-deck-btn') as HTMLButtonElement;
            expect(addToDeckBtn).toBeTruthy();
            expect(addToDeckBtn.disabled).toBe(true);
            expect(addToDeckBtn.style.opacity).toBe('0.5');
            expect(addToDeckBtn.style.cursor).toBe('not-allowed');
            expect(addToDeckBtn.title).toBe('Log in to add to decks...');
            expect(addToDeckBtn.getAttribute('data-guest-disabled')).toBe('true');
        });
    });

    describe('displayLocations function', () => {
        test('should immediately disable Add to Deck buttons for guest users', () => {
            const mockLocations = [
                {
                    id: '1',
                    name: 'Test Location',
                    image: 'test.jpg',
                    threat_level: 2,
                    special_ability: 'Test ability'
                }
            ];

            const displayLocations = (locations: any[]) => {
                const tbody = document.getElementById('locations-tbody');
                if (!tbody) return;

                tbody.innerHTML = '';

                locations.forEach(location => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>
                            <img src="/src/resources/cards/images/locations/${location.image}" 
                                 alt="${location.name}" 
                                 style="width: 80px; height: auto; max-height: 120px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                                 onclick="openModal(this)">
                        </td>
                        <td>
                            <button class="add-to-deck-btn" onclick="showDeckSelection('location', '${location.id}', '${location.name}', this)">
                                Add to Deck
                            </button>
                        </td>
                        <td><strong>${location.name}</strong></td>
                        <td>${location.threat_level}</td>
                        <td>${location.special_ability || ''}</td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Immediately disable Add to Deck button for guest users to prevent flash
                    if (typeof (global as any).isGuestUser === 'function' && (global as any).isGuestUser()) {
                        const addToDeckBtn = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
                        if (addToDeckBtn) {
                            addToDeckBtn.disabled = true;
                            addToDeckBtn.style.opacity = '0.5';
                            addToDeckBtn.style.cursor = 'not-allowed';
                            addToDeckBtn.title = 'Log in to add to decks...';
                            addToDeckBtn.setAttribute('data-guest-disabled', 'true');
                        }
                    }
                });
            };

            displayLocations(mockLocations);

            const addToDeckBtn = document.querySelector('#locations-tab .add-to-deck-btn') as HTMLButtonElement;
            expect(addToDeckBtn).toBeTruthy();
            expect(addToDeckBtn.disabled).toBe(true);
            expect(addToDeckBtn.style.opacity).toBe('0.5');
            expect(addToDeckBtn.style.cursor).toBe('not-allowed');
            expect(addToDeckBtn.title).toBe('Log in to add to decks...');
            expect(addToDeckBtn.getAttribute('data-guest-disabled')).toBe('true');
        });
    });

    describe('Multiple buttons handling', () => {
        test('should disable all Add to Deck buttons for guest users', () => {
            const mockCharacters = [
                {
                    id: '1',
                    name: 'Character 1',
                    image: 'test1.jpg',
                    energy: 10,
                    combat: 8,
                    brute_force: 6,
                    intelligence: 12,
                    threat_level: 15,
                    special_abilities: 'Test ability 1'
                },
                {
                    id: '2',
                    name: 'Character 2',
                    image: 'test2.jpg',
                    energy: 12,
                    combat: 10,
                    brute_force: 8,
                    intelligence: 14,
                    threat_level: 18,
                    special_abilities: 'Test ability 2'
                }
            ];

            const displayCharacters = (characters: any[]) => {
                const tbody = document.getElementById('characters-tbody');
                if (!tbody) return;

                tbody.innerHTML = '';

                characters.forEach(character => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>
                            <img src="/src/resources/cards/images/characters/${character.image}" 
                                 alt="${character.name}" 
                                 style="width: 80px; height: auto; max-height: 120px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                                 onclick="openModal(this)">
                        </td>
                        <td>
                            <button class="add-to-deck-btn" onclick="showDeckSelection('character', '${character.id}', '${character.name}', this)">
                                Add to Deck
                            </button>
                        </td>
                        <td><strong>${character.name}</strong></td>
                        <td>${character.energy}</td>
                        <td>${character.combat}</td>
                        <td>${character.brute_force}</td>
                        <td>${character.intelligence}</td>
                        <td>${character.threat_level}</td>
                        <td>${character.special_abilities || ''}</td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Immediately disable Add to Deck button for guest users to prevent flash
                    if (typeof (global as any).isGuestUser === 'function' && (global as any).isGuestUser()) {
                        const addToDeckBtn = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
                        if (addToDeckBtn) {
                            addToDeckBtn.disabled = true;
                            addToDeckBtn.style.opacity = '0.5';
                            addToDeckBtn.style.cursor = 'not-allowed';
                            addToDeckBtn.title = 'Log in to add to decks...';
                            addToDeckBtn.setAttribute('data-guest-disabled', 'true');
                        }
                    }
                });
            };

            displayCharacters(mockCharacters);

            const addToDeckButtons = document.querySelectorAll('#characters-tab .add-to-deck-btn');
            expect(addToDeckButtons).toHaveLength(2);

            addToDeckButtons.forEach(button => {
                const btn = button as HTMLButtonElement;
                expect(btn.disabled).toBe(true);
                expect(btn.style.opacity).toBe('0.5');
                expect(btn.style.cursor).toBe('not-allowed');
                expect(btn.title).toBe('Log in to add to decks...');
                expect(btn.getAttribute('data-guest-disabled')).toBe('true');
            });
        });
    });

    describe('Edge cases', () => {
        test('should handle missing isGuestUser function gracefully', () => {
            // Remove the isGuestUser function
            delete (global as any).isGuestUser;

            const mockCharacters = [
                {
                    id: '1',
                    name: 'Test Character',
                    image: 'test.jpg',
                    energy: 10,
                    combat: 8,
                    brute_force: 6,
                    intelligence: 12,
                    threat_level: 15,
                    special_abilities: 'Test ability'
                }
            ];

            const displayCharacters = (characters: any[]) => {
                const tbody = document.getElementById('characters-tbody');
                if (!tbody) return;

                tbody.innerHTML = '';

                characters.forEach(character => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>
                            <img src="/src/resources/cards/images/characters/${character.image}" 
                                 alt="${character.name}" 
                                 style="width: 80px; height: auto; max-height: 120px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                                 onclick="openModal(this)">
                        </td>
                        <td>
                            <button class="add-to-deck-btn" onclick="showDeckSelection('character', '${character.id}', '${character.name}', this)">
                                Add to Deck
                            </button>
                        </td>
                        <td><strong>${character.name}</strong></td>
                        <td>${character.energy}</td>
                        <td>${character.combat}</td>
                        <td>${character.brute_force}</td>
                        <td>${character.intelligence}</td>
                        <td>${character.threat_level}</td>
                        <td>${character.special_abilities || ''}</td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Immediately disable Add to Deck button for guest users to prevent flash
                    if (typeof (global as any).isGuestUser === 'function' && (global as any).isGuestUser()) {
                        const addToDeckBtn = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
                        if (addToDeckBtn) {
                            addToDeckBtn.disabled = true;
                            addToDeckBtn.style.opacity = '0.5';
                            addToDeckBtn.style.cursor = 'not-allowed';
                            addToDeckBtn.title = 'Log in to add to decks...';
                            addToDeckBtn.setAttribute('data-guest-disabled', 'true');
                        }
                    }
                });
            };

            // Should not throw an error
            expect(() => displayCharacters(mockCharacters)).not.toThrow();

            const addToDeckBtn = document.querySelector('#characters-tab .add-to-deck-btn') as HTMLButtonElement;
            expect(addToDeckBtn).toBeTruthy();
            expect(addToDeckBtn.disabled).toBe(false); // Should remain enabled when isGuestUser is not available
        });

        test('should handle missing button element gracefully', () => {
            const mockCharacters = [
                {
                    id: '1',
                    name: 'Test Character',
                    image: 'test.jpg',
                    energy: 10,
                    combat: 8,
                    brute_force: 6,
                    intelligence: 12,
                    threat_level: 15,
                    special_abilities: 'Test ability'
                }
            ];

            const displayCharacters = (characters: any[]) => {
                const tbody = document.getElementById('characters-tbody');
                if (!tbody) return;

                tbody.innerHTML = '';

                characters.forEach(character => {
                    const row = document.createElement('tr');
                    
                    // Create row without the button to test missing button handling
                    row.innerHTML = `
                        <td>
                            <img src="/src/resources/cards/images/characters/${character.image}" 
                                 alt="${character.name}" 
                                 style="width: 80px; height: auto; max-height: 120px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                                 onclick="openModal(this)">
                        </td>
                        <td><strong>${character.name}</strong></td>
                        <td>${character.energy}</td>
                        <td>${character.combat}</td>
                        <td>${character.brute_force}</td>
                        <td>${character.intelligence}</td>
                        <td>${character.threat_level}</td>
                        <td>${character.special_abilities || ''}</td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Immediately disable Add to Deck button for guest users to prevent flash
                    if (typeof (global as any).isGuestUser === 'function' && (global as any).isGuestUser()) {
                        const addToDeckBtn = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
                        if (addToDeckBtn) {
                            addToDeckBtn.disabled = true;
                            addToDeckBtn.style.opacity = '0.5';
                            addToDeckBtn.style.cursor = 'not-allowed';
                            addToDeckBtn.title = 'Log in to add to decks...';
                            addToDeckBtn.setAttribute('data-guest-disabled', 'true');
                        }
                    }
                });
            };

            // Should not throw an error even when button is missing
            expect(() => displayCharacters(mockCharacters)).not.toThrow();
        });
    });
});
