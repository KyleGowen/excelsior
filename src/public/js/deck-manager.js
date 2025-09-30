// Deck management module
class DeckManager {
    constructor() {
        this.currentDeck = null;
        this.deckCards = [];
        this.availableCards = new Map();
        this.currentUser = null;
    }

    // Initialize the deck manager
    async initialize() {
        await this.loadUserData();
        await this.loadCurrentDeck();
        await this.loadAvailableCards();
    }

    // Load current user data
    async loadUserData() {
        try {
            const result = await API.getUsers();
            if (result.success && result.data.length > 0) {
                this.currentUser = result.data[0]; // For now, use first user
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Load current deck from URL
    async loadCurrentDeck() {
        const pathParts = window.location.pathname.split('/');
        const deckId = pathParts[pathParts.length - 1];
        
        if (deckId && deckId !== 'new') {
            try {
                const result = await API.getDeck(deckId);
                if (result.success) {
                    this.currentDeck = result.data;
                    this.deckCards = result.data.cards || [];
                    
                    // Debug UI state
                    if (this.currentDeck.metadata.uiState && this.currentDeck.metadata.uiState.expansionState) {
                    }
                }
            } catch (error) {
                console.error('Error loading deck:', error);
                this.showNotification('Failed to load deck', 'error');
            }
        } else {
            // New deck
            this.currentDeck = {
                metadata: {
                    id: null,
                    name: 'New Deck',
                    description: '',
                    userId: this.currentUser?.userId || 'unknown',
                    createdAt: new Date().toISOString()
                },
                cards: []
            };
            this.deckCards = [];
        }
    }

    // Load all available cards
    async loadAvailableCards() {
        try {
            const cardTypes = [
                'characters', 'locations', 'special-cards', 'missions', 'events',
                'aspects', 'advanced-universe', 'teamwork', 'ally-universe',
                'training', 'basic-universe', 'power-cards'
            ];

            const promises = cardTypes.map(type => {
                const methodName = `get${type.charAt(0).toUpperCase() + type.slice(1).replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())}`;
                return API[methodName]();
            });
            const results = await Promise.all(promises);

            cardTypes.forEach((type, index) => {
                if (results[index] && results[index].success && type) {
                    const normalizedType = type.replace('-cards', '').replace('-', '_');
                    this.availableCards.set(normalizedType, results[index].data);
                }
            });

        } catch (error) {
            console.error('Error loading available cards:', error);
        }
    }

    // Add card to deck
    async addCardToDeck(cardType, cardId, cardName, selectedAlternateImage = null) {
        console.log('🔍 addCardToDeck called:', { cardType, cardId, cardName, selectedAlternateImage });
        
        // Check limits
        if (cardType === 'character' && this.getCharacterCount() >= 4) {
            this.showNotification('Cannot add more than 4 characters to a deck', 'error');
            return;
        }

        if (cardType === 'mission' && this.getMissionCount() >= 7) {
            this.showNotification('Cannot add more than 7 missions to a deck', 'error');
            return;
        }

        // Check if card already exists
        const existingCardIndex = this.deckCards.findIndex(card => 
            card.type === cardType && card.cardId === cardId
        );

        if (existingCardIndex >= 0) {
            // Increase quantity
            this.deckCards[existingCardIndex].quantity += 1;
            if (selectedAlternateImage && cardType === 'character') {
                this.deckCards[existingCardIndex].selectedAlternateImage = selectedAlternateImage;
            }
        } else {
            // Add new card
            const newCard = {
                id: `deckcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: cardType,
                cardId: cardId,
                quantity: 1
            };
            
            if (selectedAlternateImage && cardType === 'character') {
                newCard.selectedAlternateImage = selectedAlternateImage;
            }
            
            this.deckCards.push(newCard);
        }

        // Save to server if we have a deck ID
        if (this.currentDeck && this.currentDeck.metadata.id) {
            try {
                const cardData = {
                    cardType: cardType,
                    cardId: cardId,
                    quantity: 1,
                    selectedAlternateImage: selectedAlternateImage
                };
                
                console.log('🔍 Calling API.addCardToDeck with:', { deckId: this.currentDeck.metadata.id, cardData });
                await API.addCardToDeck(this.currentDeck.metadata.id, cardData);
                console.log('✅ API.addCardToDeck successful');
                this.showNotification(`Added ${cardName} to deck`, 'success');
            } catch (error) {
                console.error('❌ Error adding card to deck:', error);
                this.showNotification('Failed to add card to deck', 'error');
                // Revert local changes
                if (existingCardIndex >= 0) {
                    this.deckCards[existingCardIndex].quantity -= 1;
                } else {
                    this.deckCards.pop();
                }
                return;
            }
        }

        this.updateDeckDisplay();
        this.updateDeckStats();
        
        // Ensure layout is maintained after card removal
        if (window.deckEditor && window.deckEditor.ensureTwoColumnLayout) {
            window.deckEditor.ensureTwoColumnLayout();
        }
    }

    // Remove card from deck
    async removeCardFromDeck(cardId) {
        console.log('🔍 DEBUG: removeCardFromDeck called with cardId:', cardId);
        console.log('🔍 DEBUG: Current deckCards before removal:', this.deckCards.length);
        console.log('🔍 DEBUG: Current window width:', window.innerWidth);
        console.log('🔍 DEBUG: Current deckbuilder-container classes:', document.querySelector('.deckbuilder-container')?.className);
        
        const cardIndex = this.deckCards.findIndex(card => card.id === cardId);
        if (cardIndex >= 0) {
            const removedCard = this.deckCards[cardIndex];
            console.log('🔍 DEBUG: Removing card:', removedCard);
            this.deckCards.splice(cardIndex, 1);
            console.log('🔍 DEBUG: DeckCards after removal:', this.deckCards.length);
            
            this.updateDeckDisplay();
            this.updateDeckStats();
            
            // Ensure layout is maintained after card removal
            if (window.deckEditor && window.deckEditor.ensureTwoColumnLayout) {
                window.deckEditor.ensureTwoColumnLayout();
            }
            
            // Check layout after update
            setTimeout(() => {
                console.log('🔍 DEBUG: After update - window width:', window.innerWidth);
                console.log('🔍 DEBUG: After update - deckbuilder-container classes:', document.querySelector('.deckbuilder-container')?.className);
                console.log('🔍 DEBUG: After update - deckbuilder-container computed style:', window.getComputedStyle(document.querySelector('.deckbuilder-container')).gridTemplateColumns);
            }, 100);
        }
    }

    // Update card quantity
    async updateCardQuantity(cardId, newQuantity) {
        const card = this.deckCards.find(card => card.id === cardId);
        if (card) {
            if (newQuantity <= 0) {
                await this.removeCardFromDeck(cardId);
            } else {
                card.quantity = newQuantity;
                this.updateDeckDisplay();
                this.updateDeckStats();
            }
        }
    }

    // Save deck changes
    async saveDeckChanges() {
        if (!this.currentDeck) return;

        try {
            // Update card count
            this.currentDeck.metadata.cardCount = this.getTotalCardCount();
            this.currentDeck.metadata.lastModified = new Date().toISOString();
            
            // Include UI state in the save
            const deckData = {
                name: this.currentDeck.metadata.name,
                description: this.currentDeck.metadata.description,
                cards: this.deckCards,
                uiState: this.currentDeck.metadata.uiState
            };

            // Debug logging
            if (this.currentDeck.metadata.uiState && this.currentDeck.metadata.uiState.expansionState) {
            }

            if (this.currentDeck.metadata.id) {
                // Update existing deck
                await API.updateDeck(this.currentDeck.metadata.id, deckData);
            } else {
                // Create new deck
                const result = await API.createDeck(deckData);
                
                if (result.success) {
                    this.currentDeck = result.data;
                    // Update URL to reflect new deck ID
                    const newUrl = `/users/${this.currentUser.userId}/decks/${result.data.metadata.id}`;
                    window.history.replaceState({}, '', newUrl);
                }
            }

            this.showNotification('Deck saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving deck:', error);
            this.showNotification('Failed to save deck', 'error');
        }
    }

    // Get card count by type
    getCardCountByType(type) {
        return this.deckCards
            .filter(card => card.type === type)
            .reduce((total, card) => total + card.quantity, 0);
    }

    // Get character count
    getCharacterCount() {
        return this.getCardCountByType('character');
    }

    // Get mission count
    getMissionCount() {
        return this.getCardCountByType('mission');
    }

    // Get total card count
    getTotalCardCount() {
        return this.deckCards.reduce((total, card) => total + card.quantity, 0);
    }

    // Update deck display
    updateDeckDisplay() {
        // This will be implemented by the deck editor
        if (window.deckEditor) {
            window.deckEditor.updateDeckDisplay();
        }
    }

    // Update deck stats
    updateDeckStats() {
        // This will be implemented by the deck editor
        if (window.deckEditor) {
            window.deckEditor.updateDeckStats();
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Get available cards by type
    getAvailableCardsByType(type) {
        return this.availableCards.get(type) || [];
    }

    // Get card by ID and type
    getCardById(type, cardId) {
        const cards = this.getAvailableCardsByType(type);
        return cards.find(card => card.id === cardId);
    }
}

// Export for use in other modules
window.DeckManager = DeckManager;
