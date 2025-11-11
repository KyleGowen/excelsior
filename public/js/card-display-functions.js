// Card Display Functions
// Extracted from index.html for better modularity

// Display missions
function displayMissions(missions) {
    const tbody = document.getElementById('missions-tbody');
    
    if (missions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No missions found</td></tr>';
        return;
    }
    
    // Sort missions by mission set first, then by card name alphabetically
    const sortedMissions = missions.sort((a, b) => {
        if (a.mission_set !== b.mission_set) {
            return a.mission_set.localeCompare(b.mission_set);
        }
        return a.card_name.localeCompare(b.card_name);
    });
    
    tbody.innerHTML = sortedMissions.map(mission => `
        <tr>
            <td>
                <img src="/src/resources/cards/images/missions/${mapImagePathToActualFile(mission.image)}" 
                     alt="${mission.card_name}" 
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/missions/${mapImagePathToActualFile(mission.image)}', '${mission.card_name.replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='"
                     style="width: 120px !important; height: auto !important; max-height: 180px !important; cursor: pointer;">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('mission', '${mission.id}', '${mission.card_name.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${mission.id}', 'mission')" style="margin-top: 4px; display: block; width: 100%;">
                    Add to Collection
                </button>
                ` : ''}
            </td>
            <td>${mission.mission_set}</td>
            <td>${mission.card_name}</td>
        </tr>
    `).join('');
}

// Display events
function displayEvents(events) {
    const tbody = document.getElementById('events-tbody');
    
    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No events found</td></tr>';
        return;
    }
    
    // Sort events by mission set first, then by name alphabetically
    const sortedEvents = events.sort((a, b) => {
        if (a.mission_set !== b.mission_set) {
            return a.mission_set.localeCompare(b.mission_set);
        }
        return a.name.localeCompare(b.name);
    });
    
    tbody.innerHTML = '';
    
    sortedEvents.forEach(event => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <img src="/src/resources/cards/images/events/${mapImagePathToActualFile(event.image)}" 
                     alt="${event.name}" 
                     style="width: 120px !important; height: auto !important; max-height: 180px !important; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/events/${mapImagePathToActualFile(event.image)}', '${event.name.replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('event', '${event.id}', '${event.name.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${event.id}', 'event')" style="margin-top: 4px; display: block; width: 100%;">
                    Add to Collection
                </button>
                ` : ''}
            </td>
            <td><strong>${event.name}</strong></td>
            <td>${event.mission_set}</td>
            <td>${event.game_effect}</td>
            <td><em>${event.flavor_text.replace(/^\*|\*$/g, '')}</em></td>
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

// Display aspects
function displayAspects(aspects) {
    const tbody = document.getElementById('aspects-tbody');
    
    if (aspects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No aspects found</td></tr>';
        return;
    }
    
    tbody.innerHTML = aspects.map(aspect => `
        <tr>
            <td>
                <img src="/src/resources/cards/images/aspects/${mapImagePathToActualFile(aspect.image)}" 
                     alt="${aspect.card_name}" 
                     style="width: 120px !important; height: auto !important; max-height: 180px !important; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtZWRpYW4iIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/aspects/${mapImagePathToActualFile(aspect.image)}', '${aspect.card_name.replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('aspect', '${aspect.id}', '${aspect.card_name.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${aspect.id}', 'aspect')" style="margin-top: 4px; display: block; width: 100%;">
                    Add to Collection
                </button>
                ` : ''}
            </td>
            <td><strong>${aspect.card_name}</strong></td>
            <td>${aspect.location}</td>
            <td>${formatSpecialCardEffect(aspect.aspect_description || aspect.card_effect || 'No description available')}</td>
            <td class="fortifications-column">${aspect.is_fortification ? 'Yes' : 'No'}</td>
            <td class="one-per-deck-column">${aspect.is_one_per_deck ? 'Yes' : 'No'}</td>
        </tr>
    `).join('');
}

/**
 * Format advanced universe card effect text with proper HTML encoding and keyword highlighting
 */
function formatAdvancedUniverseCardEffect(effectText, cardData = null) {
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
    const orderedKeywords = ['**One Per Deck**'];
    const foundKeywords = [];
    
    // Find all special keywords in the text
    for (const keyword of orderedKeywords) {
        if (decodedText.includes(keyword)) {
            foundKeywords.push(keyword);
        }
    }
    
    // Check if card has one_per_deck=true and add the label if not already present
    if (cardData && cardData.is_one_per_deck === true && !foundKeywords.includes('**One Per Deck**')) {
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

// Display advanced universe cards
function displayAdvancedUniverse(advancedUniverse) {
    const tbody = document.getElementById('advanced-universe-tbody');
    if (!tbody) return;
    
    if (advancedUniverse.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No advanced universe cards found</td></tr>';
        return;
    }
    
    tbody.innerHTML = advancedUniverse.map(card => `
        <tr>
            <td>
                <img src="/src/resources/cards/images/${card.image}" 
                     alt="${card.name}" 
                     class="card-image"
                     style="width: 120px !important; height: auto !important; max-height: 180px !important; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                     onclick="openModal(this)"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/${card.image}', '${card.name.replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('advanced-universe', '${card.id}', '${card.name.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
                ${(typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN') ? `
                <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${card.id}', 'advanced-universe')" style="margin-top: 4px; display: block; width: 100%;">
                    Add to Collection
                </button>
                ` : ''}
            </td>
            <td><strong>${card.name}</strong></td>
            <td>${card.character}</td>
            <td>${formatAdvancedUniverseCardEffect(card.card_description || card.card_effect || 'No description available', card)}</td>
            <td class="one-per-deck-advanced-column">${card.is_one_per_deck ? 'Yes' : 'No'}</td>
        </tr>
    `).join('');
}

// Display teamwork cards
function displayTeamwork(teamwork) {
    const tbody = document.getElementById('teamwork-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = teamwork.map(card => `
        <tr>
            <td>${card.card_name}</td>
            <td>${card.to_use}</td>
            <td>${card.followup_attack_types}</td>
            <td>${card.first_attack_bonus}</td>
            <td>${card.second_attack_bonus}</td>
        </tr>
    `).join('');
}

// Display ally universe cards
function displayAllyUniverse(allies) {
    const tbody = document.getElementById('ally-universe-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = allies.map(card => `
        <tr>
            <td>${card.card_name}</td>
            <td>${card.stat_to_use}</td>
            <td>${card.stat_type_to_use}</td>
            <td>${card.attack_value}</td>
            <td>${card.attack_type}</td>
            <td>${card.card_text}</td>
        </tr>
    `).join('');
}

// Display training cards
function displayTraining(cards) {
    const tbody = document.getElementById('training-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = cards.map(card => `
        <tr>
            <td>${card.card_name}</td>
            <td>${card.type_1}</td>
            <td>${card.type_2}</td>
            <td>${card.value_to_use}</td>
            <td>${card.bonus}</td>
        </tr>
    `).join('');
}

// Display basic universe cards
function displayBasicUniverse(cards) {
    const tbody = document.getElementById('basic-universe-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = cards.map(card => `
        <tr>
            <td>${card.card_name}</td>
            <td>${card.type}</td>
            <td>${card.value_to_use}</td>
            <td>${card.bonus}</td>
            <td>${card.card_text}</td>
        </tr>
    `).join('');
}

// Display power cards
function displayPowerCards(cards) {
    const tbody = document.getElementById('power-cards-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = cards.map(card => `
        <tr>
            <td>${card.card_name}</td>
            <td>${card.type}</td>
            <td>${card.value}</td>
            <td>${card.card_text}</td>
        </tr>
    `).join('');
}

// Make functions globally available
window.displayAdvancedUniverse = displayAdvancedUniverse;
window.displayTeamwork = displayTeamwork;
window.displayAllyUniverse = displayAllyUniverse;
window.displayTraining = displayTraining;
window.displayBasicUniverse = displayBasicUniverse;
window.displayPowerCards = displayPowerCards;
window.displayAspects = displayAspects;
window.displayMissions = displayMissions;
window.displayEvents = displayEvents;
window.displayLocations = displayLocations;
