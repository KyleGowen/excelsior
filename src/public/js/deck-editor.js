// Main deck editor module
class DeckEditor {
    constructor() {
        this.deckManager = new DeckManager();
        this.cardBrowser = null;
        this.dragDrop = null;
        this.isInitialized = false;
    }

    // Initialize the deck editor
    async initialize() {
        try {
            await this.deckManager.initialize();
            
            // Initialize other modules
            this.cardBrowser = new CardBrowser(this.deckManager);
            this.dragDrop = new DragDrop(this.deckManager);
            
            // Setup UI
            this.setupEventListeners();
            this.ensureTwoColumnLayout(); // Ensure 2-column layout is maintained
            this.updateDeckTitle();
            this.updateDeckDisplay();
            this.restoreSectionStates(); // Restore saved collapse states
            this.updateDeckStats();
            
            // Initialize other modules
            await this.cardBrowser.initialize();
            this.dragDrop.initialize();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing deck editor:', error);
            this.showError('Failed to initialize deck editor');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Save button
        const saveBtn = document.getElementById('saveDeckBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveDeck());
        }

        // Clear all button
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllCards());
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Filter select
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => this.handleFilter(e.target.value));
        }

        // Window resize listener for debugging and layout maintenance
        window.addEventListener('resize', () => {
            console.log('🔍 DEBUG: Window resize detected - width:', window.innerWidth);
            console.log('🔍 DEBUG: Deckbuilder container classes after resize:', document.querySelector('.deckbuilder-container')?.className);
            console.log('🔍 DEBUG: Deckbuilder container computed style after resize:', window.getComputedStyle(document.querySelector('.deckbuilder-container')).gridTemplateColumns);
            
            // Ensure layout is maintained after resize
            this.ensureTwoColumnLayout();
        });
    }

    // Ensure 2-column layout is maintained
    ensureTwoColumnLayout() {
        console.log('🔍 DEBUG: ensureTwoColumnLayout called');
        const container = document.querySelector('.deckbuilder-container');
        if (container) {
            container.classList.add('force-two-column');
            console.log('🔍 DEBUG: Added force-two-column class to deckbuilder-container');
            console.log('🔍 DEBUG: Container classes after adding class:', container.className);
            console.log('🔍 DEBUG: Computed grid template columns:', window.getComputedStyle(container).gridTemplateColumns);
        } else {
            console.log('🔍 DEBUG: deckbuilder-container not found');
        }
    }

    // Update deck title
    updateDeckTitle() {
        const titleElement = document.getElementById('deckTitle');
        if (titleElement && this.deckManager.currentDeck) {
            const deck = this.deckManager.currentDeck;
            titleElement.textContent = deck.metadata.name || 'New Deck';
        }
    }

    // Update deck display
    updateDeckDisplay() {
        console.log('🔍 DEBUG: updateDeckDisplay called');
        console.log('🔍 DEBUG: Current deckCards count:', this.deckManager.deckCards.length);
        console.log('🔍 DEBUG: Window width during update:', window.innerWidth);
        console.log('🔍 DEBUG: Deckbuilder container before update:', document.querySelector('.deckbuilder-container')?.className);
        
        const container = document.getElementById('deckCardsEditor');
        if (!container) return;

        if (this.deckManager.deckCards.length === 0) {
            container.innerHTML = '<div class="loading">No cards in deck yet</div>';
            console.log('🔍 DEBUG: No cards, showing loading message');
            return;
        }

        // Group cards by type
        const cardsByType = this.groupCardsByType(this.deckManager.deckCards);
        console.log('🔍 DEBUG: Cards grouped by type:', Object.keys(cardsByType));
        
        let html = '';
        for (const [type, cards] of Object.entries(cardsByType)) {
            html += this.renderCardSection(type, cards);
        }

        container.innerHTML = html;
        this.setupCardActionListeners();
        
        // Ensure layout is maintained after DOM update
        this.ensureTwoColumnLayout();
        
        // Check layout after DOM update
        setTimeout(() => {
            console.log('🔍 DEBUG: After DOM update - window width:', window.innerWidth);
            console.log('🔍 DEBUG: After DOM update - deckbuilder-container classes:', document.querySelector('.deckbuilder-container')?.className);
            console.log('🔍 DEBUG: After DOM update - deckbuilder-container computed style:', window.getComputedStyle(document.querySelector('.deckbuilder-container')).gridTemplateColumns);
        }, 50);
    }

    // Group cards by type
    groupCardsByType(cards) {
        const groups = {};
        cards.forEach(card => {
            if (!groups[card.type]) {
                groups[card.type] = [];
            }
            groups[card.type].push(card);
        });
        return groups;
    }

    // Render card section
    renderCardSection(type, cards) {
        const typeNames = {
            'character': 'Characters',
            'location': 'Locations',
            'special': 'Special Cards',
            'mission': 'Missions',
            'event': 'Events',
            'aspect': 'Aspects',
            'advanced-universe': 'Universe: Advanced',
            'teamwork': 'Teamwork',
            'ally-universe': 'Ally Universe',
            'training': 'Training',
            'basic-universe': 'Basic Universe',
            'power': 'Power Cards'
        };

        const typeName = typeNames[type] || type;
        const totalQuantity = cards.reduce((sum, card) => sum + card.quantity, 0);
        
        // Check if section should be collapsed based on saved state
        const isCollapsed = this.isSectionCollapsed(type);
        const collapseIcon = isCollapsed ? '▲' : '▼';
        const collapseClass = isCollapsed ? 'collapsed' : '';

        let cardsHtml = cards.map(card => this.renderDeckCard(card)).join('');

        return `
            <div class="deck-card-section ${collapseClass}" data-section-type="${type}">
                <div class="deck-card-section-header" onclick="deckEditor.toggleSection('${type}')">
                    <div class="section-title-group">
                        <span class="deck-card-section-title">${typeName}</span>
                        <span class="deck-card-section-count">${cards.length} cards, ${totalQuantity} total</span>
                    </div>
                    <div class="section-controls">
                        <button class="collapse-btn" type="button">${collapseIcon}</button>
                    </div>
                </div>
                <div class="deck-cards-list" style="display: ${isCollapsed ? 'none' : 'block'}">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    // Render individual deck card
    renderDeckCard(card) {
        const cardData = this.deckManager.getCardById(card.type, card.cardId);
        if (!cardData) {
            return `<div class="deck-card-item">Unknown card (${card.cardId})</div>`;
        }

        const cardName = cardData.name || cardData.card_name || 'Unknown';
        const cardImage = this.getCardImagePath(cardData, card.type, card.selectedAlternateImage);
        
        let statsHtml = '';
        if (card.type === 'character') {
            statsHtml = this.renderCharacterStats(cardData);
        }

        return `
            <div class="deck-card-item" data-card-id="${card.id}">
                <img src="${cardImage}" alt="${cardName}" class="deck-card-image">
                <div class="deck-card-info">
                    <div class="deck-card-name">${cardName}</div>
                    ${statsHtml}
                    <div class="deck-card-ability">${cardData.special_abilities || cardData.ability || ''}</div>
                </div>
                <div class="deck-card-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="deckEditor.updateCardQuantity('${card.id}', ${card.quantity - 1})">-</button>
                        <span class="quantity-display">${card.quantity}</span>
                        <button class="quantity-btn" onclick="deckEditor.updateCardQuantity('${card.id}', ${card.quantity + 1})">+</button>
                    </div>
                    ${card.type === 'character' ? `<button class="btn btn-secondary" onclick="deckEditor.showAlternateArt('${card.id}')">Change Art</button>` : ''}
                    <button class="btn btn-danger" onclick="deckEditor.removeCard('${card.id}')">Remove</button>
                </div>
            </div>
        `;
    }

    // Render character stats
    renderCharacterStats(character) {
        const stats = [
            { label: 'TL:', value: character.threat_level || 0, color: '#ffd700' },
            { label: 'E:', value: character.energy || 0, color: '#ffff00' },
            { label: 'C:', value: character.combat || 0, color: '#ff8c00' },
            { label: 'BF:', value: character.brute_force || 0, color: '#32cd32' },
            { label: 'I:', value: character.intelligence || 0, color: '#6495ed' }
        ];

        return `
            <div class="deck-card-stats">
                ${stats.map(stat => 
                    `<span style="color: ${stat.color}; margin-right: 8px;">${stat.label} ${stat.value}</span>`
                ).join('')}
            </div>
        `;
    }

    // Get card image path
    getCardImagePath(card, type, selectedAlternateImage = null) {
        if (type === 'character' && selectedAlternateImage) {
            return `/src/resources/cards/images/characters/alternate/${selectedAlternateImage}`;
        }
        
        const imagePath = card.image || card.image_path || '';
        if (imagePath) {
            return `/src/resources/cards/images/${this.getImageSubfolder(type)}/${imagePath}`;
        }
        
        return '/src/resources/images/op-logo.png'; // Fallback image
    }

    // Get image subfolder for card type
    getImageSubfolder(type) {
        const subfolders = {
            'character': 'characters',
            'location': 'locations',
            'special': 'specials',
            'mission': 'missions',
            'event': 'events',
            'aspect': 'aspects',
            'advanced-universe': 'advanced-universe',
            'teamwork': 'teamwork-universe',
            'ally-universe': 'ally-universe',
            'training': 'training',
            'basic-universe': 'basic-universe',
            'power': 'power-cards'
        };
        return subfolders[type] || 'characters';
    }

    // Setup card action listeners
    setupCardActionListeners() {
        // This will be called after rendering deck cards
        // Individual action handlers are defined as onclick attributes
    }

    // Update deck stats
    updateDeckStats() {
        const totalCards = this.deckManager.getTotalCardCount();
        const characterCount = this.deckManager.getCharacterCount();
        const missionCount = this.deckManager.getMissionCount();

        // Update stat displays
        this.updateStatDisplay('totalCards', `${totalCards}/51`);
        this.updateStatDisplay('maxEnergy', this.calculateMaxEnergy());
        this.updateStatDisplay('maxCombat', this.calculateMaxCombat());
        this.updateStatDisplay('maxBruteForce', this.calculateMaxBruteForce());
        this.updateStatDisplay('maxIntelligence', this.calculateMaxIntelligence());
        this.updateStatDisplay('totalThreat', this.calculateTotalThreat());
    }

    // Calculate max energy
    calculateMaxEnergy() {
        const characters = this.deckManager.deckCards.filter(card => card.type === 'character');
        return Math.max(...characters.map(card => {
            const charData = this.deckManager.getCardById('character', card.cardId);
            return charData?.energy || 0;
        }), 0);
    }

    // Calculate max combat
    calculateMaxCombat() {
        const characters = this.deckManager.deckCards.filter(card => card.type === 'character');
        return Math.max(...characters.map(card => {
            const charData = this.deckManager.getCardById('character', card.cardId);
            return charData?.combat || 0;
        }), 0);
    }

    // Calculate max brute force
    calculateMaxBruteForce() {
        const characters = this.deckManager.deckCards.filter(card => card.type === 'character');
        return Math.max(...characters.map(card => {
            const charData = this.deckManager.getCardById('character', card.cardId);
            return charData?.brute_force || 0;
        }), 0);
    }

    // Calculate max intelligence
    calculateMaxIntelligence() {
        const characters = this.deckManager.deckCards.filter(card => card.type === 'character');
        return Math.max(...characters.map(card => {
            const charData = this.deckManager.getCardById('character', card.cardId);
            return charData?.intelligence || 0;
        }), 0);
    }

    // Calculate total threat
    calculateTotalThreat() {
        const characters = this.deckManager.deckCards.filter(card => card.type === 'character');
        const locations = this.deckManager.deckCards.filter(card => card.type === 'location');
        
        // Get the current reserve character ID
        const reserveCharacterId = this.deckManager.currentDeck?.metadata?.reserve_character;
        
        let totalThreat = 0;
        
        // Calculate threat from characters
        characters.forEach(card => {
            const charData = this.deckManager.getCardById('character', card.cardId);
            if (charData?.threat_level) {
                let threatLevel = charData.threat_level;
                
                // Apply reserve character adjustments
                if (card.cardId === reserveCharacterId) {
                    // Victory Harben: 18 -> 20 when reserve (+2)
                    if (charData.name === 'Victory Harben') {
                        threatLevel = 20;
                    }
                    // Carson of Venus: 18 -> 19 when reserve (+1)
                    else if (charData.name === 'Carson of Venus') {
                        threatLevel = 19;
                    }
                    // Morgan Le Fay: 19 -> 20 when reserve (+1)
                    else if (charData.name === 'Morgan Le Fay') {
                        threatLevel = 20;
                    }
                }
                
                totalThreat += threatLevel * card.quantity;
            }
        });
        
        // Calculate threat from locations
        locations.forEach(card => {
            const locationData = this.deckManager.getCardById('location', card.cardId);
            if (locationData?.threat_level) {
                totalThreat += locationData.threat_level * card.quantity;
            }
        });
        
        return `${totalThreat}/76`;
    }

    // Update stat display
    updateStatDisplay(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    // Handle search
    handleSearch(searchTerm) {
        if (this.cardBrowser) {
            this.cardBrowser.handleSearch(searchTerm);
        }
    }

    // Handle filter
    handleFilter(filterType) {
        if (this.cardBrowser) {
            this.cardBrowser.handleFilter(filterType);
        }
    }

    // Save deck
    async saveDeck() {
        await this.deckManager.saveDeckChanges();
    }

    // Clear all cards
    async clearAllCards() {
        if (confirm('Are you sure you want to remove all cards from this deck?')) {
            this.deckManager.deckCards = [];
            this.updateDeckDisplay();
            this.updateDeckStats();
        }
    }

    // Update card quantity
    async updateCardQuantity(cardId, newQuantity) {
        await this.deckManager.updateCardQuantity(cardId, newQuantity);
    }

    // Remove card
    async removeCard(cardId) {
        await this.deckManager.removeCardFromDeck(cardId);
    }

    // Show alternate art selection
    showAlternateArt(cardId) {
        const card = this.deckManager.deckCards.find(c => c.id === cardId);
        if (!card || card.type !== 'character') return;

        const character = this.deckManager.getCardById('character', card.cardId);
        if (!character || !character.alternateImages || character.alternateImages.length === 0) {
            this.showNotification('No alternate art available for this character', 'warning');
            return;
        }

        // This would open the alternate art modal
        // Implementation would be similar to the original deckbuilder.html
    }

    // Show error
    showError(message) {
        const container = document.getElementById('deckCardsEditor');
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    // Check if a section is collapsed based on saved state
    isSectionCollapsed(sectionType) {
        if (!this.deckManager.currentDeck || !this.deckManager.currentDeck.metadata.uiState) {
            return false; // Default to expanded
        }
        
        const expansionState = this.deckManager.currentDeck.metadata.uiState.expansionState || {};
        // Only return true if explicitly set to false (collapsed)
        // undefined means never been set, so default to expanded (false)
        return expansionState.hasOwnProperty(sectionType) && expansionState[sectionType] === false;
    }

    // Toggle section collapse state
    toggleSection(sectionType) {
        // Initialize UI state if it doesn't exist
        if (!this.deckManager.currentDeck.metadata.uiState) {
            this.deckManager.currentDeck.metadata.uiState = { expansionState: {} };
        }
        
        if (!this.deckManager.currentDeck.metadata.uiState.expansionState) {
            this.deckManager.currentDeck.metadata.uiState.expansionState = {};
        }

        // Toggle the state: if currently collapsed (false), expand (true), otherwise collapse (false)
        const isCurrentlyCollapsed = this.isSectionCollapsed(sectionType);
        this.deckManager.currentDeck.metadata.uiState.expansionState[sectionType] = !isCurrentlyCollapsed;

        // Update the UI
        this.updateSectionDisplay(sectionType);
        
        // Log for debugging
        
        // Save the deck to persist the UI state
        this.deckManager.saveDeckChanges();
    }

    // Update section display after toggle
    updateSectionDisplay(sectionType) {
        const section = document.querySelector(`[data-section-type="${sectionType}"]`);
        if (!section) return;

        const isCollapsed = this.isSectionCollapsed(sectionType);
        const cardsList = section.querySelector('.deck-cards-list');
        const collapseBtn = section.querySelector('.collapse-btn');
        
        if (cardsList) {
            cardsList.style.display = isCollapsed ? 'none' : 'block';
        }
        
        if (collapseBtn) {
            collapseBtn.textContent = isCollapsed ? '▲' : '▼';
        }
        
        // Update section class
        if (isCollapsed) {
            section.classList.add('collapsed');
        } else {
            section.classList.remove('collapsed');
        }
    }

    // Restore all section states from saved data
    restoreSectionStates() {
        if (!this.deckManager.currentDeck || !this.deckManager.currentDeck.metadata.uiState) {
            return;
        }

        const expansionState = this.deckManager.currentDeck.metadata.uiState.expansionState || {};

        // Get all section types that exist in the current deck
        const cardsByType = this.groupCardsByType(this.deckManager.deckCards);
        const sectionTypes = Object.keys(cardsByType);

        sectionTypes.forEach(sectionType => {
            if (expansionState.hasOwnProperty(sectionType)) {
                this.updateSectionDisplay(sectionType);
            }
        });
    }
}

// Initialize deck editor when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.deckEditor = new DeckEditor();
    await window.deckEditor.initialize();
});
