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
 * Display character cards in the characters table
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
    
    // Verify tbody is ready

    characters.forEach(character => {
        const row = document.createElement('tr');
        
        // Determine threat level class
        let threatClass = 'threat-low';
        if (character.threat_level >= 20) threatClass = 'threat-high';
        else if (character.threat_level >= 18) threatClass = 'threat-medium';

        row.innerHTML = `
            <td>
                <img src="/src/resources/cards/images/characters/${mapImagePathToActualFile(character.image)}" 
                     alt="${character.name}" 
                     style="width: 80px; height: auto; max-height: 120px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgODAgMTIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/characters/${mapImagePathToActualFile(character.image)}', '${character.name.replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('character', '${character.id}', '${character.name.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
            </td>
            <td><strong>${character.name}</strong></td>
            <td>${character.energy}</td>
            <td>${character.combat}</td>
            <td>${character.brute_force}</td>
            <td>${character.intelligence}</td>
            <td class="${threatClass}">${character.threat_level}</td>
            <td>${character.special_abilities || ''}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Format special card effect text with proper HTML encoding and keyword highlighting
 */
function formatSpecialCardEffect(effectText, cardData = null) {
    if (!effectText) return '';
    
    // Decode HTML entities in the text
    let decodedText = effectText
        .replace(/\'93/g, "'")  // Left single quotation mark
        .replace(/\'94/g, "'")  // Right single quotation mark
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
 */
function displaySpecialCards(specialCards) {
    const tbody = document.getElementById('special-cards-tbody');
    tbody.innerHTML = '';

    specialCards.forEach(card => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <img src="/src/resources/cards/images/specials/${mapImagePathToActualFile(card.image)}" 
                     alt="${card.name}" 
                     style="width: 120px; height: auto; max-height: 180px; object-fit: contain; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null;"
                     onmouseenter="showCardHoverModal('/src/resources/cards/images/specials/${mapImagePathToActualFile(card.image)}', '${card.name.replace(/'/g, "\\'")}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </td>
            <td>
                <button class="add-to-deck-btn" onclick="showDeckSelection('special', '${card.id}', '${card.name.replace(/'/g, "\\'")}', this)">
                    Add to Deck
                </button>
            </td>
            <td><strong>${card.name}</strong></td>
            <td>${card.character}</td>
            <td>${formatSpecialCardEffect(card.card_effect, card)}</td>
        `;
        
        tbody.appendChild(row);
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
            </td>
            <td><strong>${location.name}</strong></td>
            <td class="${threatClass}">${location.threat_level}</td>
            <td>${location.special_ability || ''}</td>
        `;
        
        tbody.appendChild(row);
    });
}
