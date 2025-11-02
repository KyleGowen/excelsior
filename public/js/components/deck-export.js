/* ========================================
 * DECK EXPORT COMPONENT
 * ========================================
 *
 * This file contains the deck export functionality
 * for ADMIN users to export decks as JSON.
 *
 * Purpose: Standalone deck export module
 * Created: Refactored from deck-editor-core.js
 * Contains:
 *   - exportDeckAsJson() - Main export function
 *   - showExportOverlay() - Display export overlay
 *   - closeExportOverlay() - Close export overlay
 *   - copyJsonToClipboard() - Copy JSON to clipboard
 *
 * Dependencies:
 *   - Global: currentUser, window.availableCardsMap, window.deckEditorCards
 *   - Global: loadAvailableCards(), showNotification(), validateDeck()
 *   - Global: isDeckLimited, currentDeckData
 *   - DOM: #exportJsonOverlay, #exportJsonContent elements
 *
 * ======================================== */

/**
 * Export deck as JSON (Admin only)
 * Exports the current deck configuration as a JSON object
 * and displays it in a modal overlay for copying.
 *
 * @returns {Promise<void>}
 */
async function exportDeckAsJson() {
    // Security check - only allow ADMIN users
    // Note: Currently commented out for debugging, should be re-enabled in production
    if (!currentUser || currentUser.role !== 'ADMIN') {
        // showNotification('Access denied: Admin privileges required', 'error');
        // return;
    }
    
    try {
        // Ensure availableCardsMap is loaded before exporting
        if (!window.availableCardsMap || window.availableCardsMap.size === 0) {
            if (typeof loadAvailableCards === 'function') {
                await loadAvailableCards();
                // Wait a bit for the function to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (!window.availableCardsMap || window.availableCardsMap.size === 0) {
                console.error('No card data available for export');
                showNotification('Card data not loaded. Please refresh the page and try again.', 'error');
                return;
            }
        }
        
        // Get current deck data from currentDeckData object, fallback to UI elements
        let deckName = 'Untitled Deck';
        let deckDescription = '';
        
        // Try to get from currentDeckData first
        if (currentDeckData && currentDeckData.metadata) {
            deckName = currentDeckData.metadata.name || 'Untitled Deck';
            deckDescription = currentDeckData.metadata.description || '';
        } else {
            // Only try UI elements if metadata is not available
            // Look for the deck title in the deck editor area, not the deck list
            // The deck editor title should be an h3 element that's not in the deck list
            const deckTitleElement = document.querySelector('#deckEditorModal h3') || 
                                    document.querySelector('#deckEditorModal h4') || 
                                    document.querySelector('.deck-editor h3') ||
                                    document.querySelector('.deck-editor h4') ||
                                    // Look for h3 elements that are not in deck list items
                                    Array.from(document.querySelectorAll('h3')).find(h3 => 
                                        !h3.closest('[class*="deck"]') || 
                                        h3.textContent.includes('ABCDE') ||
                                        h3.textContent.includes('FGHIJK')
                                    ) ||
                                    document.querySelector('h4') || 
                                    document.querySelector('.deck-title');
            
            if (deckTitleElement && deckTitleElement.textContent.trim()) {
                // Extract just the deck name, excluding legality badges
                let titleText = deckTitleElement.textContent.trim();
                
                // Remove common legality suffixes that are dynamically added
                titleText = titleText.replace(/\s+(Not Legal|Legal|Invalid|Valid)$/i, '');
                
                // Also try to get just the text content without the legality span
                const legalityBadge = deckTitleElement.querySelector('.deck-validation-badge, .legality-badge');
                if (legalityBadge) {
                    // Clone the element and remove the legality badge to get clean text
                    const cleanElement = deckTitleElement.cloneNode(true);
                    const cleanBadge = cleanElement.querySelector('.deck-validation-badge, .legality-badge');
                    if (cleanBadge) {
                        cleanBadge.remove();
                    }
                    titleText = cleanElement.textContent.trim();
                }
                
                if (titleText) {
                    deckName = titleText;
                }
            }
            const deckDescElement = document.querySelector('.deck-description') || 
                                  document.querySelector('.deck-desc') ||
                                  document.querySelector('[data-deck-description]');
            
            if (deckDescElement && deckDescElement.textContent.trim()) {
                deckDescription = deckDescElement.textContent.trim();
            }
        }
        
        // Calculate deck statistics
        const totalCards = window.deckEditorCards
            .filter(card => !['mission', 'character', 'location'].includes(card.type))
            .reduce((sum, card) => sum + card.quantity, 0);
        
        const characterCards = window.deckEditorCards.filter(card => card.type === 'character');
        const locationCards = window.deckEditorCards.filter(card => card.type === 'location');
        
        let maxEnergy = 0, maxCombat = 0, maxBruteForce = 0, maxIntelligence = 0;
        let totalThreat = 0;
        
        // Get the current reserve character ID
        const reserveCharacterId = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character;
        
        if (characterCards.length > 0) {
            maxEnergy = Math.max(...characterCards.map(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                return availableCard ? (availableCard.energy || 0) : 0;
            }));
            maxCombat = Math.max(...characterCards.map(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                return availableCard ? (availableCard.combat || 0) : 0;
            }));
            maxBruteForce = Math.max(...characterCards.map(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                return availableCard ? (availableCard.brute_force || 0) : 0;
            }));
            maxIntelligence = Math.max(...characterCards.map(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                return availableCard ? (availableCard.intelligence || 0) : 0;
            }));
        }
        
        // Calculate threat from characters (with reserve character adjustments)
        characterCards.forEach(card => {
            const character = window.availableCardsMap.get(card.cardId);
            if (character && character.threat_level) {
                let threatLevel = character.threat_level;
                
                // Apply reserve character adjustments
                if (card.cardId === reserveCharacterId) {
                    // Victory Harben: 18 -> 20 when reserve (+2)
                    if (character.name === 'Victory Harben') {
                        threatLevel = 20;
                    }
                    // Carson of Venus: 18 -> 19 when reserve (+1)
                    else if (character.name === 'Carson of Venus') {
                        threatLevel = 19;
                    }
                    // Morgan Le Fay: 19 -> 20 when reserve (+1)
                    else if (character.name === 'Morgan Le Fay') {
                        threatLevel = 20;
                    }
                }
                
                totalThreat += threatLevel * card.quantity;
            }
        });
        
        // Calculate threat from locations
        locationCards.forEach(card => {
            const location = window.availableCardsMap.get(card.cardId);
            if (location && location.threat_level) {
                totalThreat += location.threat_level * card.quantity;
            }
        });
        
        // Calculate icon totals (from special, aspect, ally, teamwork, and power cards)
        const calculateIconTotals = (deckCards) => {
            const totals = {
                'Energy': 0,
                'Combat': 0,
                'Brute Force': 0,
                'Intelligence': 0
            };
            
            const iconTypes = ['Energy', 'Combat', 'Brute Force', 'Intelligence'];
            
            // Only process card types that should contribute to icon totals
            const allowedTypes = ['special', 'aspect', 'ally-universe', 'ally_universe', 'teamwork', 'power'];
            
            deckCards.forEach(card => {
                // Skip card types that don't contribute to icon totals
                if (!allowedTypes.includes(card.type)) {
                    return;
                }
                
                const availableCard = window.availableCardsMap.get(card.cardId);
                if (!availableCard) return;
                
                const quantity = card.quantity || 1;
                let icons = [];
                
                // Determine icons based on card type
                if (card.type === 'power') {
                    // Power cards: use power_type field
                    const type = String(availableCard.power_type || '').trim();
                    const isMulti = /multi\s*-?power/i.test(type);
                    
                    if (type === 'Any-Power') {
                        // Any-Power doesn't count toward icon totals
                        icons = [];
                    } else if (isMulti) {
                        // Multi Power counts as all 4 types
                        icons = ['Energy', 'Combat', 'Brute Force', 'Intelligence'];
                    } else {
                        // Single type power card
                        const matchedType = iconTypes.find(t => t === type);
                        if (matchedType) {
                            icons = [matchedType];
                        }
                    }
                } else if (card.type === 'teamwork') {
                    // Teamwork cards: use to_use field
                    const src = String(availableCard.to_use || '');
                    const isAny = /Any-?Power/i.test(src);
                    
                    if (isAny) {
                        // Any-Power doesn't count toward icon totals
                        icons = [];
                    } else {
                        // Match Energy, Combat, Brute Force, Intelligence from to_use string
                        icons = iconTypes.filter(t => {
                            const regex = new RegExp(t, 'i');
                            return regex.test(src);
                        });
                    }
                } else if (card.type === 'ally-universe' || card.type === 'ally_universe') {
                    // Ally-universe cards: use stat_type_to_use field
                    const src = String(availableCard.stat_type_to_use || '');
                    const matchedType = iconTypes.find(t => {
                        const regex = new RegExp(t, 'i');
                        return regex.test(src);
                    });
                    if (matchedType) {
                        icons = [matchedType];
                    }
                } else {
                    // For other card types (special, aspect, etc.): use icons array
                    icons = Array.isArray(availableCard.icons) ? availableCard.icons : [];
                    // Filter to only count the 4 main icon types
                    icons = icons.filter(icon => iconTypes.includes(icon));
                }
                
                // Count each icon type, multiplied by quantity
                icons.forEach(icon => {
                    if (totals.hasOwnProperty(icon)) {
                        totals[icon] += quantity;
                    }
                });
            });
            
            return totals;
        };
        
        const iconTotals = calculateIconTotals(window.deckEditorCards);
        
        // Helper function to get card name from availableCardsMap
        // Use exact database names for import compatibility
        const getCardNameFromMap = (card) => {
            const availableCard = window.availableCardsMap.get(card.cardId);
            if (availableCard) {
                // Use the exact name as it appears in the database
                return availableCard.name || availableCard.card_name || 'Unknown Card';
            }
            console.warn(`Card not found in availableCardsMap: ${card.cardId} (type: ${card.type})`);
            return 'Unknown Card';
        };

        // Helper function to create repeated cards array based on quantity
        const createRepeatedCards = (cards, cardType) => {
            const result = [];
            cards.filter(card => card.type === cardType).forEach(card => {
                const cardName = getCardNameFromMap(card);
                const quantity = card.quantity || 1;
                for (let i = 0; i < quantity; i++) {
                    result.push(cardName);
                }
            });
            return result;
        };

        // Helper function to create sorted power cards array
        // Sorts by value (ascending), then by type (Energy, Combat, Brute Force, Intelligence, Multi, Any-Power)
        const createSortedPowerCards = (cards) => {
            const result = [];
            cards.filter(card => card.type === 'power').forEach(card => {
                const cardName = getCardNameFromMap(card);
                const quantity = card.quantity || 1;
                for (let i = 0; i < quantity; i++) {
                    result.push(cardName);
                }
            });
            
            // Sort power cards by value, then by type
            const typeOrder = {
                'Energy': 1,
                'Combat': 2,
                'Brute Force': 3,
                'Intelligence': 4,
                'Multi Power': 5,
                'Multi-Power': 5,
                'Any-Power': 6,
                'Any Power': 6
            };
            
            result.sort((a, b) => {
                // Extract value and type from power card names (format: "5 - Energy" or "3 - Multi Power")
                const parsePowerCard = (name) => {
                    const match = name.match(/^(\d+)\s*-\s*(.+)$/);
                    if (match) {
                        const value = parseInt(match[1], 10);
                        const type = match[2].trim();
                        return { value, type };
                    }
                    // Fallback for unexpected format
                    return { value: 999, type: name };
                };
                
                const aParsed = parsePowerCard(a);
                const bParsed = parsePowerCard(b);
                
                // First sort by value (ascending)
                if (aParsed.value !== bParsed.value) {
                    return aParsed.value - bParsed.value;
                }
                
                // Then sort by type order
                const aTypeOrder = typeOrder[aParsed.type] || 99;
                const bTypeOrder = typeOrder[bParsed.type] || 99;
                
                if (aTypeOrder !== bTypeOrder) {
                    return aTypeOrder - bTypeOrder;
                }
                
                // If same value and type order, maintain original order (stable sort)
                return 0;
            });
            
            return result;
        };

        // Helper function to create characters array
        const createCharactersArray = (cards) => {
            const result = [];
            
            cards.filter(card => card.type === 'character').forEach(card => {
                const cardName = getCardNameFromMap(card);
                const quantity = card.quantity || 1;
                
                // All characters exported as simple strings
                for (let i = 0; i < quantity; i++) {
                    result.push(cardName);
                }
            });
            
            return result;
        };

        // Helper function to create special cards grouped by character
        const createSpecialCardsByCharacter = (cards) => {
            const result = {};
            cards.filter(card => card.type === 'special').forEach(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                if (!availableCard) return;
                
                // Get character name from special card data
                // Use character_name or character field (database uses character_name, frontend may use character)
                const characterName = availableCard.character_name || availableCard.character || 'Any Character';
                const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                const quantity = card.quantity || 1;
                
                // Initialize character array if it doesn't exist
                if (!result[characterName]) {
                    result[characterName] = [];
                }
                
                // Add card repeated by quantity (all as simple strings)
                for (let i = 0; i < quantity; i++) {
                    result[characterName].push(cardName);
                }
            });
            return result;
        };

        // Helper function to create missions grouped by mission set
        const createMissionsByMissionSet = (cards) => {
            const result = {};
            cards.filter(card => card.type === 'mission').forEach(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                if (!availableCard) return;
                
                // Get mission set from card data
                const missionSet = availableCard.mission_set || 'Unknown Mission Set';
                const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                const quantity = card.quantity || 1;
                
                // Initialize mission set array if it doesn't exist
                if (!result[missionSet]) {
                    result[missionSet] = [];
                }
                
                // Add card repeated by quantity
                for (let i = 0; i < quantity; i++) {
                    result[missionSet].push(cardName);
                }
            });
            return result;
        };

        // Helper function to create events grouped by mission set
        const createEventsByMissionSet = (cards) => {
            const result = {};
            cards.filter(card => card.type === 'event').forEach(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                if (!availableCard) return;
                
                // Get mission set from card data
                const missionSet = availableCard.mission_set || 'Unknown Mission Set';
                const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                const quantity = card.quantity || 1;
                
                // Initialize mission set array if it doesn't exist
                if (!result[missionSet]) {
                    result[missionSet] = [];
                }
                
                // Add card repeated by quantity
                for (let i = 0; i < quantity; i++) {
                    result[missionSet].push(cardName);
                }
            });
            return result;
        };

        // Helper function to create advanced universe cards grouped by character
        const createAdvancedUniverseByCharacter = (cards) => {
            const result = {};
            cards.filter(card => card.type === 'advanced-universe').forEach(card => {
                const availableCard = window.availableCardsMap.get(card.cardId);
                if (!availableCard) return;
                
                // Get character name from advanced universe card data
                // Advanced universe cards use 'character' field (not 'character_name')
                const characterName = availableCard.character || 'Unknown Character';
                const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                const quantity = card.quantity || 1;
                
                // Initialize character array if it doesn't exist
                if (!result[characterName]) {
                    result[characterName] = [];
                }
                
                // Add card repeated by quantity
                for (let i = 0; i < quantity; i++) {
                    result[characterName].push(cardName);
                }
            });
            return result;
        };

        // Organize cards by category with repeated cards for multiple quantities
        // Note: window.deckEditorCards uses frontend format (e.g., 'ally-universe', 'basic-universe', 'advanced-universe')
        const cardCategories = {
            characters: createCharactersArray(window.deckEditorCards),
            special_cards: createSpecialCardsByCharacter(window.deckEditorCards),
            locations: createRepeatedCards(window.deckEditorCards, 'location'),
            missions: createMissionsByMissionSet(window.deckEditorCards),
            events: createEventsByMissionSet(window.deckEditorCards),
            aspects: createRepeatedCards(window.deckEditorCards, 'aspect'),
            advanced_universe: createAdvancedUniverseByCharacter(window.deckEditorCards),
            teamwork: createRepeatedCards(window.deckEditorCards, 'teamwork'),
            allies: createRepeatedCards(window.deckEditorCards, 'ally-universe'),
            training: createRepeatedCards(window.deckEditorCards, 'training'),
            basic_universe: createRepeatedCards(window.deckEditorCards, 'basic-universe'),
            power_cards: createSortedPowerCards(window.deckEditorCards)
        };
        
        // Collect special card attributes at root level (single values, not arrays)
        let reserveCharacter = null;
        let cataclysmSpecial = null;
        let assistSpecial = null;
        let ambushSpecial = null;
        
        // Get reserve character (reserveCharacterId already declared above for threat calculation)
        if (reserveCharacterId) {
            const reserveCard = window.deckEditorCards.find(card => card.type === 'character' && card.cardId === reserveCharacterId);
            if (reserveCard) {
                reserveCharacter = getCardNameFromMap(reserveCard);
            }
        }
        
        // Collect special card types (get first occurrence of each type)
        window.deckEditorCards.filter(card => card.type === 'special').forEach(card => {
            const availableCard = window.availableCardsMap.get(card.cardId);
            if (!availableCard) return;
            
            const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
            const isCataclysm = availableCard.is_cataclysm === true || availableCard.cataclysm === true;
            const isAssist = availableCard.is_assist === true || availableCard.assist === true;
            const isAmbush = availableCard.is_ambush === true || availableCard.ambush === true;
            
            // Set first occurrence of each type (skip if already found)
            if (isCataclysm && !cataclysmSpecial) {
                cataclysmSpecial = cardName;
            }
            if (isAssist && !assistSpecial) {
                assistSpecial = cardName;
            }
            if (isAmbush && !ambushSpecial) {
                ambushSpecial = cardName;
            }
        });
        
        // Determine if deck is legal and limited using the actual validation logic
        const validation = validateDeck(window.deckEditorCards);
        const isLegal = validation.errors.length === 0;
        const isLimited = isDeckLimited; // Use the global limited state variable
        
        // Create export data structure with data at top level
        const exportData = {
            name: deckName,
            description: deckDescription,
            total_cards: totalCards,
            max_energy: maxEnergy,
            max_combat: maxCombat,
            max_brute_force: maxBruteForce,
            max_intelligence: maxIntelligence,
            total_energy_icons: iconTotals.Energy || 0,
            total_combat_icons: iconTotals.Combat || 0,
            total_brute_force_icons: iconTotals['Brute Force'] || 0,
            total_intelligence_icons: iconTotals.Intelligence || 0,
            total_threat: totalThreat,
            legal: isLegal,
            limited: isLimited,
            export_timestamp: new Date().toISOString(),
            exported_by: currentUser.name || currentUser.username || 'Admin',
            reserve_character: reserveCharacter,
            cataclysm_special: cataclysmSpecial,
            assist_special: assistSpecial,
            ambush_special: ambushSpecial,
            cards: cardCategories
        };
        
        // Show JSON in overlay
        const jsonString = JSON.stringify(exportData, null, 2);
        showExportOverlay(jsonString);
        
    } catch (error) {
        console.error('Error exporting deck:', error);
        showNotification('Error exporting deck: ' + error.message, 'error');
    }
}

/**
 * NOTE: Import functionality has been moved to deck-import.js
 * This file now only contains export functionality.
 */

/**
 * Render JSON as an interactive, collapsible tree structure
 * Creates a visual JSON viewer similar to Insomnia/Postman with expand/collapse functionality
 *
 * @param {any} data - The JSON data (object or array)
 * @param {HTMLElement} container - Container element to render into
 * @param {number} indentLevel - Current indentation level (for recursion)
 */
function renderJsonTree(data, container, indentLevel = 0) {
    if (data === null) {
        const nullElement = document.createElement('span');
        nullElement.className = 'json-value json-null';
        nullElement.textContent = 'null';
        return { element: nullElement, lineCount: 1 };
    }
    
    if (data === undefined) {
        const undefinedElement = document.createElement('span');
        undefinedElement.className = 'json-value json-undefined';
        undefinedElement.textContent = 'undefined';
        return { element: undefinedElement, lineCount: 1 };
    }
    
    if (typeof data === 'boolean') {
        const boolElement = document.createElement('span');
        boolElement.className = 'json-value json-boolean';
        boolElement.textContent = data.toString();
        return { element: boolElement, lineCount: 1 };
    }
    
    if (typeof data === 'number') {
        const numElement = document.createElement('span');
        numElement.className = 'json-value json-number';
        numElement.textContent = data.toString();
        return { element: numElement, lineCount: 1 };
    }
    
    if (typeof data === 'string') {
        const strElement = document.createElement('span');
        strElement.className = 'json-value json-string';
        strElement.textContent = JSON.stringify(data);
        return { element: strElement, lineCount: 1 };
    }
    
    if (Array.isArray(data)) {
        return renderJsonArray(data, container, indentLevel, 1);
    }
    
    if (typeof data === 'object') {
        return renderJsonObject(data, container, indentLevel, 1);
    }
    
    const fallback = document.createElement('span');
    fallback.className = 'json-value';
    fallback.textContent = String(data);
    return { element: fallback, lineCount: 1 };
}

/**
 * Render a JSON array with collapsible functionality
 */
function renderJsonArray(arr, container, indentLevel, startLine) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-node';
    
    // Opening bracket line
    const openingLine = document.createElement('div');
    openingLine.className = 'json-line';
    
    const openingContent = document.createElement('div');
    openingContent.className = 'json-line-content';
    openingContent.style.paddingLeft = `${indentLevel * 20}px`;
    
    const toggle = document.createElement('span');
    toggle.className = 'json-toggle';
    toggle.setAttribute('data-collapsed', 'false');
    
    const bracketOpen = document.createElement('span');
    bracketOpen.className = 'json-bracket';
    bracketOpen.textContent = '[';
    
    const collapsedIndicator = document.createElement('span');
    collapsedIndicator.className = 'json-collapsed-indicator';
    collapsedIndicator.style.display = 'none';
    
    const bracketCloseInline = document.createElement('span');
    bracketCloseInline.className = 'json-bracket';
    bracketCloseInline.textContent = ']';
    bracketCloseInline.style.display = 'none';
    
    openingContent.appendChild(toggle);
    openingContent.appendChild(bracketOpen);
    openingContent.appendChild(collapsedIndicator);
    openingContent.appendChild(bracketCloseInline);
    openingLine.appendChild(openingContent);
    
    // Children container
    const childrenWrapper = document.createElement('div');
    childrenWrapper.className = 'json-children';
    
    // Closing bracket line (for expanded state)
    const closingLine = document.createElement('div');
    closingLine.className = 'json-line';
    const closingContent = document.createElement('div');
    closingContent.className = 'json-line-content';
    closingContent.style.paddingLeft = `${indentLevel * 20}px`;
    const bracketClose = document.createElement('span');
    bracketClose.className = 'json-bracket';
    bracketClose.textContent = ']';
    closingContent.appendChild(bracketClose);
    closingLine.appendChild(closingContent);
    
    let isCollapsed = false;
    
    const updateCollapsedState = (collapsed) => {
        isCollapsed = collapsed;
        toggle.setAttribute('data-collapsed', collapsed.toString());
        childrenWrapper.style.display = collapsed ? 'none' : 'block';
        closingLine.style.display = collapsed ? 'none' : 'block';
        
        if (collapsed) {
            const itemCount = arr.length;
            collapsedIndicator.textContent = ` ↔ ${itemCount} ↔ `;
            collapsedIndicator.style.display = 'inline';
            bracketCloseInline.style.display = 'inline';
        } else {
            collapsedIndicator.style.display = 'none';
            bracketCloseInline.style.display = 'none';
        }
    };
    
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        updateCollapsedState(!isCollapsed);
    });
    
    // Render children
    if (arr.length === 0) {
        // Empty array - show brackets on same line
        toggle.style.display = 'none';
        bracketCloseInline.style.display = 'inline';
        bracketCloseInline.style.marginLeft = '4px';
        childrenWrapper.style.display = 'none';
        closingLine.style.display = 'none';
    } else {
        let currentLine = startLine + 1;
        arr.forEach((item, index) => {
            const childResult = renderJsonTree(item, childrenWrapper, indentLevel + 1);
            
            const childLine = document.createElement('div');
            childLine.className = 'json-line';
            
            const childContent = document.createElement('div');
            childContent.className = 'json-line-content';
            childContent.style.paddingLeft = `${(indentLevel + 1) * 20}px`;
            
            childContent.appendChild(childResult.element);
            
            if (index < arr.length - 1) {
                const comma = document.createElement('span');
                comma.className = 'json-comma';
                comma.textContent = ',';
                childContent.appendChild(comma);
            }
            
            childLine.appendChild(childContent);
            childrenWrapper.appendChild(childLine);
            
            currentLine += childResult.lineCount;
        });
    }
    
    wrapper.appendChild(openingLine);
    wrapper.appendChild(childrenWrapper);
    if (arr.length > 0) {
        wrapper.appendChild(closingLine);
    }
    
    // Start expanded
    if (arr.length > 0) {
        updateCollapsedState(false);
    }
    
    return { element: wrapper, lineCount: arr.length === 0 ? 1 : arr.length + 2 };
}

/**
 * Render a JSON object with collapsible functionality
 */
function renderJsonObject(obj, container, indentLevel, startLine) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-node';
    
    // Opening brace line
    const openingLine = document.createElement('div');
    openingLine.className = 'json-line';
    
    const openingContent = document.createElement('div');
    openingContent.className = 'json-line-content';
    openingContent.style.paddingLeft = `${indentLevel * 20}px`;
    
    const toggle = document.createElement('span');
    toggle.className = 'json-toggle';
    toggle.setAttribute('data-collapsed', 'false');
    
    const braceOpen = document.createElement('span');
    braceOpen.className = 'json-brace';
    braceOpen.textContent = '{';
    
    const collapsedIndicator = document.createElement('span');
    collapsedIndicator.className = 'json-collapsed-indicator';
    collapsedIndicator.style.display = 'none';
    
    const braceCloseInline = document.createElement('span');
    braceCloseInline.className = 'json-brace';
    braceCloseInline.textContent = '}';
    braceCloseInline.style.display = 'none';
    
    openingContent.appendChild(toggle);
    openingContent.appendChild(braceOpen);
    openingContent.appendChild(collapsedIndicator);
    openingContent.appendChild(braceCloseInline);
    openingLine.appendChild(openingContent);
    
    // Children container
    const childrenWrapper = document.createElement('div');
    childrenWrapper.className = 'json-children';
    
    // Closing brace line (for expanded state)
    const closingLine = document.createElement('div');
    closingLine.className = 'json-line';
    const closingContent = document.createElement('div');
    closingContent.className = 'json-line-content';
    closingContent.style.paddingLeft = `${indentLevel * 20}px`;
    const braceClose = document.createElement('span');
    braceClose.className = 'json-brace';
    braceClose.textContent = '}';
    closingContent.appendChild(braceClose);
    closingLine.appendChild(closingContent);
    
    let isCollapsed = false;
    
    const updateCollapsedState = (collapsed) => {
        isCollapsed = collapsed;
        toggle.setAttribute('data-collapsed', collapsed.toString());
        childrenWrapper.style.display = collapsed ? 'none' : 'block';
        closingLine.style.display = collapsed ? 'none' : 'block';
        
        if (collapsed) {
            const keyCount = Object.keys(obj).length;
            collapsedIndicator.textContent = ` ↔ ${keyCount} ↔ `;
            collapsedIndicator.style.display = 'inline';
            braceCloseInline.style.display = 'inline';
        } else {
            collapsedIndicator.style.display = 'none';
            braceCloseInline.style.display = 'none';
        }
    };
    
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        updateCollapsedState(!isCollapsed);
    });
    
    // Render children
    const keys = Object.keys(obj);
    if (keys.length === 0) {
        // Empty object - show braces on same line
        toggle.style.display = 'none';
        braceCloseInline.style.display = 'inline';
        braceCloseInline.style.marginLeft = '4px';
        childrenWrapper.style.display = 'none';
        closingLine.style.display = 'none';
    } else {
        keys.forEach((key, index) => {
            const value = obj[key];
            const isArray = Array.isArray(value);
            const isObject = typeof value === 'object' && value !== null && !isArray;
            
            // Key line - always starts here
            const keyLine = document.createElement('div');
            keyLine.className = 'json-line';
            
            const keyContent = document.createElement('div');
            keyContent.className = 'json-line-content';
            keyContent.style.paddingLeft = `${(indentLevel + 1) * 20}px`;
            
            // Key
            const keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = JSON.stringify(key);
            
            // Colon
            const colon = document.createElement('span');
            colon.className = 'json-colon';
            colon.textContent = ': ';
            
            keyContent.appendChild(keySpan);
            keyContent.appendChild(colon);
            
            if (isArray || isObject) {
                // Complex value - opening bracket/brace on same line as key
                const toggle = document.createElement('span');
                toggle.className = 'json-toggle';
                toggle.setAttribute('data-collapsed', 'false');
                
                const bracketOrBrace = document.createElement('span');
                bracketOrBrace.className = isArray ? 'json-bracket' : 'json-brace';
                bracketOrBrace.textContent = isArray ? '[' : '{';
                
                const collapsedIndicator = document.createElement('span');
                collapsedIndicator.className = 'json-collapsed-indicator';
                collapsedIndicator.style.display = 'none';
                
                const closeInline = document.createElement('span');
                closeInline.className = isArray ? 'json-bracket' : 'json-brace';
                closeInline.textContent = isArray ? ']' : '}';
                closeInline.style.display = 'none';
                
                keyContent.appendChild(toggle);
                keyContent.appendChild(bracketOrBrace);
                keyContent.appendChild(collapsedIndicator);
                keyContent.appendChild(closeInline);
                
                keyLine.appendChild(keyContent);
                childrenWrapper.appendChild(keyLine);
                
                // Children container
                const valueChildrenWrapper = document.createElement('div');
                valueChildrenWrapper.className = 'json-children';
                
                let isValueCollapsed = false;
                
                const updateValueCollapsed = (collapsed) => {
                    isValueCollapsed = collapsed;
                    toggle.setAttribute('data-collapsed', collapsed.toString());
                    valueChildrenWrapper.style.display = collapsed ? 'none' : 'block';
                    
                    if (collapsed) {
                        const count = isArray ? value.length : Object.keys(value).length;
                        collapsedIndicator.textContent = ` ↔ ${count} ↔ `;
                        collapsedIndicator.style.display = 'inline';
                        closeInline.style.display = 'inline';
                    } else {
                        collapsedIndicator.style.display = 'none';
                        closeInline.style.display = 'none';
                    }
                };
                
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updateValueCollapsed(!isValueCollapsed);
                });
                
                // Render children
                if (isArray) {
                    if (value.length === 0) {
                        toggle.style.display = 'none';
                        closeInline.style.display = 'inline';
                        closeInline.style.marginLeft = '4px';
                        valueChildrenWrapper.style.display = 'none';
                    } else {
                        value.forEach((item, itemIndex) => {
                            const itemResult = renderJsonTree(item, valueChildrenWrapper, indentLevel + 2);
                            
                            const itemLine = document.createElement('div');
                            itemLine.className = 'json-line';
                            
                            const itemContent = document.createElement('div');
                            itemContent.className = 'json-line-content';
                            itemContent.style.paddingLeft = `${(indentLevel + 2) * 20}px`;
                            itemContent.appendChild(itemResult.element);
                            
                            if (itemIndex < value.length - 1) {
                                const comma = document.createElement('span');
                                comma.className = 'json-comma';
                                comma.textContent = ',';
                                itemContent.appendChild(comma);
                            }
                            
                            itemLine.appendChild(itemContent);
                            valueChildrenWrapper.appendChild(itemLine);
                        });
                        
                        // Closing bracket line
                        const closingLine = document.createElement('div');
                        closingLine.className = 'json-line';
                        const closingContent = document.createElement('div');
                        closingContent.className = 'json-line-content';
                        closingContent.style.paddingLeft = `${(indentLevel + 1) * 20}px`;
                        const bracketClose = document.createElement('span');
                        bracketClose.className = 'json-bracket';
                        bracketClose.textContent = ']';
                        closingContent.appendChild(bracketClose);
                        closingLine.appendChild(closingContent);
                        
                        childrenWrapper.appendChild(valueChildrenWrapper);
                        childrenWrapper.appendChild(closingLine);
                    }
                } else {
                    // Object
                    const objKeys = Object.keys(value);
                    if (objKeys.length === 0) {
                        toggle.style.display = 'none';
                        closeInline.style.display = 'inline';
                        closeInline.style.marginLeft = '4px';
                        valueChildrenWrapper.style.display = 'none';
                    } else {
                        objKeys.forEach((objKey, objKeyIndex) => {
                            const objValueResult = renderJsonTree(value[objKey], valueChildrenWrapper, indentLevel + 2);
                            
                            const objLine = document.createElement('div');
                            objLine.className = 'json-line';
                            
                            const objContent = document.createElement('div');
                            objContent.className = 'json-line-content';
                            objContent.style.paddingLeft = `${(indentLevel + 2) * 20}px`;
                            
                            const objKeySpan = document.createElement('span');
                            objKeySpan.className = 'json-key';
                            objKeySpan.textContent = JSON.stringify(objKey);
                            
                            const objColon = document.createElement('span');
                            objColon.className = 'json-colon';
                            objColon.textContent = ': ';
                            
                            objContent.appendChild(objKeySpan);
                            objContent.appendChild(objColon);
                            objContent.appendChild(objValueResult.element);
                            
                            if (objKeyIndex < objKeys.length - 1) {
                                const comma = document.createElement('span');
                                comma.className = 'json-comma';
                                comma.textContent = ',';
                                objContent.appendChild(comma);
                            }
                            
                            objLine.appendChild(objContent);
                            valueChildrenWrapper.appendChild(objLine);
                        });
                        
                        // Closing brace line
                        const closingLine = document.createElement('div');
                        closingLine.className = 'json-line';
                        const closingContent = document.createElement('div');
                        closingContent.className = 'json-line-content';
                        closingContent.style.paddingLeft = `${(indentLevel + 1) * 20}px`;
                        const braceClose = document.createElement('span');
                        braceClose.className = 'json-brace';
                        braceClose.textContent = '}';
                        closingContent.appendChild(braceClose);
                        closingLine.appendChild(closingContent);
                        
                        childrenWrapper.appendChild(valueChildrenWrapper);
                        childrenWrapper.appendChild(closingLine);
                    }
                }
                
                // Start expanded
                if ((isArray && value.length > 0) || (isObject && Object.keys(value).length > 0)) {
                    updateValueCollapsed(false);
                }
                
                // Comma after value if not last key
                if (index < keys.length - 1) {
                    const lastLine = childrenWrapper.lastElementChild;
                    if (lastLine && lastLine.querySelector('.json-line-content')) {
                        const comma = document.createElement('span');
                        comma.className = 'json-comma';
                        comma.textContent = ',';
                        lastLine.querySelector('.json-line-content').appendChild(comma);
                    }
                }
            } else {
                // Simple value - everything on one line
                const valueResult = renderJsonTree(value, keyContent, indentLevel + 1);
                keyContent.appendChild(valueResult.element);
                
                if (index < keys.length - 1) {
                    const comma = document.createElement('span');
                    comma.className = 'json-comma';
                    comma.textContent = ',';
                    keyContent.appendChild(comma);
                }
                
                keyLine.appendChild(keyContent);
                childrenWrapper.appendChild(keyLine);
            }
        });
    }
    
    wrapper.appendChild(openingLine);
    wrapper.appendChild(childrenWrapper);
    if (keys.length > 0) {
        wrapper.appendChild(closingLine);
    }
    
    // Start expanded
    if (keys.length > 0) {
        updateCollapsedState(false);
    }
    
    return { element: wrapper, lineCount: keys.length === 0 ? 1 : keys.length + 2 };
}

/**
 * Show export overlay with JSON content
 * Displays a modal overlay containing the exported JSON data as formatted text
 *
 * @param {string} jsonString - The JSON string to display
 */
function showExportOverlay(jsonString) {
    const overlay = document.getElementById('exportJsonOverlay');
    const content = document.getElementById('exportJsonContent');
    
    if (overlay && content) {
        // Display formatted JSON as static text
        try {
            const jsonData = JSON.parse(jsonString);
            const formattedJson = JSON.stringify(jsonData, null, 2);
            content.textContent = formattedJson;
            content.className = ''; // Use default pre styling
        } catch (e) {
            // Fallback to plain text if JSON is invalid
            content.textContent = jsonString;
            content.className = '';
        }
        
        overlay.style.display = 'flex';
        
        // Store JSON for copying
        overlay.dataset.jsonString = jsonString;
        
        // Add click outside to close
        overlay.onclick = function(event) {
            if (event.target === overlay) {
                closeExportOverlay();
            }
        };
    }
}

/**
 * Close export overlay
 * Hides the export overlay modal and cleans up event listeners
 */
function closeExportOverlay() {
    const overlay = document.getElementById('exportJsonOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.onclick = null;
    }
}

/**
 * Copy JSON to clipboard
 * Copies the exported JSON data to the user's clipboard
 * and provides visual feedback
 */
function copyJsonToClipboard() {
    const overlay = document.getElementById('exportJsonOverlay');
    const jsonString = overlay?.dataset.jsonString;
    
    if (jsonString) {
        navigator.clipboard.writeText(jsonString).then(() => {
            // Show temporary feedback
            const copyBtn = document.querySelector('.copy-button');
            const originalTitle = copyBtn.title;
            copyBtn.title = 'Copied!';
            copyBtn.style.background = 'rgba(78, 205, 196, 0.4)';
            copyBtn.style.borderColor = 'rgba(78, 205, 196, 0.6)';

            setTimeout(() => {
                copyBtn.title = originalTitle;
                copyBtn.style.background = 'rgba(78, 205, 196, 0.2)';
                copyBtn.style.borderColor = 'rgba(78, 205, 196, 0.3)';
            }, 1000);
        }).catch(err => {
            console.error('Failed to copy JSON: ', err);
            showNotification('Failed to copy to clipboard', 'error');
        });
    }
}

// Export functions to window object for backward compatibility
// This allows existing code and tests to continue using these functions
if (typeof window !== 'undefined') {
    window.exportDeckAsJson = exportDeckAsJson;
    window.showExportOverlay = showExportOverlay;
    window.closeExportOverlay = closeExportOverlay;
    window.copyJsonToClipboard = copyJsonToClipboard;
}

