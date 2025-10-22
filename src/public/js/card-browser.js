// Card browser module
class CardBrowser {
    constructor(deckManager) {
        this.deckManager = deckManager;
        this.currentFilter = '';
        this.currentSearch = '';
        this.filteredCards = new Map();
    }

    // Initialize the card browser
    async initialize() {
        this.loadCardCategories();
        this.setupEventListeners();
    }

    // Load card categories
    loadCardCategories() {
        const container = document.getElementById('cardCategories');
        if (!container) return;

        const categories = [
            { type: 'character', name: 'Characters', count: this.deckManager.getAvailableCardsByType('character').length },
            { type: 'location', name: 'Locations', count: this.deckManager.getAvailableCardsByType('location').length },
            { type: 'special', name: 'Special Cards', count: this.deckManager.getAvailableCardsByType('special').length },
            { type: 'mission', name: 'Missions', count: this.deckManager.getAvailableCardsByType('mission').length },
            { type: 'event', name: 'Events', count: this.deckManager.getAvailableCardsByType('event').length },
            { type: 'aspect', name: 'Aspects', count: this.deckManager.getAvailableCardsByType('aspect').length },
            { type: 'advanced-universe', name: 'Universe: Advanced', count: this.deckManager.getAvailableCardsByType('advanced-universe').length },
            { type: 'teamwork', name: 'Universe: Teamwork', count: this.deckManager.getAvailableCardsByType('teamwork').length },
            { type: 'ally-universe', name: 'Universe: Ally', count: (() => {
                const cards = this.deckManager.getAvailableCardsByType('ally-universe');
                console.log('🔍 Ally cards loaded:', cards.length, cards);
                console.log('🔍 Ally cards sample:', cards.slice(0, 3));
                return cards.length;
            })() },
            { type: 'training', name: 'Universe: Training', count: this.deckManager.getAvailableCardsByType('training').length },
            { type: 'basic-universe', name: 'Universe: Basic', count: (() => {
                const cards = this.deckManager.getAvailableCardsByType('basic-universe');
                console.log('🔍 Basic Universe cards loaded:', cards.length, cards);
                console.log('🔍 Basic Universe cards sample:', cards.slice(0, 3));
                return cards.length;
            })() },
            { type: 'power', name: 'Power Cards', count: this.deckManager.getAvailableCardsByType('power').length }
        ];

        let html = '';
        categories.forEach(category => {
            if (category.count > 0) {
                html += this.renderCategory(category);
            }
        });

        container.innerHTML = html;
        this.setupCategoryEventListeners();
    }

    // Render category
    renderCategory(category) {
        const hasFilter = ['special', 'advanced-universe', 'teamwork', 'basic-universe', 'training', 'ally-universe', 'power'].includes(category.type);
        
        return `
            <div class="card-category" data-category="${category.type}">
                <div class="card-category-header collapsed" onclick="deckEditor.cardBrowser.toggleCategory(this)">
                    <div class="category-header-content">
                        <span>${category.name} (${category.count})</span>
                        ${hasFilter ? `
                            <label class="filter-toggle" onclick="event.stopPropagation()">
                                <input type="checkbox" id="${category.type}CharacterFilter" onchange="deckEditor.cardBrowser.toggleCharacterFilter('${category.type}')">
                                <span class="toggle-label">Hide Unusables</span>
                            </label>
                        ` : ''}
                    </div>
                    <div class="category-header-controls">
                        <span class="collapse-icon">▼</span>
                    </div>
                </div>
                <div class="card-category-content collapsed">
                    <div class="loading">Loading ${category.name.toLowerCase()}...</div>
                </div>
            </div>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
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
    }

    // Setup category event listeners
    setupCategoryEventListeners() {
        // Toggle category expansion
        document.querySelectorAll('.card-category-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.closest('.filter-toggle')) {
                    this.toggleCategory(header);
                }
            });
        });
    }

    // Toggle category
    toggleCategory(header) {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.collapse-icon');
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.textContent = '▲';
            
            // Load cards for this category if not already loaded
            const category = header.closest('.card-category').dataset.category;
            this.loadCardsForCategory(category);
        } else {
            content.classList.add('collapsed');
            icon.textContent = '▼';
        }
    }

    // Load cards for category
    async loadCardsForCategory(categoryType) {
        const categoryElement = document.querySelector(`[data-category="${categoryType}"]`);
        const content = categoryElement.querySelector('.card-category-content');
        
        if (content.querySelector('.card-grid')) {
            return; // Already loaded
        }

        try {
            const cards = this.deckManager.getAvailableCardsByType(categoryType);
            
            
            const filteredCards = this.filterCards(cards, categoryType);
            const cardsHtml = this.renderCards(filteredCards, categoryType);
            
            content.innerHTML = cardsHtml;
            this.setupCardEventListeners(categoryType);
        } catch (error) {
            console.error(`Error loading ${categoryType} cards:`, error);
            content.innerHTML = '<div class="error">Error loading cards</div>';
        }
    }

    // Filter cards
    filterCards(cards, categoryType) {
        let filtered = cards;

        // Apply search filter
        if (this.currentSearch) {
            const searchTerm = this.currentSearch.toLowerCase();
            filtered = filtered.filter(card => {
                const name = (card.name || card.card_name || '').toLowerCase();
                return name.includes(searchTerm);
            });
        }

        // Apply type filter
        if (this.currentFilter && this.currentFilter !== categoryType) {
            return [];
        }

        // Apply character filter for certain types
        if (this.shouldApplyCharacterFilter(categoryType)) {
            const filterCheckbox = document.getElementById(`${categoryType}CharacterFilter`);
            if (filterCheckbox && filterCheckbox.checked) {
                filtered = this.filterByCharacter(categoryType, filtered);
            }
        }

        return filtered;
    }

    // Check if character filter should be applied
    shouldApplyCharacterFilter(categoryType) {
        return ['special', 'advanced-universe', 'teamwork', 'basic-universe', 'training', 'ally-universe', 'power'].includes(categoryType);
    }

    // Filter cards by character
    filterByCharacter(categoryType, cards) {
        const selectedCharacters = this.deckManager.deckCards
            .filter(card => card.type === 'character')
            .map(card => card.cardId);

        if (selectedCharacters.length === 0) {
            return cards; // Show all if no characters selected
        }

        return cards.filter(card => {
            // For special cards, check if character matches
            if (categoryType === 'special' || categoryType === 'advanced-universe') {
                return !card.character || selectedCharacters.includes(card.character) || card.character === 'Any Character';
            }
            
            // For other types, show all for now
            return true;
        });
    }

    // Render cards
    renderCards(cards, categoryType) {
        if (cards.length === 0) {
            return '<div class="empty-state">No cards found</div>';
        }

        // Group cards if needed
        if (categoryType === 'mission' || categoryType === 'event') {
            return this.renderGroupedCards(cards, categoryType, 'mission_set');
        } else if (categoryType === 'special' || categoryType === 'advanced-universe') {
            return this.renderGroupedCards(cards, categoryType, 'character');
        } else if (categoryType === 'teamwork') {
            return this.renderGroupedCards(cards, categoryType, 'to_use');
        } else if (categoryType === 'power') {
            return this.renderGroupedCards(cards, categoryType, 'power_type');
        } else {
            return this.renderSimpleCards(cards, categoryType);
        }
    }

    // Render simple cards
    renderSimpleCards(cards, categoryType) {
        return `
            <div class="card-grid">
                ${cards.map(card => this.renderCard(card, categoryType)).join('')}
            </div>
        `;
    }

    // Render grouped cards
    renderGroupedCards(cards, categoryType, groupBy) {
        const groups = {};
        cards.forEach(card => {
            const groupKey = card[groupBy] || 'Other';
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(card);
        });

        let html = '';
        Object.keys(groups).sort().forEach(groupKey => {
            const groupCards = groups[groupKey];
            // Escape group key for onclick attribute
            const escapedGroupKey = groupKey.replace(/'/g, "\\'").replace(/"/g, '\\"');
            html += `
                <div class="card-group">
                    <div class="card-group-header" onclick="deckEditor.cardBrowser.toggleGroup(this)">
                        <span>${groupKey} (${groupCards.length})</span>
                        <span class="collapse-icon">▼</span>
                    </div>
                    <div class="card-group-content collapsed">
                        <div class="card-grid">
                            ${groupCards.map(card => this.renderCard(card, categoryType)).join('')}
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    // Render individual card
    renderCard(card, categoryType) {
        const cardName = card.name || card.card_name || 'Unknown';
        const cardImage = this.getCardImagePath(card, categoryType);
        
        let statsHtml = '';
        if (categoryType === 'character') {
            statsHtml = this.renderCharacterStats(card);
        }

        // Escape special characters for HTML attributes
        const escapedCardName = cardName.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const escapedCardImage = cardImage.replace(/'/g, "\\'").replace(/"/g, '\\"');

        return `
            <div class="card-item" 
                 data-type="${categoryType}" 
                 data-id="${card.id}"
                 data-name="${cardName}"
                 onmouseenter="cardBrowser.showCardHover('${escapedCardImage}', '${escapedCardName}')"
                 onmouseleave="cardBrowser.hideCardHover()">
                <div class="card-item-content">
                    <div class="card-name">${cardName}</div>
                    ${statsHtml}
                </div>
                <div class="card-item-plus" onclick="deckEditor.cardBrowser.addCard('${categoryType}', '${card.id}', '${escapedCardName}')">+</div>
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
            <div class="character-stats">
                ${stats.map(stat => 
                    `<span class="character-stat">
                        <span class="stat-label">${stat.label}</span>
                        <span class="stat-value" style="color: ${stat.color};">${stat.value}</span>
                    </span>`
                ).join('')}
            </div>
        `;
    }

    // Get card image path
    getCardImagePath(card, categoryType) {
        const imagePath = card.image || card.image_path || '';
        if (imagePath) {
            return `/src/resources/cards/images/${this.getImageSubfolder(categoryType)}/${imagePath}`;
        }
        return '/src/resources/images/op-logo.png';
    }

    // Get image subfolder
    getImageSubfolder(categoryType) {
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
        return subfolders[categoryType] || 'characters';
    }

    // Setup card event listeners
    setupCardEventListeners(categoryType) {
        // Card hover events are handled by onmouseenter/onmouseleave attributes
        // Add card events are handled by onclick attributes
    }

    // Handle search
    handleSearch(searchTerm) {
        this.currentSearch = searchTerm;
        this.refreshVisibleCategories();
    }

    // Handle filter
    handleFilter(filterType) {
        this.currentFilter = filterType;
        this.refreshVisibleCategories();
    }

    // Refresh visible categories
    refreshVisibleCategories() {
        document.querySelectorAll('.card-category-content:not(.collapsed)').forEach(content => {
            const category = content.closest('.card-category').dataset.category;
            this.loadCardsForCategory(category);
        });
    }

    // Toggle character filter
    toggleCharacterFilter(categoryType) {
        this.refreshVisibleCategories();
    }

    // Toggle group
    toggleGroup(header) {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.collapse-icon');
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.textContent = '▲';
        } else {
            content.classList.add('collapsed');
            icon.textContent = '▼';
        }
    }

    // Add card to deck
    addCard(categoryType, cardId, cardName) {
        console.log('🔍 addCard called:', { categoryType, cardId, cardName });
        this.deckManager.addCardToDeck(categoryType, cardId, cardName);
    }

    // Show card hover
    showCardHover(imagePath, cardName) {
        const modal = document.getElementById('cardHoverModal');
        if (modal) {
            const img = modal.querySelector('#cardHoverImage');
            
            if (img) img.src = imagePath;
            
            modal.classList.add('visible');
        }
    }

    // Hide card hover
    hideCardHover() {
        const modal = document.getElementById('cardHoverModal');
        if (modal) {
            modal.classList.remove('visible');
        }
    }
}

// Export for use in other modules
window.CardBrowser = CardBrowser;
