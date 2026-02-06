// card-filter-toggles.js - Card-type filter toggle functions
// Extracted from public/index.html

// Character filter for database view
async function applyFilters() {
    try {
        const response = await fetch('/api/characters');
        const data = await response.json();
        
        if (data.success) {
            let filteredCharacters = data.data;
            
            // Check if any filters are actually applied
            let hasActiveFilters = false;
            
            // Apply name search filter
            const nameSearchInput = document.querySelector('.header-filter[placeholder="Search names..."]');
            if (nameSearchInput && nameSearchInput.value.toLowerCase().length > 0) {
                hasActiveFilters = true;
                const searchTerm = nameSearchInput.value.toLowerCase();
                filteredCharacters = filteredCharacters.filter(character => 
                    character.name.toLowerCase().includes(searchTerm)
                );
            }
            
            // Apply inherent abilities toggle filters
            const hasInherentAbilityToggle = document.getElementById('has-inherent-ability');
            const hasNoInherentAbilityToggle = document.getElementById('has-no-inherent-ability');
            
            if (hasInherentAbilityToggle && hasInherentAbilityToggle.checked) {
                hasActiveFilters = true;
                filteredCharacters = filteredCharacters.filter(character => 
                    character.special_abilities && character.special_abilities.trim().length > 0
                );
            }
            
            if (hasNoInherentAbilityToggle && hasNoInherentAbilityToggle.checked) {
                hasActiveFilters = true;
                filteredCharacters = filteredCharacters.filter(character => 
                    !character.special_abilities || character.special_abilities.trim().length === 0
                );
            }

            // Apply inherent abilities search filter
            const abilitiesSearchInput = document.querySelector('.header-filter[placeholder="Search abilities..."]');
            if (abilitiesSearchInput && abilitiesSearchInput.value.toLowerCase().length > 0) {
                hasActiveFilters = true;
                const searchTerm = abilitiesSearchInput.value.toLowerCase();
                filteredCharacters = filteredCharacters.filter(character => 
                    character.special_abilities && character.special_abilities.toLowerCase().includes(searchTerm)
                );
            }
            
            // Apply numeric filters
            const numericColumns = ['energy', 'combat', 'brute_force', 'intelligence', 'threat_level'];
            
            numericColumns.forEach(column => {
                const equalsInput = document.querySelector(`.filter-input.equals[data-column="${column}"]`);
                const minInput = document.querySelector(`.filter-input.min[data-column="${column}"]`);
                const maxInput = document.querySelector(`.filter-input.max[data-column="${column}"]`);
                
                // Apply equals filter
                if (equalsInput && equalsInput.value !== '') {
                    hasActiveFilters = true;
                    const equalsValue = parseInt(equalsInput.value);
                    filteredCharacters = filteredCharacters.filter(character => 
                        character[column] === equalsValue
                    );
                }
                
                // Apply min filter
                if (minInput && minInput.value !== '') {
                    hasActiveFilters = true;
                    const minValue = parseInt(minInput.value);
                    filteredCharacters = filteredCharacters.filter(character => 
                        character[column] >= minValue
                    );
                }
                
                // Apply max filter
                if (maxInput && maxInput.value !== '') {
                    hasActiveFilters = true;
                    const maxValue = parseInt(maxInput.value);
                    filteredCharacters = filteredCharacters.filter(character => 
                        character[column] <= maxValue
                    );
                }
            });
            
            
            // Only apply filtering if there are active filters, otherwise show all characters
            if (hasActiveFilters) {
            displayCharacters(filteredCharacters);
            } else {
                // No filters active, show all characters
                displayCharacters(data.data);
            }
        }
    } catch (error) {
        console.error('Filter error:', error);
    }
}

// Location filtering
async function applyLocationFilters() {
    try {
        const resp = await fetch('/api/locations');
        const data = await resp.json();
        if (!data.success) return;

        let filtered = data.data;

        // Filter by threat level range
        const minThreat = document.getElementById('location-threat-min').value;
        const maxThreat = document.getElementById('location-threat-max').value;
        
        
        if (minThreat && !isNaN(minThreat)) {
            filtered = filtered.filter(location => location.threat_level >= parseInt(minThreat));
        }
        if (maxThreat && !isNaN(maxThreat)) {
            filtered = filtered.filter(location => location.threat_level <= parseInt(maxThreat));
        }
        

        displayLocations(filtered);
    } catch (err) {
        console.error('Error applying location filters:', err);
    }
}

// Events filtering
function applyEventsFilters() {
    const selectedMissionSets = Array.from(document.querySelectorAll('#events-tab input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedMissionSets.length === 0) {
        // If no mission sets selected, show none
        document.getElementById('events-tbody').innerHTML = '<tr><td colspan="5" class="no-results">No mission sets selected</td></tr>';
        return;
    }
    
    // Filter events based on selected mission sets
    const events = window.eventsData || [];
    const filteredEvents = events.filter(event => 
        selectedMissionSets.includes(event.mission_set)
    );
    
    displayEvents(filteredEvents);
}

// Basic Universe filtering
async function applyBasicUniverseFilters() {
    try {
        const resp = await fetch('/api/basic-universe');
        const data = await resp.json();
        if (!data.success) return;

        let filtered = data.data;

        // Filter by type
        const selectedTypes = Array.from(document.querySelectorAll('#basic-universe-tab input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        console.log('Selected types for filtering:', selectedTypes);
        
        // If no types are selected, show no cards
        if (selectedTypes.length === 0) {
            filtered = [];
            console.log('No types selected - showing no cards');
        } else {
            filtered = filtered.filter(card => selectedTypes.includes(card.type));
            console.log('Filtered cards count:', filtered.length);
        }

        // Filter by value range
        const equalsValue = document.querySelector('#basic-universe-tab input[data-column="value"].equals').value;
        const minValue = document.getElementById('basic-value-min').value;
        const maxValue = document.getElementById('basic-value-max').value;
        
        if (equalsValue && !isNaN(equalsValue)) {
            const equalsNum = parseInt(equalsValue);
            filtered = filtered.filter(card => {
                const cardValue = parseInt(card.value_to_use.match(/(\d+)/)?.[1] || '0');
                return cardValue === equalsNum;
            });
        } else {
            if (minValue && !isNaN(minValue)) {
                const minNum = parseInt(minValue);
                filtered = filtered.filter(card => {
                    const cardValue = parseInt(card.value_to_use.match(/(\d+)/)?.[1] || '0');
                    return cardValue >= minNum;
                });
            }
            if (maxValue && !isNaN(maxValue)) {
                const maxNum = parseInt(maxValue);
                filtered = filtered.filter(card => {
                    const cardValue = parseInt(card.value_to_use.match(/(\d+)/)?.[1] || '0');
                    return cardValue <= maxNum;
                });
            }
        }

        // Filter by bonus range
        const equalsBonus = document.querySelector('#basic-universe-tab input[data-column="bonus"].equals').value;
        const minBonus = document.getElementById('basic-bonus-min').value;
        const maxBonus = document.getElementById('basic-bonus-max').value;
        
        if (equalsBonus && !isNaN(equalsBonus)) {
            const equalsBonusNum = parseInt(equalsBonus);
            filtered = filtered.filter(card => {
                const cardBonus = parseInt(card.bonus.match(/(\d+)/)?.[1] || '0');
                return cardBonus === equalsBonusNum;
            });
        } else {
            if (minBonus && !isNaN(minBonus)) {
                const minBonusNum = parseInt(minBonus);
                filtered = filtered.filter(card => {
                    const cardBonus = parseInt(card.bonus.match(/(\d+)/)?.[1] || '0');
                    return cardBonus >= minBonusNum;
                });
            }
            if (maxBonus && !isNaN(maxBonus)) {
                const maxBonusNum = parseInt(maxBonus);
                filtered = filtered.filter(card => {
                    const cardBonus = parseInt(card.bonus.match(/(\d+)/)?.[1] || '0');
                    return cardBonus <= maxBonusNum;
                });
            }
        }

        displayBasicUniverse(filtered);
    } catch (err) {
        console.error('Error applying basic universe filters:', err);
    }
}

// ===== DECK EDITOR FILTER TOGGLES =====

async function toggleEventsMissionFilter() {
    const filterCheckbox = document.getElementById('eventsMissionFilter');
    if (!filterCheckbox) {
        console.error('Events mission filter checkbox not found');
        return;
    }
    
    const isChecked = filterCheckbox.checked;
    
    // Find the events category
    const allCategories = document.querySelectorAll('.card-category');
    let eventsCategory = null;
    
    for (const category of allCategories) {
        const categoryName = category.querySelector('.category-header-content span');
        if (categoryName && categoryName.textContent.includes('Events')) {
            eventsCategory = category;
            break;
        }
    }
    
    if (!eventsCategory) {
        console.error('Events category not found');
        return;
    }
    
    // Get mission set names from current deck missions
    const deckMissionCards = window.deckEditorCards.filter(card => card.type === 'mission');
    const deckMissionSets = new Set();
    
    deckMissionCards.forEach(card => {
        const mission = window.availableCardsMap.get(card.cardId);
        if (mission && mission.mission_set) {
            deckMissionSets.add(mission.mission_set);
        }
    });
    
    // If no missions selected, show all events
    if (deckMissionSets.size === 0) {
        if (isChecked) {
            showNotification('No missions selected - all events are considered usable', 'info');
        }
        return;
    }
    
    // Find all mission set groups in the events category
    const missionSetGroups = eventsCategory.querySelectorAll('.mission-set-group');
    
    missionSetGroups.forEach(group => {
        const groupHeader = group.querySelector('.mission-set-group-header span');
        if (!groupHeader) return;
        
        const groupName = groupHeader.textContent.split(' (')[0]; // Remove count
        const isUsable = deckMissionSets.has(groupName);
        
        if (isChecked) {
            // Hide unusable groups
            group.style.display = isUsable ? 'block' : 'none';
        } else {
            // Show all groups
            group.style.display = 'block';
        }
    });
    
    if (isChecked) {
        const visibleGroups = Array.from(missionSetGroups).filter(group => group.style.display !== 'none');
        showNotification(`Showing events for ${visibleGroups.length} selected mission set(s)`, 'info');
    }
}

// Toggle special cards character filter
async function toggleSpecialCardsCharacterFilter() {
    const filterCheckbox = document.getElementById('specialCardsCharacterFilter');
    if (!filterCheckbox) {
        console.error('Special cards character filter checkbox not found');
        return;
    }
    
    const isChecked = filterCheckbox.checked;
    
    // Find the special cards category by looking for the one with character groups
    const allCategories = document.querySelectorAll('.card-category');
    let specialCardsCategory = null;
    
    for (const category of allCategories) {
        if (category.querySelector('.character-group')) {
            specialCardsCategory = category;
            break;
        }
    }
    
    if (!specialCardsCategory) {
        console.error('Special cards category not found');
        return;
    }
    
    
    const characterGroups = specialCardsCategory.querySelectorAll('.character-group');
    
    // Get character names from current deck
    // First, get all character data to map IDs to names
    const allCharacters = await fetch('/api/characters').then(r => r.json());
    const characterMap = {};
    if (allCharacters.success) {
        allCharacters.data.forEach(char => {
            characterMap[char.id] = char.name;
        });
    }
    
    const deckCharacterCards = window.deckEditorCards.filter(card => card.type === 'character');
    const deckCharacterNames = deckCharacterCards.map(card => {
        // Direct lookup using UUID
        const character = window.availableCardsMap.get(card.cardId);
        return character ? character.name : null;
    }).filter(name => name); // Remove any undefined names
    
    
    // First, collect all groups and sort them to put "Any Character" at the top
    const groupsArray = Array.from(characterGroups);
    const anyCharacterGroup = groupsArray.find(group => {
        const header = group.querySelector('.character-group-header span');
        return header && header.textContent.split(' (')[0] === 'Any Character';
    });
    
    // Remove "Any Character" from the array and add it back at the beginning
    const otherGroups = groupsArray.filter(group => group !== anyCharacterGroup);
    const sortedGroups = anyCharacterGroup ? [anyCharacterGroup, ...otherGroups] : otherGroups;
    
    // Now process each group
    sortedGroups.forEach((group, index) => {
        const header = group.querySelector('.character-group-header span');
        if (!header) {
            return;
        }
        
        const characterName = header.textContent.split(' (')[0];
        
        if (isChecked) {
            // Always show "Any Character" group
            if (characterName === 'Any Character') {
                group.style.display = 'block';
                return;
            }
            
            // Show only characters that are in the current deck
            const isInDeck = deckCharacterNames.some(deckName => {
                // Exact match
                if (deckName === characterName) {
                    return true;
                }
                
                // Handle Angry Mob variants
                if (characterName.startsWith('Angry Mob') && deckName.startsWith('Angry Mob')) {
                    // Generic "Angry Mob" group should show for any Angry Mob variant
                    if (characterName === 'Angry Mob') {
                        return true;
                    }
                    
                    // Variant-specific groups (e.g., "Angry Mob: Middle Ages" or "Angry Mob - Middle Ages")
                    const hasVariantQualifier = characterName.includes(':') || characterName.includes(' - ');
                    if (hasVariantQualifier) {
                        // Extract variant from group name
                        const separator = characterName.includes(':') ? ':' : ' - ';
                        const groupVariant = characterName.split(separator)[1].trim();
                        
                        // Extract variant from deck character name (e.g., "Middle Ages" from "Angry Mob (Middle Ages)")
                        const deckVariantMatch = deckName.match(/\(([^)]+)\)/);
                        if (!deckVariantMatch) return false;
                        const deckVariant = deckVariantMatch[1].trim();
                        
                        // Normalize for comparison (handle pluralization and case)
                        const normalize = (v) => v.toLowerCase().replace(/\s+/g, ' ').trim().replace(/s$/, '');
                        return normalize(groupVariant) === normalize(deckVariant);
                    }
                    
                    return false;
                }
                
                // Handle other special cases (non-Angry Mob)
                const deckNameClean = deckName.split(' (')[0];
                if (deckNameClean === characterName) {
                    return true;
                }
                
                return false;
            });
            
            group.style.display = isInDeck ? 'block' : 'none';
        } else {
            // Show all character groups
            group.style.display = 'block';
        }
    });
    
    // Reorder the DOM elements to match our sorted order
    if (anyCharacterGroup && sortedGroups.length > 1) {
        const container = specialCardsCategory.querySelector('.card-category-content');
        sortedGroups.forEach(group => {
            container.appendChild(group);
        });
    }
}
// Update special cards filter when deck changes
function updateSpecialCardsFilter() {
    const filterCheckbox = document.getElementById('specialCardsCharacterFilter');
    if (filterCheckbox && filterCheckbox.checked) {
        // Add a small delay to ensure DOM is fully updated
        setTimeout(() => {
            toggleSpecialCardsCharacterFilter();
        }, 50);
    }
}
// Toggle advanced universe character filter
async function toggleAdvancedUniverseCharacterFilter() {
    const filterCheckbox = document.getElementById('advancedUniverseCharacterFilter');
    if (!filterCheckbox) {
        console.error('Advanced universe character filter checkbox not found');
        return;
    }
    
    const isChecked = filterCheckbox.checked;
    
    // Find the advanced universe category
    const allCategories = document.querySelectorAll('.card-category');
    let advancedUniverseCategory = null;
    
    for (const category of allCategories) {
        const header = category.querySelector('.card-category-header span');
        if (header && header.textContent.includes('Universe: Advanced')) {
            advancedUniverseCategory = category;
            break;
        }
    }
    
    if (!advancedUniverseCategory) {
        console.error('Advanced universe category not found');
        return;
    }
    
    // Get all character groups in the advanced universe category
    const characterGroups = advancedUniverseCategory.querySelectorAll('.character-group');
    
    if (isChecked) {
        // Filter to show only cards for characters in the deck
        const deckCharacterNames = window.deckEditorCards
            .filter(card => card.type === 'character')
            .map(card => {
                // Direct lookup using UUID
                const availableCard = window.availableCardsMap.get(card.cardId);
                return availableCard ? availableCard.name : null;
            })
            .filter(name => name !== null);
        
        characterGroups.forEach(group => {
            const header = group.querySelector('.character-group-header span');
            if (header) {
                const characterName = header.textContent.split(' (')[0]; // Extract character name
                
                if (deckCharacterNames.includes(characterName) || characterName === 'Any Character') {
                    group.style.display = 'block';
                } else {
                    group.style.display = 'none';
                }
            }
        });
    } else {
        // Show all character groups
        characterGroups.forEach(group => {
            group.style.display = 'block';
        });
    }
}

// Update advanced universe filter when deck changes
function updateAdvancedUniverseFilter() {
    const filterCheckbox = document.getElementById('advancedUniverseCharacterFilter');
    if (filterCheckbox && filterCheckbox.checked) {
        toggleAdvancedUniverseCharacterFilter();
    }
}

// Toggle power cards character filter
async function togglePowerCardsCharacterFilter() {
    const filterCheckbox = document.getElementById('powerCardsCharacterFilter');
    if (!filterCheckbox) {
        console.error('Power cards character filter checkbox not found');
        return;
    }
    
    const isChecked = filterCheckbox.checked;
    
    // Find the power cards category
    const allCategories = document.querySelectorAll('.card-category');
    let powerCardsCategory = null;
    
    for (const category of allCategories) {
        const header = category.querySelector('.card-category-header span');
        if (header && header.textContent.includes('Power Cards')) {
            powerCardsCategory = category;
            break;
        }
    }
    
    if (!powerCardsCategory) {
        console.error('Power cards category not found');
        return;
    }
    
        
    if (isChecked) {
        // Add visual indicator class
        powerCardsCategory.classList.add('power-cards-filter-active');
    } else {
        // Remove visual indicator class
        powerCardsCategory.classList.remove('power-cards-filter-active');
    }
    
    // Get character data from current deck
    const allCharacters = await fetch('/api/characters').then(r => r.json());
    const characterMap = {};
    if (allCharacters.success) {
        allCharacters.data.forEach(char => {
            characterMap[char.id] = char;
        });
    }
    
    const deckCharacters = window.deckEditorCards
        .filter(card => card.type === 'character')
        .map(card => {
            // Direct lookup using UUID
            return window.availableCardsMap.get(card.cardId);
        })
        .filter(char => char); // Remove undefined entries
    
    console.log(`Power cards filter: Found ${deckCharacters.length} characters in deck`);
    if (deckCharacters.length === 0) {
        console.log('No characters in deck - showing all power cards');
    }
    
    // Get all power card groups
    const powerGroups = powerCardsCategory.querySelectorAll('.character-group');
    let totalVisibleCards = 0;
    
    powerGroups.forEach(group => {
        const header = group.querySelector('.character-group-header span');
        if (!header) return;
        
        const powerType = header.textContent.split(' (')[0];
        
        if (isChecked) {
            // If no characters in deck, show all power cards
            if (deckCharacters.length === 0) {
                const cardItems = group.querySelectorAll('.card-item');
                cardItems.forEach(cardItem => {
                    cardItem.style.display = 'block';
                });
                group.style.display = 'block';
                totalVisibleCards += cardItems.length;
                console.log(`  ${powerType}: showing all ${cardItems.length} cards (no characters in deck)`);
                return;
            }
            
            // Filter power cards based on character stats
            const cardItems = group.querySelectorAll('.card-item');
            let visibleCount = 0;
            
            cardItems.forEach(cardItem => {
                const cardText = cardItem.textContent.trim().replace(/\s+/g, ' ').replace(/\s*\+$/, '');
                const match = cardText.match(/^(\d+) - (.+)$/);
                
                if (match) {
                    const cardValue = parseInt(match[1]);
                    const cardType = match[2];
                    
                    // Check if any deck character can use this power card
                    const canUse = deckCharacters.some(char => {
                        // Apply special-case overrides for power card usability
                        // John Carter: treat Brute Force as 8 for power card filtering
                        // Time Traveler: treat Intelligence as 8 for power card filtering
                        const nameLower = (char.name || '').toLowerCase();
                        const effectiveEnergy = char.energy || 0;
                        const effectiveCombat = char.combat || 0;
                        const effectiveBrute = Math.max(char.brute_force || 0, nameLower.includes('john carter') ? 8 : 0);
                        const effectiveIntel = Math.max(char.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0);
                        let characterStat = 0;
                        
                        switch (cardType) {
                            case 'Energy':
                                characterStat = effectiveEnergy;
                                break;
                            case 'Combat':
                                characterStat = effectiveCombat;
                                break;
                            case 'Brute Force':
                                characterStat = effectiveBrute;
                                break;
                            case 'Intelligence':
                                characterStat = effectiveIntel;
                                break;
                            case 'Any-Power':
                            case 'Multi-Power':
                            case 'Multi Power':  // Handle both hyphenated and spaced versions
                                // These can be used by any character with any stat >= card value
                                characterStat = Math.max(effectiveEnergy, effectiveCombat, effectiveBrute, effectiveIntel);
                                break;
                        }
                        
                        const usable = characterStat >= cardValue;
                        return usable;
                    });
                    
                    cardItem.style.display = canUse ? 'block' : 'none';
                    if (canUse) visibleCount++;
                }
            });
            
            // Update the group header count
            const originalText = header.textContent;
            const newText = originalText.replace(/\(\d+\)/, `(${visibleCount})`);
            header.textContent = newText;
            
            // Show/hide the entire group based on whether any cards are visible
            group.style.display = visibleCount > 0 ? 'block' : 'none';
            totalVisibleCards += visibleCount;
        } else {
            // Show all power cards and restore original counts
            const cardItems = group.querySelectorAll('.card-item');
            cardItems.forEach(cardItem => {
                cardItem.style.display = 'block';
            });
            group.style.display = 'block';
            
            // For Available Cards, counts should reflect number of available unique cards
            const powerTypeCount = cardItems.length;
            
            const originalText = header.textContent;
            const newText = originalText.replace(/\(\d+\)/, `(${powerTypeCount})`);
            header.textContent = newText;
            totalVisibleCards += powerTypeCount;
            console.log(`  ${powerType}: all ${powerTypeCount} cards shown (${cardItems.length} unique cards)`);
        }
    });
    
    // Update the main Power Cards header count
    const mainHeader = powerCardsCategory.querySelector('.card-category-header span');
    if (mainHeader) {
        // Calculate total power card count from window.deckEditorCards instead of using totalVisibleCards
        const totalPowerCardCount = window.deckEditorCards
            .filter(card => card.type === 'power')
            .reduce((total, card) => total + card.quantity, 0);
        
        const originalText = mainHeader.textContent;
        const newText = originalText.replace(/\(\d+\)/, `(${totalPowerCardCount})`);
        mainHeader.textContent = newText;
    }
    
    // Also check if character filter is active
    const powerFilterCheckbox2 = document.getElementById('powerCardsCharacterFilter');
    if (powerFilterCheckbox2 && powerFilterCheckbox2.checked) {
        togglePowerCardsCharacterFilter();
    }
}

    // Update power cards filter when deck changes
function updatePowerCardsFilter() {
    // Update power card counts in the UI
    const powerCardsCategory = document.querySelector('.card-category[data-type="power"]');
    if (!powerCardsCategory) {
        return;
    }
    
    // Get all power type sections within the power cards category
    const powerTypeSections = powerCardsCategory.querySelectorAll('.character-group');
    let totalVisibleCards = 0;
    
    powerTypeSections.forEach(section => {
        const header = section.querySelector('.character-group-header span');
        if (!header) return;
        
        const powerType = header.textContent.split(' (')[0]; // Extract power type name
        
        // Use DOM card items within this section so counts are correct on initial render
        const powerTypeCount = section.querySelectorAll('.card-item').length;
        
        const originalText = header.textContent;
        const newText = originalText.replace(/\(\d+\)/, `(${powerTypeCount})`);
        header.textContent = newText;
        totalVisibleCards += powerTypeCount;
    });
    
    // Update the main Power Cards header count from available items in DOM
    const mainHeader = powerCardsCategory.querySelector('.card-category-header span');
    if (mainHeader) {
        const totalPowerCardCount = Array.from(powerTypeSections).reduce((sum, section) => {
            return sum + section.querySelectorAll('.card-item').length;
        }, 0);
        const originalText = mainHeader.textContent;
        const newText = originalText.replace(/\(\d+\)/, `(${totalPowerCardCount})`);
        mainHeader.textContent = newText;
    }
    
    // Also check if character filter is active
    const powerFilterCheckbox2 = document.getElementById('powerCardsCharacterFilter');
    if (powerFilterCheckbox2 && powerFilterCheckbox2.checked) {
        togglePowerCardsCharacterFilter();
    }
}
// Toggle basic universe character filter
async function toggleBasicUniverseCharacterFilter() {
    const filterCheckbox = document.getElementById('basicUniverseCharacterFilter');
    if (!filterCheckbox) {
        console.error('Basic universe character filter checkbox not found');
        return;
    }
    
    const isChecked = filterCheckbox.checked;
    
    // Find the basic universe category
    const allCategories = document.querySelectorAll('.card-category');
    let basicUniverseCategory = null;
    
    for (const category of allCategories) {
        const header = category.querySelector('.card-category-header span');
        if (header && header.textContent.includes('Universe: Basic')) {
            basicUniverseCategory = category;
            break;
        }
    }
    
    if (!basicUniverseCategory) {
        console.error('Basic universe category not found');
        return;
    }
    
    
    if (isChecked) {
        // Add visual indicator class
        basicUniverseCategory.classList.add('power-cards-filter-active');
    } else {
        // Remove visual indicator class
        basicUniverseCategory.classList.remove('power-cards-filter-active');
    }
    
    // Get character data from current deck
    const allCharacters = await fetch('/api/characters').then(r => r.json());
    const characterMap = {};
    if (allCharacters.success) {
        allCharacters.data.forEach(char => {
            characterMap[char.id] = char;
        });
    }
    
    const deckCharacters = window.deckEditorCards
        .filter(card => card.type === 'character')
        .map(card => {
            // Direct lookup using UUID
            return window.availableCardsMap.get(card.cardId);
        })
        .filter(char => char); // Remove undefined entries
    
    
    // Get all basic universe cards
    const cardItems = basicUniverseCategory.querySelectorAll('.card-item');
    let totalVisibleCards = 0;
    
    cardItems.forEach(cardItem => {
        // Get the card data from the data attributes
        const cardType = cardItem.dataset.type;
        const cardId = cardItem.dataset.id;
        
        if (cardType === 'basic-universe') {
            // Get the card data from the available cards map
            // Direct lookup using UUID
            const availableCard = window.availableCardsMap.get(cardId);
            
            if (availableCard) {
                const cardName = availableCard.card_name;
                const cardTypeValue = availableCard.type;
                const valueToUse = availableCard.value_to_use;
                
                // Parse the value requirement (e.g., "6 or greater", "7 or greater")
                const valueMatch = valueToUse.match(/(\d+) or greater/);
                const requiredValue = valueMatch ? parseInt(valueMatch[1]) : 0;
                
                if (isChecked) {
                    // Check if any deck character can use this basic universe card
                    const canUse = deckCharacters.some(char => {
                        let characterStat = 0;
                        
                        switch (cardTypeValue) {
                            case 'Energy':
                                characterStat = char.energy;
                                break;
                            case 'Combat':
                                characterStat = char.combat;
                                break;
                            case 'Brute Force':
                                characterStat = char.brute_force;
                                break;
                            case 'Intelligence':
                                characterStat = char.intelligence;
                                break;
                        }
                        
                        const usable = characterStat >= requiredValue;
                        return usable;
                    });
                    
                    cardItem.style.display = canUse ? 'block' : 'none';
                    if (canUse) totalVisibleCards++;
                } else {
                    // Show all basic universe cards
                    cardItem.style.display = 'block';
                    totalVisibleCards++;
                }
            } else {
                // If card data not found, show the card
                cardItem.style.display = 'block';
                totalVisibleCards++;
            }
        } else {
            // For non-basic-universe cards, always show them
            cardItem.style.display = 'block';
            totalVisibleCards++;
        }
    });
    
    // Update the category header count
    const categoryHeader = basicUniverseCategory.querySelector('.card-category-header span');
    if (categoryHeader) {
        const originalText = categoryHeader.textContent;
        const newText = originalText.replace(/\(\d+\)/, `(${totalVisibleCards})`);
        categoryHeader.textContent = newText;
    }
    
}

// Update basic universe filter when deck changes
function updateBasicUniverseFilter() {
    const filterCheckbox = document.getElementById('basicUniverseCharacterFilter');
    if (filterCheckbox && filterCheckbox.checked) {
        toggleBasicUniverseCharacterFilter();
    }
}

// Toggle teamwork character filter
async function toggleTeamworkCharacterFilter() {
    const filterCheckbox = document.getElementById('teamworkCharacterFilter');
    if (!filterCheckbox) {
        console.error('Teamwork character filter checkbox not found');
        return;
    }
    
    const isChecked = filterCheckbox.checked;
    
    // Find the teamwork category
    const allCategories = document.querySelectorAll('.card-category');
    let teamworkCategory = null;
    
    for (const category of allCategories) {
        const header = category.querySelector('.card-category-header span');
        if (header && header.textContent.includes('Universe: Teamwork')) {
            teamworkCategory = category;
            break;
        }
    }
    
    if (!teamworkCategory) {
        console.error('Teamwork category not found');
        return;
    }
    
    // Get all card items in the teamwork category
    const cardItems = teamworkCategory.querySelectorAll('.card-item');
    let visibleCount = 0;
    
    if (isChecked) {
        // Filter out unusable cards
        cardItems.forEach(cardItem => {
            const cardText = cardItem.querySelector('.card-item-content').textContent;
            
            // Extract the "To Use" requirement (e.g., "6 Energy", "7 Combat")
            const toUseMatch = cardText.match(/(\d+)\s+(Energy|Combat|Brute Force|Intelligence|Any-Power)/);
            if (!toUseMatch) {
                cardItem.style.display = 'none';
                return;
            }
            
            const requiredValue = parseInt(toUseMatch[1]);
            const requiredType = toUseMatch[2];
            
            // Check if any character in the deck meets this requirement
            const hasUsableCharacter = window.deckEditorCards.some(deckCard => {
                if (deckCard.type !== 'character') return false;
                
                // Direct lookup using UUID
                const availableCard = window.availableCardsMap.get(deckCard.cardId);
                if (!availableCard) return false;
                
                // Check the specific stat type
                let characterValue = 0;
                switch (requiredType) {
                    case 'Energy':
                        characterValue = availableCard.energy || 0;
                        break;
                    case 'Combat':
                        characterValue = availableCard.combat || 0;
                        break;
                    case 'Brute Force':
                        characterValue = availableCard.brute_force || 0;
                        break;
                    case 'Intelligence':
                        characterValue = availableCard.intelligence || 0;
                        break;
                    case 'Any-Power':
                        // For Any-Power, check if character has any power stat >= required value
                        const maxPower = Math.max(
                            availableCard.energy || 0,
                            availableCard.combat || 0,
                            availableCard.brute_force || 0,
                            availableCard.intelligence || 0
                        );
                        return maxPower >= requiredValue;
                }
                
                return characterValue >= requiredValue;
            });
            
            if (!hasUsableCharacter) {
                cardItem.style.display = 'none';
            } else {
                cardItem.style.display = 'flex';
                visibleCount++;
            }
        });
    } else {
        // Show all cards
        cardItems.forEach(cardItem => {
            cardItem.style.display = 'flex';
            visibleCount++;
        });
    }
    
    // Update category totals for all subcategories
    const characterGroups = teamworkCategory.querySelectorAll('.character-group');
    characterGroups.forEach(group => {
        const header = group.querySelector('.character-group-header span');
        if (header) {
            const originalText = header.textContent;
            const match = originalText.match(/^(.+?)\s*\((\d+)\)$/);
            if (match) {
                const categoryName = match[1];
                const groupCardItems = group.querySelectorAll('.card-item');
                const groupVisibleCount = Array.from(groupCardItems).filter(item => 
                    item.style.display !== 'none'
                ).length;
                header.textContent = `${categoryName} (${groupVisibleCount})`;
            }
        }
    });
}

// Update teamwork filter when deck changes
function updateTeamworkFilter() {
    const filterCheckbox = document.getElementById('teamworkCharacterFilter');
    if (filterCheckbox && filterCheckbox.checked) {
        toggleTeamworkCharacterFilter();
    }
}

// Toggle training character filter
async function toggleTrainingCharacterFilter() {
    const filterCheckbox = document.getElementById('trainingCharacterFilter');
    if (!filterCheckbox) {
        console.error('Training character filter checkbox not found');
        return;
    }
    
    const isChecked = filterCheckbox.checked;
    
    // Find the training category
    const allCategories = document.querySelectorAll('.card-category');
    let trainingCategory = null;
    
    for (const category of allCategories) {
        const header = category.querySelector('.card-category-header span');
        if (header && header.textContent.includes('Universe: Training')) {
            trainingCategory = category;
            break;
        }
    }
    
    if (!trainingCategory) {
        console.error('Training category not found');
        return;
    }
    
    
    if (isChecked) {
        // Add visual indicator class
        trainingCategory.classList.add('power-cards-filter-active');
    } else {
        // Remove visual indicator class
        trainingCategory.classList.remove('power-cards-filter-active');
    }
    
    // Get character data from current deck
    const allCharacters = await fetch('/api/characters').then(r => r.json());
    const characterMap = {};
    if (allCharacters.success) {
        allCharacters.data.forEach(char => {
            characterMap[char.id] = char;
        });
    }
    
    const deckCharacters = window.deckEditorCards
        .filter(card => card.type === 'character')
        .map(card => {
            // Direct lookup using UUID
            return window.availableCardsMap.get(card.cardId);
        })
        .filter(char => char); // Remove undefined entries
    
    
    // Get all training cards
    const cardItems = trainingCategory.querySelectorAll('.card-item');
    let totalVisibleCards = 0;
    
    cardItems.forEach(cardItem => {
        // Get the card data from the data attributes
        const cardType = cardItem.dataset.type;
        const cardId = cardItem.dataset.id;
        
        if (cardType === 'training') {
            // Get the card data from the available cards map
            // Direct lookup using UUID
            const availableCard = window.availableCardsMap.get(cardId);
            
            if (availableCard) {
                const cardName = availableCard.card_name;
                const type1 = availableCard.type_1;
                const type2 = availableCard.type_2;
                const valueToUse = availableCard.value_to_use;
                
                // Parse the value requirement (e.g., "5 or less", "6 or less")
                const valueMatch = valueToUse.match(/(\d+) or less/);
                const requiredValue = valueMatch ? parseInt(valueMatch[1]) : 0;
                
                if (isChecked) {
                    // Check if any deck character can use this training card
                    // A character can use the card if they have EITHER type1 OR type2 with the required value
                    const canUse = deckCharacters.some(char => {
                        let type1Stat = 0;
                        let type2Stat = 0;
                        
                        // Get stats for both types
                        switch (type1) {
                            case 'Energy':
                                type1Stat = char.energy;
                                break;
                            case 'Combat':
                                type1Stat = char.combat;
                                break;
                            case 'Brute Force':
                                type1Stat = char.brute_force;
                                break;
                            case 'Intelligence':
                                type1Stat = char.intelligence;
                                break;
                        }
                        
                        switch (type2) {
                            case 'Energy':
                                type2Stat = char.energy;
                                break;
                            case 'Combat':
                                type2Stat = char.combat;
                                break;
                            case 'Brute Force':
                                type2Stat = char.brute_force;
                                break;
                            case 'Intelligence':
                                type2Stat = char.intelligence;
                                break;
                        }
                        
                        // Card is usable if EITHER type meets the requirement
                        const type1Usable = type1Stat <= requiredValue;
                        const type2Usable = type2Stat <= requiredValue;
                        const usable = type1Usable || type2Usable;
                        
                        return usable;
                    });
                    
                    cardItem.style.display = canUse ? 'block' : 'none';
                    if (canUse) totalVisibleCards++;
                } else {
                    // Show all training cards
                    cardItem.style.display = 'block';
                    totalVisibleCards++;
                }
            } else {
                // If card data not found, show the card
                cardItem.style.display = 'block';
                totalVisibleCards++;
            }
        } else {
            // For non-training cards, always show them
            cardItem.style.display = 'block';
            totalVisibleCards++;
        }
    });
    
    // Update the category header count
    const categoryHeader = trainingCategory.querySelector('.card-category-header span');
    if (categoryHeader) {
        const originalText = categoryHeader.textContent;
        const newText = originalText.replace(/\(\d+\)/, `(${totalVisibleCards})`);
        categoryHeader.textContent = newText;
    }
    
}

// Update training filter when deck changes
function updateTrainingFilter() {
    const filterCheckbox = document.getElementById('trainingCharacterFilter');
    if (filterCheckbox && filterCheckbox.checked) {
        toggleTrainingCharacterFilter();
    }
}
// Toggle ally universe character filter
async function toggleAllyUniverseCharacterFilter() {
    const filterCheckbox = document.getElementById('allyUniverseCharacterFilter');
    if (!filterCheckbox) {
        console.error('Ally universe character filter checkbox not found');
        return;
    }
    
    const isChecked = filterCheckbox.checked;
    
    // Find the ally universe category
    const allCategories = document.querySelectorAll('.card-category');
    let allyUniverseCategory = null;
    
    for (const category of allCategories) {
        const header = category.querySelector('.card-category-header span');
        if (header && header.textContent.includes('Universe: Ally')) {
            allyUniverseCategory = category;
            break;
        }
    }
    
    if (!allyUniverseCategory) {
        console.error('Ally universe category not found');
        return;
    }
    
    
    if (isChecked) {
        // Add visual indicator class
        allyUniverseCategory.classList.add('power-cards-filter-active');
    } else {
        // Remove visual indicator class
        allyUniverseCategory.classList.remove('power-cards-filter-active');
    }
    
    // Get character data from current deck
    const allCharacters = await fetch('/api/characters').then(r => r.json());
    const characterMap = {};
    if (allCharacters.success) {
        allCharacters.data.forEach(char => {
            characterMap[char.id] = char;
        });
    }
    
    const deckCharacters = window.deckEditorCards
        .filter(card => card.type === 'character')
        .map(card => {
            // Direct lookup using UUID
            return window.availableCardsMap.get(card.cardId);
        })
        .filter(char => char); // Remove undefined entries
    
    
    // Get all ally universe cards
    const cardItems = allyUniverseCategory.querySelectorAll('.card-item');
    let totalVisibleCards = 0;
    
    cardItems.forEach(cardItem => {
        // Get the card data from the data attributes
        const cardType = cardItem.dataset.type;
        const cardId = cardItem.dataset.id;
        
        if (cardType === 'ally-universe') {
            // Get the card data from the available cards map
            // Direct lookup using UUID
            const availableCard = window.availableCardsMap.get(cardId);
            
            if (availableCard) {
                const cardName = availableCard.card_name;
                const statToUse = availableCard.stat_to_use;
                const statTypeToUse = availableCard.stat_type_to_use;
                
                // Parse the value requirement (e.g., "5 or less", "7 or higher")
                const valueMatch = statToUse.match(/(\d+) or (less|higher)/);
                const requiredValue = valueMatch ? parseInt(valueMatch[1]) : 0;
                const isLessThan = valueMatch && valueMatch[2] === 'less';
                
                if (isChecked) {
                    // Check if any deck character can use this ally universe card
                    const canUse = deckCharacters.some(char => {
                        let characterStat = 0;
                        
                        // Get the character's stat for the required type
                        switch (statTypeToUse) {
                            case 'Energy':
                                characterStat = char.energy;
                                break;
                            case 'Combat':
                                characterStat = char.combat;
                                break;
                            case 'Brute Force':
                                characterStat = char.brute_force;
                                break;
                            case 'Intelligence':
                                characterStat = char.intelligence;
                                break;
                        }
                        
                        // Check if the character meets the requirement
                        const usable = isLessThan ? characterStat <= requiredValue : characterStat >= requiredValue;
                        
                        return usable;
                    });
                    
                    cardItem.style.display = canUse ? 'block' : 'none';
                    if (canUse) totalVisibleCards++;
                } else {
                    // Show all ally universe cards
                    cardItem.style.display = 'block';
                    totalVisibleCards++;
                }
            } else {
                // If card data not found, show the card
                cardItem.style.display = 'block';
                totalVisibleCards++;
            }
        } else {
            // For non-ally-universe cards, always show them
            cardItem.style.display = 'block';
            totalVisibleCards++;
        }
    });
    
    // Update the category header count
    const categoryHeader = allyUniverseCategory.querySelector('.card-category-header span');
    if (categoryHeader) {
        const originalText = categoryHeader.textContent;
        const newText = originalText.replace(/\(\d+\)/, `(${totalVisibleCards})`);
        categoryHeader.textContent = newText;
    }
    
}

// Update ally universe filter when deck changes
function updateAllyUniverseFilter() {
    const filterCheckbox = document.getElementById('allyUniverseCharacterFilter');
    if (filterCheckbox && filterCheckbox.checked) {
        toggleAllyUniverseCharacterFilter();
    }
}

// Export all functions to window for backward compatibility
window.applyFilters = applyFilters;
window.applyLocationFilters = applyLocationFilters;
window.applyEventsFilters = applyEventsFilters;
window.applyBasicUniverseFilters = applyBasicUniverseFilters;
window.toggleEventsMissionFilter = toggleEventsMissionFilter;
window.toggleSpecialCardsCharacterFilter = toggleSpecialCardsCharacterFilter;
window.updateSpecialCardsFilter = updateSpecialCardsFilter;
window.toggleAdvancedUniverseCharacterFilter = toggleAdvancedUniverseCharacterFilter;
window.updateAdvancedUniverseFilter = updateAdvancedUniverseFilter;
window.togglePowerCardsCharacterFilter = togglePowerCardsCharacterFilter;
window.updatePowerCardsFilter = updatePowerCardsFilter;
window.toggleBasicUniverseCharacterFilter = toggleBasicUniverseCharacterFilter;
window.updateBasicUniverseFilter = updateBasicUniverseFilter;
window.toggleTeamworkCharacterFilter = toggleTeamworkCharacterFilter;
window.updateTeamworkFilter = updateTeamworkFilter;
window.toggleTrainingCharacterFilter = toggleTrainingCharacterFilter;
window.updateTrainingFilter = updateTrainingFilter;
window.toggleAllyUniverseCharacterFilter = toggleAllyUniverseCharacterFilter;
window.updateAllyUniverseFilter = updateAllyUniverseFilter;
