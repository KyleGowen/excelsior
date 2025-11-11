/* ========================================
 * PHASE 3: CARD DISPLAY FUNCTIONS
 * ========================================
 * 
 * This file contains all card rendering and display functions extracted from
 * index.html during Phase 3 of the refactoring project.
 * 
 * Purpose: All card rendering and display functions
 * Created: Phase 3 of 12-phase refactoring project
 * Contains:
 *   - displayCharacters() - Character card rendering
 *   - displaySpecialCards() - Special card rendering
 *   - displayLocations() - Location card rendering
 *   - formatSpecialCardEffect() - Card effect formatting
 *   - All other card type display functions
 * 
 * ======================================== */

/**
 * Group cards by name, universe, and card type
 * Returns a map where key is "name|universe|type" and value is array of cards
 * Original art (non-alternate) is placed first in each group
 */
function groupCardsByVariant(cards, nameField = 'name', universeField = 'universe') {
    const groups = new Map();
    
    cards.forEach(card => {
        const name = card[nameField] || card.name || '';
        const universe = card[universeField] || card.universe || 'ERB';
        const cardType = card.card_type || 'character';
        const key = `${name}|${universe}|${cardType}`;
        
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        
        groups.get(key).push(card);
    });
    
    // Sort each group: original art first (image_path doesn't contain /alternate/), then alternates
    groups.forEach((group, key) => {
        group.sort((a, b) => {
            const aIsAlternate = (a.image_path || a.image || '').includes('/alternate/');
            const bIsAlternate = (b.image_path || b.image || '').includes('/alternate/');
            
            if (aIsAlternate && !bIsAlternate) return 1;  // b (original) comes first
            if (!aIsAlternate && bIsAlternate) return -1; // a (original) comes first
            return 0; // Keep original order for same type
        });
    });
    
    return groups;
}

/**
 * Get the image path for a card, handling both image_path and image fields
 */
function getCardImagePathForDisplay(card, cardType = 'character') {
    const imagePath = card.image_path || card.image || '';
    if (!imagePath) return '';
    
    // If it's already a full path, return it
    if (imagePath.startsWith('/src/resources/cards/images/')) {
        return imagePath;
    }
    
    // Construct full path based on card type
    const basePath = '/src/resources/cards/images/';
    switch (cardType) {
        case 'character':
            return `${basePath}characters/${mapImagePathToActualFile(imagePath)}`;
        case 'special':
            return `${basePath}specials/${mapImagePathToActualFile(imagePath)}`;
        case 'power':
            return `${basePath}power-cards/${mapImagePathToActualFile(imagePath)}`;
        case 'location':
            return `${basePath}locations/${mapImagePathToActualFile(imagePath)}`;
        case 'mission':
            return `${basePath}missions/${mapImagePathToActualFile(imagePath)}`;
        case 'event':
            return `${basePath}events/${mapImagePathToActualFile(imagePath)}`;
        case 'aspect':
            return `${basePath}aspects/${mapImagePathToActualFile(imagePath)}`;
        case 'advanced-universe':
        case 'advanced_universe':
            return `${basePath}advanced-universe/${mapImagePathToActualFile(imagePath)}`;
        case 'teamwork':
            return `${basePath}teamwork-universe/${mapImagePathToActualFile(imagePath)}`;
        case 'ally-universe':
        case 'ally_universe':
            return `${basePath}ally-universe/${mapImagePathToActualFile(imagePath)}`;
        case 'training':
            return `${basePath}training-universe/${mapImagePathToActualFile(imagePath)}`;
        case 'basic-universe':
        case 'basic_universe':
            return `${basePath}basic-universe/${mapImagePathToActualFile(imagePath)}`;
        default:
            return `${basePath}${mapImagePathToActualFile(imagePath)}`;
    }
}

/**
 * Display character cards in the characters table
 * Groups cards by name and universe, showing a single row with navigation arrows for alternate arts
 */
function displayCharacters(characters) {
    const tbody = document.getElementById('characters-tbody');
    if (!tbody) {
        console.error('❌ characters-tbody element not found!');
        return;
    }
    
    // Ensure the characters tab is visible before populating
    const charactersTab = document.getElementById('characters-tab');
    if (charactersTab && charactersTab.style.display === 'none') {
        charactersTab.style.display = 'block';
    }
    
    tbody.innerHTML = '';
    
    // Group characters by name and universe
    const groupedCharacters = groupCardsByVariant(characters, 'name', 'universe');
    
    // Process each group
    groupedCharacters.forEach((group, key) => {
        if (group.length === 0) return;
        
        // Use the first card (original art) as the representative for stats
        const representative = group[0];
        
        // Determine threat level class
        let threatClass = 'threat-low';
        if (representative.threat_level >= 20) threatClass = 'threat-high';
        else if (representative.threat_level >= 18) threatClass = 'threat-medium';
        
        // Prepare image data for navigation
        const imageData = group.map(card => ({
            id: card.id,
            imagePath: getCardImagePathForDisplay(card, 'character'),
            name: card.name
        }));
        
        // Create unique identifier for this card group
        const groupId = `char-group-${representative.id}`;
        
        // Build navigation arrows HTML (only show if there are multiple images)
        const hasMultipleImages = imageData.length > 1;
        const navArrows = hasMultipleImages ? `
            <button class="card-nav-arrow card-nav-prev" onclick="navigateCardImage('${groupId}', -1)" aria-label="Previous art" type="button">‹</button>
            <button class="card-nav-arrow card-nav-next" onclick="navigateCardImage('${groupId}', 1)" aria-label="Next art" type="button">›</button>
        ` : '';
        
        // Current image (starts with original art - index 0)
        const currentImage = imageData[0];
        const currentImagePath = currentImage.imagePath;
        const currentImageName = currentImage.name;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="card-image-container">
                    ${navArrows}
                    <img id="${groupId}-img"
                         src="${currentImagePath}" 
                         alt="${currentImageName}" 
                         style="width: auto; max-width: 316px; height: auto; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                         onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgODAgMTIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='; this.style.cursor='default'; this.onclick=null;"
                         onmouseenter="showCardHoverModal('${currentImagePath}', '${currentImageName.replace(/'/g, "\\'")}')"
                         onmouseleave="hideCardHoverModal()"
                         onclick="openModal(this)">
                </div>
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('character', '${currentImage.id}', '${currentImageName.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${currentImage.id}', 'character')" style="margin-top: 4px; display: block; width: 100%;">
                    Add to Collection
                </button>
                ` : ''}
            </td>
            <td><strong>${representative.name}</strong></td>
            <td>${representative.energy}</td>
            <td>${representative.combat}</td>
            <td>${representative.brute_force}</td>
            <td>${representative.intelligence}</td>
            <td class="${threatClass}">${representative.threat_level}</td>
            <td>${representative.special_abilities || ''}</td>
        `;
        
        // Store image data in data attribute for navigation
        row.querySelector('.card-image-container').setAttribute('data-image-data', JSON.stringify(imageData));
        row.querySelector('.card-image-container').setAttribute('data-current-index', '0');
        
        tbody.appendChild(row);
        
        // Lock row height after image loads to prevent changes when cycling images
        const img = row.querySelector('img');
        if (img) {
            const lockRowHeight = () => {
                const imageCell = row.querySelector('td:nth-child(1)');
                if (imageCell && !imageCell.dataset.heightLocked) {
                    const currentHeight = imageCell.offsetHeight;
                    if (currentHeight > 0) {
                        imageCell.style.height = currentHeight + 'px';
                        imageCell.style.minHeight = currentHeight + 'px';
                        imageCell.style.maxHeight = currentHeight + 'px';
                        imageCell.dataset.heightLocked = 'true';
                    }
                }
            };
            
            if (img.complete) {
                // Image already loaded
                setTimeout(lockRowHeight, 100);
            } else {
                // Wait for image to load
                img.addEventListener('load', lockRowHeight, { once: true });
                // Fallback timeout
                setTimeout(lockRowHeight, 1000);
            }
        }
        
        // Immediately disable Add to Deck button for guest users to prevent flash
        if (typeof isGuestUser === 'function' && isGuestUser()) {
            const addToDeckBtn = row.querySelector('.add-to-deck-btn');
            if (addToDeckBtn) {
                addToDeckBtn.disabled = true;
                addToDeckBtn.style.opacity = '0.5';
                addToDeckBtn.style.cursor = 'not-allowed';
                addToDeckBtn.title = 'Log in to add to decks...';
                addToDeckBtn.setAttribute('data-guest-disabled', 'true');
            }
        }
    });
}

/**
 * Navigate through alternate card images
 * @param {string} groupId - The unique identifier for the card group
 * @param {number} direction - -1 for previous, 1 for next
 */
function navigateCardImage(groupId, direction) {
    const container = document.querySelector(`#${groupId}-img`).closest('.card-image-container');
    if (!container) return;
    
    const imageData = JSON.parse(container.getAttribute('data-image-data') || '[]');
    if (imageData.length <= 1) return; // No navigation needed for single image
    
    let currentIndex = parseInt(container.getAttribute('data-current-index') || '0', 10);
    currentIndex += direction;
    
    // Wrap around
    if (currentIndex < 0) {
        currentIndex = imageData.length - 1;
    } else if (currentIndex >= imageData.length) {
        currentIndex = 0;
    }
    
    // Update image
    const newImage = imageData[currentIndex];
    const img = document.getElementById(`${groupId}-img`);
    const newImagePath = newImage.imagePath;
    
    img.src = newImagePath;
    img.alt = newImage.name;
    
    // Update hover modal
    img.setAttribute('onmouseenter', `showCardHoverModal('${newImagePath}', '${newImage.name.replace(/'/g, "\\'")}')`);
    
    // Update current index
    container.setAttribute('data-current-index', currentIndex.toString());
    
    // Update Add to Deck and Add to Collection buttons to use current card ID
    const row = container.closest('tr');
    if (row) {
        // Determine card type from groupId prefix
        let cardType = 'character';
        if (groupId.startsWith('special-')) {
            cardType = 'special';
        } else if (groupId.startsWith('power-')) {
            cardType = 'power';
        } else if (groupId.startsWith('location-')) {
            cardType = 'location';
        } else if (groupId.startsWith('mission-')) {
            cardType = 'mission';
        } else if (groupId.startsWith('event-')) {
            cardType = 'event';
        } else if (groupId.startsWith('aspect-')) {
            cardType = 'aspect';
        }
        
        const addToDeckBtn = row.querySelector('.add-to-deck-btn');
        if (addToDeckBtn) {
            addToDeckBtn.setAttribute('onclick', `showDeckSelection('${cardType}', '${newImage.id}', '${newImage.name.replace(/'/g, "\\'")}', this)`);
        }
        
        const addToCollectionBtn = row.querySelector('.add-to-collection-btn');
        if (addToCollectionBtn) {
            addToCollectionBtn.setAttribute('onclick', `addCardToCollectionFromDatabase('${newImage.id}', '${cardType}')`);
        }
    }
}

/**
 * Format special card effect text with proper HTML encoding and keyword highlighting
 */
function formatSpecialCardEffect(effectText, cardData = null) {
    if (!effectText) return '';
    
    // Decode HTML entities in the text
    let decodedText = effectText
        .replace(/\\'93/g, "'")  // Left single quotation mark (escaped)
        .replace(/\\'94/g, "'")  // Right single quotation mark (escaped)
        .replace(/&#39;/g, "'")  // Single quotation mark
        .replace(/&apos;/g, "'") // Single quotation mark (alternative)
        .replace(/&quot;/g, '"') // Double quotes
        .replace(/&amp;/g, '&')  // Ampersands
        .replace(/&lt;/g, '<')   // Less than
        .replace(/&gt;/g, '>')   // Greater than
        .replace(/&nbsp;/g, ' '); // Non-breaking spaces
    
    // Define special keywords and desired display order (One Per Deck last)
    const orderedKeywords = ['**Fortifications!**', '**Cataclysm!**', '**Assist!**', '**Ambush!**', '**One Per Deck**'];
    const foundKeywords = [];
    
    // Find all special keywords in the text
    for (const keyword of orderedKeywords) {
        if (decodedText.includes(keyword)) {
            foundKeywords.push(keyword);
        }
    }
    
    // Check if card has one_per_deck=true and add the label if not already present
    if (cardData && cardData.one_per_deck === true && !foundKeywords.includes('**One Per Deck**')) {
        foundKeywords.push('**One Per Deck**');
    }
    
    if (foundKeywords.length > 0) {
        // Remove all special keywords from the main text
        let mainText = decodedText;
        for (const keyword of orderedKeywords) {
            mainText = mainText.replace(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        }
        
        // Clean up extra spaces and trim
        mainText = mainText.replace(/\s+/g, ' ').trim();
        
        // Sort keywords in the desired order (ensures One Per Deck is last)
        const sortedKeywords = foundKeywords.sort((a, b) => orderedKeywords.indexOf(a) - orderedKeywords.indexOf(b));
        
        // Create keyword lines (convert ** to <strong> tags)
        const keywordLines = sortedKeywords.map(keyword => keyword.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
        
        // Format: main text + keywords on separate lines
        return (mainText ? mainText + '<br><br>' : '') + keywordLines.join('<br>');
    }
    
    // If no special keywords found, return the decoded text
    return decodedText;
}

/**
 * Display special cards in the special cards table
 * Groups cards by name, universe, and card_type, showing a single row with navigation arrows for alternate arts
 */
function displaySpecialCards(specialCards) {
    const tbody = document.getElementById('special-cards-tbody');
    
    if (!tbody) {
        console.error('❌ special-cards-tbody element not found!');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Check tab visibility after clearing
    const specialCardsTab = document.getElementById('special-cards-tab');
    const charactersTab = document.getElementById('characters-tab');

    // Group special cards by name, universe, and card_type
    const groupedCards = groupCardsByVariant(specialCards, 'name', 'universe');
    
    // Process each group
    groupedCards.forEach((group, key) => {
        if (group.length === 0) return;
        
        // Use the first card (original art) as the representative
        const representative = group[0];
        
        // Prepare image data for navigation
        const imageData = group.map(card => ({
            id: card.id,
            imagePath: getCardImagePathForDisplay(card, 'special'),
            name: card.name
        }));
        
        // Create unique identifier for this card group
        const groupId = `special-group-${representative.id}`;
        
        // Build navigation arrows HTML (only show if there are multiple images)
        const hasMultipleImages = imageData.length > 1;
        const navArrows = hasMultipleImages ? `
            <button class="card-nav-arrow card-nav-prev" onclick="navigateCardImage('${groupId}', -1)" aria-label="Previous art" type="button">‹</button>
            <button class="card-nav-arrow card-nav-next" onclick="navigateCardImage('${groupId}', 1)" aria-label="Next art" type="button">›</button>
        ` : '';
        
        // Current image (starts with original art - index 0)
        const currentImage = imageData[0];
        const currentImagePath = currentImage.imagePath;
        const currentImageName = currentImage.name;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="card-image-container">
                    ${navArrows}
                    <img id="${groupId}-img"
                         src="${currentImagePath}" 
                         alt="${currentImageName}" 
                         style="width: 120px; height: auto; max-height: 180px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                         onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                         onmouseenter="showCardHoverModal('${currentImagePath}', '${currentImageName.replace(/'/g, "\\'")}')"
                         onmouseleave="hideCardHoverModal()"
                         onclick="openModal(this)">
                </div>
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('special', '${currentImage.id}', '${currentImageName.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${currentImage.id}', 'special')" style="margin-top: 4px; display: block; width: 100%;">
                    Add to Collection
                </button>
                ` : ''}
            </td>
            <td><strong>${representative.name}</strong></td>
            <td>${representative.character}</td>
            <td>${formatSpecialCardEffect(representative.card_effect, representative)}</td>
        `;
        
        // Store image data in data attribute for navigation
        row.querySelector('.card-image-container').setAttribute('data-image-data', JSON.stringify(imageData));
        row.querySelector('.card-image-container').setAttribute('data-current-index', '0');
        
        tbody.appendChild(row);
        
        // Immediately disable Add to Deck button for guest users to prevent flash
        if (typeof isGuestUser === 'function' && isGuestUser()) {
            const addToDeckBtn = row.querySelector('.add-to-deck-btn');
            if (addToDeckBtn) {
                addToDeckBtn.disabled = true;
                addToDeckBtn.style.opacity = '0.5';
                addToDeckBtn.style.cursor = 'not-allowed';
                addToDeckBtn.title = 'Log in to add to decks...';
                addToDeckBtn.setAttribute('data-guest-disabled', 'true');
            }
        }
    });
}

/**
 * Display location cards in the locations table
 */
function displayLocations(locations) {
    const tbody = document.getElementById('locations-tbody');
    tbody.innerHTML = '';

    locations.forEach(location => {
        const row = document.createElement('tr');
        
        // Set the data-id attribute for location identification
        row.dataset.id = location.id;
        
        // Determine threat level class
        let threatClass = 'threat-low';
        if (location.threat_level >= 3) threatClass = 'threat-high';
        else if (location.threat_level >= 1) threatClass = 'threat-medium';

        row.innerHTML = `
            <td>
                <img src="/src/resources/cards/images/locations/${mapImagePathToActualFile(location.image)}" 
                     alt="${location.name}" 
                     style="width: 80px; height: auto; max-height: 120px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0iblkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3R0eHQ+Cjwvc3ZnPg=='; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/locations/${mapImagePathToActualFile(location.image)}', '${location.name.replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('location', '${location.id}', '${location.name.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${location.id}', 'location')" style="margin-top: 4px; display: block; width: 100%;">
                    Add to Collection
                </button>
                ` : ''}
            </td>
            <td><strong>${location.name}</strong></td>
            <td class="${threatClass}">${location.threat_level}</td>
            <td>${location.special_ability || ''}</td>
        `;
        
        tbody.appendChild(row);
        
        // Immediately disable Add to Deck button for guest users to prevent flash
        if (typeof isGuestUser === 'function' && isGuestUser()) {
            const addToDeckBtn = row.querySelector('.add-to-deck-btn');
            if (addToDeckBtn) {
                addToDeckBtn.disabled = true;
                addToDeckBtn.style.opacity = '0.5';
                addToDeckBtn.style.cursor = 'not-allowed';
                addToDeckBtn.title = 'Log in to add to decks...';
                addToDeckBtn.setAttribute('data-guest-disabled', 'true');
            }
        }
    });
}

// Make functions globally available
window.displayCharacters = displayCharacters;
window.displaySpecialCards = displaySpecialCards;
window.displayLocations = displayLocations;
window.formatSpecialCardEffect = formatSpecialCardEffect;
window.navigateCardImage = navigateCardImage;
window.groupCardsByVariant = groupCardsByVariant;
window.getCardImagePathForDisplay = getCardImagePathForDisplay;
