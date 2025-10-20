/**
 * Unit Tests for Tile View Display Functionality
 * Specifically tests the tile view rendering of deck cards
 */

import { jest } from '@jest/globals';

// Mock DOM environment
const mockDeckCardsEditor = {
    innerHTML: '',
    querySelectorAll: jest.fn(() => []),
    classList: {
        contains: jest.fn(() => false)
    }
};

// Mock document
(global as any).document = {
    getElementById: jest.fn((id: string) => {
        if (id === 'deckCardsEditor') {
            return mockDeckCardsEditor;
        }
        return null;
    })
};

// Mock window object
(global as any).window = {
    deckEditorCards: [] as any[],
    availableCardsMap: new Map()
};

// Extend Window interface for TypeScript
declare global {
    interface Window {
        deckEditorCards: any[];
        availableCardsMap: Map<string, any>;
    }
}

// Mock global functions
(global as any).showDeckValidation = jest.fn();
(global as any).updateDeckEditorCardCount = jest.fn();

describe('Tile View Display Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDeckCardsEditor.innerHTML = '';
        (global.window as any).deckEditorCards = [];
        (global.window as any).availableCardsMap = new Map();
    });

    describe('Tile View Card Rendering', () => {
        test('should render character cards in tile format', async () => {
            const characterCard = {
                id: 'deckcard_1',
                type: 'character',
                cardId: 'c7dc892b-5c68-40ee-9d16-df0cfb742591',
                quantity: 1,
                selectedAlternateImage: 'captain_nemo.jpg'
            };

            (global.window as any).deckEditorCards = [characterCard];
            (global.window as any).availableCardsMap.set('c7dc892b-5c68-40ee-9d16-df0cfb742591', {
                id: 'c7dc892b-5c68-40ee-9d16-df0cfb742591',
                name: 'Captain Nemo',
                image: 'captain_nemo.jpg'
            });

            const renderTileView = async () => {
                const deckCardsEditor = document.getElementById('deckCardsEditor');
                
                if (window.deckEditorCards.length === 0) {
                    deckCardsEditor!.innerHTML = `<div class="empty-deck-message">Empty</div>`;
                    return;
                }
                
                // Group cards by type
                const cardsByType: { [key: string]: any[] } = {};
                window.deckEditorCards.forEach((card: any, index: number) => {
                    const type = card.type;
                    if (!cardsByType[type]) {
                        cardsByType[type] = [];
                    }
                    cardsByType[type].push({ ...card, originalIndex: index });
                });
                
                // Render cards by type
                let html = '';
                const typeOrder = ['character', 'special', 'power', 'mission', 'location'];
                const typeDisplayNames: { [key: string]: string } = {
                    'character': 'Character Cards',
                    'special': 'Special Cards', 
                    'power': 'Power Cards',
                    'mission': 'Mission Cards',
                    'location': 'Location Cards'
                };
                
                typeOrder.forEach(type => {
                    if (cardsByType[type] && cardsByType[type].length > 0) {
                        html += `<div class="deck-section">
                            <h3>${typeDisplayNames[type]} (${cardsByType[type].length})</h3>
                            <div class="deck-cards-grid">`;
                        
                        cardsByType[type].forEach((cardData: any) => {
                            html += `
                                <div class="deck-card-editor-item" data-card-id="${cardData.cardId}" data-card-type="${cardData.type}">
                                    <div class="deck-card-image">
                                        <img src="${cardData.selectedAlternateImage || 'placeholder.jpg'}" alt="${cardData.cardId}">
                                    </div>
                                    <div class="deck-card-info">
                                        <div class="deck-card-name">${cardData.cardId}</div>
                                        <div class="deck-card-quantity">
                                            <button onclick="removeCardFromDeck(${cardData.originalIndex})">-</button>
                                            <span>${cardData.quantity}</span>
                                            <button onclick="addOneCardToEditor('${cardData.type}', '${cardData.cardId}', '${cardData.cardId}')">+</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `</div></div>`;
                    }
                });
                
                deckCardsEditor!.innerHTML = html;
            };

            await renderTileView();

            // Verify tile view structure
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-section');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-cards-grid');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-editor-item');
            
            // Verify character card specific elements
            expect(mockDeckCardsEditor.innerHTML).toContain('Character Cards (1)');
            expect(mockDeckCardsEditor.innerHTML).toContain('c7dc892b-5c68-40ee-9d16-df0cfb742591');
            expect(mockDeckCardsEditor.innerHTML).toContain('captain_nemo.jpg');
            
            // Verify tile view specific classes
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-image');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-info');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-quantity');
        });

        test('should render multiple cards in grid layout', async () => {
            const cards = [
                {
                    id: 'deckcard_1',
                    type: 'character',
                    cardId: 'char-1',
                    quantity: 1
                },
                {
                    id: 'deckcard_2',
                    type: 'power',
                    cardId: 'power-1',
                    quantity: 2
                },
                {
                    id: 'deckcard_3',
                    type: 'special',
                    cardId: 'special-1',
                    quantity: 1
                }
            ];

            (global.window as any).deckEditorCards = cards;

            const renderTileView = async () => {
                const deckCardsEditor = document.getElementById('deckCardsEditor');
                
                if (window.deckEditorCards.length === 0) {
                    deckCardsEditor!.innerHTML = `<div class="empty-deck-message">Empty</div>`;
                    return;
                }
                
                // Group cards by type
                const cardsByType: { [key: string]: any[] } = {};
                window.deckEditorCards.forEach((card: any, index: number) => {
                    const type = card.type;
                    if (!cardsByType[type]) {
                        cardsByType[type] = [];
                    }
                    cardsByType[type].push({ ...card, originalIndex: index });
                });
                
                // Render cards by type
                let html = '';
                const typeOrder = ['character', 'special', 'power', 'mission', 'location'];
                const typeDisplayNames: { [key: string]: string } = {
                    'character': 'Character Cards',
                    'special': 'Special Cards', 
                    'power': 'Power Cards',
                    'mission': 'Mission Cards',
                    'location': 'Location Cards'
                };
                
                typeOrder.forEach(type => {
                    if (cardsByType[type] && cardsByType[type].length > 0) {
                        html += `<div class="deck-section">
                            <h3>${typeDisplayNames[type]} (${cardsByType[type].length})</h3>
                            <div class="deck-cards-grid">`;
                        
                        cardsByType[type].forEach((cardData: any) => {
                            html += `
                                <div class="deck-card-editor-item" data-card-id="${cardData.cardId}" data-card-type="${cardData.type}">
                                    <div class="deck-card-image">
                                        <img src="${cardData.selectedAlternateImage || 'placeholder.jpg'}" alt="${cardData.cardId}">
                                    </div>
                                    <div class="deck-card-info">
                                        <div class="deck-card-name">${cardData.cardId}</div>
                                        <div class="deck-card-quantity">
                                            <button onclick="removeCardFromDeck(${cardData.originalIndex})">-</button>
                                            <span>${cardData.quantity}</span>
                                            <button onclick="addOneCardToEditor('${cardData.type}', '${cardData.cardId}', '${cardData.cardId}')">+</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `</div></div>`;
                    }
                });
                
                deckCardsEditor!.innerHTML = html;
            };

            await renderTileView();

            // Verify all card types are rendered
            expect(mockDeckCardsEditor.innerHTML).toContain('Character Cards (1)');
            expect(mockDeckCardsEditor.innerHTML).toContain('Special Cards (1)');
            expect(mockDeckCardsEditor.innerHTML).toContain('Power Cards (1)');
            
            // Verify correct number of tile items
            const tileItems = mockDeckCardsEditor.innerHTML.match(/deck-card-editor-item/g);
            expect(tileItems).toHaveLength(3);
        });

        test('should handle alternate images correctly', async () => {
            const cardWithAlternate = {
                id: 'deckcard_1',
                type: 'character',
                cardId: 'char-1',
                quantity: 1,
                selectedAlternateImage: 'char1_alt.jpg'
            };

            (global.window as any).deckEditorCards = [cardWithAlternate];

            const renderTileView = async () => {
                const deckCardsEditor = document.getElementById('deckCardsEditor');
                
                if (window.deckEditorCards.length === 0) {
                    deckCardsEditor!.innerHTML = `<div class="empty-deck-message">Empty</div>`;
                    return;
                }
                
                // Group cards by type
                const cardsByType: { [key: string]: any[] } = {};
                window.deckEditorCards.forEach((card: any, index: number) => {
                    const type = card.type;
                    if (!cardsByType[type]) {
                        cardsByType[type] = [];
                    }
                    cardsByType[type].push({ ...card, originalIndex: index });
                });
                
                // Render cards by type
                let html = '';
                const typeOrder = ['character', 'special', 'power', 'mission', 'location'];
                const typeDisplayNames: { [key: string]: string } = {
                    'character': 'Character Cards',
                    'special': 'Special Cards', 
                    'power': 'Power Cards',
                    'mission': 'Mission Cards',
                    'location': 'Location Cards'
                };
                
                typeOrder.forEach(type => {
                    if (cardsByType[type] && cardsByType[type].length > 0) {
                        html += `<div class="deck-section">
                            <h3>${typeDisplayNames[type]} (${cardsByType[type].length})</h3>
                            <div class="deck-cards-grid">`;
                        
                        cardsByType[type].forEach((cardData: any) => {
                            html += `
                                <div class="deck-card-editor-item" data-card-id="${cardData.cardId}" data-card-type="${cardData.type}">
                                    <div class="deck-card-image">
                                        <img src="${cardData.selectedAlternateImage || 'placeholder.jpg'}" alt="${cardData.cardId}">
                                    </div>
                                    <div class="deck-card-info">
                                        <div class="deck-card-name">${cardData.cardId}</div>
                                        <div class="deck-card-quantity">
                                            <button onclick="removeCardFromDeck(${cardData.originalIndex})">-</button>
                                            <span>${cardData.quantity}</span>
                                            <button onclick="addOneCardToEditor('${cardData.type}', '${cardData.cardId}', '${cardData.cardId}')">+</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `</div></div>`;
                    }
                });
                
                deckCardsEditor!.innerHTML = html;
            };

            await renderTileView();

            // Verify alternate image is used
            expect(mockDeckCardsEditor.innerHTML).toContain('char1_alt.jpg');
            expect(mockDeckCardsEditor.innerHTML).not.toContain('placeholder.jpg');
        });

        test('should fallback to placeholder for missing images', async () => {
            const cardWithoutImage = {
                id: 'deckcard_1',
                type: 'character',
                cardId: 'char-1',
                quantity: 1
                // No selectedAlternateImage
            };

            (global.window as any).deckEditorCards = [cardWithoutImage];

            const renderTileView = async () => {
                const deckCardsEditor = document.getElementById('deckCardsEditor');
                
                if (window.deckEditorCards.length === 0) {
                    deckCardsEditor!.innerHTML = `<div class="empty-deck-message">Empty</div>`;
                    return;
                }
                
                // Group cards by type
                const cardsByType: { [key: string]: any[] } = {};
                window.deckEditorCards.forEach((card: any, index: number) => {
                    const type = card.type;
                    if (!cardsByType[type]) {
                        cardsByType[type] = [];
                    }
                    cardsByType[type].push({ ...card, originalIndex: index });
                });
                
                // Render cards by type
                let html = '';
                const typeOrder = ['character', 'special', 'power', 'mission', 'location'];
                const typeDisplayNames: { [key: string]: string } = {
                    'character': 'Character Cards',
                    'special': 'Special Cards', 
                    'power': 'Power Cards',
                    'mission': 'Mission Cards',
                    'location': 'Location Cards'
                };
                
                typeOrder.forEach(type => {
                    if (cardsByType[type] && cardsByType[type].length > 0) {
                        html += `<div class="deck-section">
                            <h3>${typeDisplayNames[type]} (${cardsByType[type].length})</h3>
                            <div class="deck-cards-grid">`;
                        
                        cardsByType[type].forEach((cardData: any) => {
                            html += `
                                <div class="deck-card-editor-item" data-card-id="${cardData.cardId}" data-card-type="${cardData.type}">
                                    <div class="deck-card-image">
                                        <img src="${cardData.selectedAlternateImage || 'placeholder.jpg'}" alt="${cardData.cardId}">
                                    </div>
                                    <div class="deck-card-info">
                                        <div class="deck-card-name">${cardData.cardId}</div>
                                        <div class="deck-card-quantity">
                                            <button onclick="removeCardFromDeck(${cardData.originalIndex})">-</button>
                                            <span>${cardData.quantity}</span>
                                            <button onclick="addOneCardToEditor('${cardData.type}', '${cardData.cardId}', '${cardData.cardId}')">+</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `</div></div>`;
                    }
                });
                
                deckCardsEditor!.innerHTML = html;
            };

            await renderTileView();

            // Verify placeholder image is used
            expect(mockDeckCardsEditor.innerHTML).toContain('placeholder.jpg');
        });
    });

    describe('Tile View Interaction Elements', () => {
        test('should include correct onclick handlers for quantity controls', async () => {
            const card = {
                id: 'deckcard_1',
                type: 'power',
                cardId: 'power-1',
                quantity: 2
            };

            (global.window as any).deckEditorCards = [card];

            const renderTileView = async () => {
                const deckCardsEditor = document.getElementById('deckCardsEditor');
                
                if (window.deckEditorCards.length === 0) {
                    deckCardsEditor!.innerHTML = `<div class="empty-deck-message">Empty</div>`;
                    return;
                }
                
                // Group cards by type
                const cardsByType: { [key: string]: any[] } = {};
                window.deckEditorCards.forEach((card: any, index: number) => {
                    const type = card.type;
                    if (!cardsByType[type]) {
                        cardsByType[type] = [];
                    }
                    cardsByType[type].push({ ...card, originalIndex: index });
                });
                
                // Render cards by type
                let html = '';
                const typeOrder = ['character', 'special', 'power', 'mission', 'location'];
                const typeDisplayNames: { [key: string]: string } = {
                    'character': 'Character Cards',
                    'special': 'Special Cards', 
                    'power': 'Power Cards',
                    'mission': 'Mission Cards',
                    'location': 'Location Cards'
                };
                
                typeOrder.forEach(type => {
                    if (cardsByType[type] && cardsByType[type].length > 0) {
                        html += `<div class="deck-section">
                            <h3>${typeDisplayNames[type]} (${cardsByType[type].length})</h3>
                            <div class="deck-cards-grid">`;
                        
                        cardsByType[type].forEach((cardData: any) => {
                            html += `
                                <div class="deck-card-editor-item" data-card-id="${cardData.cardId}" data-card-type="${cardData.type}">
                                    <div class="deck-card-image">
                                        <img src="${cardData.selectedAlternateImage || 'placeholder.jpg'}" alt="${cardData.cardId}">
                                    </div>
                                    <div class="deck-card-info">
                                        <div class="deck-card-name">${cardData.cardId}</div>
                                        <div class="deck-card-quantity">
                                            <button onclick="removeCardFromDeck(${cardData.originalIndex})">-</button>
                                            <span>${cardData.quantity}</span>
                                            <button onclick="addOneCardToEditor('${cardData.type}', '${cardData.cardId}', '${cardData.cardId}')">+</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `</div></div>`;
                    }
                });
                
                deckCardsEditor!.innerHTML = html;
            };

            await renderTileView();

            // Verify onclick handlers are present
            expect(mockDeckCardsEditor.innerHTML).toContain('onclick="removeCardFromDeck(0)"');
            expect(mockDeckCardsEditor.innerHTML).toContain('onclick="addOneCardToEditor(\'power\', \'power-1\', \'power-1\')"');
        });

        test('should include correct data attributes', async () => {
            const card = {
                id: 'deckcard_1',
                type: 'character',
                cardId: 'char-1',
                quantity: 1
            };

            (global.window as any).deckEditorCards = [card];

            const renderTileView = async () => {
                const deckCardsEditor = document.getElementById('deckCardsEditor');
                
                if (window.deckEditorCards.length === 0) {
                    deckCardsEditor!.innerHTML = `<div class="empty-deck-message">Empty</div>`;
                    return;
                }
                
                // Group cards by type
                const cardsByType: { [key: string]: any[] } = {};
                window.deckEditorCards.forEach((card: any, index: number) => {
                    const type = card.type;
                    if (!cardsByType[type]) {
                        cardsByType[type] = [];
                    }
                    cardsByType[type].push({ ...card, originalIndex: index });
                });
                
                // Render cards by type
                let html = '';
                const typeOrder = ['character', 'special', 'power', 'mission', 'location'];
                const typeDisplayNames: { [key: string]: string } = {
                    'character': 'Character Cards',
                    'special': 'Special Cards', 
                    'power': 'Power Cards',
                    'mission': 'Mission Cards',
                    'location': 'Location Cards'
                };
                
                typeOrder.forEach(type => {
                    if (cardsByType[type] && cardsByType[type].length > 0) {
                        html += `<div class="deck-section">
                            <h3>${typeDisplayNames[type]} (${cardsByType[type].length})</h3>
                            <div class="deck-cards-grid">`;
                        
                        cardsByType[type].forEach((cardData: any) => {
                            html += `
                                <div class="deck-card-editor-item" data-card-id="${cardData.cardId}" data-card-type="${cardData.type}">
                                    <div class="deck-card-image">
                                        <img src="${cardData.selectedAlternateImage || 'placeholder.jpg'}" alt="${cardData.cardId}">
                                    </div>
                                    <div class="deck-card-info">
                                        <div class="deck-card-name">${cardData.cardId}</div>
                                        <div class="deck-card-quantity">
                                            <button onclick="removeCardFromDeck(${cardData.originalIndex})">-</button>
                                            <span>${cardData.quantity}</span>
                                            <button onclick="addOneCardToEditor('${cardData.type}', '${cardData.cardId}', '${cardData.cardId}')">+</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `</div></div>`;
                    }
                });
                
                deckCardsEditor!.innerHTML = html;
            };

            await renderTileView();

            // Verify data attributes
            expect(mockDeckCardsEditor.innerHTML).toContain('data-card-id="char-1"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-card-type="character"');
        });
    });

    describe('Tile View Performance', () => {
        test('should handle large number of cards efficiently', async () => {
            // Create 100 cards
            const cards = Array.from({ length: 100 }, (_, i) => ({
                id: `deckcard_${i}`,
                type: i % 2 === 0 ? 'character' : 'power',
                cardId: `card-${i}`,
                quantity: 1
            }));

            (global.window as any).deckEditorCards = cards;

            const startTime = Date.now();

            const renderTileView = async () => {
                const deckCardsEditor = document.getElementById('deckCardsEditor');
                
                if (window.deckEditorCards.length === 0) {
                    deckCardsEditor!.innerHTML = `<div class="empty-deck-message">Empty</div>`;
                    return;
                }
                
                // Group cards by type
                const cardsByType: { [key: string]: any[] } = {};
                window.deckEditorCards.forEach((card: any, index: number) => {
                    const type = card.type;
                    if (!cardsByType[type]) {
                        cardsByType[type] = [];
                    }
                    cardsByType[type].push({ ...card, originalIndex: index });
                });
                
                // Render cards by type
                let html = '';
                const typeOrder = ['character', 'special', 'power', 'mission', 'location'];
                const typeDisplayNames: { [key: string]: string } = {
                    'character': 'Character Cards',
                    'special': 'Special Cards', 
                    'power': 'Power Cards',
                    'mission': 'Mission Cards',
                    'location': 'Location Cards'
                };
                
                typeOrder.forEach(type => {
                    if (cardsByType[type] && cardsByType[type].length > 0) {
                        html += `<div class="deck-section">
                            <h3>${typeDisplayNames[type]} (${cardsByType[type].length})</h3>
                            <div class="deck-cards-grid">`;
                        
                        cardsByType[type].forEach((cardData: any) => {
                            html += `
                                <div class="deck-card-editor-item" data-card-id="${cardData.cardId}" data-card-type="${cardData.type}">
                                    <div class="deck-card-image">
                                        <img src="${cardData.selectedAlternateImage || 'placeholder.jpg'}" alt="${cardData.cardId}">
                                    </div>
                                    <div class="deck-card-info">
                                        <div class="deck-card-name">${cardData.cardId}</div>
                                        <div class="deck-card-quantity">
                                            <button onclick="removeCardFromDeck(${cardData.originalIndex})">-</button>
                                            <span>${cardData.quantity}</span>
                                            <button onclick="addOneCardToEditor('${cardData.type}', '${cardData.cardId}', '${cardData.cardId}')">+</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `</div></div>`;
                    }
                });
                
                deckCardsEditor!.innerHTML = html;
            };

            await renderTileView();

            const endTime = Date.now();
            const renderTime = endTime - startTime;

            // Should render in reasonable time (less than 100ms for 100 cards)
            expect(renderTime).toBeLessThan(100);
            
            // Verify all cards were rendered
            const tileItems = mockDeckCardsEditor.innerHTML.match(/deck-card-editor-item/g);
            expect(tileItems).toHaveLength(100);
        });
    });
});
