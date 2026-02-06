// card-data-display.js - Card-type data loading and display functions
// Extracted from public/index.html

async function loadMissions() {
    try {
        const response = await fetch('/api/missions');
        const data = await response.json();
        
        if (data.success) {
            // Store missions data globally for filtering
            window.missionsData = data.data;
            displayMissions(data.data);
        }
    } catch (error) {
        console.error('Error loading missions:', error);
    }
}

// displayMissions function moved to external file

// setupMissionSearch function moved to external file

// Event functions
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const data = await response.json();
        
        if (data.success) {
            // Store events data globally for filtering
            window.eventsData = data.data;
            displayEvents(data.data);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// displayEvents function moved to external file

// setupEventSearch function moved to external file

// Aspect functions
async function loadAspects() {
    try {
        const response = await fetch('/api/aspects');
        const data = await response.json();
        
        if (data.success) {
            displayAspects(data.data);
        }
    } catch (error) {
        console.error('Error loading aspects:', error);
    }
}
// displayAspects function moved to external file

// toggleFortificationsColumn function moved to filter-functions.js

// toggleOnePerDeckColumn function moved to external file

// Advanced Universe functions
async function loadAdvancedUniverse() {
    try {
        const response = await fetch('/api/advanced-universe');
        const data = await response.json();
        
        if (data.success) {
            displayAdvancedUniverse(data.data);
        }
    } catch (error) {
        console.error('Error loading advanced universe:', error);
    }
}

// displayAdvancedUniverse function moved to external file
// displayAdvancedUniverse_OLD function removed (unused)
// toggleOnePerDeckAdvancedColumn function moved to external file

// Teamwork functions
async function loadTeamwork() {
    try {
        const response = await fetch('/api/teamwork');
        const data = await response.json();
        
        if (data.success) {
            displayTeamwork(data.data);
        }
    } catch (error) {
        console.error('Error loading teamwork:', error);
    }
}

function displayTeamwork(teamwork) {
    const tbody = document.getElementById('teamwork-tbody');
    
    if (teamwork.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No teamwork cards found</td></tr>';
        return;
    }
    
    // Sort teamwork cards by OverPower type order: Energy, Combat, Brute Force, Intelligence, Any-Power
    const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power'];
    const sortedTeamwork = teamwork.sort((a, b) => {
        const aType = a.to_use || '';
        const bType = b.to_use || '';
        
        // Extract the power type from "X Energy", "X Combat", etc.
        const aPowerType = aType.replace(/^\d+\s+/, '');
        const bPowerType = bType.replace(/^\d+\s+/, '');
        
        const aIndex = preferredOrder.indexOf(aPowerType);
        const bIndex = preferredOrder.indexOf(bPowerType);
        
        // If both are in preferred order, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
        }
        
        // If only one is in preferred order, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // If neither is in preferred order, sort alphabetically
        return aPowerType.localeCompare(bPowerType);
    });
    
    tbody.innerHTML = sortedTeamwork.map(card => `
        <tr>
            <td>
                <img src="/src/resources/cards/images/teamwork-universe/${mapImagePathToActualFile(card.image)}" 
                     alt="${card.card_type || ''}" 
                     style="width: 120px !important; height: auto !important; max-height: 180px !important; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiZmZmYiIHRleHQtYW5jaG9yPSJtZWRpYW4iIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/teamwork-universe/${mapImagePathToActualFile(card.image)}', '${(card.card_type || '').replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('teamwork', '${card.id}', '${(card.card_type || '').replace(/'/g, "\\'")}', this)">
                    +Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${card.id}', 'teamwork')" style="margin-top: 4px; display: block;">
                    +Collection
                </button>
                ` : ''}
            </td>
            <td>${card.to_use}</td>
            <td>${card.acts_as}</td>
            <td>${card.followup_attack_types}</td>
            <td>${card.first_attack_bonus}</td>
            <td>${card.second_attack_bonus}</td>
        </tr>
    `).join('');
}

// Ally Universe
async function loadAllyUniverse() {
    try {
        const response = await fetch('/api/ally-universe');
        const data = await response.json();
        if (data.success) {
            displayAllyUniverse(data.data);
        }
    } catch (error) {
        console.error('Error loading ally universe:', error);
    }
}

function displayAllyUniverse(allies) {
    const tbody = document.getElementById('ally-universe-tbody');
    if (!allies || allies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No allies found</td></tr>';
        return;
    }
    
    // Sort ally cards by OverPower type order: Energy, Combat, Brute Force, Intelligence, Any-Power
    const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power'];
    const sortedAllies = allies.sort((a, b) => {
        const aType = a.stat_type_to_use || '';
        const bType = b.stat_type_to_use || '';
        
        const aIndex = preferredOrder.indexOf(aType);
        const bIndex = preferredOrder.indexOf(bType);
        
        // If both are in preferred order, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
        }
        
        // If only one is in preferred order, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // If neither is in preferred order, sort alphabetically
        return aType.localeCompare(bType);
    });
    
    tbody.innerHTML = sortedAllies.map(card => `
        <tr>
            <td>
                <img src="/src/resources/cards/images/ally-universe/${mapImagePathToActualFile(card.image)}" 
                     alt="${card.card_name}" 
                     style="width: 120px !important; height: auto !important; max-height: 180px !important; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiZmZmYiIHRleHQtYW5jaG9yPSJtZWRpYW4iIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/ally-universe/${mapImagePathToActualFile(card.image)}', '${(card.card_name || '').replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('ally-universe', '${card.id}', '${(card.card_name || '').replace(/'/g, "\\'")}', this)">
                    +Deck
                </button>
            </td>
            <td><strong>${card.card_name}</strong></td>
            <td>${card.stat_to_use}</td>
            <td>${card.stat_type_to_use}</td>
            <td>${card.attack_value}</td>
            <td>${card.attack_type}</td>
            <td>${card.card_text}</td>
        </tr>
    `).join('');
}

// setupAllyUniverseSearch function moved to external file

// Training functions
async function loadTraining() {
    try {
        const response = await fetch('/api/training');
        const data = await response.json();
        if (data.success) displayTraining(data.data);
    } catch (e) { console.error('Error loading training:', e); }
}

function displayTraining(cards) {
    const tbody = document.getElementById('training-tbody');
    if (!cards || cards.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No training found</td></tr>';
        return;
    }
    tbody.innerHTML = cards.map(card => `
        <tr>
            <td>
                <img src="/src/resources/cards/images/training-universe/${mapImagePathToActualFile(card.image)}" 
                     alt="${card.card_name}" 
                     style="width: 120px !important; height: auto !important; max-height: 180px !important; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiZmZmYiIHRleHQtYW5jaG9yPSJtZWRpYW4iIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/training-universe/${mapImagePathToActualFile(card.image)}', '${(card.card_name || '').replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('training', '${card.id}', '${(card.card_name || '').replace(/'/g, "\\'")}', this)">
                    +Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${card.id}', 'training')" style="margin-top: 4px; display: block;">
                    +Collection
                </button>
                ` : ''}
            </td>
            <td><strong>${card.card_name.replace(/^Training \(/, '').replace(/\)$/, '')}</strong></td>
            <td>${card.type_1}</td>
            <td>${card.type_2}</td>
            <td>${card.value_to_use}</td>
            <td>${card.bonus}</td>
        </tr>
    `).join('');
}

// setupTrainingSearch function moved to external file

// Basic Universe functions
async function loadBasicUniverse() {
    try {
        const resp = await fetch('/api/basic-universe');
        const data = await resp.json();
        if (data.success) displayBasicUniverse(data.data);
    } catch (e) { console.error('Error loading basic universe:', e); }
}

function setupBasicUniverseSearch() {
    // Initialize checkboxes to checked by default
    const checkboxes = document.querySelectorAll('#basic-universe-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });

    // Add event listeners for filters
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyBasicUniverseFilters);
    });

    // Add event listeners for other filter inputs
    const valueEquals = document.querySelector('#basic-universe-tab input[data-column="value"].equals');
    const valueMin = document.getElementById('basic-value-min');
    const valueMax = document.getElementById('basic-value-max');
    const bonusEquals = document.querySelector('#basic-universe-tab input[data-column="bonus"].equals');
    const bonusMin = document.getElementById('basic-bonus-min');
    const bonusMax = document.getElementById('basic-bonus-max');

    if (valueEquals) valueEquals.addEventListener('input', applyBasicUniverseFilters);
    if (valueMin) valueMin.addEventListener('input', applyBasicUniverseFilters);
    if (valueMax) valueMax.addEventListener('input', applyBasicUniverseFilters);
    if (bonusEquals) bonusEquals.addEventListener('input', applyBasicUniverseFilters);
    if (bonusMin) bonusMin.addEventListener('input', applyBasicUniverseFilters);
    if (bonusMax) bonusMax.addEventListener('input', applyBasicUniverseFilters);

    // Setup search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm.length === 0) { 
                await applyBasicUniverseFilters(); 
                return; 
            }
            try {
                const resp = await fetch('/api/basic-universe');
                const data = await resp.json();
                if (data.success) {
                    const filtered = data.data.filter(card =>
                        card.card_name.toLowerCase().includes(searchTerm) ||
                        card.type.toLowerCase().includes(searchTerm) ||
                        card.value_to_use.toLowerCase().includes(searchTerm) ||
                        card.bonus.toLowerCase().includes(searchTerm)
                    );
                    displayBasicUniverse(filtered);
                }
            } catch (err) { 
                console.error('Error searching basic universe:', err); 
            }
        });
    }
}

function displayBasicUniverse(cards) {
    const tbody = document.getElementById('basic-universe-tbody');
    if (!cards || cards.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No basic universe cards found</td></tr>';
        return;
    }
    
    // Sort basic universe cards by type, then value_to_use, then bonus
    const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power'];
    const sortedCards = cards.sort((a, b) => {
        // First sort by type using OverPower order
        const aTypeIndex = preferredOrder.indexOf(a.type);
        const bTypeIndex = preferredOrder.indexOf(b.type);
        
        if (aTypeIndex !== bTypeIndex) {
            if (aTypeIndex === -1) return 1;  // Put unknown types at end
            if (bTypeIndex === -1) return -1;
            return aTypeIndex - bTypeIndex;
        }
        
        // Then sort by value_to_use (extract numeric value)
        const aValue = parseInt(a.value_to_use) || 0;
        const bValue = parseInt(b.value_to_use) || 0;
        if (aValue !== bValue) {
            return aValue - bValue;
        }
        
        // Finally sort by bonus (extract numeric value)
        const aBonus = parseInt(a.bonus.replace('+', '')) || 0;
        const bBonus = parseInt(b.bonus.replace('+', '')) || 0;
        return aBonus - bBonus;
    });
    
    tbody.innerHTML = sortedCards.map(card => `
        <tr>
            <td>
                <img src="/src/resources/cards/images/basic-universe/${mapImagePathToActualFile(card.image)}" 
                     alt="${card.card_name}" 
                     style="width: 120px !important; height: auto !important; max-height: 180px !important; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/basic-universe/${mapImagePathToActualFile(card.image)}', '${(card.card_name || '').replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('basic-universe', '${card.id}', '${(card.card_name || '').replace(/'/g, "\\'")}', this)">
                    +Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${card.id}', 'basic-universe')" style="margin-top: 4px; display: block;">
                    +Collection
                </button>
                ` : ''}
            </td>
            <td><strong>${card.card_name}</strong></td>
            <td>${card.type}</td>
            <td>${card.value_to_use}</td>
            <td>${card.bonus}</td>
        </tr>
    `).join('');
}

// setupBasicUniverseSearch function moved to external file

// clearBasicUniverseFilters function moved to filter-functions.js

// applyBasicUniverseFilters moved to card-filter-toggles.js


// Power Cards functions
async function loadPowerCards() {
    try {
        const resp = await fetch('/api/power-cards');
        const data = await resp.json();
        if (data.success) {
            displayPowerCards(data.data);
        }
    } catch (e) { console.error('Error loading power cards:', e); }
}

// Export all functions to window for backward compatibility
window.loadMissions = loadMissions;
window.loadEvents = loadEvents;
window.loadAspects = loadAspects;
window.loadAdvancedUniverse = loadAdvancedUniverse;
window.loadTeamwork = loadTeamwork;
window.displayTeamwork = displayTeamwork;
window.loadAllyUniverse = loadAllyUniverse;
window.displayAllyUniverse = displayAllyUniverse;
window.loadTraining = loadTraining;
window.displayTraining = displayTraining;
window.loadBasicUniverse = loadBasicUniverse;
window.setupBasicUniverseSearch = setupBasicUniverseSearch;
window.displayBasicUniverse = displayBasicUniverse;
window.loadPowerCards = loadPowerCards;
