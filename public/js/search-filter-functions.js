// Search and Filter Functions
// Extracted from index.html as part of Phase 10C refactoring

// Search and filter setup functions
function setupSearch() {
    const headerFilters = document.querySelectorAll('.header-filter');
    // Only target filter inputs within the characters tab, not all filter inputs
    const filterInputs = document.querySelectorAll('#characters-tab .filter-input');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const hasInherentAbilityToggle = document.getElementById('has-inherent-ability');
    const hasNoInherentAbilityToggle = document.getElementById('has-no-inherent-ability');
    
    // Setup header text search filters
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
    const searchInput = document.getElementById('search-input');
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
    const searchInput = document.getElementById('search-input');
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
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.length === 0) {
            // Reload all special cards
            await loadSpecialCards();
            return;
        }

        try {
            const response = await fetch('/api/special-cards');
            const data = await response.json();
            
            if (data.success) {
                const filteredSpecialCards = data.data.filter(card => 
                    card.name.toLowerCase().includes(searchTerm) ||
                    card.character.toLowerCase().includes(searchTerm) ||
                    card.card_effect.toLowerCase().includes(searchTerm) ||
                    (searchTerm.includes('cataclysm') && card.is_cataclysm) ||
                    (searchTerm.includes('yes') && card.is_cataclysm) ||
                    (searchTerm.includes('no') && !card.is_cataclysm)
                );
                displaySpecialCards(filteredSpecialCards);
            }
        } catch (error) {
            console.error('Error searching special cards:', error);
        }
    });
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
                    (card.attack_value && card.attack_value.toLowerCase().includes(searchTerm)) ||
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
                            (card.value_to_use && card.value_to_use.toLowerCase().includes(searchTerm)) ||
                            (card.bonus && card.bonus.toLowerCase().includes(searchTerm))
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
                    (card.value_to_use && card.value_to_use.toLowerCase().includes(searchTerm)) ||
                    (card.bonus && card.bonus.toLowerCase().includes(searchTerm))
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
