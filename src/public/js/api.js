// API communication module
class API {
    static async request(url, options = {}) {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }

    // User endpoints
    static async getUsers() {
        return this.request('/api/users');
    }

    // Deck endpoints
    static async getDecks() {
        return this.request('/api/decks');
    }

    static async getDeck(deckId) {
        return this.request(`/api/decks/${deckId}`);
    }

    static async createDeck(deckData) {
        return this.request('/api/decks', {
            method: 'POST',
            body: JSON.stringify(deckData)
        });
    }

    static async updateDeck(deckId, deckData) {
        return this.request(`/api/decks/${deckId}`, {
            method: 'PUT',
            body: JSON.stringify(deckData)
        });
    }

    static async deleteDeck(deckId) {
        return this.request(`/api/decks/${deckId}`, {
            method: 'DELETE'
        });
    }

    // Deck card endpoints
    static async addCardToDeck(deckId, cardData) {
        return this.request(`/api/decks/${deckId}/cards`, {
            method: 'POST',
            body: JSON.stringify(cardData)
        });
    }

    static async removeCardFromDeck(deckId, cardData) {
        return this.request(`/api/decks/${deckId}/cards`, {
            method: 'DELETE',
            body: JSON.stringify(cardData)
        });
    }

    static async clearDeckCards(deckId, cardType = 'all') {
        return this.request(`/api/decks/${deckId}/cards`, {
            method: 'DELETE',
            body: JSON.stringify({
                cardType: cardType,
                cardId: 'all',
                quantity: 999
            })
        });
    }

    // Card data endpoints
    static async getCharacters() {
        return this.request('/api/characters');
    }

    static async getLocations() {
        return this.request('/api/locations');
    }

    static async getSpecialCards() {
        return this.request('/api/special-cards');
    }

    static async getMissions() {
        return this.request('/api/missions');
    }

    static async getEvents() {
        return this.request('/api/events');
    }

    static async getAspects() {
        return this.request('/api/aspects');
    }

    static async getAdvancedUniverse() {
        return this.request('/api/advanced-universe');
    }

    static async getTeamwork() {
        return this.request('/api/teamwork');
    }

    static async getAllyUniverse() {
        return this.request('/api/ally-universe');
    }

    static async getTraining() {
        return this.request('/api/training');
    }

    static async getBasicUniverse() {
        return this.request('/api/basic-universe');
    }

    static async getPowerCards() {
        return this.request('/api/power-cards');
    }

    // Deck stats endpoint
    static async getDeckStats(deckId) {
        return this.request(`/api/decks/${deckId}/stats`);
    }
}

// Export for use in other modules
window.API = API;
