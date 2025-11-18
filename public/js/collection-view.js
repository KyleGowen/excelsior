/* Collection View JavaScript */

// Collection view state
let collectionCards = [];
let collectionSearchTimeout = null;

/**
 * Translate set code to display name
 */
function translateSet(setCode) {
    if (!setCode) {
        return 'Edgar Rice Burroughs and the World Legends';
    }

    switch (setCode.toUpperCase()) {
        case 'ERB':
            return 'Edgar Rice Burroughs and the World Legends';
        default:
            return setCode;
    }
}

/**
 * Format card type for display
 */
function formatCardType(cardType) {
    const typeMap = {
        'character': 'Character',
        'special': 'Special',
        'power': 'Power',
        'location': 'Location',
        'mission': 'Mission',
        'event': 'Event',
        'aspect': 'Aspect',
        'advanced_universe': 'Universe: Advanced',
        'teamwork': 'Universe: Teamwork',
        'ally_universe': 'Universe: Ally',
        'training': 'Universe: Training',
        'basic_universe': 'Universe: Basic'
    };
    return typeMap[cardType] || cardType;
}

/**
 * Map database image paths to actual file paths
 */
function mapImagePathToActualFile(imagePath) {
    if (!imagePath) return imagePath;
    
    // For all card types, the database now contains the full directory structure
    // like "characters/angry_mob_industrial_age.webp", "missions/the-warlord-of-mars/a_fighting_man_of_mars.webp", etc.
    // So we need to return the path after the first directory to preserve the directory structure
    
    // Check for common card type prefixes
    const prefixes = ['characters/', 'missions/', 'specials/', 'locations/', 'events/', 'aspects/', 'power-cards/', 'teamwork-universe/', 'ally-universe/', 'training-universe/', 'basic-universe/', 'advanced-universe/'];
    
    for (const prefix of prefixes) {
        if (imagePath.startsWith(prefix)) {
            return imagePath.substring(prefix.length);
        }
    }
    
    // Fallback: if no prefix matches, return the filename part (after the last slash)
    const filename = imagePath.split('/').pop();
    return filename;
}

/**
 * Get card image path - uses image_path from collection card, constructing full path if needed
 */
function getCardImagePath(cardData, cardType) {
    console.log('🟣 [Collection] getCardImagePath CALLED:', {
        hasCardData: !!cardData,
        image_path: cardData?.image_path,
        image_path_type: typeof cardData?.image_path,
        cardType,
        fullCardData: cardData
    });
    
    if (!cardData || !cardData.image_path) {
        console.warn('🟣 [Collection] getCardImagePath: No cardData or image_path', { cardData, cardType });
        return '/src/resources/cards/images/placeholder.webp';
    }
    
    const imagePath = cardData.image_path.trim();
    console.log('🟣 [Collection] getCardImagePath: trimmed imagePath:', imagePath);
    
    // If it's already a full path, use it directly
    if (imagePath.startsWith('/src/resources/cards/images/')) {
        console.log('🟣 [Collection] getCardImagePath: Returning full path directly:', imagePath);
        return imagePath;
    }
    
    console.log('🟣 [Collection] getCardImagePath: Path does not start with /src/resources, processing...');
    
    // If it's just a filename (like "placeholder_aspect.webp" or "angry_mob__industrial_age_.webp")
    // construct the full path based on card type
    if (!imagePath.includes('/')) {
        // It's just a filename - construct path based on card type
        let constructedPath;
        switch (cardType) {
            case 'character':
                constructedPath = `/src/resources/cards/images/characters/${imagePath}`;
                break;
            case 'special':
                constructedPath = `/src/resources/cards/images/specials/${imagePath}`;
                break;
            case 'power':
                constructedPath = `/src/resources/cards/images/power-cards/${imagePath}`;
                break;
            case 'location':
                constructedPath = `/src/resources/cards/images/locations/${imagePath}`;
                break;
            case 'mission':
                constructedPath = `/src/resources/cards/images/missions/${imagePath}`;
                break;
            case 'event':
                constructedPath = `/src/resources/cards/images/events/${imagePath}`;
                break;
            case 'aspect':
                constructedPath = `/src/resources/cards/images/aspects/${imagePath}`;
                break;
            case 'advanced_universe':
                constructedPath = `/src/resources/cards/images/advanced-universe/${imagePath}`;
                break;
            case 'teamwork':
                constructedPath = `/src/resources/cards/images/teamwork-universe/${imagePath}`;
                break;
            case 'ally_universe':
                constructedPath = `/src/resources/cards/images/ally-universe/${imagePath}`;
                break;
            case 'training':
                constructedPath = `/src/resources/cards/images/training-universe/${imagePath}`;
                break;
            case 'basic_universe':
                constructedPath = `/src/resources/cards/images/basic-universe/${imagePath}`;
                break;
            default:
                constructedPath = '/src/resources/cards/images/placeholder.webp';
        }
        console.log('🟣 [Collection] Constructed path from filename:', { original: imagePath, cardType, constructed: constructedPath });
        return constructedPath;
    }
    
    // If it has a partial path (like "characters/alternate/zorro.png"), construct full path
    if (imagePath.includes('/') && !imagePath.startsWith('/')) {
        const constructedPath = `/src/resources/cards/images/${imagePath}`;
        console.log('🟣 [Collection] Constructed path from partial:', { original: imagePath, constructed: constructedPath });
        return constructedPath;
    }
    
    // Fallback: ensure it starts with / to make it absolute
    if (imagePath && !imagePath.startsWith('/')) {
        console.warn('🟣 [Collection] Image path does not start with /, using placeholder:', imagePath);
        return '/src/resources/cards/images/placeholder.webp';
    }
    
    return imagePath || '/src/resources/cards/images/placeholder.webp';
}

/**
 * Get card display name
 */
function getCardDisplayName(cardData, cardType) {
    if (!cardData || !cardData.card_data) {
        return 'Unknown Card';
    }

    const card = cardData.card_data;

    switch (cardType) {
        case 'power':
            return `${card.value} - ${card.power_type}`;
        case 'teamwork':
            return card.to_use || card.card_type || card.name || 'Teamwork';
        case 'advanced_universe':
            return card.card_name || card.name || 'Advanced Universe';
        case 'ally_universe':
            return card.card_name || card.name || 'Ally';
        case 'training':
            return card.card_name || card.name || 'Training';
        case 'basic_universe':
            return card.card_name || card.name || 'Basic Universe';
        case 'aspect':
            return card.card_name || card.name || 'Aspect';
        case 'mission':
            return card.card_name || card.name || 'Mission';
        case 'event':
            return card.name || 'Event';
        case 'location':
            return card.name || 'Location';
        case 'special':
            return card.name || 'Special';
        case 'character':
            return card.name || 'Character';
        default:
            return cardData.card_name || 'Unknown';
    }
}

/**
 * Load collection cards from API
 */
async function loadCollection() {
    try {
        const response = await fetch('/api/collections/me/cards', {
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.error('Access denied: Only ADMIN users can access collections');
                return;
            }
            throw new Error(`Failed to load collection: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            collectionCards = data.data;
            displayCollectionCards(collectionCards);
        } else {
            console.error('Failed to load collection:', data.error);
        }
    } catch (error) {
        console.error('Error loading collection:', error);
        const listContainer = document.getElementById('collectionCardsList');
        if (listContainer) {
            listContainer.innerHTML = '<div class="collection-loading">Error loading collection. Please try again.</div>';
        }
    }
}

/**
 * Display collection cards in a single table
 */
function displayCollectionCards(cards) {
    const listContainer = document.getElementById('collectionCardsList');
    if (!listContainer) return;

    if (cards.length === 0) {
        listContainer.innerHTML = `
            <div class="collection-empty">
                <div class="collection-empty-message">Your collection is empty</div>
                <div class="collection-empty-hint">Use the search bar above to add cards to your collection</div>
            </div>
        `;
        return;
    }

    let html = `
        <table class="collection-category-table" id="collection-table" data-sort="set_number" data-sort-dir="asc">
            <thead>
                <tr>
                    <th class="collection-col-quantity sortable resizable" data-sort="quantity">
                        <div class="th-content">Qty <span class="sort-indicator"></span></div>
                        <div class="resize-handle"></div>
                    </th>
                    <th class="collection-col-set-number sortable resizable" data-sort="set_number">
                        <div class="th-content"># <span class="sort-indicator"> ▲</span></div>
                        <div class="resize-handle"></div>
                    </th>
                    <th class="collection-col-name sortable resizable" data-sort="name">
                        <div class="th-content">Name <span class="sort-indicator"></span></div>
                        <div class="resize-handle"></div>
                    </th>
                    <th class="collection-col-type sortable resizable" data-sort="type">
                        <div class="th-content">Type <span class="sort-indicator"></span></div>
                        <div class="resize-handle"></div>
                    </th>
                    <th class="collection-col-set sortable resizable" data-sort="set">
                        <div class="th-content">Set <span class="sort-indicator"></span></div>
                        <div class="resize-handle"></div>
                    </th>
                    <th class="collection-col-actions resizable">
                        <div class="th-content">Actions</div>
                        <div class="resize-handle"></div>
                    </th>
                </tr>
            </thead>
            <tbody class="collection-category-tbody">
    `;

    cards.forEach(card => {
        const cardType = card.card_type;
        const cardName = getCardDisplayName(card, cardType);
        
        console.log('🟣 [Collection] Processing card for display:', {
            card_id: card.card_id,
            card_type: cardType,
            card_name: cardName,
            image_path_from_db: card.image_path,
            image_path_type: typeof card.image_path,
            image_path_length: card.image_path ? card.image_path.length : 0,
            has_card_data: !!card.card_data
        });
        
        const cardImage = getCardImagePath(card, cardType);
        console.log('🟣 [Collection] getCardImagePath returned:', {
            input_image_path: card.image_path,
            output_cardImage: cardImage,
            cardType
        });
        
        const cardSet = translateSet(card.set);
        
        // Get set_number from card_data
        const setNumber = card.card_data?.set_number || '';
        const setNumberValue = setNumber ? parseInt(setNumber) : 999999; // Use high number for null values to sort them last
        
        // Check if this is an alternate art by checking if image_path contains '/alternate/'
        const isAlternateArt = card.image_path && card.image_path.includes('/alternate/');
        const displayName = isAlternateArt ? `${cardName} (Alternate Art)` : cardName;
        
        // Escape single quotes in image path for use in HTML attribute
        const escapedImagePath = cardImage.replace(/'/g, "\\'");
        const escapedImagePathAttr = cardImage.replace(/"/g, '&quot;');
        
        console.log('🟣 [Collection] Final paths for HTML:', {
            original_cardImage: cardImage,
            escapedImagePath: escapedImagePath,
            escapedImagePathAttr: escapedImagePathAttr,
            will_be_used_in_onmouseenter: escapedImagePath
        });

        html += `
            <tr class="collection-card-item"
                data-card-id="${card.card_id}"
                data-card-type="${card.card_type}"
                data-image-path="${escapedImagePathAttr}"
                data-quantity="${card.quantity}"
                data-set-number="${setNumberValue}"
                data-card-name="${displayName.replace(/"/g, '&quot;')}"
                data-card-set="${cardSet.replace(/"/g, '&quot;')}"
                onmouseenter="showCardHoverModal('${escapedImagePath}', '${displayName.replace(/'/g, "\\'")}')"
                onmouseleave="hideCardHoverModal()">
                <td class="collection-card-quantity">${card.quantity}</td>
                <td class="collection-card-set-number">${setNumber || ''}</td>
                <td class="collection-card-name">${displayName}</td>
                <td class="collection-card-type">${formatCardType(cardType)}</td>
                <td class="collection-card-set">${cardSet}</td>
                <td class="collection-card-actions">
                    <div class="collection-quantity-control">
                        <button class="collection-quantity-btn" 
                            onclick="handleCollectionQuantityClick(this, ${card.quantity - 1})"
                                ${card.quantity <= 0 ? 'disabled' : ''}>-</button>
                        <button class="collection-quantity-btn" 
                            onclick="handleCollectionQuantityClick(this, ${card.quantity + 1})">+</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    listContainer.innerHTML = html;
    
    // Load saved column widths
    const table = listContainer.querySelector('#collection-table');
    if (table) {
        loadColumnWidths(table);
    }
    
    // Add event listeners for sortable column headers
    initializeCollectionSorting();
    
    // Apply default sort by set_number ascending
    if (table) {
        // Update sort indicator for set_number column
        const setNumberHeader = table.querySelector('[data-sort="set_number"]');
        if (setNumberHeader) {
            const indicator = setNumberHeader.querySelector('.sort-indicator');
            if (indicator) {
                indicator.textContent = ' ▲';
            }
        }
        sortCollectionTable(table, 'set_number', 'asc');
    }
    
    // Add event listeners for resizable columns
    initializeCollectionResizing();
}

/**
 * Initialize collection search
 */
function initializeCollectionSearch() {
    const searchInput = document.getElementById('collectionSearchInput');
    const searchResults = document.getElementById('collectionSearchResults');

    if (!searchInput || !searchResults) {
        console.error('Collection search elements not found');
        return;
    }

    // Use DeckEditorSearch component if available
    if (window.DeckEditorSearch && window.CardSearchService) {
        window.collectionSearchComponent = new window.DeckEditorSearch({
            input: searchInput,
            results: searchResults,
            onSelect: ({ id, type, imagePath }) => {
                addCardToCollection(id, type, imagePath || null);
            }
        });
        window.collectionSearchComponent.mount();
        return;
    }

    // Fallback to manual implementation
    searchInput.addEventListener('input', handleCollectionSearch);
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            searchResults.style.display = 'block';
        }
    });
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            searchResults.style.display = 'none';
        }, 200);
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.collection-search-container')) {
            searchResults.style.display = 'none';
        }
    });
}

/**
 * Handle collection search input
 */
async function handleCollectionSearch(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    const searchResults = document.getElementById('collectionSearchResults');

    if (searchTerm.length < 2) {
        searchResults.style.display = 'none';
        return;
    }

    // Clear previous timeout
    if (collectionSearchTimeout) {
        clearTimeout(collectionSearchTimeout);
    }

    // Debounce search
    collectionSearchTimeout = setTimeout(async () => {
        try {
            let results = [];
            if (window.CardSearchService) {
                const searchService = new window.CardSearchService({ maxResults: 20 });
                results = await searchService.search(searchTerm);
            } else {
                // Fallback to searchAllCards if available
                if (typeof searchAllCards === 'function') {
                    results = await searchAllCards(searchTerm);
                }
            }
            displayCollectionSearchResults(results);
        } catch (error) {
            console.error('Collection search error:', error);
            searchResults.style.display = 'none';
        }
    }, 300);
}

/**
 * Display collection search results
 */
function displayCollectionSearchResults(results) {
    const searchResults = document.getElementById('collectionSearchResults');
    if (!searchResults) return;

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="collection-search-result-item">No cards found</div>';
        searchResults.style.display = 'block';
        return;
    }

    const html = results.map(card => {
        // Escape single quotes in image path and card name for use in HTML attributes
        const escapedImagePath = (card.image || '').replace(/'/g, "\\'");
        const escapedCardName = (card.name || '').replace(/'/g, "\\'");
        // After migration, alternate cards are separate cards, so we use the card's image directly
        const imagePath = card.image || card.image_path || '';
        const imagePathAttr = imagePath ? imagePath.replace(/"/g, '&quot;') : '';
        // Use data attributes instead of inline onclick to avoid escaping issues
        return `
        <div class="collection-search-result-item"
             data-card-id="${card.id}"
             data-card-type="${card.type}"
             data-image-path="${imagePathAttr}"
             onclick="handleCollectionSearchResultClick(this)"
             onmouseenter="showCardHoverModal('${escapedImagePath}', '${escapedCardName}')"
             onmouseleave="hideCardHoverModal()">
            <div class="collection-search-result-name">${card.name}</div>
            <div class="collection-search-result-type">${formatCardType(card.type)}</div>
        </div>
        `;
    }).join('');

    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
}

/**
 * Handle click on collection search result
 */
function handleCollectionSearchResultClick(element) {
    const cardId = element.getAttribute('data-card-id');
    const cardType = element.getAttribute('data-card-type');
    const imagePath = element.getAttribute('data-image-path') || null;
    console.log('🟦 [Collection] Search result selected:', { cardId, cardType, imagePath });
    addCardToCollection(cardId, cardType, imagePath);
}

/**
 * Add card to collection from database view
 */
async function addCardToCollectionFromDatabase(cardId, cardType) {
    await addCardToCollection(cardId, cardType);
}

/**
 * Add card to collection
 */
async function addCardToCollection(cardId, cardType, imagePath = null) {
    try {
        const requestBody = {
            cardId: cardId,
            cardType: cardType,
            quantity: 1
        };
        
        // Include imagePath if provided (required for collection cards)
        if (imagePath && imagePath.trim() !== '') {
            requestBody.imagePath = imagePath;
        }
        
        const url = '/api/collections/me/cards';
        console.log('🔵 [Collection] Adding card to collection:', {
            url,
            cardId,
            cardType,
            imagePath,
            requestBody,
            method: 'POST'
        });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
        });
        
        console.log('🔵 [Collection] Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('🔴 [Collection] Failed to add card to collection:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
                requestBody,
                responseUrl: response.url
            });
            if (typeof showNotification === 'function') {
                showNotification(`Failed to add card: ${errorData.error || 'Unknown error'}`, 'error');
            } else {
                alert(`Failed to add card: ${errorData.error || 'Unknown error'}`);
            }
            return;
        }

        const data = await response.json();
        if (data.success) {
            console.log('🟢 [Collection] Card added successfully:', data);
            // Clear search
            const searchInput = document.getElementById('collectionSearchInput');
            if (searchInput) {
                searchInput.value = '';
            }
            const searchResults = document.getElementById('collectionSearchResults');
            if (searchResults) {
                searchResults.style.display = 'none';
            }

            // Reload collection
            await loadCollection();

            if (typeof showNotification === 'function') {
                showNotification('Card added to collection', 'success');
            }
        }
    } catch (error) {
        console.error('Error adding card to collection:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to add card to collection', 'error');
        } else {
            alert('Failed to add card to collection');
        }
    }
}

/**
 * Update card quantity in collection
 */
async function updateCollectionQuantity(cardId, cardType, newQuantity, imagePath) {
    if (newQuantity < 0) {
        console.warn('🟦 [Collection] updateCollectionQuantity called with negative quantity:', newQuantity);
        return;
    }

    if (!imagePath) {
        console.error('🟦 [Collection] updateCollectionQuantity called without imagePath');
        return;
    }

    const url = `/api/collections/me/cards/${cardId}`;
    const requestBody = {
        quantity: newQuantity,
        cardType: cardType,
        imagePath: imagePath
    };
    
    console.log('🟦 [Collection] Updating collection quantity:', {
        url,
        cardId,
        cardType,
        newQuantity,
        imagePath,
        requestBody
    });

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
        });

        console.log('🟦 [Collection] Update quantity response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('🔴 [Collection] Failed to update quantity:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
                requestBody
            });
            if (typeof showNotification === 'function') {
                showNotification(`Failed to update quantity: ${errorData.error || 'Unknown error'}`, 'error');
            }
            return;
        }

        const data = await response.json();
        if (data.success) {
            // Reload collection
            await loadCollection();
        }
    } catch (error) {
        console.error('Error updating collection quantity:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to update quantity', 'error');
        }
    }
}

/**
 * Handle quantity button click (uses DOM context for alternate image)
 */
function handleCollectionQuantityClick(buttonElement, newQuantity) {
    if (!buttonElement) return;
    const row = buttonElement.closest('.collection-card-item');
    if (!row) return;

    const cardId = row.getAttribute('data-card-id');
    const cardType = row.getAttribute('data-card-type');
    const imagePath = row.getAttribute('data-image-path');
    console.log('🟦 [Collection] Quantity button clicked:', { cardId, cardType, imagePath, newQuantity });

    if (!imagePath) {
        console.error('🟦 [Collection] Missing image_path attribute on collection card row');
        return;
    }

    updateCollectionQuantity(cardId, cardType, newQuantity, imagePath);
}

/**
 * Remove card from collection
 */
async function removeCardFromCollection(cardId, cardType) {
    if (!confirm('Are you sure you want to remove this card from your collection?')) {
        return;
    }

    try {
        const response = await fetch(`/api/collections/me/cards/${cardId}?cardType=${encodeURIComponent(cardType)}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (typeof showNotification === 'function') {
                showNotification(`Failed to remove card: ${errorData.error || 'Unknown error'}`, 'error');
            } else {
                alert(`Failed to remove card: ${errorData.error || 'Unknown error'}`);
            }
            return;
        }

        const data = await response.json();
        if (data.success) {
            // Reload collection
            await loadCollection();

            if (typeof showNotification === 'function') {
                showNotification('Card removed from collection', 'success');
            }
        }
    } catch (error) {
        console.error('Error removing card from collection:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to remove card from collection', 'error');
        } else {
            alert('Failed to remove card from collection');
        }
    }
}

/**
 * Initialize sorting for collection table
 */
function initializeCollectionSorting() {
    const sortableHeaders = document.querySelectorAll('.collection-category-table .sortable');
    
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            const table = this.closest('.collection-category-table');
            
            if (!table) return;
            
            // Toggle sort direction
            const currentSort = table.getAttribute('data-sort');
            const currentDir = table.getAttribute('data-sort-dir') || 'asc';
            let newDir = 'asc';
            
            if (currentSort === sortField && currentDir === 'asc') {
                newDir = 'desc';
            }
            
            // Update table attributes
            table.setAttribute('data-sort', sortField);
            table.setAttribute('data-sort-dir', newDir);
            
            // Update sort indicators
            table.querySelectorAll('.sort-indicator').forEach(indicator => {
                indicator.textContent = '';
            });
            
            const indicator = this.querySelector('.sort-indicator');
            if (indicator) {
                indicator.textContent = newDir === 'asc' ? ' ▲' : ' ▼';
            }
            
            // Sort the table rows
            sortCollectionTable(table, sortField, newDir);
        });
        
        // Add hover effect
        header.style.cursor = 'pointer';
    });
}

/**
 * Sort collection table rows
 */
function sortCollectionTable(table, sortField, direction) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr.collection-card-item'));
    
    rows.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortField) {
            case 'quantity':
                aValue = parseInt(a.getAttribute('data-quantity') || '0');
                bValue = parseInt(b.getAttribute('data-quantity') || '0');
                break;
            case 'set_number':
                aValue = parseInt(a.getAttribute('data-set-number') || '999999');
                bValue = parseInt(b.getAttribute('data-set-number') || '999999');
                break;
            case 'name':
                aValue = (a.getAttribute('data-card-name') || '').toLowerCase();
                bValue = (b.getAttribute('data-card-name') || '').toLowerCase();
                break;
            case 'set':
                aValue = (a.getAttribute('data-card-set') || '').toLowerCase();
                bValue = (b.getAttribute('data-card-set') || '').toLowerCase();
                break;
            case 'type':
                aValue = (a.querySelector('.collection-card-type')?.textContent || '').toLowerCase();
                bValue = (b.querySelector('.collection-card-type')?.textContent || '').toLowerCase();
                break;
            default:
                return 0;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        }
    });
    
    // Clear tbody and re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Initialize column resizing for collection tables
 */
function initializeCollectionResizing() {
    const tables = document.querySelectorAll('.collection-category-table');
    
    tables.forEach(table => {
        const resizeHandles = table.querySelectorAll('.resize-handle');
        
        resizeHandles.forEach((handle) => {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            let th = handle.parentElement;
            
            handle.addEventListener('mousedown', function(e) {
                isResizing = true;
                startX = e.pageX;
                startWidth = th.offsetWidth;
                
                th.classList.add('resizing');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                
                e.preventDefault();
                e.stopPropagation();
            });
            
            function handleMouseMove(e) {
                if (!isResizing) return;
                
                const diff = e.pageX - startX;
                let newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px
                
                // Get all column headers to calculate total width
                const allHeaders = Array.from(th.parentElement.children);
                const columnIndex = allHeaders.indexOf(th);
                
                // Apply max-width constraint if it exists on the column
                const maxWidth = window.getComputedStyle(th).maxWidth;
                if (maxWidth && maxWidth !== 'none') {
                    const maxWidthPx = parseFloat(maxWidth);
                    if (!isNaN(maxWidthPx)) {
                        newWidth = Math.min(newWidth, maxWidthPx);
                    }
                }
                
                // Calculate current total width of all columns
                let totalWidth = 0;
                allHeaders.forEach((header, idx) => {
                    if (idx === columnIndex) {
                        totalWidth += newWidth;
                    } else {
                        // Get the actual width, preferring style.width over offsetWidth
                        const styleWidth = header.style.width;
                        if (styleWidth) {
                            totalWidth += parseFloat(styleWidth);
                        } else {
                            totalWidth += header.offsetWidth;
                        }
                    }
                });
                
                // Get table's available width
                const tableWidth = table.offsetWidth;
                
                // If total width exceeds table width, constrain the new width
                if (totalWidth > tableWidth) {
                    // Calculate how much we need to reduce
                    const excess = totalWidth - tableWidth;
                    newWidth = Math.max(50, newWidth - excess);
                    
                    // Re-apply max-width after constraint
                    if (maxWidth && maxWidth !== 'none') {
                        const maxWidthPx = parseFloat(maxWidth);
                        if (!isNaN(maxWidthPx)) {
                            newWidth = Math.min(newWidth, maxWidthPx);
                        }
                    }
                }
                
                th.style.width = newWidth + 'px';
                th.style.minWidth = newWidth + 'px';
                th.style.maxWidth = newWidth + 'px'; // Prevent expansion beyond calculated width
                
                // Update all cells in this column
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const cell = row.children[columnIndex];
                    if (cell) {
                        cell.style.width = newWidth + 'px';
                        cell.style.minWidth = newWidth + 'px';
                        cell.style.maxWidth = newWidth + 'px';
                    }
                });
            }
            
            function handleMouseUp() {
                if (!isResizing) return;
                
                isResizing = false;
                th.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                
                // Save column widths to localStorage
                saveColumnWidths(table);
            }
        });
    });
}

/**
 * Save column widths to localStorage
 */
function saveColumnWidths(table) {
    const headers = table.querySelectorAll('thead th');
    const widths = {};
    
    headers.forEach((th) => {
        const className = th.className.match(/collection-col-\w+/)?.[0];
        if (className) {
            widths[className] = th.offsetWidth;
        }
    });
    
    localStorage.setItem('collection-column-widths', JSON.stringify(widths));
}

/**
 * Load column widths from localStorage
 */
function loadColumnWidths(table) {
    const savedWidths = localStorage.getItem('collection-column-widths');
    
    if (!savedWidths) return;
    
    try {
        const widths = JSON.parse(savedWidths);
        const headers = table.querySelectorAll('thead th');
        
        headers.forEach((th) => {
            const className = th.className.match(/collection-col-\w+/)?.[0];
            if (className && widths[className]) {
                const width = widths[className];
                th.style.width = width + 'px';
                th.style.minWidth = width + 'px';
                
                // Update all cells in this column
                const columnIndex = Array.from(th.parentElement.children).indexOf(th);
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const cell = row.children[columnIndex];
                    if (cell) {
                        cell.style.width = width + 'px';
                        cell.style.minWidth = width + 'px';
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error loading column widths:', error);
    }
}

/**
 * Initialize collection view
 */
function initializeCollectionView() {
    initializeCollectionSearch();
    loadCollection();
}

// Expose functions globally for inline HTML usage
window.translateSet = translateSet;
window.translateUniverse = translateSet; // Backward compatibility alias
window.formatCardType = formatCardType;
window.loadCollection = loadCollection;
window.displayCollectionCards = displayCollectionCards;
window.initializeCollectionSearch = initializeCollectionSearch;
window.addCardToCollection = addCardToCollection;
window.updateCollectionQuantity = updateCollectionQuantity;
window.handleCollectionQuantityClick = handleCollectionQuantityClick;
window.removeCardFromCollection = removeCardFromCollection;
window.initializeCollectionView = initializeCollectionView;
window.addCardToCollectionFromDatabase = addCardToCollectionFromDatabase;
window.handleCollectionSearchResultClick = handleCollectionSearchResultClick;

