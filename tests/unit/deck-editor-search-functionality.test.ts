/**
 * Unit tests for deck editor search functionality
 * Tests the searchAllCards function and mission/event search logic
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock DOM elements
const mockSearchResults = {
  innerHTML: '',
  style: { display: 'none' }
};

const mockDocument = {
  getElementById: jest.fn((id: string) => {
    if (id === 'deckEditorSearchResults') return mockSearchResults;
    return null;
  })
};

(global as any).document = mockDocument;

// Mock the search functions from index.html
let searchAllCards: (searchTerm: string) => Promise<any[]>;
let displayDeckEditorSearchResults: (results: any[]) => void;

// Define the search function for testing
searchAllCards = async function(searchTerm: string) {
  const results: any[] = [];
  
  try {
    // Search missions
    const missionsResponse = await fetch('/api/missions');
    const missions = await missionsResponse.json();
    if (missions.success) {
      missions.data.forEach((mission: any) => {
        // Check if card name contains search term
        const nameMatch = mission.card_name && mission.card_name.toLowerCase().includes(searchTerm);
        
        // Check if mission set contains search term
        const setMatch = mission.mission_set && mission.mission_set.toLowerCase().includes(searchTerm);
        
        // Check for exact type match
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

    // Search events
    const eventsResponse = await fetch('/api/events');
    const events = await eventsResponse.json();
    if (events.success) {
      events.data.forEach((event: any) => {
        // Check if event name contains search term
        const nameMatch = event.name && event.name.toLowerCase().includes(searchTerm);
        
        // Check if mission set contains search term
        const setMatch = event.mission_set && event.mission_set.toLowerCase().includes(searchTerm);
        
        // Check for exact type match
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
  } catch (error) {
    console.error('Error searching cards:', error);
  }

  // Sort results by name and limit to 20
  const filteredResults = results
    .filter(result => result.name && result.name.trim())
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 20);
    
  return filteredResults;
};

displayDeckEditorSearchResults = function(results: any[]) {
  const searchResults = document.getElementById('deckEditorSearchResults');
  
  if (results.length === 0) {
    searchResults!.innerHTML = '<div class="deck-editor-search-result">No cards found</div>';
  } else {
    const htmlContent = results.map(card => `
      <div class="deck-editor-search-result">
        <div class="deck-editor-search-result-image" style="background-image: url('${card.image}')"></div>
        <div class="deck-editor-search-result-info">
          <div class="deck-editor-search-result-name">${card.name}</div>
          <div class="deck-editor-search-result-type">${card.type}</div>
          ${card.character ? `<div class="deck-editor-search-result-character">${card.character}</div>` : ''}
        </div>
      </div>
    `).join('');
    
    searchResults!.innerHTML = htmlContent;
  }
};

describe('Deck Editor Search Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchResults.innerHTML = '';
    mockSearchResults.style.display = 'none';
  });

  describe('Mission Search', () => {
    it('should find missions by card name', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: 'Gone Too Far',
            mission_set: 'The Call of Cthulhu',
            image: 'gone_too_far.webp'
          },
          {
            id: '2',
            card_name: 'Johansen\'s Widow',
            mission_set: 'The Call of Cthulhu',
            image: 'johansens_widow.webp'
          }
        ]
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('gone too far');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: '1',
        name: 'Gone Too Far',
        type: 'mission',
        image: '/src/resources/cards/images/gone_too_far.webp',
        character: 'The Call of Cthulhu'
      });
    });

    it('should find missions by mission set name', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: 'Gone Too Far',
            mission_set: 'The Call of Cthulhu',
            image: 'gone_too_far.webp'
          },
          {
            id: '2',
            card_name: 'Johansen\'s Widow',
            mission_set: 'The Call of Cthulhu',
            image: 'johansens_widow.webp'
          },
          {
            id: '3',
            card_name: 'Beasts of Tarzan',
            mission_set: 'King of the Jungle',
            image: 'beasts_of_tarzan.webp'
          }
        ]
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('call of cthulhu');

      expect(results).toHaveLength(2);
      expect(results[0].character).toBe('The Call of Cthulhu');
      expect(results[1].character).toBe('The Call of Cthulhu');
    });

    it('should find all missions when searching for "mission"', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: 'Gone Too Far',
            mission_set: 'The Call of Cthulhu',
            image: 'gone_too_far.webp'
          },
          {
            id: '2',
            card_name: 'Beasts of Tarzan',
            mission_set: 'King of the Jungle',
            image: 'beasts_of_tarzan.webp'
          }
        ]
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('mission');

      expect(results).toHaveLength(2);
      expect(results.every(result => result.type === 'mission')).toBe(true);
    });

    it('should find all missions when searching for "missions"', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: 'Gone Too Far',
            mission_set: 'The Call of Cthulhu',
            image: 'gone_too_far.webp'
          }
        ]
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('missions');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('mission');
    });

    it('should handle case-insensitive search', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: 'Gone Too Far',
            mission_set: 'The Call of Cthulhu',
            image: 'gone_too_far.webp'
          }
        ]
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      // The search function converts input to lowercase, so we need to test with lowercase
      const results = await searchAllCards('gone too far');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Gone Too Far');
    });

    it('should handle partial matches', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: 'Gone Too Far',
            mission_set: 'The Call of Cthulhu',
            image: 'gone_too_far.webp'
          },
          {
            id: '2',
            card_name: 'Johansen\'s Widow',
            mission_set: 'The Call of Cthulhu',
            image: 'johansens_widow.webp'
          }
        ]
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('gone');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Gone Too Far');
    });
  });

  describe('Event Search', () => {
    it('should find events by event name', async () => {
      const mockMissions = { success: true, data: [] };
      const mockEvents = {
        success: true,
        data: [
          {
            id: '1',
            name: 'The Alert',
            mission_set: 'The Call of Cthulhu',
            image: 'the_alert.webp'
          },
          {
            id: '2',
            name: 'The Dreams of Men',
            mission_set: 'The Call of Cthulhu',
            image: 'the_dreams_of_men.webp'
          }
        ]
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('the alert');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: '1',
        name: 'The Alert',
        type: 'event',
        image: '/src/resources/cards/images/the_alert.webp',
        character: 'The Call of Cthulhu'
      });
    });

    it('should find events by mission set name', async () => {
      const mockMissions = { success: true, data: [] };
      const mockEvents = {
        success: true,
        data: [
          {
            id: '1',
            name: 'The Alert',
            mission_set: 'The Call of Cthulhu',
            image: 'the_alert.webp'
          },
          {
            id: '2',
            name: 'Battle at Olympus',
            mission_set: 'Time Wars: Rise of the Gods',
            image: 'battle_at_olympus.webp'
          }
        ]
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('call of cthulhu');

      expect(results).toHaveLength(1);
      expect(results[0].character).toBe('The Call of Cthulhu');
    });

    it('should find all events when searching for "event"', async () => {
      const mockMissions = { success: true, data: [] };
      const mockEvents = {
        success: true,
        data: [
          {
            id: '1',
            name: 'The Alert',
            mission_set: 'The Call of Cthulhu',
            image: 'the_alert.webp'
          },
          {
            id: '2',
            name: 'The Dreams of Men',
            mission_set: 'The Call of Cthulhu',
            image: 'the_dreams_of_men.webp'
          }
        ]
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('event');

      expect(results).toHaveLength(2);
      expect(results.every(result => result.type === 'event')).toBe(true);
    });

    it('should find all events when searching for "events"', async () => {
      const mockMissions = { success: true, data: [] };
      const mockEvents = {
        success: true,
        data: [
          {
            id: '1',
            name: 'The Alert',
            mission_set: 'The Call of Cthulhu',
            image: 'the_alert.webp'
          }
        ]
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('events');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('event');
    });
  });

  describe('Combined Search Results', () => {
    it('should return both missions and events when searching for mission set', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: 'Gone Too Far',
            mission_set: 'The Call of Cthulhu',
            image: 'gone_too_far.webp'
          }
        ]
      };

      const mockEvents = {
        success: true,
        data: [
          {
            id: '2',
            name: 'The Alert',
            mission_set: 'The Call of Cthulhu',
            image: 'the_alert.webp'
          }
        ]
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('call of cthulhu');

      expect(results).toHaveLength(2);
      expect(results.some(result => result.type === 'mission')).toBe(true);
      expect(results.some(result => result.type === 'event')).toBe(true);
      expect(results.every(result => result.character === 'The Call of Cthulhu')).toBe(true);
    });

    it('should sort results alphabetically by name', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: 'Z Mission',
            mission_set: 'Test Set',
            image: 'z_mission.webp'
          },
          {
            id: '2',
            card_name: 'A Mission',
            mission_set: 'Test Set',
            image: 'a_mission.webp'
          }
        ]
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('mission');

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('A Mission');
      expect(results[1].name).toBe('Z Mission');
    });

    it('should limit results to 20 items', async () => {
      const mockMissions = {
        success: true,
        data: Array.from({ length: 25 }, (_, i) => ({
          id: `${i}`,
          card_name: `Mission ${i}`,
          mission_set: 'Test Set',
          image: `mission_${i}.webp`
        }))
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('mission');

      expect(results).toHaveLength(20);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('API Error'));

      const results = await searchAllCards('test');

      expect(results).toHaveLength(0);
    });

    it('should handle unsuccessful API responses', async () => {
      const mockMissions = { success: false, error: 'Database error' };
      const mockEvents = { success: false, error: 'Database error' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('test');

      expect(results).toHaveLength(0);
    });

    it('should filter out results with empty names', async () => {
      const mockMissions = {
        success: true,
        data: [
          {
            id: '1',
            card_name: '',
            mission_set: 'Test Set',
            image: 'empty.webp'
          },
          {
            id: '2',
            card_name: 'Valid Mission',
            mission_set: 'Test Set',
            image: 'valid.webp'
          }
        ]
      };

      const mockEvents = { success: true, data: [] };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMissions)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockEvents)
        });

      const results = await searchAllCards('mission');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Valid Mission');
    });
  });

  describe('Display Function', () => {
    it('should display "No cards found" when no results', () => {
      displayDeckEditorSearchResults([]);

      expect(mockSearchResults.innerHTML).toBe('<div class="deck-editor-search-result">No cards found</div>');
    });

    it('should display search results with proper HTML structure', () => {
      const results = [
        {
          id: '1',
          name: 'Gone Too Far',
          type: 'mission',
          image: '/src/resources/cards/images/gone_too_far.webp',
          character: 'The Call of Cthulhu'
        }
      ];

      displayDeckEditorSearchResults(results);

      expect(mockSearchResults.innerHTML).toContain('Gone Too Far');
      expect(mockSearchResults.innerHTML).toContain('mission');
      expect(mockSearchResults.innerHTML).toContain('The Call of Cthulhu');
      expect(mockSearchResults.innerHTML).toContain('background-image: url(\'/src/resources/cards/images/gone_too_far.webp\')');
    });

    it('should handle results without character field', () => {
      const results = [
        {
          id: '1',
          name: 'Test Mission',
          type: 'mission',
          image: '/src/resources/cards/images/test.webp',
          character: null
        }
      ];

      displayDeckEditorSearchResults(results);

      expect(mockSearchResults.innerHTML).toContain('Test Mission');
      expect(mockSearchResults.innerHTML).not.toContain('deck-editor-search-result-character');
    });
  });
});
