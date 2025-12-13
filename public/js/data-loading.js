/* ========================================
 * PHASE 6: DATA LOADING FUNCTIONS
 * ========================================
 * 
 * This file contains API data loading and management functions
 * extracted from index.html during Phase 6 of the refactoring project.
 * 
 * Purpose: API data loading and management
 * Created: Phase 6 of 12-phase refactoring project
 * Contains:
 *   - loadDatabaseViewData() - Database view initialization
 *   - loadCharacters() - Character data loading
 *   - loadSpecialCards() - Special card data loading
 *   - All other card type loading functions
 *   - Background data loading functions
 * 
 * ======================================== */

// Load all database view data
async function loadDatabaseViewData(forceCharactersTab = false) {
    // Clear all filters globally before loading data
    clearAllFiltersGlobally();
    
    // Only force characters tab if explicitly requested
    if (forceCharactersTab) {
        // Ensure characters tab is visible before loading data
        const charactersTab = document.getElementById('characters-tab');
        charactersTab.style.display = 'block';
        
        // Set characters tab as active
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const charactersButton = document.querySelector('[data-tab="characters"]');
        if (charactersButton) {
            charactersButton.classList.add('active');
        }
        
        // Call switchTab to set up search container and other tab-specific functionality
        if (typeof switchTab === 'function') {
            switchTab('characters');
        }
    }
    
    try {
        await Promise.all([
            loadCharacters(),
            loadSpecialCards(),
            loadAdvancedUniverse(),
            loadMissions(),
            loadLocations(),
            loadEvents(),
            loadAspects(),
            loadTeamwork(),
            loadAllyUniverse(),
            loadTraining(),
            loadBasicUniverse(),
            loadPowerCards(),
            loadUserDecks()
        ]);
        
        // Update all statistics after loading all data
        
        // Only switch to characters tab if explicitly requested
        if (forceCharactersTab) {
            switchTab('characters');
        }
        
        // Lock all row heights after all data is loaded
        setTimeout(() => {
            if (typeof lockAllSpecialCardRowHeights === 'function') {
                lockAllSpecialCardRowHeights();
            }
        }, 1000);
        
    // Disable "Add to Deck" buttons for guest users immediately
    disableAddToDeckButtonsImmediate();
        
    } catch (error) {
        console.error('❌ Error loading database view data:', error);
    }
}

// Load and display characters
async function loadCharacters() {
    try {
        const response = await fetch('/api/characters');
        const data = await response.json();
        
        if (data.success) {
            
            // Small delay to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 10));
            
            displayCharacters(data.data);
        } else {
            throw new Error('Failed to load characters');
        }
    } catch (error) {
        console.error('❌ Error loading characters:', error);
        document.getElementById('characters-tbody').innerHTML = 
            '<tr><td colspan="8" class="error">Error loading characters. Please try again.</td></tr>';
    }
}

// Load and display special cards
async function loadSpecialCards() {
    try {
        const response = await fetch('/api/special-cards');
        const data = await response.json();
        
        if (data.success) {
            displaySpecialCards(data.data);
            
            // Lock all row heights after a delay to ensure images are loaded
            setTimeout(() => {
                if (typeof lockAllSpecialCardRowHeights === 'function') {
                    lockAllSpecialCardRowHeights();
                }
            }, 500);
        } else {
            throw new Error('Failed to load special cards');
        }
    } catch (error) {
        console.error('Error loading special cards:', error);
        document.getElementById('special-cards-tbody').innerHTML = 
            '<tr><td colspan="5" class="error">Error loading special cards. Please try again.</td></tr>';
    }
}

// Load and display locations
async function loadLocations() {
    try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        
        if (data.success) {
            displayLocations(data.data);
        } else {
            throw new Error('Failed to load locations');
        }
    } catch (error) {
        console.error('Error loading locations:', error);
        document.getElementById('locations-tbody').innerHTML = 
            '<tr><td colspan="4" class="error">Error loading locations. Please try again.</td></tr>';
    }
}

// Load and display Character+ data (characters with their special cards)
async function loadCharacterPlus() {
    try {
        // Fetch both characters and special cards in parallel
        const [charactersResponse, specialCardsResponse] = await Promise.all([
            fetch('/api/characters'),
            fetch('/api/special-cards')
        ]);
        
        const charactersData = await charactersResponse.json();
        const specialCardsData = await specialCardsResponse.json();
        
        if (!charactersData.success) {
            throw new Error('Failed to load characters');
        }
        
        if (!specialCardsData.success) {
            throw new Error('Failed to load special cards');
        }
        
        // Group special cards by character_name
        const specialCardsByCharacter = new Map();
        specialCardsData.data.forEach(specialCard => {
            const characterName = specialCard.character_name || specialCard.character || '';
            if (!specialCardsByCharacter.has(characterName)) {
                specialCardsByCharacter.set(characterName, []);
            }
            specialCardsByCharacter.get(characterName).push(specialCard);
        });
        
        // Process each character and pair with their special cards
        const charactersWithSpecials = charactersData.data.map(character => {
            const characterName = character.name || '';
            let specialCards = [];
            
            // Special handling for Angry Mob characters
            if (characterName.startsWith('Angry Mob')) {
                // Extract the variant from character name (e.g., "Middle Ages" from "Angry Mob (Middle Ages)")
                const variantMatch = characterName.match(/\(([^)]+)\)/);
                const variant = variantMatch ? variantMatch[1].trim() : null;
                
                // Normalize variant name for matching (handle case differences and pluralization)
                const normalizeVariant = (v) => {
                    if (!v) return '';
                    // Normalize to handle "Ages" vs "Age" differences and case
                    let normalized = v.toLowerCase().replace(/\s+/g, ' ').trim();
                    // Handle pluralization: "middle ages" = "middle age", "industrial age" = "industrial ages"
                    // We'll do a flexible match that handles both
                    return normalized;
                };
                const normalizedVariant = normalizeVariant(variant);
                
                // Also create a flexible matcher that handles pluralization
                const matchesVariant = (specialVariant, characterVariant) => {
                    const normSpecial = normalizeVariant(specialVariant);
                    const normCharacter = normalizeVariant(characterVariant);
                    // Exact match
                    if (normSpecial === normCharacter) return true;
                    // Handle pluralization: "middle ages" matches "middle age" and vice versa
                    if (normSpecial.replace(/s$/, '') === normCharacter.replace(/s$/, '')) return true;
                    if (normSpecial === normCharacter.replace(/s$/, '')) return true;
                    if (normSpecial.replace(/s$/, '') === normCharacter) return true;
                    return false;
                };
                
                // Collect generic Angry Mob specials (no qualifier after colon)
                const genericSpecials = [];
                // Collect variant-specific specials (e.g., "Angry Mob: Middle Ages")
                const variantSpecials = [];
                
                specialCardsData.data.forEach(specialCard => {
                    // API returns 'character' field, not 'character_name'
                    const specialCharacterName = specialCard.character || specialCard.character_name || '';
                    
                    if (specialCharacterName === 'Angry Mob') {
                        // Generic Angry Mob special (no qualifier) - show for all variants
                        genericSpecials.push(specialCard);
                    } else if (specialCharacterName && (specialCharacterName.startsWith('Angry Mob:') || specialCharacterName.startsWith('Angry Mob -'))) {
                        // Variant-specific special (e.g., "Angry Mob: Middle Ages" or "Angry Mob - Middle Ages")
                        // Handle both colon and dash formats
                        const separator = specialCharacterName.includes(':') ? ':' : ' - ';
                        const parts = specialCharacterName.split(separator);
                        const specialVariant = parts.length > 1 ? parts[1].trim() : '';
                        // Only include if it matches THIS specific variant (handles pluralization differences)
                        if (variant && matchesVariant(specialVariant, variant)) {
                            variantSpecials.push(specialCard);
                        }
                        // If it doesn't match, don't include it (this prevents Middle Ages specials from showing in Industrial Age)
                    }
                });
                
                // Combine: variant-specific first, then generic
                specialCards = [...variantSpecials, ...genericSpecials];
            } else {
                // Regular character matching
                specialCards = specialCardsByCharacter.get(characterName) || [];
            }
            
            // Sort special cards alphabetically by name
            const sortedSpecials = specialCards.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            
            // Take first 6 special cards and pad with null if needed
            const specialCardsArray = sortedSpecials.slice(0, 6);
            while (specialCardsArray.length < 6) {
                specialCardsArray.push(null);
            }
            
            return {
                character: character,
                specialCards: specialCardsArray
            };
        });
        
        // Display the data (pass all special cards for proper alternate art grouping)
        displayCharacterPlus(charactersWithSpecials, specialCardsData.data);
        
    } catch (error) {
        console.error('Error loading Character+ data:', error);
        const tbody = document.getElementById('character-plus-tbody');
        if (tbody) {
            tbody.innerHTML = 
                '<tr><td colspan="7" class="error">Error loading Character+ data. Please try again.</td></tr>';
        }
    }
}

// Make function globally available
window.loadCharacterPlus = loadCharacterPlus;
