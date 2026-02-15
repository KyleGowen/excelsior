// deck-editor-rendering.js - Deck editor rendering functions
// Extracted from public/index.html

// ===== View toggle and list/card view rendering =====

function toggleListView() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (deckCardsEditor.classList.contains('card-view')) {
        // Currently in Card View - switch to List View
        viewManager.switchToListView();
    } else if (deckCardsEditor.classList.contains('list-view')) {
        // Currently in List View - switch to Tile View
        viewManager.switchToTileView();
    } else {
        // Currently in Tile View - switch to Card View
        viewManager.switchToCardView();
    }
    
    if (currentDeckId) {
        const preferences = getCurrentUIPreferences();
        saveUIPreferences(currentDeckId, preferences);
    }
}

function renderDeckCardsListView() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (!deckCardsEditor) return;


    // Group cards by type
    const cardsByType = {};
    window.deckEditorCards.forEach(card => {
        const type = card.type;
        if (!cardsByType[type]) {
            cardsByType[type] = [];
        }
        cardsByType[type].push(card);
    });


    // Define type order and display names
    const typeOrder = ['character', 'location', 'special', 'power', 'teamwork', 'ally-universe', 'basic-universe', 'advanced-universe', 'training', 'mission', 'event', 'aspect'];
    const typeDisplayNames = {
        'character': 'Characters',
        'location': 'Locations', 
        'special': 'Special Cards',
        'power': 'Power Cards',
        'teamwork': 'Teamwork Cards',
        'ally-universe': 'Ally Universe',
        'basic-universe': 'Basic Universe',
        'advanced-universe': 'Universe: Advanced',
        'training': 'Training Cards',
        'mission': 'Missions',
        'event': 'Events',
        'aspect': 'Aspects'
    };

    let html = '';
    
    // Render each type section
    typeOrder.forEach(type => {
        const cards = cardsByType[type];
        if (!cards || cards.length === 0) return;

        const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
        const displayName = typeDisplayNames[type] || type;
        
        html += `
            <div class="deck-list-section">
                <div class="deck-list-section-header" onclick="toggleDeckListSection('${type}')">
                    <div class="deck-list-section-title">${displayName}</div>
                    <div class="deck-list-section-count">${totalCards} card${totalCards !== 1 ? 's' : ''}</div>
                    <div class="deck-list-section-toggle">▼</div>
                </div>
                <div class="deck-list-items" id="deck-list-items-${type}" style="display: block;">
        `;

        // Special handling for special cards - group by character
        if (type === 'special') {
            const characterGroups = {};
            
            cards.forEach(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                if (!availableCard) return;
                
                const characterName = availableCard.character || availableCard.character_name || 'Any Character';
                if (!characterGroups[characterName]) {
                    characterGroups[characterName] = [];
                }
                characterGroups[characterName].push(card);
            });
            
            // Sort character names alphabetically, but put "Any Character" first
            const sortedCharacterNames = Object.keys(characterGroups).sort((a, b) => {
                if (a === 'Any Character') return -1;
                if (b === 'Any Character') return 1;
                return a.localeCompare(b);
            });
            
            sortedCharacterNames.forEach(characterName => {
                const characterCards = characterGroups[characterName];
                const cardCount = characterCards.reduce((total, card) => total + card.quantity, 0);
                
                html += `
                    <div class="character-group">
                        <div class="character-group-header" onclick="toggleCharacterGroup(this)">
                            <span>${characterName} (${cardCount})</span>
                            <span class="collapse-icon">▼</span>
                        </div>
                        <div class="character-group-content">
                `;
                
                characterCards.forEach((card, index) => {
                    const availableCard = window.availableCardsMap.get(card.cardId);
                    if (!availableCard) return;
                    
                    const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                    const imagePath = getCardImagePath(availableCard, card.type);
                    
                    html += `
                        <div class="deck-list-item" 
                             data-card-id="${card.cardId}"
                             data-type="${card.type}"
                             onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                             onmouseleave="hideCardHoverModal()">
                            <div class="deck-list-item-quantity">${card.quantity}</div>
                            <div class="deck-list-item-name">
                                ${(() => {
                                    const iconMap = {
                                        'Energy': '/src/resources/images/icons/energy.png',
                                        'Combat': '/src/resources/images/icons/combat.png',
                                        'Brute Force': '/src/resources/images/icons/brute_force.png',
                                        'Intelligence': '/src/resources/images/icons/intelligence.png'
                                    };
                                    const renderOrder = ['Energy','Combat','Brute Force','Intelligence'];
                                    const icons = Array.isArray(availableCard.icons) ? availableCard.icons : [];
                                    const imgs = renderOrder
                                        .filter(t => icons.includes(t) && iconMap[t])
                                        .map(t => `<img src="${iconMap[t]}" alt="${t}" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-left:8px;" />`)
                                        .join('');
                                    return imgs ? `${cardName} ${imgs}` : `${cardName}`;
                                })()}
                            </div>
                            <div class="deck-list-item-actions">
                                ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `
                                    <div class="deck-list-item-quantity-control">
                                        <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${window.deckEditorCards.indexOf(card)})">-1</button>
                                        <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${window.deckEditorCards.indexOf(card)})">+1</button>
                                    </div>
                                ` : ''}
                                ${type === 'character' ? `
                                    ${currentUser ? `<button class="ko-btn ${window.SimulateKO && window.SimulateKO.isKOd(card.cardId) ? 'active' : ''}" onclick="toggleKOCharacter('${card.cardId}', ${window.deckEditorCards.indexOf(card)})" title="${window.SimulateKO && window.SimulateKO.isKOd(card.cardId) ? 'Un-KO Character' : 'KO Character'}">KO</button>` : ''}
                                    ${getReserveCharacterButton(card.cardId, window.deckEditorCards.indexOf(card))}
                                    <button class="deck-list-item-remove" onclick="removeCardFromEditor(${window.deckEditorCards.indexOf(card)})">-</button>
                                ` : ''}
                                ${(type === 'location' || type === 'mission') && type !== 'character' ? `
                                    ${card.type === 'mission' ? getDisplayMissionButton(card.cardId, window.deckEditorCards.indexOf(card)) : ''}
                                    <button class="deck-list-item-remove" onclick="removeCardFromEditor(${window.deckEditorCards.indexOf(card)})">-</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            });
        } else {
            // Regular handling for other card types (including characters)
            // Sort cards by name for consistent display
            cards.sort((a, b) => {
                const availableCardA = window.availableCardsMap.get(a.cardId);
                const availableCardB = window.availableCardsMap.get(b.cardId);
                const nameA = availableCardA?.name || availableCardA?.card_name || 'Unknown';
                const nameB = availableCardB?.name || availableCardB?.card_name || 'Unknown';
                return nameA.localeCompare(nameB);
            });

            cards.forEach((card, index) => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                
                if (!availableCard) {
                    return;
                }

                // Use the same naming logic as tile view
                let cardName;
                if (card.type === 'power') {
                    cardName = `${availableCard.value} - ${availableCard.power_type}`;
                } else if (card.type === 'teamwork') {
                    cardName = `${availableCard.to_use} -> ${availableCard.followup_attack_types} (${availableCard.first_attack_bonus}/${availableCard.second_attack_bonus})`;
                } else if (card.type === 'ally-universe') {
                    cardName = `${availableCard.card_name} - ${availableCard.stat_to_use} ${availableCard.stat_type_to_use} → ${availableCard.attack_value} ${availableCard.attack_type}`;
                } else if (card.type === 'basic-universe') {
                    cardName = `${availableCard.card_name} - ${availableCard.type} (${availableCard.value_to_use} → ${availableCard.bonus})`;
                } else if (card.type === 'training') {
                    cardName = `${availableCard.card_name.replace(/^Training \(/, '').replace(/\)$/, '')} - ${availableCard.type_1} + ${availableCard.type_2} (${availableCard.value_to_use} → ${availableCard.bonus})`;
                } else {
                    cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                }
                const imagePath = getCardImagePath(availableCard, card.type);
                
                html += `
                    <div class="deck-list-item" 
                         onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                         onmouseleave="hideCardHoverModal()">
                        <div class="deck-list-item-quantity">${card.quantity}</div>
                        <div class="deck-list-item-name">
                            ${(() => {
                                const iconMap = {
                                    'Energy': '/src/resources/images/icons/energy.png',
                                    'Combat': '/src/resources/images/icons/combat.png',
                                    'Brute Force': '/src/resources/images/icons/brute_force.png',
                                    'Intelligence': '/src/resources/images/icons/intelligence.png',
                                    'Any-Power': '/src/resources/images/icons/any-power.png'
                                };
                                if (card.type === 'power') {
                                    const type = String(availableCard.power_type || '').trim();
                                    const renderOrder = ['Any-Power','Energy','Combat','Brute Force','Intelligence'];
                                    const isMulti = /multi\s*-?power/i.test(type);
                                    const icons = type === 'Any-Power'
                                        ? ['Any-Power']
                                        : isMulti
                                            ? ['Energy','Combat','Brute Force','Intelligence']
                                            : renderOrder.filter(t => t === type);
                                    const imgs = icons
                                        .filter(t => iconMap[t])
                                        .map(t => `<img src="${iconMap[t]}" alt="${t}" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-left:8px;" />`)
                                        .join('');
                                    return imgs ? `${cardName} ${imgs}` : `${cardName}`;
                                }
                                if (card.type === 'teamwork') {
                                    const renderOrder = ['Any-Power','Energy','Combat','Brute Force','Intelligence'];
                                    const src = String(availableCard.to_use || '');
                                    const isAny = /Any-?Power/i.test(src);
                                    const icons = isAny ? ['Any-Power'] : renderOrder.filter(t => t !== 'Any-Power' && new RegExp(t, 'i').test(src));
                                    const imgs = icons
                                        .filter(t => iconMap[t])
                                        .map(t => `<img src="${iconMap[t]}" alt="${t}" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-left:8px;" />`)
                                        .join('');
                                    return imgs ? `${cardName} ${imgs}` : `${cardName}`;
                                }
                                if (card.type === 'ally-universe') {
                                    const iconMap = {
                                        'Energy': '/src/resources/images/icons/energy.png',
                                        'Combat': '/src/resources/images/icons/combat.png',
                                        'Brute Force': '/src/resources/images/icons/brute_force.png',
                                        'Intelligence': '/src/resources/images/icons/intelligence.png'
                                    };
                                    const src = String(availableCard.stat_type_to_use || '');
                                    const renderOrder = ['Energy','Combat','Brute Force','Intelligence'];
                                    const type = renderOrder.find(t => new RegExp(t, 'i').test(src));
                                    const img = type && iconMap[type] ? `<img src="${iconMap[type]}" alt="${type}" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-left:8px;" />` : '';
                                    return `${cardName} ${img}`.trim();
                                }
                                if (card.type === 'aspect') {
                                    const renderOrder = ['Energy','Combat','Brute Force','Intelligence'];
                                    const icons = Array.isArray(availableCard.icons) ? availableCard.icons : [];
                                    const imgs = renderOrder
                                        .filter(t => icons.includes(t) && iconMap[t])
                                        .map(t => `<img src="${iconMap[t]}" alt="${t}" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-left:8px;" />`)
                                        .join('');
                                    return imgs ? `${cardName} ${imgs}` : `${cardName}`;
                                }
                                return `${cardName}`;
                            })()}
                        </div>
                        <div class="deck-list-item-actions">
                            ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `
                                <div class="deck-list-item-quantity-control">
                                    <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${window.deckEditorCards.indexOf(card)})">-1</button>
                                    <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${window.deckEditorCards.indexOf(card)})">+1</button>
                                </div>
                            ` : ''}
                                ${type === 'character' ? `
                                    ${getReserveCharacterButton(card.cardId, window.deckEditorCards.indexOf(card))}
                                    <button class="deck-list-item-remove" onclick="removeCardFromEditor(${window.deckEditorCards.indexOf(card)})">-</button>
                                ` : ''}
                                ${(type === 'location' || type === 'mission') && type !== 'character' ? `
                                    ${card.type === 'mission' ? getDisplayMissionButton(card.cardId, window.deckEditorCards.indexOf(card)) : ''}
                                    <button class="deck-list-item-remove" onclick="removeCardFromEditor(${window.deckEditorCards.indexOf(card)})">-</button>
                                ` : ''}
                        </div>
                    </div>
                `;
            });
        }

        html += `
                </div>
            </div>
        `;
    });

    // Check if columns already exist to preserve layout during updates
    const existingColumns = Array.from(deckCardsEditor.querySelectorAll('.deck-column'));
    const hasColumns = existingColumns.length === 2;
    
    // If columns exist, preserve them by updating content within them
    if (hasColumns) {
        // Map existing sections to their columns by type to prevent redistribution
        const leftColumnTypes = new Set();
        const rightColumnTypes = new Set();
        const sectionHeights = new Map(); // Store section heights to prevent jumps
        
        // Force a layout calculation before capturing heights to ensure accurate measurements
        void existingColumns[0].offsetHeight;
        void existingColumns[1].offsetHeight;
        
        existingColumns[0].querySelectorAll('.deck-list-section').forEach(section => {
            const itemsContainer = section.querySelector('.deck-list-items');
            if (itemsContainer) {
                const type = itemsContainer.id.replace('deck-list-items-', '');
                if (type) {
                    leftColumnTypes.add(type);
                    // Force layout calculation for this section before capturing height
                    void section.offsetHeight;
                    const height = section.offsetHeight;
                    if (height > 0) {
                        sectionHeights.set(type, height);
                    }
                }
            }
        });
        
        existingColumns[1].querySelectorAll('.deck-list-section').forEach(section => {
            const itemsContainer = section.querySelector('.deck-list-items');
            if (itemsContainer) {
                const type = itemsContainer.id.replace('deck-list-items-', '');
                if (type) {
                    rightColumnTypes.add(type);
                    // Force layout calculation for this section before capturing height
                    void section.offsetHeight;
                    const height = section.offsetHeight;
                    if (height > 0) {
                        sectionHeights.set(type, height);
                    }
                }
            }
        });
        
        // Prepare new content first
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newSections = Array.from(tempDiv.children);
        
        // Distribute sections based on their original column assignment
        const leftSections = [];
        const rightSections = [];
        
        newSections.forEach(section => {
            const itemsContainer = section.querySelector('.deck-list-items');
            if (itemsContainer) {
                const type = itemsContainer.id.replace('deck-list-items-', '');
                if (leftColumnTypes.has(type)) {
                    leftSections.push(section);
                } else if (rightColumnTypes.has(type)) {
                    rightSections.push(section);
                } else {
                    // New section type - use original distribution logic
                    const totalExisting = leftColumnTypes.size + rightColumnTypes.size;
                    const newTypeIndex = typeOrder.indexOf(type);
                    const shouldBeInLeft = newTypeIndex < Math.ceil(totalExisting / 2);
                    if (shouldBeInLeft) {
                        leftSections.push(section);
                        leftColumnTypes.add(type);
                        console.log(`🆕 ${type} → left column (new)`);
                    } else {
                        rightSections.push(section);
                        rightColumnTypes.add(type);
                        console.log(`🆕 ${type} → right column (new)`);
                    }
                }
            }
        });
        
        console.log(`📦 Left sections: ${leftSections.length}, Right sections: ${rightSections.length}`);
        
        // Measure new content heights BEFORE the swap to predict final dimensions
        // This allows us to apply the correct height immediately during swap
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.pointerEvents = 'none';
        tempContainer.style.height = 'auto';
        tempContainer.style.width = existingColumns[0].offsetWidth + 'px';
        document.body.appendChild(tempContainer);
        
        // Clone and measure left sections
        const leftSectionHeights = new Map();
        leftSections.forEach(section => {
            const clone = section.cloneNode(true);
            tempContainer.appendChild(clone);
            const itemsContainer = clone.querySelector('.deck-list-items');
            if (itemsContainer) {
                const type = itemsContainer.id.replace('deck-list-items-', '');
                if (type) {
                    // Force layout calculation
                    void clone.offsetHeight;
                    const newHeight = clone.offsetHeight;
                    if (newHeight > 0) {
                        leftSectionHeights.set(type, newHeight);
                        console.log(`📐 Measured new height for ${type}: ${newHeight}px`);
                    }
                }
            }
            tempContainer.removeChild(clone);
        });
        
        // Clone and measure right sections
        tempContainer.style.width = existingColumns[1].offsetWidth + 'px';
        const rightSectionHeights = new Map();
        rightSections.forEach(section => {
            const clone = section.cloneNode(true);
            tempContainer.appendChild(clone);
            const itemsContainer = clone.querySelector('.deck-list-items');
            if (itemsContainer) {
                const type = itemsContainer.id.replace('deck-list-items-', '');
                if (type) {
                    // Force layout calculation
                    void clone.offsetHeight;
                    const newHeight = clone.offsetHeight;
                    if (newHeight > 0) {
                        rightSectionHeights.set(type, newHeight);
                        console.log(`📐 Measured new height for ${type}: ${newHeight}px`);
                    }
                }
            }
            tempContainer.removeChild(clone);
        });
        
        document.body.removeChild(tempContainer);
        
        // CRITICAL: Preserve column widths BEFORE RAF to prevent flex recalculation
        // Force layout calculation to get accurate widths
        void existingColumns[0].offsetWidth;
        void existingColumns[1].offsetWidth;
        const leftColumnWidth = existingColumns[0].offsetWidth;
        const rightColumnWidth = existingColumns[1].offsetWidth;
        
        // Lock column widths IMMEDIATELY to prevent flex recalculation during replaceChildren
        existingColumns[0].style.width = `${leftColumnWidth}px`;
        existingColumns[0].style.minWidth = `${leftColumnWidth}px`;
        existingColumns[0].style.maxWidth = `${leftColumnWidth}px`;
        existingColumns[0].style.flex = '0 0 auto'; // Prevent flex from recalculating
        existingColumns[1].style.width = `${rightColumnWidth}px`;
        existingColumns[1].style.minWidth = `${rightColumnWidth}px`;
        existingColumns[1].style.maxWidth = `${rightColumnWidth}px`;
        existingColumns[1].style.flex = '0 0 auto'; // Prevent flex from recalculating
        
        // Force layout calculation with locked widths
        void existingColumns[0].offsetWidth;
        void existingColumns[1].offsetWidth;
        
        // Execute replacement synchronously in one frame to minimize layout recalculation
        // Using RAF ensures it happens right before paint, reducing visual jumps
        requestAnimationFrame(() => {
            // Preserve column heights to prevent jumps
            const leftColumnHeight = existingColumns[0].offsetHeight;
            const rightColumnHeight = existingColumns[1].offsetHeight;
            
            console.log(`📏 Before replacement - Left column: ${leftColumnHeight}px (width: ${leftColumnWidth}px), Right column: ${rightColumnHeight}px (width: ${rightColumnWidth}px)`);
            
            // Apply section heights - use new measured height if available, otherwise preserve old
            const appliedHeights = new Map();
            
            // Store target heights for each section type - use MAX of measured vs preserved
            // This prevents shrinking by always using the larger value
            leftSections.forEach(section => {
                const itemsContainer = section.querySelector('.deck-list-items');
                if (itemsContainer) {
                    const type = itemsContainer.id.replace('deck-list-items-', '');
                    const measuredHeight = leftSectionHeights.get(type);
                    const preservedHeight = sectionHeights.get(type);
                    // Use maximum to prevent shrinking, prefer measured if both exist
                    const targetHeight = measuredHeight && preservedHeight 
                        ? Math.max(measuredHeight, preservedHeight)
                        : (measuredHeight || preservedHeight);
                    if (targetHeight && targetHeight > 0) {
                        appliedHeights.set(type, targetHeight);
                        console.log(`📐 Target height for ${type}: ${targetHeight}px (measured: ${measuredHeight || 'none'}, preserved: ${preservedHeight || 'none'})`);
                    }
                }
            });
            
            rightSections.forEach(section => {
                const itemsContainer = section.querySelector('.deck-list-items');
                if (itemsContainer) {
                    const type = itemsContainer.id.replace('deck-list-items-', '');
                    const measuredHeight = rightSectionHeights.get(type);
                    const preservedHeight = sectionHeights.get(type);
                    // Use maximum to prevent shrinking, prefer measured if both exist
                    const targetHeight = measuredHeight && preservedHeight 
                        ? Math.max(measuredHeight, preservedHeight)
                        : (measuredHeight || preservedHeight);
                    if (targetHeight && targetHeight > 0) {
                        appliedHeights.set(type, targetHeight);
                        console.log(`📐 Target height for ${type}: ${targetHeight}px (measured: ${measuredHeight || 'none'}, preserved: ${preservedHeight || 'none'})`);
                    }
                }
            });
            
            // Also preserve column heights to prevent column-level jumps
            if (leftColumnHeight > 0) {
                existingColumns[0].style.minHeight = `${leftColumnHeight}px`;
            }
            if (rightColumnHeight > 0) {
                existingColumns[1].style.minHeight = `${rightColumnHeight}px`;
            }
            
            // Force a layout calculation to apply the column heights before swap
            void existingColumns[0].offsetHeight;
            void existingColumns[1].offsetHeight;
            
            // Batch both column updates together synchronously
            if (existingColumns[0] && leftSections.length > 0) {
                existingColumns[0].replaceChildren(...leftSections);
            } else if (existingColumns[0]) {
                existingColumns[0].replaceChildren();
            }
            if (existingColumns[1] && rightSections.length > 0) {
                existingColumns[1].replaceChildren(...rightSections);
            } else if (existingColumns[1]) {
                existingColumns[1].replaceChildren();
            }
            
            // CRITICAL: Apply section heights IMMEDIATELY and SYNCHRONOUSLY after replaceChildren
            // This must happen before any layout recalculation to prevent visual jumps
            appliedHeights.forEach((height, type) => {
                const itemsContainer = document.getElementById(`deck-list-items-${type}`);
                if (itemsContainer) {
                    const section = itemsContainer.closest('.deck-list-section');
                    if (section) {
                        // Apply exact height immediately to lock dimensions before browser recalculates
                        section.style.height = `${height}px`;
                        section.style.minHeight = `${height}px`;
                        section.style.boxSizing = 'border-box';
                        section.style.overflow = 'hidden'; // Prevent content overflow during transition
                    }
                }
            });
            
            // CRITICAL: Lock all quantity element widths immediately to prevent layout shifts
            // This fixes the issue where single-digit quantities cause text to jump
            const allQuantityElements = deckCardsEditor.querySelectorAll('.deck-list-item-quantity');
            allQuantityElements.forEach((qty, idx) => {
                // Force fixed width regardless of content
                qty.style.setProperty('min-width', '40px', 'important');
                qty.style.setProperty('width', '40px', 'important');
                qty.style.setProperty('text-align', 'right', 'important');
                qty.style.setProperty('flex', '0 0 40px', 'important');
                qty.style.setProperty('box-sizing', 'border-box', 'important');
                
                // Debug logging
                const text = qty.textContent.trim();
                const width = qty.offsetWidth;
                const computedWidth = window.getComputedStyle(qty).width;
                if (idx < 5) { // Log first 5 for debugging
                }
            });
            
            // Force synchronous layout calculation with heights applied
            // This ensures browser uses our locked heights before paint
            void existingColumns[0].offsetHeight;
            void existingColumns[1].offsetHeight;
            
            // Verify all sections got their heights applied
            appliedHeights.forEach((expectedHeight, type) => {
                const itemsContainer = document.getElementById(`deck-list-items-${type}`);
                if (itemsContainer) {
                    const section = itemsContainer.closest('.deck-list-section');
                    if (section) {
                        const actualHeight = section.offsetHeight;
                        if (Math.abs(actualHeight - expectedHeight) > 1) {
                            console.warn(`⚠️ Height mismatch for ${type}: expected ${expectedHeight}px, got ${actualHeight}px`);
                            // Force correct height
                            section.style.height = `${expectedHeight}px`;
                        }
                    }
                }
            });
            
            // Switch from exact height to min-height in next frame to allow growth
            // Use double RAF to ensure paint has completed
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    appliedHeights.forEach((height, type) => {
                        const itemsContainer = document.getElementById(`deck-list-items-${type}`);
                        if (itemsContainer) {
                            const section = itemsContainer.closest('.deck-list-section');
                            if (section) {
                                // Switch to min-height to allow growth but prevent shrinking
                                section.style.height = '';
                                section.style.overflow = ''; // Re-enable overflow
                                section.style.minHeight = `${height}px`;
                            }
                        }
                    });
                    
                    // Allow columns to grow naturally too
                    existingColumns[0].style.minHeight = '';
                    existingColumns[1].style.minHeight = '';
                    
                    // Restore flex properties to allow natural column behavior
                    existingColumns[0].style.width = '';
                    existingColumns[0].style.minWidth = '';
                    existingColumns[0].style.maxWidth = '';
                    existingColumns[0].style.flex = '';
                    existingColumns[1].style.width = '';
                    existingColumns[1].style.minWidth = '';
                    existingColumns[1].style.maxWidth = '';
                    existingColumns[1].style.flex = '';
                });
            });
            
            // Apply saved expansion state to list view sections (moved here to run after DOM update)
            typeOrder.forEach(type => {
                const cards = cardsByType[type];
                if (!cards || cards.length === 0) return;
                
                const itemsContainer = document.getElementById(`deck-list-items-${type}`);
                const header = itemsContainer?.previousElementSibling;
                const toggle = header?.querySelector('.deck-list-section-toggle');
                
                if (itemsContainer && header && toggle) {
                    // In read-only list view, always expand sections by default
                    const isExpanded = true; // Always expanded in read-only list view
                    if (!isExpanded) {
                        itemsContainer.style.display = 'none';
                        toggle.textContent = '▶';
                        header.classList.add('collapsed');
                    }
                }
            });
            
            // Remove min-height constraints after layout has fully stabilized
            // Use triple RAF to ensure all layout calculations are complete
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        // Check each section and remove min-height only if it has grown naturally
                        appliedHeights.forEach((preservedHeight, type) => {
                            const itemsContainer = document.getElementById(`deck-list-items-${type}`);
                            if (itemsContainer) {
                                const section = itemsContainer.closest('.deck-list-section');
                                if (section) {
                                    const currentHeight = section.offsetHeight;
                                    const minHeight = parseInt(section.style.minHeight) || 0;
                                    // Only remove if section has grown beyond preserved height
                                    if (currentHeight > preservedHeight && currentHeight >= minHeight) {
                                        section.style.minHeight = '';
                                        console.log(`✅ Removed min-height constraint for ${type} (${currentHeight}px > ${preservedHeight}px)`);
                                    } else if (currentHeight === preservedHeight) {
                                        // Keep min-height if section hasn't changed size
                                        console.log(`🔒 Keeping min-height for ${type} (${currentHeight}px = ${preservedHeight}px)`);
                                    }
                                }
                            }
                        });
                        
                        const newLeftHeight = existingColumns[0].offsetHeight;
                        const newRightHeight = existingColumns[1].offsetHeight;
                        console.log(`📏 After replacement - Left column: ${newLeftHeight}px, Right column: ${newRightHeight}px`);
                    });
                });
            });
        });
    } else {
        // Use requestAnimationFrame to batch DOM updates and reduce flicker
        requestAnimationFrame(() => {
            // No columns exist yet - do normal render
            deckCardsEditor.innerHTML = html;
            
            // Apply KO dimming (list view)
            if (currentUser) {
                applyKODimming();
            }
            
            // Ultra-aggressive layout enforcement
            ultraAggressiveLayoutEnforcement();
            
            // Set up two-column layout for list view (critical for initial load)
            enforceTwoColumnLayoutInListView();
            
            // Ensure two-column layout is applied after DOM updates (fallback)
            setTimeout(() => {
                enforceTwoColumnLayoutInListView();
            }, 10);
            
            // Apply saved expansion state to list view sections (moved here to run after DOM update)
            typeOrder.forEach(type => {
                const cards = cardsByType[type];
                if (!cards || cards.length === 0) return;
                
                const itemsContainer = document.getElementById(`deck-list-items-${type}`);
                const header = itemsContainer?.previousElementSibling;
                const toggle = header?.querySelector('.deck-list-section-toggle');
                
                if (itemsContainer && header && toggle) {
                    // In read-only list view, always expand sections by default
                    const isExpanded = true; // Always expanded in read-only list view
                    if (!isExpanded) {
                        itemsContainer.style.display = 'none';
                        toggle.textContent = '▶';
                        header.classList.add('collapsed');
                    }
                }
            });
        });
    }
    
    // Force layout recalculation to ensure horizontal orientation
    requestAnimationFrame(() => {
        const listItems = deckCardsEditor.querySelectorAll('.deck-list-item');
        listItems.forEach(item => {
            // Force flex layout to be horizontal
            item.style.display = 'flex';
            item.style.flexDirection = 'row';
            item.style.flexWrap = 'nowrap';
            item.style.width = '100%';
            item.style.minWidth = '100%';
            item.style.boxSizing = 'border-box';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'flex-start';
        });
        
        // Trigger a reflow to ensure the layout is applied
        deckCardsEditor.offsetHeight;
        
        // Additional enforcement after a short delay
        setTimeout(() => {
            const listItems = deckCardsEditor.querySelectorAll('.deck-list-item');
            listItems.forEach(item => {
                item.style.display = 'flex';
                item.style.flexDirection = 'row';
                item.style.flexWrap = 'nowrap';
                item.style.width = '100%';
                item.style.minWidth = '100%';
                item.style.boxSizing = 'border-box';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'flex-start';
            });
        }, 10);
    });
    
    // Update deck summary and card count to ensure Draw Hand button state is correct
    updateDeckEditorCardCount();
    if (typeof updateDeckSummary === 'function') {
        updateDeckSummary(window.deckEditorCards);
    }
}

// Card View category toggle function
function toggleCardViewCategory(categoryType) {
    const cardsContainer = document.getElementById(`cards-${categoryType}`);
    const toggleButton = document.getElementById(`toggle-${categoryType}`);
    const section = cardsContainer ? cardsContainer.closest('.card-view-category-section') : null;
    
    if (cardsContainer && toggleButton) {
        const isCollapsed = cardsContainer.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand the category
            cardsContainer.classList.remove('collapsed');
            toggleButton.classList.remove('collapsed');
            if (section) section.classList.remove('collapsed');
        } else {
            // Collapse the category
            cardsContainer.classList.add('collapsed');
            toggleButton.classList.add('collapsed');
            if (section) section.classList.add('collapsed');
        }
    }
}

// Card View rendering function - Completely independent from Tile View
function renderDeckCardsCardView() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (!deckCardsEditor) return;

    // FORCE flex-direction to column for Card View
    deckCardsEditor.style.display = 'flex';
    deckCardsEditor.style.flexDirection = 'column';
    deckCardsEditor.style.flexWrap = 'nowrap';
    deckCardsEditor.style.alignItems = 'stretch';

    // Card View is now available to all users

    if (window.deckEditorCards.length === 0) {
        deckCardsEditor.innerHTML = `
            <div class="empty-deck-message">
                <p>No cards in this deck yet.</p>
                <p>Drag cards from the right panel to add them!</p>
            </div>
        `;
        return;
    }

    // Group cards by type - Card View specific logic
    const cardsByType = {};
    window.deckEditorCards.forEach((card, index) => {
        let type = card.type;
        // Convert underscore format to hyphen format for consistency
        if (type === 'ally_universe') {
            type = 'ally-universe';
        } else if (type === 'basic_universe') {
            type = 'basic-universe';
        } else if (type === 'advanced_universe') {
            type = 'advanced-universe';
        }
        
        if (!cardsByType[type]) {
            cardsByType[type] = [];
        }
        cardsByType[type].push({ ...card, originalIndex: index });
    });

    // Card View specific type order and display names
    const typeOrder = [
        'character', 'location', 'mission', 'event', 'special', 
        'aspect', 'advanced-universe', 'teamwork', 'ally-universe', 
        'training', 'basic-universe', 'power'
    ];
    
    const typeDisplayNames = {
        'character': 'Characters',
        'location': 'Locations', 
        'mission': 'Missions',
        'event': 'Events',
        'special': 'Special Cards',
        'aspect': 'Aspects',
        'advanced-universe': 'Universe: Advanced',
        'teamwork': 'Universe: Teamwork',
        'ally-universe': 'Universe: Ally',
        'training': 'Universe: Training',
        'basic-universe': 'Universe: Basic',
        'power': 'Power Cards'
    };

    let cardsHtml = '';

    // Extract character order from Characters section for sorting special cards
    const characterOrder = [];
    if (cardsByType['character'] && cardsByType['character'].length > 0) {
        cardsByType['character'].forEach(cardData => {
            const characterCard = window.availableCardsMap.get(cardData.cardId);
            if (characterCard && characterCard.name) {
                const characterName = (characterCard.name || '').trim();
                if (characterName && !characterOrder.includes(characterName)) {
                    characterOrder.push(characterName);
                }
            }
        });
    }

    // Render each type group as a full-width vertical section - completely independent structure
    typeOrder.forEach(type => {
        if (cardsByType[type] && cardsByType[type].length > 0) {
            const typeCards = cardsByType[type];
            const typeName = typeDisplayNames[type] || type;
            const cardCount = typeCards.reduce((total, card) => total + (card.quantity || 1), 0);
            
            // Add "Remove Unusables" button for applicable card types
            let removeUnusablesButton = '';
            if (type === 'special') {
                removeUnusablesButton = `<button class="remove-all-btn card-view-remove-unusables-btn" onclick="event.stopPropagation(); removeUnusableSpecialCards()">Remove Unusables</button>`;
            } else if (type === 'event') {
                removeUnusablesButton = `<button class="remove-all-btn card-view-remove-unusables-btn" onclick="event.stopPropagation(); removeUnusableEvents()">Remove Unusables</button>`;
            } else if (type === 'advanced-universe') {
                removeUnusablesButton = `<button class="remove-all-btn card-view-remove-unusables-btn" onclick="event.stopPropagation(); removeUnusableAdvancedUniverse()">Remove Unusables</button>`;
            } else if (type === 'training') {
                removeUnusablesButton = `<button class="remove-all-btn card-view-remove-unusables-btn" onclick="event.stopPropagation(); removeUnusableTraining()">Remove Unusables</button>`;
            } else if (type === 'ally-universe') {
                removeUnusablesButton = `<button class="remove-all-btn card-view-remove-unusables-btn" onclick="event.stopPropagation(); removeUnusableAllyUniverse()">Remove Unusables</button>`;
            } else if (type === 'basic-universe') {
                removeUnusablesButton = `<button class="remove-all-btn card-view-remove-unusables-btn" onclick="event.stopPropagation(); removeUnusableBasicUniverse()">Remove Unusables</button>`;
            } else if (type === 'power') {
                removeUnusablesButton = `<button class="remove-all-btn card-view-remove-unusables-btn" onclick="event.stopPropagation(); removeUnusablePowerCards()">Remove Unusables</button>`;
            }
            
            cardsHtml += `
                <div class="card-view-category-section" data-type="${type}">
                    <div class="card-view-category-header" onclick="toggleCardViewCategory('${type}')">
                        <span class="card-view-category-name">${typeName}</span>
                        <div class="card-view-category-controls">
                            ${removeUnusablesButton}
                            <span class="card-view-category-count">${cardCount} card${cardCount !== 1 ? 's' : ''}</span>
                            <span class="card-view-category-toggle" id="toggle-${type}">▼</span>
                        </div>
                    </div>
                    <div class="card-view-category-cards" id="cards-${type}">
            `;
            
            // Render cards in horizontal rows - Card View specific rendering
            // For power cards: sort by value with Overpower type tiebreaker (Energy, Combat, Brute Force, Intelligence, Multi Power, Any-Power)
            // For special cards: sort by character order matching Characters section, with "Any Character" specials last
            const cardsForRendering = (type === 'power') ? (() => {
                const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Multi Power', 'Any-Power'];
                const orderIndex = (t) => {
                    const idx = preferredOrder.indexOf(t);
                    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
                };
                const copy = [...typeCards];
                copy.sort((a, b) => {
                    const cardA = window.availableCardsMap.get(a.cardId);
                    const cardB = window.availableCardsMap.get(b.cardId);
                    if (!cardA || !cardB) return 0;
                    const valueA = parseInt(cardA.value) || 0;
                    const valueB = parseInt(cardB.value) || 0;
                    if (valueA !== valueB) return valueA - valueB;
                    const aType = cardA.power_type || '';
                    const bType = cardB.power_type || '';
                    return orderIndex(aType) - orderIndex(bType);
                });
                return copy;
            })() : (type === 'special') ? (() => {
                // Sort special cards by character order, with "Any Character" specials last
                const copy = [...typeCards];
                copy.sort((a, b) => {
                    const cardA = window.availableCardsMap.get(a.cardId);
                    const cardB = window.availableCardsMap.get(b.cardId);
                    if (!cardA || !cardB) return 0;
                    
                    const charA = (cardA.character || '').trim();
                    const charB = (cardB.character || '').trim();
                    
                    // Check if either is "Any Character" (case-insensitive)
                    const aIsAnyCharacter = !charA || charA.toLowerCase().includes('any character') || charA.toLowerCase() === 'any';
                    const bIsAnyCharacter = !charB || charB.toLowerCase().includes('any character') || charB.toLowerCase() === 'any';
                    
                    // "Any Character" specials always go last
                    if (aIsAnyCharacter && !bIsAnyCharacter) return 1;
                    if (!aIsAnyCharacter && bIsAnyCharacter) return -1;
                    if (aIsAnyCharacter && bIsAnyCharacter) {
                        // Both are "Any Character", sort by card name
                        const nameA = (cardA.name || cardA.card_name || '').trim();
                        const nameB = (cardB.name || cardB.card_name || '').trim();
                        return nameA.localeCompare(nameB);
                    }
                    
                    // Both are regular character specials - sort by character order
                    const indexA = characterOrder.indexOf(charA);
                    const indexB = characterOrder.indexOf(charB);
                    
                    // If character not found in order, put it at the end (after "Any Character")
                    if (indexA === -1 && indexB === -1) {
                        // Neither found, sort by character name then card name
                        const charCompare = charA.localeCompare(charB);
                        if (charCompare !== 0) return charCompare;
                        const nameA = (cardA.name || cardA.card_name || '').trim();
                        const nameB = (cardB.name || cardB.card_name || '').trim();
                        return nameA.localeCompare(nameB);
                    }
                    if (indexA === -1) return 1; // A not found, put it after B
                    if (indexB === -1) return -1; // B not found, put it after A
                    
                    // Both found in order - sort by character order
                    if (indexA !== indexB) return indexA - indexB;
                    
                    // Same character - sort by card name
                    const nameA = (cardA.name || cardA.card_name || '').trim();
                    const nameB = (cardB.name || cardB.card_name || '').trim();
                    return nameA.localeCompare(nameB);
                });
                return copy;
            })() : typeCards;

            // Show multiple instances of cards based on quantity
            cardsForRendering.forEach((cardData, cardIndex) => {
                const card = cardData;
                const index = cardData.originalIndex;
                const quantity = card.quantity || 1;
                
                // Direct lookup using UUID
                // If selectedAlternateCardId exists, use that for image lookup; otherwise use original cardId
                const cardIdForImage = card.selectedAlternateCardId || card.cardId;
                let availableCard = window.availableCardsMap.get(cardIdForImage);
                
                // Try alternate key formats for basic-universe cards
                if ((card.type === 'basic-universe' || card.type === 'basic_universe') && !availableCard) {
                    const normalizedType = 'basic-universe';
                    availableCard = window.availableCardsMap.get(`${normalizedType}_${cardIdForImage}`) ||
                                  window.availableCardsMap.get(`${card.type}_${cardIdForImage}`);
                    
                    if (!availableCard) {
                        // Card not found - will use placeholder
                    }
                }
                
                if (!availableCard) {
                    console.warn('Card not found in availableCardsMap:', cardIdForImage);
                    return;
                }
                
                // Get card image path - use the alternate card's image if selected
                const cardImagePath = getCardImagePath(availableCard, card.type);
                
                // Check if this card has alternate arts (same logic as tile view)
                let hasAlternateArts = false;
                if (availableCard && window.availableCardsMap) {
                    if (card.type === 'character') {
                        const name = (availableCard.name || '').trim();
                        const set = (availableCard.set || 'ERB').trim() || 'ERB';
                        let count = 0;
                        window.availableCardsMap.forEach((c, id) => {
                            const cardType = c.cardType || c.type || '';
                            if ((cardType === 'character' || id.startsWith('char_')) && 
                                (c.name || '').trim() === name && 
                                (c.set || 'ERB').trim() === set) {
                                count++;
                            }
                        });
                        hasAlternateArts = count > 1;
                    } else if (card.type === 'special') {
                        const characterName = (availableCard.character || '').trim();
                        const cardName = (availableCard.name || availableCard.card_name || '').trim();
                        const uniqueImagePaths = new Set();
                        window.availableCardsMap.forEach((c, id) => {
                            const cardType = c.cardType || c.type || '';
                            if ((cardType === 'special' || id.startsWith('special_')) && 
                                (c.character || '').trim() === characterName && 
                                (c.name || c.card_name || '').trim() === cardName) {
                                const imagePath = getCardImagePath(c, 'special');
                                uniqueImagePaths.add(imagePath);
                            }
                        });
                        // Only show button if there are multiple unique image paths
                        hasAlternateArts = uniqueImagePaths.size > 1;
                    } else if (card.type === 'power') {
                        // Group by value and power_type only (not by set) to include alternates across all sets
                        // Check for unique image paths, not just card count
                        const value = String(availableCard.value || '').trim();
                        const powerType = (availableCard.power_type || '').trim();
                        const uniqueImagePaths = new Set();
                        window.availableCardsMap.forEach((c, id) => {
                            const cardType = c.cardType || c.type || '';
                            if ((cardType === 'power' || id.startsWith('power_')) && 
                                String(c.value || '').trim() === value && 
                                (c.power_type || '').trim() === powerType) {
                                const imagePath = getCardImagePath(c, 'power');
                                uniqueImagePaths.add(imagePath);
                            }
                        });
                        hasAlternateArts = uniqueImagePaths.size > 1;
                    } else if (card.type === 'location') {
                        // For locations, group by name - alternates are separate rows with same name
                        // Use Set to count unique location IDs (map stores same card under multiple keys)
                        const name = (availableCard.name || '').trim();
                        const uniqueLocationIds = new Set();
                        window.availableCardsMap.forEach((c, id) => {
                            const iterCardType = c.cardType || c.type || '';
                            if ((iterCardType === 'location' || id.startsWith('location_')) && 
                                (c.name || '').trim() === name) {
                                uniqueLocationIds.add(c.id || id);
                            }
                        });
                        hasAlternateArts = uniqueLocationIds.size > 1;
                    }
                }
                
                // Create Change Art button if card has alternate arts
                const changeArtButton = hasAlternateArts ? 
                    `<button class="alternate-art-btn card-view-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>` : '';
                
                // Add quantity buttons for applicable card types
                let quantityButtons = '';
                if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
                    quantityButtons = `
                        <button class="remove-one-btn card-view-btn" onclick="removeOneCardFromEditor(${index})">-1</button>
                        <button class="add-one-btn card-view-btn" onclick="addOneCardToEditor(${index})">+1</button>
                    `;
                } else if (card.type === 'character') {
                    // For characters, add remove button, KO button, and reserve button
                    const reserveButton = getReserveCharacterButton(card.cardId, index);
                    const koButton = currentUser 
                        ? `<button class="ko-btn card-view-btn ${window.SimulateKO && window.SimulateKO.isKOd(card.cardId) ? 'active' : ''}" onclick="toggleKOCharacter('${card.cardId}', ${index})" title="${window.SimulateKO && window.SimulateKO.isKOd(card.cardId) ? 'Un-KO Character' : 'KO Character'}">KO</button>`
                        : '';
                    quantityButtons = `
                        <button class="quantity-btn card-view-btn" onclick="removeCardFromEditor(${index})">-</button>
                        ${koButton}
                        ${reserveButton}
                    `;
                } else {
                    quantityButtons = `<button class="quantity-btn card-view-btn" onclick="removeCardFromEditor(${index})">-</button>`;
                }
                
                // Add Pre-Placed button for Training cards when Spartan Training Ground is present
                // Add Pre-Placed button for Basic Universe cards when Dracula's Armory is present
                // Add Pre-Placed button for Sword and Shield special card when Lancelot is present
                let prePlacedButton = '';
                if (card.type === 'training' && hasSpartanTrainingGround()) {
                    const isExcluded = card.exclude_from_draw === true;
                    const activeClass = isExcluded ? 'active' : '';
                    prePlacedButton = `
                        <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawTrainingCard('${card.cardId}', ${index})" title="${isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)'}">Pre-Placed</button>
                    `;
                } else if (card.type === 'basic-universe' && hasDraculasArmory()) {
                    const isExcluded = card.exclude_from_draw === true;
                    const activeClass = isExcluded ? 'active' : '';
                    prePlacedButton = `
                        <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawBasicUniverseCard('${card.cardId}', ${index})" title="${isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)'}">Pre-Placed</button>
                    `;
                } else if (card.type === 'special' && hasLancelot()) {
                    // Check if this is Sword and Shield special card
                    const cardData = window.availableCardsMap.get(card.cardId);
                    const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';
                    if (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield')) {
                        const isExcluded = card.exclude_from_draw === true;
                        const activeClass = isExcluded ? 'active' : '';
                        prePlacedButton = `
                            <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawSwordAndShield('${card.cardId}', ${index})" title="${isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)'}">Pre-Placed</button>
                        `;
                    }
                }
                
                // Check if this character is KO'd (for card view)
                const isKOdCardView = card.type === 'character' && window.SimulateKO && window.SimulateKO.isKOd(card.cardId);
                const koDimmedClassCardView = isKOdCardView ? 'ko-dimmed' : '';
                
                // Render multiple instances of the card based on quantity
                for (let i = 0; i < quantity; i++) {
                    // Get instance-specific alternate card ID if it exists
                    const instanceCardId = (card.selectedAlternateCardIds && card.selectedAlternateCardIds[i]) 
                        ? card.selectedAlternateCardIds[i] 
                        : (card.selectedAlternateCardId || card.cardId);
                    
                    // Look up the card for this instance
                    let instanceAvailableCard = window.availableCardsMap.get(instanceCardId);
                    if (!instanceAvailableCard) {
                        instanceAvailableCard = availableCard; // Fallback to original
                    }
                    
                    // Get instance-specific image path (thumbnail for character display, full-res for modal)
                    const instanceImagePath = getCardImagePath(instanceAvailableCard, card.type, card.type === 'character' ? { useThumbnail: true } : {});
                    const instanceFullResPath = getCardImagePath(instanceAvailableCard, card.type);

                    // Create instance-specific Change Art button
                    const instanceChangeArtButton = changeArtButton.replace(
                        `showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})`,
                        `showAlternateArtSelectionForExistingCard('${card.cardId}', ${index}, ${i})`
                    );
                    
                    cardsHtml += `
                        <div class="deck-card-card-view-item ${koDimmedClassCardView}" 
                             data-index="${index}" 
                             data-card-id="${card.cardId}"
                             data-type="${card.type}"
                             data-instance="${i + 1}"
                             onmouseenter="showCardHoverModal('${instanceFullResPath.replace(/'/g, "\\'")}', '${(instanceAvailableCard.name || instanceAvailableCard.card_name || 'Card').replace(/'/g, "\\'")}')"
                             onmouseleave="hideCardHoverModal()">
                            <img src="${instanceImagePath}" data-full-res="${instanceFullResPath}" alt="${instanceAvailableCard.name || instanceAvailableCard.card_name || 'Card'}" class="card-view-image">
                            <div class="card-view-actions">
                                ${instanceChangeArtButton}
                                ${quantityButtons}
                                ${prePlacedButton}
                                ${card.type === 'mission' ? getDisplayMissionButton(card.cardId, index) : ''}
                            </div>
                        </div>
                    `;
                }
            });
            
            cardsHtml += `
                    </div>
                </div>
            `;
        }
    });

    deckCardsEditor.innerHTML = cardsHtml;
    
    // Apply KO dimming (card view)
    if (currentUser) {
        applyKODimming();
    }
    
    // Update deck summary and card count to ensure Draw Hand button state is correct
    updateDeckEditorCardCount();
    if (typeof updateDeckSummary === 'function') {
        updateDeckSummary(window.deckEditorCards);
    }
}


// ===== Category toggle, power sort, character/mission group toggles =====

function toggleCategory(headerElement) {
    const category = headerElement.closest('.card-category');
    const content = category.querySelector('.card-category-content');
    const icon = headerElement.querySelector('.collapse-icon');
    
    if (headerElement.classList.contains('collapsed')) {
        // Expand
        headerElement.classList.remove('collapsed');
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        icon.textContent = '▼';
    } else {
        // Collapse
        headerElement.classList.add('collapsed');
        content.classList.add('collapsed');
        content.classList.remove('expanded');
        icon.textContent = '▶';
    }
}

// Toggle power cards sort mode between type and value
async function togglePowerCardsSort() {
    // Toggle the sort mode
    powerCardsSortMode = powerCardsSortMode === 'value' ? 'type' : 'value';
    
    // Update button text
    const sortButton = document.getElementById('powerCardsSortToggle');
    if (sortButton) {
        sortButton.textContent = powerCardsSortMode === 'value' ? 'Sort by Type' : 'Sort by Value';
    }
    
    // Save sort mode to localStorage
    if (currentDeckId) {
        localStorage.setItem(`powerCardsSortMode_${currentDeckId}`, powerCardsSortMode);
        
        // Also save UI preferences to database
        const preferences = getCurrentUIPreferences();
        saveUIPreferences(currentDeckId, preferences);
    }
    
    // Re-render the deck to apply new sort mode
    await displayDeckCardsForEditing();
}

// Load power cards sort mode from localStorage
function loadPowerCardsSortMode() {
    if (currentDeckId) {
        const savedMode = localStorage.getItem(`powerCardsSortMode_${currentDeckId}`);
        if (savedMode && (savedMode === 'type' || savedMode === 'value')) {
            powerCardsSortMode = savedMode;
        }
    }
}

// Toggle character group collapse/expand within special cards and power cards
function toggleCharacterGroup(headerElement, groupKey = null) {
    // Character group expansion is a UI-only operation that should be allowed for all users
    // No security check needed - this is just visual state management
    
    const group = headerElement.closest('.character-group');
    const content = group.querySelector('.character-group-content');
    const icon = headerElement.querySelector('.collapse-icon');
    const groupName = headerElement.querySelector('span').textContent.split(' (')[0]; // Extract group name
    
    // Use provided groupKey or fall back to groupName for backward compatibility
    const stateKey = groupKey || groupName;
    
    if (content.classList.contains('collapsed')) {
        // Expand
        content.classList.remove('collapsed');
        icon.textContent = '▼';
        characterGroupExpansionState[stateKey] = true;
    } else {
        // Collapse
        content.classList.add('collapsed');
        icon.textContent = '▶';
        characterGroupExpansionState[stateKey] = false;
    }
    
    // Save character group expansion state
    saveCharacterGroupExpansionState();
}

function toggleMissionSetGroup(headerElement) {
    const group = headerElement.closest('.mission-set-group');
    const content = group.querySelector('.mission-set-group-content');
    const icon = headerElement.querySelector('.collapse-icon');
    
    if (content.classList.contains('collapsed')) {
        // Expand
        content.classList.remove('collapsed');
        icon.textContent = '▼';
    } else {
        // Collapse
        content.classList.add('collapsed');
        icon.textContent = '▶';
    }
}


// ===== displayDeckCardsForEditing =====

async function displayDeckCardsForEditing() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    
    if (window.deckEditorCards.length === 0) {
        deckCardsEditor.innerHTML = `
            <div class="empty-deck-message">
                <p>No cards in this deck yet.</p>
                <p>Drag cards from the right panel to add them!</p>
            </div>
        `;
        
        // Validate empty deck
        await showDeckValidation(window.deckEditorCards);
        return;
    }
    
    // Validate deck and show results
    await showDeckValidation(window.deckEditorCards);
    
    // Group cards by type (normalize underscore format to hyphen format)
    const cardsByType = {};
    window.deckEditorCards.forEach((card, index) => {
        let type = card.type;
        // Convert underscore format to hyphen format for consistency
        if (type === 'ally_universe') {
            type = 'ally-universe';
        } else if (type === 'basic_universe') {
            type = 'basic-universe';
        } else if (type === 'advanced_universe') {
            type = 'advanced-universe';
        }
        
        if (!cardsByType[type]) {
            cardsByType[type] = [];
        }
        cardsByType[type].push({ ...card, originalIndex: index });
    });
    
    // Define type order and display names (using frontend format with hyphens)
    const typeOrder = [
        'character', 'location', 'mission', 'event', 'special', 
        'aspect', 'advanced-universe', 'teamwork', 'ally-universe', 
        'training', 'basic-universe', 'power'
    ];
    
    const typeDisplayNames = {
        'character': 'Characters',
        'location': 'Locations', 
        'mission': 'Missions',
        'event': 'Events',
        'special': 'Special Cards',
        'aspect': 'Aspects',
        'advanced-universe': 'Universe: Advanced',
        'teamwork': 'Universe: Teamwork',
        'ally-universe': 'Universe: Ally',
        'training': 'Universe: Training',
        'basic-universe': 'Universe: Basic',
        'power': 'Power Cards'
    };
    
    let cardsHtml = '';
    
    // Render each type group
    typeOrder.forEach(type => {
        if (cardsByType[type] && cardsByType[type].length > 0) {
            const typeCards = cardsByType[type];
            const typeName = typeDisplayNames[type] || formatCardType(type);
            const cardCount = typeCards.reduce((total, card) => total + (card.quantity || 1), 0);
            
            // For missions, find the most represented mission set
            let additionalInfo = '';
            if (type === 'mission' && typeCards.length > 0) {
                const missionSetCounts = {};
                typeCards.forEach(cardData => {
                    // Since deck_cards.card_id now contains UUIDs, we can look up directly
                    const availableCard = window.availableCardsMap.get(cardData.cardId);
                    if (availableCard && availableCard.mission_set) {
                        missionSetCounts[availableCard.mission_set] = (missionSetCounts[availableCard.mission_set] || 0) + 1;
                    }
                });
                
                if (Object.keys(missionSetCounts).length > 0) {
                    const mostRepresentedSet = Object.entries(missionSetCounts)
                        .sort(([,a], [,b]) => b - a)[0];
                    additionalInfo = `<span class="deck-type-info">(${mostRepresentedSet[0]})</span>`;
                }
            }
            
            // Add remove all button for all card types
            let removeAllButton = '';
            if (type === 'mission') {
                removeAllButton = `<button class="remove-all-btn" onclick="event.stopPropagation(); removeAllMissionsFromDeck()">Remove All</button>`;
            } else if (type === 'special') {
                removeAllButton = `
                    <button class="remove-all-btn" onclick="event.stopPropagation(); removeUnusableSpecialCards()">Remove Unusables</button>
                    <button class="remove-all-btn" onclick="event.stopPropagation(); removeAllCardsFromDeck('${type}')">Remove All</button>
                `;
            } else if (type === 'power') {
                const sortButtonText = powerCardsSortMode === 'value' ? 'Sort by Type' : 'Sort by Value';
                removeAllButton = `
                    <button class="remove-all-btn" id="powerCardsSortToggle" onclick="event.stopPropagation(); togglePowerCardsSort()">${sortButtonText}</button>
                    <button class="remove-all-btn" onclick="event.stopPropagation(); removeAllCardsFromDeck('${type}')">Remove All</button>
                `;
            } else {
                removeAllButton = `<button class="remove-all-btn" onclick="event.stopPropagation(); removeAllCardsFromDeck('${type}')">Remove All</button>`;
            }
            
            // Special formatting for character count
            let countDisplay = '';
            if (type === 'character') {
                if (cardCount === 4) {
                    countDisplay = ''; // Hide count when exactly 4 characters
                } else {
                    countDisplay = `${cardCount}/4 Characters Selected`;
                }
            } else {
                countDisplay = `${cardCount} card${cardCount !== 1 ? 's' : ''}`;
            }
            
            cardsHtml += `
                <div class="deck-type-section" data-type="${type}" ondragover="handleDeckCardDragOver(event)" ondrop="handleDeckCardDrop(event)">
                    <div class="deck-type-header" onclick="toggleDeckTypeSection('${type}')">
                        <div class="deck-type-left">
                            <span class="deck-type-name">${typeName}</span>
                            <span class="deck-type-count">${countDisplay}</span>
                            ${additionalInfo}
                        </div>
                        <div class="deck-type-right">
                            ${removeAllButton}
                            <span class="deck-type-toggle">▼</span>
                        </div>
                    </div>
                    <div class="deck-type-cards" id="deck-type-${type}">
            `;
            
            
            if (type === 'special') {
                // Special handling for special cards - group by character
                const characterGroups = {};
                
                typeCards.forEach(cardData => {
                    const card = cardData;
                    // Convert internal type format to map key format
                    let mapKeyType = card.type;
                    if (card.type === 'ally_universe') {
                        mapKeyType = 'ally-universe';
                    } else if (card.type === 'basic_universe') {
                        mapKeyType = 'basic-universe';
                    } else if (card.type === 'advanced_universe') {
                        mapKeyType = 'advanced-universe';
                    }
                    // Direct lookup using UUID
                    const availableCard = window.availableCardsMap.get(card.cardId);
                    
                    if (!availableCard) {
                        console.warn('Special card not found in availableCardsMap:', card);
                        return;
                    }
                    
                    const characterName = availableCard.character || availableCard.character_name || 'Any Character';
                    if (!characterGroups[characterName]) {
                        characterGroups[characterName] = [];
                    }
                    characterGroups[characterName].push(cardData);
                });
                
                // Sort character names alphabetically, but put "Any Character" first
                const sortedCharacterNames = Object.keys(characterGroups).sort((a, b) => {
                    if (a === 'Any Character') return -1;
                    if (b === 'Any Character') return 1;
                    return a.localeCompare(b);
                });
                
                sortedCharacterNames.forEach(characterName => {
                    const characterCards = characterGroups[characterName];
                    const cardCount = characterCards.reduce((total, card) => total + (card.quantity || 1), 0);
                    
                    // Check if this character group should be expanded
                    const isExpanded = characterGroupExpansionState[characterName] === true;
                    const collapsedClass = isExpanded ? '' : 'collapsed';
                    const iconText = isExpanded ? '▼' : '▶';
                    
                    cardsHtml += `
                        <div class="character-group">
                            <div class="character-group-header" onclick="toggleCharacterGroup(this)">
                                <span>${characterName} (${cardCount})</span>
                                <span class="collapse-icon">${iconText}</span>
                            </div>
                            <div class="character-group-content ${collapsedClass}">
                    `;
                    
                    characterCards.forEach(cardData => {
                        const card = cardData;
                        const index = cardData.originalIndex;
                        // Convert internal type format to map key format
        let mapKeyType = card.type;
        if (card.type === 'ally_universe') {
            mapKeyType = 'ally-universe';
        } else if (card.type === 'basic_universe' || card.type === 'basic-universe') {
            mapKeyType = 'basic-universe';
        } else if (card.type === 'advanced_universe' || card.type === 'advanced-universe') {
            mapKeyType = 'advanced-universe';
        }
        // Direct lookup using UUID
        // If selectedAlternateCardId exists, use that for image lookup; otherwise use original cardId
        // Use per-instance alternate card ID if available, otherwise fall back
        const cardIdForLookup = (card.selectedAlternateCardIds && card.selectedAlternateCardIds[0]) 
            ? card.selectedAlternateCardIds[0] 
            : (card.selectedAlternateCardId || card.cardId);
        let availableCard = window.availableCardsMap.get(cardIdForLookup);
                        
                        if (!availableCard && (card.type === 'basic-universe' || card.type === 'basic_universe')) {
                            // Try alternate key formats for basic-universe cards
                            availableCard = window.availableCardsMap.get(`basic-universe_${cardIdForLookup}`) || 
                                           window.availableCardsMap.get(`basic_universe_${cardIdForLookup}`);
                            if (!availableCard) {
                                console.warn('❌ BASIC_UNIVERSE DISPLAY: Card not found with any key format:', {
                                    cardId: cardIdForLookup,
                                    type: card.type,
                                    availableKeysSample: Array.from(window.availableCardsMap.keys()).filter(k => k.includes('basic') || k.includes(cardIdForLookup)).slice(0, 10)
                                });
                            }
                        }
                        
                        if (!availableCard) {
                            console.warn('Card not found in availableCardsMap:', cardIdForLookup);
                            return;
                        }
                        
                        // For display purposes, if we used alternate card, we still need the original card for other data
                        // But for image, we'll use the alternate card's image
                        const imageCard = availableCard; // Use alternate card for image if selected
                        
                        // Special card - no additional details
                        const cardDetails = '';
                        
                        
                        // Determine the correct CSS class based on card type (normalize to handle both formats)
                        const normalizedType = (card.type === 'basic_universe' || card.type === 'basic-universe') ? 'basic-universe' : 
                                              (card.type === 'ally_universe' || card.type === 'ally-universe') ? 'ally-universe' :
                                              (card.type === 'advanced_universe' || card.type === 'advanced-universe') ? 'advanced-universe' : card.type;
                        let cardClass = 'special-card';
                        if (normalizedType === 'ally-universe') {
                            cardClass = 'ally-universe-card';
                        } else if (normalizedType === 'basic-universe') {
                            cardClass = 'basic-universe-card';
                        } else if (normalizedType === 'advanced-universe') {
                            cardClass = 'advanced-universe-card';
                        } else if (normalizedType === 'training') {
                            cardClass = 'training-card';
                        } else if (normalizedType === 'teamwork') {
                            cardClass = 'teamwork-card';
                        }
                        
                        // Format card display name (handle both underscore and hyphen formats)
                        let cardDisplayName;
                        if (normalizedType === 'teamwork') {
                            cardDisplayName = `${availableCard.to_use} -> ${availableCard.followup_attack_types} (${availableCard.first_attack_bonus}/${availableCard.second_attack_bonus})`;
                        } else if (normalizedType === 'ally-universe') {
                            cardDisplayName = `${availableCard.card_name} - ${availableCard.stat_to_use} ${availableCard.stat_type_to_use} → ${availableCard.attack_value} ${availableCard.attack_type}`;
                        } else if (normalizedType === 'basic-universe') {
                            cardDisplayName = `${availableCard.card_name} - ${availableCard.type} (${availableCard.value_to_use} → ${availableCard.bonus})`;
                        } else if (normalizedType === 'training') {
                            cardDisplayName = `${(availableCard.card_name || '').replace(/^Training \(/, '').replace(/\)$/, '')} - ${availableCard.type_1} + ${availableCard.type_2} (${availableCard.value_to_use} → ${availableCard.bonus})`;
                        } else {
                            cardDisplayName = availableCard.name || availableCard.card_name || getCardName(card);
                        }
                        
                        // Check if this special card has alternate arts (different image paths)
                        let hasAlternateArtsSpecial = false;
                        if (availableCard && window.availableCardsMap) {
                            const characterName = (availableCard.character || '').trim();
                            const cardName = (availableCard.name || availableCard.card_name || '').trim();
                            const currentImagePath = getCardImagePath(availableCard, 'special');
                            const uniqueImagePaths = new Set();
                            window.availableCardsMap.forEach((c, id) => {
                                const cardType = c.cardType || c.type || '';
                                if ((cardType === 'special' || id.startsWith('special_')) && 
                                    (c.character || '').trim() === characterName && 
                                    (c.name || c.card_name || '').trim() === cardName) {
                                    const imagePath = getCardImagePath(c, 'special');
                                    uniqueImagePaths.add(imagePath);
                                }
                            });
                            // Only show button if there are multiple unique image paths
                            hasAlternateArtsSpecial = uniqueImagePaths.size > 1;
                        }
                        const changeArtButtonSpecial = hasAlternateArtsSpecial ? 
                            `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>` : '';
                        
                        cardsHtml += `
                            <div class="deck-card-editor-item preview-view ${cardClass}" draggable="true" data-index="${index}" data-type="${card.type}"
                                 data-bg-image="${getCardImagePath(availableCard, card.type)}"
                                 onmouseenter="showCardHoverModal('${getCardImagePath(availableCard, card.type)}', '${cardDisplayName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()"
                                 ondragstart="handleDeckCardDragStart(event)"
                                 ondragend="handleDeckCardDragEnd(event)"
                                 ondragover="handleDeckCardDragOver(event)"
                                 ondrop="handleDeckCardDrop(event)">
                                <div class="deck-card-editor-info">
                                    <div class="deck-card-editor-name">${cardDisplayName}${card.quantity > 1 ? ` (${card.quantity})` : ''}</div>
                                    <div class="deck-card-editor-stats">${cardDetails}</div>
                                </div>
                                <div class="deck-card-editor-actions">
                                    ${changeArtButtonSpecial}
                                    <button class="remove-one-btn" onclick="removeOneCardFromEditor(${index})">-1</button>
                                    <button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>
                                </div>
                            </div>
                        `;
                    });
                    
                    cardsHtml += `
                            </div>
                        </div>
                    `;
                });
            } else if (type === 'power') {
                if (powerCardsSortMode === 'type') {
                    // Special handling for power cards - group by power type
                    const powerTypeGroups = {};
                    
                    typeCards.forEach(cardData => {
                        const card = cardData;
                        // Convert internal type format to map key format
                        let mapKeyType = card.type;
                        if (card.type === 'ally_universe') {
                            mapKeyType = 'ally-universe';
                        } else if (card.type === 'basic-universe') {
                            mapKeyType = 'basic-universe';
                        } else if (card.type === 'advanced_universe') {
                            mapKeyType = 'advanced-universe';
                        }
                        // Direct lookup using UUID
                    const availableCard = window.availableCardsMap.get(card.cardId);
                        
                        if (!availableCard) {
                            console.warn('Power card not found in availableCardsMap:', card);
                            return;
                        }
                        
                        const powerType = availableCard.power_type || 'Unknown';
                        if (!powerTypeGroups[powerType]) {
                            powerTypeGroups[powerType] = [];
                        }
                        powerTypeGroups[powerType].push(cardData);
                    });
                    
                    // Sort power types using OverPower order: Energy → Combat → Brute Force → Intelligence → Multi Power → Any-Power
                    const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Multi Power', 'Any-Power'];
                    const sortedPowerTypes = Object.keys(powerTypeGroups).sort((a, b) => {
                        const aIndex = preferredOrder.indexOf(a);
                        const bIndex = preferredOrder.indexOf(b);
                        
                        // If both are in preferred order, sort by their position
                        if (aIndex !== -1 && bIndex !== -1) {
                            return aIndex - bIndex;
                        }
                        
                        // If only one is in preferred order, prioritize it
                        if (aIndex !== -1) return -1;
                        if (bIndex !== -1) return 1;
                        
                        // If neither is in preferred order, sort alphabetically
                        return a.localeCompare(b);
                    });
                    
                    sortedPowerTypes.forEach(powerType => {
                        const powerTypeCards = powerTypeGroups[powerType];
                        const cardCount = powerTypeCards.reduce((total, card) => total + (card.quantity || 1), 0);
                        
                        // Check if this power type group should be expanded
                        const isExpanded = characterGroupExpansionState[`power_${powerType}`] === true;
                        const collapsedClass = isExpanded ? '' : 'collapsed';
                        const iconText = isExpanded ? '▼' : '▶';
                        
                        cardsHtml += `
                            <div class="character-group">
                                <div class="character-group-header" onclick="toggleCharacterGroup(this, 'power_${powerType}')">
                                    <span>${powerType} (${cardCount})</span>
                                    <span class="collapse-icon">${iconText}</span>
                                </div>
                                <div class="character-group-content ${collapsedClass}">
                        `;
                        
                        powerTypeCards.forEach(cardData => {
                            const card = cardData;
                            const index = cardData.originalIndex;
                            // Convert internal type format to map key format
                            let mapKeyType = card.type;
                            if (card.type === 'ally_universe') {
                                mapKeyType = 'ally-universe';
                            } else if (card.type === 'basic-universe') {
                                mapKeyType = 'basic-universe';
                            } else if (card.type === 'advanced_universe') {
                                mapKeyType = 'advanced-universe';
                            }
                            // Direct lookup using UUID
                    const availableCard = window.availableCardsMap.get(card.cardId);
                            
                            if (!availableCard) {
                                console.warn('Card not found in availableCardsMap:', card);
                                return;
                            }
                            
                            // Power card details - no additional details needed
                            const cardDetails = '';
                            
                            // Check if this power card has alternate arts
                            // Group by value and power_type only (not by set) to include alternates across all sets
                            // Check for unique image paths, not just card count
                            let hasAlternateArtsPower1 = false;
                            if (availableCard && window.availableCardsMap) {
                                const value = String(availableCard.value || '').trim();
                                const powerType = (availableCard.power_type || '').trim();
                                const uniqueImagePaths = new Set();
                                window.availableCardsMap.forEach((c, id) => {
                                    const cardType = c.cardType || c.type || '';
                                    if ((cardType === 'power' || id.startsWith('power_')) && 
                                        String(c.value || '').trim() === value && 
                                        (c.power_type || '').trim() === powerType) {
                                        const imagePath = getCardImagePath(c, 'power');
                                        uniqueImagePaths.add(imagePath);
                                    }
                                });
                                hasAlternateArtsPower1 = uniqueImagePaths.size > 1;
                            }
                            const changeArtButtonPower1 = hasAlternateArtsPower1 ? 
                                `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>` : '';
                            
                            cardsHtml += `
                                <div class="deck-card-editor-item preview-view power-card" draggable="true" data-index="${index}" data-type="${card.type}"
                                     data-bg-image="${getCardImagePath(availableCard, card.type)}"
                                     onmouseenter="showCardHoverModal('${getCardImagePath(availableCard, card.type)}', '${`${availableCard.value} - ${availableCard.power_type}`.replace(/'/g, "\\'")}')"
                                     onmouseleave="hideCardHoverModal()"
                                     ondragstart="handleDeckCardDragStart(event)"
                                     ondragend="handleDeckCardDragEnd(event)"
                                     ondragover="handleDeckCardDragOver(event)"
                                     ondrop="handleDeckCardDrop(event)">
                                    <div class="deck-card-editor-info">
                                        <div class="deck-card-editor-name">${`${availableCard.value} - ${availableCard.power_type}`} ${card.quantity > 1 ? `(${card.quantity})` : ''}</div>
                                        <div class="deck-card-editor-stats">${cardDetails}</div>
                                    </div>
                                    <div class="deck-card-editor-actions">
                                        ${changeArtButtonPower1}
                                        ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `<button class="remove-one-btn" onclick="removeOneCardFromEditor(${index})">-1</button>` : ''}
                                        ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `<button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>` : ''}
                                        ${card.type === 'character' || card.type === 'location' || card.type === 'mission' ? `<button class="quantity-btn" onclick="removeCardFromEditor(${index})">-</button>` : ''}
                                    </div>
                                </div>
                            `;
                        });
                        
                        cardsHtml += `
                                </div>
                            </div>
                        `;
                    });
                } else {
                // Value sorted view - sort all power cards by value, then Overpower type order
                const sortedCards = [...typeCards].sort((a, b) => {
                        // Direct lookup using UUID
                        const cardA = window.availableCardsMap.get(a.cardId);
                        const cardB = window.availableCardsMap.get(b.cardId);
                        if (!cardA || !cardB) return 0;
                        const valueA = parseInt(cardA.value) || 0;
                        const valueB = parseInt(cardB.value) || 0;
                        if (valueA !== valueB) return valueA - valueB;
                        const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Multi Power', 'Any-Power'];
                        const orderIndex = (t) => {
                            const idx = preferredOrder.indexOf(t);
                            return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
                        };
                        return orderIndex(cardA.power_type || '') - orderIndex(cardB.power_type || '');
                    });
                    
                    sortedCards.forEach(cardData => {
                        const card = cardData;
                        const index = cardData.originalIndex;
                        // Direct lookup using UUID
                        const availableCard = window.availableCardsMap.get(card.cardId);
                        
                        if (!availableCard) {
                            console.warn('Card not found in availableCardsMap:', card);
                            return;
                        }
                        
                        // Power card details - no additional details needed
                        const cardDetails = '';
                        
                        // Check if this power card has alternate arts
                        // Group by value and power_type only (not by set) to include alternates across all sets
                        // Check for unique image paths, not just card count
                        let hasAlternateArtsPower2 = false;
                        if (availableCard && window.availableCardsMap) {
                            const value = String(availableCard.value || '').trim();
                            const powerType = (availableCard.power_type || '').trim();
                            const uniqueImagePaths = new Set();
                            window.availableCardsMap.forEach((c, id) => {
                                const cardType = c.cardType || c.type || '';
                                if ((cardType === 'power' || id.startsWith('power_')) && 
                                    String(c.value || '').trim() === value && 
                                    (c.power_type || '').trim() === powerType) {
                                    const imagePath = getCardImagePath(c, 'power');
                                    uniqueImagePaths.add(imagePath);
                                }
                            });
                            hasAlternateArtsPower2 = uniqueImagePaths.size > 1;
                        }
                        const changeArtButtonPower2 = hasAlternateArtsPower2 ? 
                            `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>` : '';
                        
                        cardsHtml += `
                            <div class="deck-card-editor-item preview-view power-card" draggable="true" data-index="${index}" data-type="${card.type}"
                                 data-bg-image="${getCardImagePath(availableCard, card.type)}"
                                 onmouseenter="showCardHoverModal('${getCardImagePath(availableCard, card.type)}', '${`${availableCard.value} - ${availableCard.power_type}`.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()"
                                 ondragstart="handleDeckCardDragStart(event)"
                                 ondragend="handleDeckCardDragEnd(event)"
                                 ondragover="handleDeckCardDragOver(event)"
                                 ondrop="handleDeckCardDrop(event)">
                                <div class="deck-card-editor-info">
                                    <div class="deck-card-editor-name">${`${availableCard.value} - ${availableCard.power_type}`} ${card.quantity > 1 ? `(${card.quantity})` : ''}</div>
                                    <div class="deck-card-editor-stats">${cardDetails}</div>
                                </div>
                                <div class="deck-card-editor-actions">
                                    ${changeArtButtonPower2}
                                    ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `<button class="remove-one-btn" onclick="removeOneCardFromEditor(${index})">-1</button>` : ''}
                                    ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `<button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>` : ''}
                                    ${card.type === 'character' || card.type === 'location' || card.type === 'mission' ? `<button class="quantity-btn" onclick="removeCardFromEditor(${index})">-</button>` : ''}
                                </div>
                            </div>
                        `;
                    });
                }
            } else {
                // Regular handling for all other card types
                typeCards.forEach(cardData => {
                    const card = cardData;
                    const index = cardData.originalIndex;
                    // Convert internal type format to map key format
                    let mapKeyType = card.type;
                    if (card.type === 'ally_universe') {
                        mapKeyType = 'ally-universe';
                    } else if (card.type === 'basic_universe' || card.type === 'basic-universe') {
                        mapKeyType = 'basic-universe';
                    } else if (card.type === 'advanced_universe' || card.type === 'advanced-universe') {
                        mapKeyType = 'advanced-universe';
                    }
                    // Direct lookup using UUID
                    let availableCard = window.availableCardsMap.get(card.cardId);
                    
                    // Try alternate key formats for universe cards if direct lookup fails
                    if (!availableCard && (card.type === 'basic-universe' || card.type === 'basic_universe' || 
                                          card.type === 'ally-universe' || card.type === 'ally_universe' ||
                                          card.type === 'advanced-universe' || card.type === 'advanced_universe')) {
                        const normalizedType = (card.type === 'basic_universe' || card.type === 'basic-universe') ? 'basic-universe' : 
                                              (card.type === 'ally_universe' || card.type === 'ally-universe') ? 'ally-universe' :
                                              'advanced-universe';
                        availableCard = window.availableCardsMap.get(`${normalizedType}_${card.cardId}`) ||
                                      window.availableCardsMap.get(`${card.type}_${card.cardId}`);
                    }
                
                if (!availableCard) {
                    console.warn('Card not found in availableCardsMap:', card);
                    console.warn('Available cards map keys (first 20):', Array.from(window.availableCardsMap.keys()).slice(0, 20));
                    console.warn('Looking for cardId:', card.cardId);
                    console.warn('Card type:', card.type);
                    // Try to find any basic-universe cards in the map
                    if (card.type === 'basic-universe' || card.type === 'basic_universe') {
                        const basicUniverseCards = Array.from(window.availableCardsMap.entries()).filter(([k, v]) => 
                            v && (v.type === 'basic-universe' || v.cardType === 'basic-universe' || v.card_type === 'basic-universe')
                        );
                        console.warn('Available basic-universe cards in map:', basicUniverseCards.slice(0, 5).map(([k, v]) => ({
                            key: k,
                            id: v.id,
                            name: v.card_name || v.name
                        })));
                    }
                    // Skip alternate art check if card not found
                    cardsHtml += `
                        <div class="deck-card-editor-item preview-view" data-index="${index}" data-type="${card.type}" data-card-id="${card.cardId}">
                            <div class="deck-card-editor-info">
                                <div class="deck-card-editor-name">Card not found: ${card.cardId}</div>
                            </div>
                        </div>
                    `;
                    return;
                }
                
                let cardDetails = '';
                if (card.type === 'character') {
                    // Character stats
                    const stats = [
                        { label: 'TL:', value: availableCard.threat_level || 0, color: '#808080' },
                        { label: 'E:', value: availableCard.energy || 0, color: '#FFD700' },
                        { label: 'C:', value: availableCard.combat || 0, color: '#FF8C00' },
                        { label: 'BF:', value: availableCard.brute_force || 0, color: '#32CD32' },
                        { label: 'I:', value: availableCard.intelligence || 0, color: '#6495ED' }
                    ];
                    
                        // Special abilities - always reserve space
                        const specialAbilities = availableCard.special_abilities || '';
                        const specialAbilitiesHtml = 
                            `<div class="character-special-ability">${specialAbilities}</div>`;
                    
                    cardDetails = `
                        <div class="character-stats">
                            <div class="stat-labels">${stats.map(stat => `<span class="stat-label">${stat.label}</span>`).join(' ')}</div>
                            <div class="stat-values">${stats.map(stat => `<span class="stat-value" style="color: ${stat.color};">${stat.value}</span>`).join(' ')}</div>
                                ${specialAbilitiesHtml}
                        </div>
                    `;
                } else if (card.type === 'location') {
                    // Location threat level and special ability
                    const specialAbility = availableCard.special_ability || '';
                    cardDetails = `
                        <div class="location-stats">
                            <div class="stat-labels">
                                <span class="stat-label">TL:</span>
                            </div>
                            <div class="stat-values">
                                <span class="stat-value" style="color: #808080;">${availableCard.threat_level || 0}</span>
                            </div>
                        </div>
                        ${specialAbility ? `<div class="location-special-ability">${specialAbility}</div>` : ''}
                    `;
                    } else if (card.type === 'mission') {
                        // Mission - no additional details
                        cardDetails = '';
                    } else if (card.type === 'event') {
                        // Event - no additional details (mission set shown in header)
                        cardDetails = '';
                } else if (card.type === 'aspect') {
                        // Aspect - no additional details
                        cardDetails = '';
                } else if (card.type === 'power') {
                        // Power card details - no additional details needed
                        cardDetails = '';
                } else if (card.type === 'basic_universe' || card.type === 'basic-universe') {
                    // Basic universe - no additional details (simple display)
                    cardDetails = '';
                } else if (card.type === 'teamwork') {
                    // Teamwork details - no additional details needed
                    cardDetails = '';
                } else if (card.type === 'ally_universe') {
                    // Ally universe details - no additional details needed
                    cardDetails = '';
                } else if (card.type === 'training') {
                    // Training details - no additional details needed
                    cardDetails = '';
                } else if (card.type === 'advanced_universe') {
                    // Advanced universe details - no additional details needed
                    cardDetails = '';
                }
                
                // Preview mode - show detailed info with hover effect
                    const isCharacter = card.type === 'character';
                    const isPower = card.type === 'power';
                    const isLocation = card.type === 'location';
                    const isMission = card.type === 'mission';
                    const isEvent = card.type === 'event';
                    const isAspect = card.type === 'aspect';
                    const isTeamwork = card.type === 'teamwork';
                    const isAllyUniverse = card.type === 'ally-universe' || card.type === 'ally_universe';
                    const isBasicUniverse = card.type === 'basic-universe' || card.type === 'basic_universe';
                    const isAdvancedUniverse = card.type === 'advanced-universe' || card.type === 'advanced_universe';
                    const isTraining = card.type === 'training';
                    
                    const characterClass = isCharacter ? 'character-card' : '';
                    const powerClass = isPower ? 'power-card' : '';
                    const locationClass = isLocation ? 'location-card' : '';
                    const missionClass = isMission ? 'mission-card' : '';
                    const eventClass = isEvent ? 'event-card' : '';
                    const aspectClass = isAspect ? 'aspect-card' : '';
                    const teamworkClass = isTeamwork ? 'teamwork-card' : '';
                    const allyUniverseClass = isAllyUniverse ? 'ally-universe-card' : '';
                    const basicUniverseClass = isBasicUniverse ? 'basic-universe-card' : '';
                    const advancedUniverseClass = isAdvancedUniverse ? 'advanced-universe-card' : '';
                    const trainingClass = isTraining ? 'training-card' : '';
                    
                    const bgImagePath = (isCharacter || isPower || isLocation || isMission || isEvent || isAspect || isTeamwork || isAllyUniverse || isBasicUniverse || isAdvancedUniverse || isTraining) ? getCardImagePath(availableCard, card.type, isCharacter ? { useThumbnail: true } : {}) : '';
                    const bgImageData = bgImagePath ? `data-bg-image="${bgImagePath}"` : '';
                    
                // Format card display name (handle both underscore and hyphen formats)
                let cardDisplayNameForPreview;
                const normalizedTypeForPreview = (card.type === 'basic_universe' || card.type === 'basic-universe') ? 'basic-universe' : 
                                                  (card.type === 'ally_universe' || card.type === 'ally-universe') ? 'ally-universe' :
                                                  (card.type === 'advanced_universe' || card.type === 'advanced-universe') ? 'advanced-universe' : card.type;
                if (normalizedTypeForPreview === 'power') {
                    cardDisplayNameForPreview = `${availableCard.value} - ${availableCard.power_type}`;
                } else if (normalizedTypeForPreview === 'teamwork') {
                    cardDisplayNameForPreview = `${availableCard.to_use} -> ${availableCard.followup_attack_types} (${availableCard.first_attack_bonus}/${availableCard.second_attack_bonus})`;
                } else if (normalizedTypeForPreview === 'ally-universe') {
                    cardDisplayNameForPreview = `${availableCard.card_name} - ${availableCard.stat_to_use} ${availableCard.stat_type_to_use} → ${availableCard.attack_value} ${availableCard.attack_type}`;
                } else if (normalizedTypeForPreview === 'basic-universe') {
                    cardDisplayNameForPreview = `${availableCard.card_name} - ${availableCard.type} (${availableCard.value_to_use} → ${availableCard.bonus})`;
                } else if (normalizedTypeForPreview === 'training') {
                    cardDisplayNameForPreview = `${(availableCard.card_name || '').replace(/^Training \(/, '').replace(/\)$/, '')} - ${availableCard.type_1} + ${availableCard.type_2} (${availableCard.value_to_use} → ${availableCard.bonus})`;
                } else {
                    cardDisplayNameForPreview = availableCard.name || availableCard.card_name || getCardName(card);
                }
                
                // Check if this character is KO'd
                const isKOd = card.type === 'character' && window.SimulateKO && window.SimulateKO.isKOd(card.cardId);
                const koDimmedClass = isKOd ? 'ko-dimmed' : '';
                
                // Check if this card has alternate arts
                let hasAlternateArts = false;
                if (availableCard && window.availableCardsMap) {
                    if (card.type === 'character') {
                        const name = (availableCard.name || '').trim();
                        const set = (availableCard.set || 'ERB').trim() || 'ERB';
                        let count = 0;
                        window.availableCardsMap.forEach((c, id) => {
                            const cardType = c.cardType || c.type || '';
                            if ((cardType === 'character' || id.startsWith('char_')) && 
                                (c.name || '').trim() === name && 
                                (c.set || 'ERB').trim() === set) {
                                count++;
                            }
                        });
                        hasAlternateArts = count > 1;
                    } else if (card.type === 'special') {
                        const characterName = (availableCard.character || '').trim();
                        const cardName = (availableCard.name || availableCard.card_name || '').trim();
                        const uniqueImagePaths = new Set();
                        window.availableCardsMap.forEach((c, id) => {
                            const cardType = c.cardType || c.type || '';
                            if ((cardType === 'special' || id.startsWith('special_')) && 
                                (c.character || '').trim() === characterName && 
                                (c.name || c.card_name || '').trim() === cardName) {
                                const imagePath = getCardImagePath(c, 'special');
                                uniqueImagePaths.add(imagePath);
                            }
                        });
                        // Only show button if there are multiple unique image paths
                        hasAlternateArts = uniqueImagePaths.size > 1;
                    } else if (card.type === 'power') {
                        // Group by value and power_type only (not by set) to include alternates across all sets
                        // Check for unique image paths, not just card count
                        const value = String(availableCard.value || '').trim();
                        const powerType = (availableCard.power_type || '').trim();
                        const uniqueImagePaths = new Set();
                        window.availableCardsMap.forEach((c, id) => {
                            const cardType = c.cardType || c.type || '';
                            if ((cardType === 'power' || id.startsWith('power_')) && 
                                String(c.value || '').trim() === value && 
                                (c.power_type || '').trim() === powerType) {
                                const imagePath = getCardImagePath(c, 'power');
                                uniqueImagePaths.add(imagePath);
                            }
                        });
                        hasAlternateArts = uniqueImagePaths.size > 1;
                    } else if (card.type === 'location') {
                        // For locations, group by name - alternates are separate rows with same name
                        // Use Set to count unique location IDs (map stores same card under multiple keys)
                        const name = (availableCard.name || '').trim();
                        const uniqueLocationIds = new Set();
                        window.availableCardsMap.forEach((c, id) => {
                            const iterCardType = c.cardType || c.type || '';
                            if ((iterCardType === 'location' || id.startsWith('location_')) && 
                                (c.name || '').trim() === name) {
                                uniqueLocationIds.add(c.id || id);
                            }
                        });
                        hasAlternateArts = uniqueLocationIds.size > 1;
                    }
                }
                
                const changeArtButton = hasAlternateArts ? 
                    `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>` : '';
                
                cardsHtml += `
                        <div class="deck-card-editor-item preview-view ${characterClass} ${powerClass} ${locationClass} ${missionClass} ${eventClass} ${aspectClass} ${teamworkClass} ${allyUniverseClass} ${basicUniverseClass} ${advancedUniverseClass} ${trainingClass} ${koDimmedClass}" draggable="true" data-index="${index}" data-type="${card.type}" data-card-id="${card.cardId}"
                             ${bgImageData}
                             onmouseenter="showCardHoverModal('${getCardImagePath(availableCard, card.type)}', '${cardDisplayNameForPreview.replace(/'/g, "\\'")}')"
                         onmouseleave="hideCardHoverModal()"
                         ondragstart="handleDeckCardDragStart(event)"
                         ondragend="handleDeckCardDragEnd(event)"
                         ondragover="handleDeckCardDragOver(event)"
                         ondrop="handleDeckCardDrop(event)">
                        <div class="deck-card-editor-info">
                                <div class="deck-card-editor-name">${cardDisplayNameForPreview}${card.quantity > 1 ? ` (${card.quantity})` : ''}</div>
                            ${cardDetails ? `<div class="deck-card-editor-stats">${cardDetails}</div>` : ''}
                        </div>
                        <div class="deck-card-editor-actions">
                            ${changeArtButton}
                            ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `<button class="remove-one-btn" onclick="removeOneCardFromEditor(${index})">-1</button>` : ''}
                            ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `<button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>` : ''}
                            ${card.type === 'character' || card.type === 'location' || card.type === 'mission' ? `<button class="quantity-btn" onclick="removeCardFromEditor(${index})">-</button>` : ''}
                            ${card.type === 'character' && currentUser ? `<button class="ko-btn ${window.SimulateKO && window.SimulateKO.isKOd(card.cardId) ? 'active' : ''}" onclick="toggleKOCharacter('${card.cardId}', ${index})" title="${window.SimulateKO && window.SimulateKO.isKOd(card.cardId) ? 'Un-KO Character' : 'KO Character'}">KO</button>` : ''}
                            ${card.type === 'character' ? getReserveCharacterButton(card.cardId, index) : ''}
                            ${card.type === 'mission' ? getDisplayMissionButton(card.cardId, index) : ''}
                        </div>
                    </div>
                `;
            });
            }
            
            cardsHtml += `
                    </div>
                </div>
            `;
        }
    });
    
    deckCardsEditor.innerHTML = cardsHtml;
    
    // Apply KO dimming
    if (currentUser) {
        applyKODimming();
    }
    
    // Debug: Check character section layout and body classes
    setTimeout(() => {
        
        const characterSection = document.getElementById('deck-type-character');
        if (characterSection) {
            const characterCards = characterSection.querySelector('.deck-type-cards');
            if (characterCards) {
                const computedStyle = window.getComputedStyle(characterCards);
                
                // Read-only mode should use the same layout as edit mode - no special JavaScript rules needed
            }
        }
        
        // Debug all card sections
        const allCardSections = document.querySelectorAll('.deck-type-cards');
        allCardSections.forEach((section, index) => {
            const computedStyle = window.getComputedStyle(section);
            
            // Read-only mode should use the same layout as edit mode - no special JavaScript rules needed
        });
        
        // Read-only mode should use the same layout as edit mode - no special JavaScript rules needed
    }, 100);
    
    // Check if we're in list view mode and re-render accordingly
    if (deckCardsEditor.classList.contains('list-view')) {
        renderDeckCardsListView();
        
        // Ultra-aggressive layout enforcement
        ultraAggressiveLayoutEnforcement();
        
        return; // Skip the rest of the function since we're in list view
    }
    
    // Check if we should maintain two-column layout
    const layout = document.querySelector('.deck-editor-layout');
    const deckPane = document.querySelector('.deck-pane');
    if (layout && deckPane) {
        const layoutWidth = layout.offsetWidth;
        const deckWidth = deckPane.offsetWidth;
        const deckPercentage = (deckWidth / layoutWidth) * 100;
        
        if (deckPercentage >= 33) {
            // Only create two-column layout if it doesn't already exist and not in read-only mode
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (!deckCardsEditor.querySelector('.deck-column')) {
                createTwoColumnLayout();
            }
        }
    }
    
    // Note: Expansion state will be applied after loading UI preferences from database
    
    // Apply character background images
    setTimeout(() => {
        const basicCards = document.querySelectorAll('.deck-card-editor-item.basic-universe-card');
        applyCharacterBackgroundsToEditor();
    }, 500);
    
    // Force layout recalculation to fix any rendering issues
    requestAnimationFrame(() => {
        // Trigger a reflow to ensure proper layout
        deckCardsEditor.offsetHeight;
        
        // If there are any collapsed sections, ensure they're properly hidden
        const collapsedSections = deckCardsEditor.querySelectorAll('.deck-section.collapsed');
        collapsedSections.forEach(section => {
            const content = section.querySelector('.deck-section-content');
            if (content) {
                content.style.display = 'none';
            }
        });
        
        // Update power cards filter to show correct counts after deck display
        updatePowerCardsFilter();
        
        // Update location limit status after deck display
        updateLocationLimitStatus();
    });
}
// Apply background images to character, power, location, special, mission, and aspect cards in deck editor

// ===== Background rendering, expansion state, deck type/list sections =====

function applyCharacterBackgroundsToEditor() {
    const characterCards = document.querySelectorAll('.deck-card-editor-item.character-card');
    const powerCards = document.querySelectorAll('.deck-card-editor-item.power-card');
    const locationCards = document.querySelectorAll('.deck-card-editor-item.location-card');
    const specialCards = document.querySelectorAll('.deck-card-editor-item.special-card');
    const missionCards = document.querySelectorAll('.deck-card-editor-item.mission-card');
    const eventCards = document.querySelectorAll('.deck-card-editor-item.event-card');
    const aspectCards = document.querySelectorAll('.deck-card-editor-item.aspect-card');
    const teamworkCards = document.querySelectorAll('.deck-card-editor-item.teamwork-card');
    const allyUniverseCards = document.querySelectorAll('.deck-card-editor-item.ally-universe-card');
    const basicUniverseCards = document.querySelectorAll('.deck-card-editor-item.basic-universe-card');
    const advancedUniverseCards = document.querySelectorAll('.deck-card-editor-item.advanced-universe-card');
    const trainingCards = document.querySelectorAll('.deck-card-editor-item.training-card');
    
    // Apply to character cards
    characterCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                // URL encode the path for CSS
                const encodedPath = encodeURI(bgImage);
                card.style.setProperty('--bg-image', `url(${encodedPath})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });
    
    // Apply to power cards
    powerCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                card.style.setProperty('--bg-image', `url(${bgImage})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });
    
    // Apply to location cards
    locationCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                card.style.setProperty('--bg-image', `url(${bgImage})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });
    
    // Apply to special cards
    specialCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                card.style.setProperty('--bg-image', `url(${bgImage})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });

    // Apply to mission cards
    missionCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                card.style.setProperty('--bg-image', `url(${bgImage})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });

    // Apply to event cards
    eventCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                card.style.setProperty('--bg-image', `url(${bgImage})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });

    // Apply to teamwork cards
    teamworkCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                // URL encode the path for CSS
                const encodedPath = encodeURI(bgImage);
                card.style.setProperty('--bg-image', `url(${encodedPath})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });
    
    // Apply to basic-universe cards
    basicUniverseCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                // URL encode the path for CSS
                const encodedPath = encodeURI(bgImage);
                card.style.setProperty('--bg-image', `url(${encodedPath})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });
    
    // Apply to advanced-universe cards
    advancedUniverseCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                // URL encode the path for CSS
                const encodedPath = encodeURI(bgImage);
                card.style.setProperty('--bg-image', `url(${encodedPath})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });
    
    // Apply to training cards
    trainingCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                // URL encode the path for CSS
                const encodedPath = encodeURI(bgImage);
                card.style.setProperty('--bg-image', `url(${encodedPath})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });

    // Apply to ally-universe cards
    allyUniverseCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                // URL encode the path for CSS
                const encodedPath = encodeURI(bgImage);
                card.style.setProperty('--bg-image', `url(${encodedPath})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });

    // Apply to basic-universe cards
    basicUniverseCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                // URL encode the path for CSS
                const encodedPath = encodeURI(bgImage);
                card.style.setProperty('--bg-image', `url(${encodedPath})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });

    // Apply to aspect cards
    aspectCards.forEach(card => {
        const bgImage = card.getAttribute('data-bg-image');
        if (bgImage) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = function() {
                card.style.setProperty('--bg-image', `url(${bgImage})`);
            };
            img.onerror = function() {
                // Fallback: use default gradient without background image
                card.style.setProperty('--bg-image', 'none');
            };
            img.src = bgImage;
        }
    });
}

// Apply expansion state to deck editor sections
function applyDeckEditorExpansionState() {
    // If no expansion state is set, expand all sections by default
    if (Object.keys(deckEditorExpansionState).length === 0) {
        const sections = document.querySelectorAll('.deck-type-section');
        sections.forEach(section => {
            const type = section.id.replace('deck-type-', '');
            deckEditorExpansionState[type] = true;
        });
    } else {
        // Ensure all existing sections have a state defined
        const sections = document.querySelectorAll('.deck-type-section');
        sections.forEach(section => {
            const type = section.id.replace('deck-type-', '');
            if (deckEditorExpansionState[type] === undefined) {
                deckEditorExpansionState[type] = false; // Collapse by default
            }
        });
    }
    
    // Apply the expansion state to each section
    console.log('Applying expansion state:', deckEditorExpansionState);
    Object.keys(deckEditorExpansionState).forEach(type => {
        const cardsDiv = document.getElementById(`deck-type-${type}`);
        console.log(`Looking for cards div deck-type-${type}:`, cardsDiv);
        if (cardsDiv) {
            const section = cardsDiv.closest('.deck-type-section');
            const header = section ? section.querySelector('.deck-type-header') : null;
            const toggle = header ? header.querySelector('.deck-type-toggle') : null;
            
            console.log(`Section ${type} - cardsDiv:`, cardsDiv, 'header:', header, 'toggle:', toggle);
            
            if (cardsDiv && header && toggle) {
                if (!deckEditorExpansionState[type]) {
                    // Collapse the section
                    console.log(`Collapsing section ${type}`);
                    cardsDiv.style.display = 'none';
                    toggle.textContent = '▶';
                    header.classList.add('collapsed');
                } else {
                    // Expand the section (default state)
                    console.log(`Expanding section ${type}`);
                    cardsDiv.style.display = 'block';
                    toggle.textContent = '▼';
                    header.classList.remove('collapsed');
                }
            }
        }
    });
    
    // Scroll to the added card type if it was just added
    if (lastAddedCardType) {
        const addedSection = document.getElementById(`deck-type-${lastAddedCardType}`);
        if (addedSection) {
            addedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        lastAddedCardType = null; // Reset after scrolling
    }
}


// Toggle deck type section visibility
function toggleDeckTypeSection(type) {
    const section = document.getElementById(`deck-type-${type}`);
    const deckTypeSection = section.closest('.deck-type-section');
    const header = deckTypeSection ? deckTypeSection.querySelector('.deck-type-header') : null;
    const toggle = header ? header.querySelector('.deck-type-toggle') : null;
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        if (toggle) toggle.textContent = '▼';
        if (header) header.classList.remove('collapsed');
        deckEditorExpansionState[type] = true; // Update global state
    } else {
        section.style.display = 'none';
        if (toggle) toggle.textContent = '▶';
        if (header) header.classList.add('collapsed');
        deckEditorExpansionState[type] = false; // Update global state
        
        // Ensure the collapsed header is fully visible by adjusting scroll position
        setTimeout(() => {
            if (header) {
                ensureCollapsedHeaderIsVisible(header);
            }
        }, 10); // Small delay to ensure DOM updates are complete
        
        // Also ensure the scroll container can show all content
        setTimeout(() => {
            ensureScrollContainerCanShowAllContent();
        }, 20);
    }
    
    // Save expansion state to localStorage
    saveDeckExpansionState();
}

function toggleDeckListSection(type) {
    // SECURITY: Check if user owns this deck before allowing UI interactions
    if (currentDeckData && currentDeckData.metadata && !currentDeckData.metadata.isOwner) {
        console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
        return;
    }
    
    const itemsContainer = document.getElementById(`deck-list-items-${type}`);
    const deckListSection = itemsContainer.closest('.deck-list-section');
    const header = deckListSection ? deckListSection.querySelector('.deck-list-section-header') : null;
    const toggle = header ? header.querySelector('.deck-list-section-toggle') : null;
    
    if (itemsContainer.style.display === 'none') {
        itemsContainer.style.display = 'block';
        if (toggle) toggle.textContent = '▼';
        if (header) header.classList.remove('collapsed');
        deckEditorExpansionState[type] = true; // Update global state
    } else {
        itemsContainer.style.display = 'none';
        if (toggle) toggle.textContent = '▶';
        if (header) header.classList.add('collapsed');
        deckEditorExpansionState[type] = false; // Update global state
        
        // Ensure the collapsed header is fully visible by adjusting scroll position
        setTimeout(() => {
            if (header) {
                ensureCollapsedHeaderIsVisible(header);
            }
        }, 10); // Small delay to ensure DOM updates are complete
        
        // Also ensure the scroll container can show all content
        setTimeout(() => {
            ensureScrollContainerCanShowAllContent();
        }, 20);
    }
    
    // Save expansion state to localStorage
    saveDeckExpansionState();
}

// Ensure scroll container can show all content
function ensureScrollContainerCanShowAllContent() {
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    if (!deckCardsEditor) return;
    
    // Force a reflow to ensure all measurements are accurate
    deckCardsEditor.offsetHeight;
    
    // Always start at the top of the deck editor
    deckCardsEditor.scrollTop = 0;
}

// Enhanced scroll adjustment for collapsed headers
function ensureCollapsedHeaderIsVisible(header) {
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    if (!deckCardsEditor || !header) return;
    
    // Force a reflow to ensure all measurements are accurate
    deckCardsEditor.offsetHeight;
    header.offsetHeight;
    
    // Get the current scroll position and container dimensions
    const containerRect = deckCardsEditor.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    
    // Calculate if the header is cut off at the bottom
    const headerBottom = headerRect.bottom;
    const containerBottom = containerRect.bottom;
    
    // If the header is cut off, scroll to show it with extra padding
    if (headerBottom > containerBottom) {
        const scrollAmount = headerBottom - containerBottom + 20; // 20px extra padding
        deckCardsEditor.scrollTop += scrollAmount;
        
        // Double-check that we can actually scroll that much
        const maxScrollTop = deckCardsEditor.scrollHeight - deckCardsEditor.clientHeight;
        if (deckCardsEditor.scrollTop > maxScrollTop) {
            deckCardsEditor.scrollTop = maxScrollTop;
        }
    }
}


// Export all functions to window for backward compatibility
window.toggleListView = toggleListView;
window.renderDeckCardsListView = renderDeckCardsListView;
window.toggleCardViewCategory = toggleCardViewCategory;
window.renderDeckCardsCardView = renderDeckCardsCardView;
window.toggleCategory = toggleCategory;
window.togglePowerCardsSort = togglePowerCardsSort;
window.loadPowerCardsSortMode = loadPowerCardsSortMode;
window.toggleCharacterGroup = toggleCharacterGroup;
window.toggleMissionSetGroup = toggleMissionSetGroup;
window.displayDeckCardsForEditing = displayDeckCardsForEditing;
window.applyCharacterBackgroundsToEditor = applyCharacterBackgroundsToEditor;
window.applyDeckEditorExpansionState = applyDeckEditorExpansionState;
window.toggleDeckTypeSection = toggleDeckTypeSection;
window.toggleDeckListSection = toggleDeckListSection;
window.ensureScrollContainerCanShowAllContent = ensureScrollContainerCanShowAllContent;
window.ensureCollapsedHeaderIsVisible = ensureCollapsedHeaderIsVisible;
