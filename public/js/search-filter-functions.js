// Search and Filter Functions
// Extracted from index.html as part of Phase 10C refactoring

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Main search functionality for characters
function performMainSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const activeTab = document.querySelector('.table-container[style*="block"]');
    
    if (!activeTab) return;
    
    const rows = activeTab.querySelectorAll('tbody tr');
    rows.forEach(row => {
        if (searchTerm.length === 0) {
            // Show all rows when search is empty
            row.style.display = '';
        } else {
            // Filter rows based on search term
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        }
    });
}

// Search and filter setup functions
function setupSearch() {
    // Only target header filters within the characters tab, not all header filters
    const headerFilters = document.querySelectorAll('#characters-tab .header-filter');
    // Only target filter inputs within the characters tab, not all filter inputs
    const filterInputs = document.querySelectorAll('#characters-tab .filter-input');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const hasInherentAbilityToggle = document.getElementById('has-inherent-ability');
    const hasNoInherentAbilityToggle = document.getElementById('has-no-inherent-ability');
    
    // Setup main search input functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performMainSearch, 300));
    }
    
    // Setup header text search filters - only for characters tab
    headerFilters.forEach(input => {
        input.addEventListener('input', applyFilters);
    });
    
    // Setup numeric filters - only for character filters
    filterInputs.forEach(input => {
        input.addEventListener('input', applyFilters);
    });
    
    // Setup inherent ability toggles
    if (hasInherentAbilityToggle) {
        hasInherentAbilityToggle.addEventListener('change', applyFilters);
    }
    if (hasNoInherentAbilityToggle) {
        hasNoInherentAbilityToggle.addEventListener('change', applyFilters);
    }
    
    // Setup clear filters button
    if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

function setupLocationSearch() {
    // Set up main search input functionality (if it exists)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            if (searchTerm.length === 0) {
                // Reload all locations
                await loadLocations();
                return;
            }

            try {
                const response = await fetch('/api/locations');
                const data = await response.json();
                
                if (data.success) {
                    const filteredLocations = data.data.filter(location => 
                        location.name.toLowerCase().includes(searchTerm) ||
                        location.special_ability.toLowerCase().includes(searchTerm)
                    );
                    displayLocations(filteredLocations);
                }
            } catch (error) {
                console.error('Error searching locations:', error);
            }
        });
    }

    // Set up special ability search input functionality
    const abilitySearchInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]');
    if (abilitySearchInput) {
        abilitySearchInput.addEventListener('input', async (e) => {
            const abilityTerm = e.target.value.toLowerCase();

            if (abilityTerm.length === 0) {
                await loadLocations();
                return;
            }

            try {
                const response = await fetch('/api/locations');
                const data = await response.json();

                if (data.success) {
                    const filteredLocations = data.data.filter(location =>
                        location.special_ability.toLowerCase().includes(abilityTerm)
                    );
                    displayLocations(filteredLocations);
                }
            } catch (error) {
                console.error('Error searching locations by special ability:', error);
            }
        });
    }
}

function setupAspectSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.length === 0) {
            // Reload all aspects
            await loadAspects();
            return;
        }

        try {
            const response = await fetch('/api/aspects');
            const data = await response.json();
            
            if (data.success) {
                const filteredAspects = data.data.filter(aspect => 
                    aspect.card_name.toLowerCase().includes(searchTerm) ||
                    aspect.location.toLowerCase().includes(searchTerm) ||
                    (aspect.aspect_description && aspect.aspect_description.toLowerCase().includes(searchTerm)) ||
                    (aspect.card_effect && aspect.card_effect.toLowerCase().includes(searchTerm))
                );
                displayAspects(filteredAspects);
            }
        } catch (error) {
            console.error('Error searching aspects:', error);
        }
    });
}

function setupAdvancedUniverseSearch() {
    // Set up main search input functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            if (searchTerm.length === 0) {
                // Reload all advanced universe
                await loadAdvancedUniverse();
                return;
            }

            try {
                const response = await fetch('/api/advanced-universe');
                const data = await response.json();
                
                if (data.success) {
                    const filteredAdvancedUniverse = data.data.filter(card => 
                        card.name.toLowerCase().includes(searchTerm) ||
                        card.character.toLowerCase().includes(searchTerm) ||
                        (card.card_description && card.card_description.toLowerCase().includes(searchTerm)) ||
                        (card.card_effect && card.card_effect.toLowerCase().includes(searchTerm))
                    );
                    displayAdvancedUniverse(filteredAdvancedUniverse);
                }
            } catch (error) {
                console.error('Error searching advanced universe:', error);
            }
        });
    }

    // Set up character search input functionality
    const characterSearchInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]');
    if (characterSearchInput) {
        characterSearchInput.addEventListener('input', async (e) => {
            const characterTerm = e.target.value.toLowerCase();
            
            if (characterTerm.length === 0) {
                // Reload all advanced universe
                await loadAdvancedUniverse();
                return;
            }

            try {
                const response = await fetch('/api/advanced-universe');
                const data = await response.json();
                
                if (data.success) {
                    const filteredAdvancedUniverse = data.data.filter(card => 
                        card.character.toLowerCase().includes(characterTerm)
                    );
                    displayAdvancedUniverse(filteredAdvancedUniverse);
                }
            } catch (error) {
                console.error('Error searching advanced universe by character:', error);
            }
        });
    }

    // Set up card effect search input functionality
    const effectSearchInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]');
    if (effectSearchInput) {
        effectSearchInput.addEventListener('input', async (e) => {
            const effectTerm = e.target.value.toLowerCase();
            
            if (effectTerm.length === 0) {
                // Reload all advanced universe
                await loadAdvancedUniverse();
                return;
            }

            try {
                const response = await fetch('/api/advanced-universe');
                const data = await response.json();
                
                if (data.success) {
                    const filteredAdvancedUniverse = data.data.filter(card => {
                        const effectText = (card.card_description || card.card_effect || '').toString();
                        return effectText.toLowerCase().includes(effectTerm);
                    });
                    displayAdvancedUniverse(filteredAdvancedUniverse);
                }
            } catch (error) {
                console.error('Error searching advanced universe by card effect:', error);
            }
        });
    }
}

function setupTeamworkSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.length === 0) {
            // Reload all teamwork
            await loadTeamwork();
            return;
        }

        try {
            const response = await fetch('/api/teamwork');
            const data = await response.json();
            
            if (data.success) {
                const filteredTeamwork = data.data.filter(card => 
                    card.card_type.toLowerCase().includes(searchTerm) ||
                    card.to_use.toLowerCase().includes(searchTerm) ||
                    card.acts_as.toLowerCase().includes(searchTerm) ||
                    card.followup_attack_types.toLowerCase().includes(searchTerm) ||
                    card.first_attack_bonus.toLowerCase().includes(searchTerm) ||
                    card.second_attack_bonus.toLowerCase().includes(searchTerm)
                );
                displayTeamwork(filteredTeamwork);
            }
        } catch (error) {
            console.error('Error searching teamwork:', error);
        }
    });
}

function setupSpecialCardSearch() {
    console.log('🔍 DEBUG: setupSpecialCardSearch called');
    
    // Set up column-specific search inputs
    const nameSearchInput = document.querySelector('#special-cards-table .header-filter[data-column="name"]');
    const characterSearchInput = document.querySelector('#special-cards-table .header-filter[data-column="character"]');
    const effectSearchInput = document.querySelector('#special-cards-table .header-filter[data-column="card_effect"]');
    
    console.log('🔍 DEBUG: Found search inputs:', {
        nameSearchInput: !!nameSearchInput,
        characterSearchInput: !!characterSearchInput,
        effectSearchInput: !!effectSearchInput
    });
    
    // Function to perform search with current filter values
    async function performSpecialCardSearch() {
        console.log('🔍 DEBUG: performSpecialCardSearch called');
        
        const nameTerm = nameSearchInput ? nameSearchInput.value.toLowerCase() : '';
        const characterTerm = characterSearchInput ? characterSearchInput.value.toLowerCase() : '';
        const effectTerm = effectSearchInput ? effectSearchInput.value.toLowerCase() : '';
        
        console.log('🔍 DEBUG: Search terms:', { nameTerm, characterTerm, effectTerm });
        
        // If all search terms are empty, reload all cards
        if (nameTerm.length === 0 && characterTerm.length === 0 && effectTerm.length === 0) {
            console.log('🔍 DEBUG: All search terms empty, calling loadSpecialCards()');
            await loadSpecialCards();
            return;
        }

        try {
            console.log('🔍 DEBUG: Fetching special cards from API...');
            const response = await fetch('/api/special-cards');
            const data = await response.json();
            
            if (data.success) {
                console.log('🔍 DEBUG: API response successful, filtering cards...');
                const filteredSpecialCards = data.data.filter(card => {
                    const nameMatch = nameTerm.length === 0 || card.name.toLowerCase().includes(nameTerm);
                    const characterMatch = characterTerm.length === 0 || card.character.toLowerCase().includes(characterTerm);
                    const effectMatch = effectTerm.length === 0 || card.card_effect.toLowerCase().includes(effectTerm);
                    
                    return nameMatch && characterMatch && effectMatch;
                });
                
                console.log('🔍 DEBUG: Filtered cards count:', filteredSpecialCards.length);
                console.log('🔍 DEBUG: About to call displaySpecialCards with:', filteredSpecialCards);
                
                // Check if displaySpecialCards function exists
                if (typeof displaySpecialCards === 'function') {
                    console.log('🔍 DEBUG: displaySpecialCards function exists, calling it...');
                    displaySpecialCards(filteredSpecialCards);
                } else {
                    console.error('❌ DEBUG: displaySpecialCards function does not exist!');
                    console.log('🔍 DEBUG: Available functions:', Object.keys(window).filter(key => key.includes('display')));
                }
            }
        } catch (error) {
            console.error('Error searching special cards:', error);
        }
    }
    
    // Add event listeners to each search input
    if (nameSearchInput) {
        console.log('🔍 DEBUG: Adding event listener to name search input');
        nameSearchInput.addEventListener('input', debounce(performSpecialCardSearch, 300));
    }
    if (characterSearchInput) {
        console.log('🔍 DEBUG: Adding event listener to character search input');
        characterSearchInput.addEventListener('input', debounce(performSpecialCardSearch, 300));
    }
    if (effectSearchInput) {
        console.log('🔍 DEBUG: Adding event listener to effect search input');
        effectSearchInput.addEventListener('input', debounce(performSpecialCardSearch, 300));
    }
}

function setupMissionSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.length === 0) {
            // Reload all missions
            await loadMissions();
            return;
        }

        try {
            const response = await fetch('/api/missions');
            const data = await response.json();
            
            if (data.success) {
                const filteredMissions = data.data.filter(mission => 
                    mission.mission_set.toLowerCase().includes(searchTerm) ||
                    mission.card_name.toLowerCase().includes(searchTerm)
                );
                displayMissions(filteredMissions);
            }
        } catch (error) {
            console.error('Error searching missions:', error);
        }
    });

    // Set up checkbox event listeners for mission set filtering
    document.querySelectorAll('#missions-tab input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyMissionFilters);
    });
}

function applyMissionFilters() {
    const selectedMissionSets = Array.from(document.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedMissionSets.length === 0) {
        // If no mission sets selected, show none
        document.getElementById('missions-tbody').innerHTML = '<tr><td colspan="3" class="no-results">No mission sets selected</td></tr>';
        return;
    }
    
    // Filter missions based on selected mission sets
    const missions = window.missionsData || [];
    const filteredMissions = missions.filter(mission => 
        selectedMissionSets.includes(mission.mission_set)
    );
    
    displayMissions(filteredMissions);
}

function setupEventSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.length === 0) {
            // Reload all events
            await loadEvents();
            return;
        }

        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            
            if (data.success) {
                const filteredEvents = data.data.filter(event => 
                    event.name.toLowerCase().includes(searchTerm) ||
                    event.mission_set.toLowerCase().includes(searchTerm) ||
                    event.game_effect.toLowerCase().includes(searchTerm)
                );
                displayEvents(filteredEvents);
            }
        } catch (error) {
            console.error('Error searching events:', error);
        }
    });

    // Set up checkbox event listeners for mission set filtering
    document.querySelectorAll('#events-tab input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyEventsFilters);
    });
}

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

function setupAllyUniverseSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length === 0) {
            await loadAllyUniverse();
            return;
        }
        try {
            const response = await fetch('/api/ally-universe');
            const data = await response.json();
            if (data.success) {
                const filtered = data.data.filter(card =>
                    (card.card_name && card.card_name.toLowerCase().includes(searchTerm)) ||
                    (card.card_type && card.card_type.toLowerCase().includes(searchTerm)) ||
                    (card.stat_to_use && card.stat_to_use.toLowerCase().includes(searchTerm)) ||
                    (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes(searchTerm)) ||
                    (card.attack_value && String(card.attack_value).toLowerCase().includes(searchTerm)) ||
                    (card.attack_type && card.attack_type.toLowerCase().includes(searchTerm)) ||
                    (card.card_text && card.card_text.toLowerCase().includes(searchTerm))
                );
                displayAllyUniverse(filtered);
            }
        } catch (error) {
            console.error('Error searching ally universe:', error);
        }
    });
}

function setupTrainingSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length === 0) { await loadTraining(); return; }
        try {
            const resp = await fetch('/api/training');
            const data = await resp.json();
            if (data.success) {
                        const filtered = data.data.filter(card =>
                            (card.card_name && card.card_name.toLowerCase().includes(searchTerm)) ||
                            (card.type_1 && card.type_1.toLowerCase().includes(searchTerm)) ||
                            (card.type_2 && card.type_2.toLowerCase().includes(searchTerm)) ||
                            (card.value_to_use && String(card.value_to_use).toLowerCase().includes(searchTerm)) ||
                            (card.bonus && String(card.bonus).toLowerCase().includes(searchTerm))
                        );
                displayTraining(filtered);
            }
        } catch (err) { console.error('Error searching training:', err); }
    });
}

function setupBasicUniverseSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length === 0) { await applyBasicUniverseFilters(); return; }
        try {
            const resp = await fetch('/api/basic-universe');
            const data = await resp.json();
            if (data.success) {
                const filtered = data.data.filter(card =>
                    (card.card_name && card.card_name.toLowerCase().includes(searchTerm)) ||
                    (card.type && card.type.toLowerCase().includes(searchTerm)) ||
                    (card.value_to_use && String(card.value_to_use).toLowerCase().includes(searchTerm)) ||
                    (card.bonus && String(card.bonus).toLowerCase().includes(searchTerm))
                );
                displayBasicUniverse(filtered);
            }
        } catch (err) { console.error('Error searching basic universe:', err); }
    });
}

function setupPowerCardsSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const term = e.target.value.toLowerCase();
        if (term.length === 0) { 
            await applyPowerCardFilters(); 
            return; 
        }
        try {
            const resp = await fetch('/api/power-cards');
            const data = await resp.json();
            if (data.success) {
                const filtered = data.data.filter(c =>
                    c.power_type.toLowerCase().includes(term) ||
                    String(c.value).includes(term)
                );
                displayPowerCards(filtered);
            }
        } catch (err) { console.error('Error searching power cards:', err); }
    });
}
