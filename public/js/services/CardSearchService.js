// CardSearchService: centralized fetching and normalization of card search results
// Returns results in the form: { id, name, type, image, character }

(function(global) {
    class CardSearchService {
        constructor(options = {}) {
            this.maxResults = options.maxResults || 20;
        }

        async search(term) {
            const searchTerm = (term || '').trim().toLowerCase();
            if (searchTerm.length < 2) return [];

            const results = [];
            console.log('🔍 CardSearchService.search start:', searchTerm);

            try {
                // Fetch all endpoints in parallel for responsiveness
                const [characters, specials, missions, events, aspects, advanced, teamwork, ally, training, basic, power, locations] = await Promise.all([
                    fetch('/api/characters').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/special-cards').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/missions').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/events').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/aspects').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/advanced-universe').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/teamwork').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/ally-universe').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/training').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/basic-universe').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/power-cards').then(r => r.json()).catch(() => ({ success: false, data: [] })),
                    fetch('/api/locations').then(r => r.json()).catch(() => ({ success: false, data: [] }))
                ]);

                if (characters.success) {
                    characters.data.forEach(char => {
                        if (char.name && char.name.toLowerCase().includes(searchTerm)) {
                            results.push({
                                id: char.id,
                                name: char.name,
                                type: 'character',
                                image: `/src/resources/cards/images/${char.image}`,
                                character: null
                            });
                        }
                    });
                }

                if (specials.success) {
                    specials.data.forEach(card => {
                        const nameMatch = card.name && card.name.toLowerCase().includes(searchTerm);
                        const characterMatch = card.character && card.character.toLowerCase().includes(searchTerm);
                        const exactCharacterMatch = card.character && card.character.toLowerCase() === searchTerm;
                        const typeMatch = searchTerm === 'special';
                        if (nameMatch || characterMatch || exactCharacterMatch || typeMatch) {
                            results.push({
                                id: card.id,
                                name: card.name,
                                type: 'special',
                                image: `/src/resources/cards/images/${card.image}`,
                                character: card.character
                            });
                        }
                    });
                }

                if (missions.success) {
                    missions.data.forEach(mission => {
                        const nameMatch = mission.card_name && mission.card_name.toLowerCase().includes(searchTerm);
                        const setMatch = mission.mission_set && mission.mission_set.toLowerCase().includes(searchTerm);
                        const typeMatch = searchTerm === 'mission' || searchTerm === 'missions';
                        if (nameMatch || setMatch || typeMatch) {
                            results.push({
                                id: mission.id,
                                name: mission.card_name,
                                type: 'mission',
                                image: `/src/resources/cards/images/${mission.image}`,
                                character: mission.mission_set
                            });
                        }
                    });
                }

                if (events.success) {
                    events.data.forEach(event => {
                        const nameMatch = event.name && event.name.toLowerCase().includes(searchTerm);
                        const setMatch = event.mission_set && event.mission_set.toLowerCase().includes(searchTerm);
                        const typeMatch = searchTerm === 'event' || searchTerm === 'events';
                        if (nameMatch || setMatch || typeMatch) {
                            results.push({
                                id: event.id,
                                name: event.name,
                                type: 'event',
                                image: `/src/resources/cards/images/${event.image}`,
                                character: event.mission_set
                            });
                        }
                    });
                }

                if (aspects.success) {
                    aspects.data.forEach(aspect => {
                        if (aspect.card_name && aspect.card_name.toLowerCase().includes(searchTerm)) {
                            results.push({
                                id: aspect.id,
                                name: aspect.card_name,
                                type: 'aspect',
                                image: `/src/resources/cards/images/${aspect.image}`,
                                character: null
                            });
                        }
                    });
                }

                if (advanced.success) {
                    advanced.data.forEach(card => {
                        const nameMatch = card.name && card.name.toLowerCase().includes(searchTerm);
                        const characterMatch = card.character && card.character.toLowerCase().includes(searchTerm);
                        const exactCharacterMatch = card.character && card.character.toLowerCase() === searchTerm;
                        const typeMatch = searchTerm === 'advanced';
                        if (nameMatch || characterMatch || exactCharacterMatch || typeMatch) {
                            results.push({
                                id: card.id,
                                name: card.name,
                                type: 'advanced-universe',
                                image: `/src/resources/cards/images/${card.image}`,
                                character: card.character
                            });
                        }
                    });
                }

                if (teamwork.success) {
                    teamwork.data.forEach(card => {
                        const nameMatch = (card.name || card.to_use) && (card.name || card.to_use).toLowerCase().includes(searchTerm);
                        const characterMatch = card.character && card.character.toLowerCase().includes(searchTerm);
                        const exactCharacterMatch = card.character && card.character.toLowerCase() === searchTerm;
                        const typeMatch = searchTerm === 'teamwork';
                        if (nameMatch || characterMatch || exactCharacterMatch || typeMatch) {
                            results.push({
                                id: card.id,
                                name: card.to_use || card.name,
                                type: 'teamwork',
                                image: `/src/resources/cards/images/${card.image}`,
                                character: card.character
                            });
                        }
                    });
                }

                if (ally.success) {
                    ally.data.forEach(card => {
                        const nameMatch = card.card_name && card.card_name.toLowerCase().includes(searchTerm);
                        const typeMatch = searchTerm === 'ally';
                        if (nameMatch || typeMatch) {
                            results.push({
                                id: card.id,
                                name: card.card_name,
                                type: 'ally-universe',
                                image: `/src/resources/cards/images/${card.image}`,
                                character: null
                            });
                        }
                    });
                }

                if (training.success) {
                    training.data.forEach(card => {
                        const nameMatch = card.card_name && card.card_name.toLowerCase().includes(searchTerm);
                        const typeMatch = searchTerm === 'training';
                        if (nameMatch || typeMatch) {
                            results.push({
                                id: card.id,
                                name: card.card_name,
                                type: 'training',
                                image: `/src/resources/cards/images/${card.image}`,
                                character: null
                            });
                        }
                    });
                }

                if (basic.success) {
                    basic.data.forEach(card => {
                        const nameMatch = card.card_name && card.card_name.toLowerCase().includes(searchTerm);
                        const typeMatch = searchTerm === 'basic';
                        if (nameMatch || typeMatch) {
                            results.push({
                                id: card.id,
                                name: card.card_name,
                                type: 'basic-universe',
                                image: `/src/resources/cards/images/${card.image}`,
                                character: null
                            });
                        }
                    });
                }

                if (power.success) {
                    power.data.forEach(card => {
                        if ((card.power_type && card.power_type.toLowerCase().includes(searchTerm)) || searchTerm === 'power card') {
                            results.push({
                                id: card.id,
                                name: card.power_type,
                                type: 'power',
                                image: `/src/resources/cards/images/${card.image}`,
                                character: null
                            });
                        }
                    });
                }

                if (locations.success) {
                    locations.data.forEach(card => {
                        const nameMatch = card.name && card.name.toLowerCase().includes(searchTerm);
                        const typeMatch = searchTerm === 'location';
                        if (nameMatch || typeMatch) {
                            results.push({
                                id: card.id,
                                name: card.name,
                                type: 'location',
                                image: `/src/resources/cards/images/locations/${card.image}`,
                                character: null
                            });
                        }
                    });
                }
            } catch (err) {
                console.error('CardSearchService error:', err);
            }

            const finalResults = results
                .filter(r => r.name && r.name.trim())
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, this.maxResults);
            console.log('🔍 CardSearchService.search done. results:', finalResults.length);
            return finalResults;
        }
    }

    global.CardSearchService = CardSearchService;
})(window);


