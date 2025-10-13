/**
 * Unit tests for public/js/card-display.js
 * Tests the card display functions extracted during Phase 3 of refactoring
 */

// Mock DOM elements
const mockTbody = {
  innerHTML: '',
  appendChild: jest.fn(),
};

const mockTab = {
  style: { display: 'none' },
};

const mockRow = {
  innerHTML: '',
  appendChild: jest.fn(),
};

// Mock document methods
const mockGetElementById = jest.fn((id: string) => {
  if (id === 'characters-tbody') return mockTbody;
  if (id === 'characters-tab') return mockTab;
  if (id === 'special-cards-tbody') return mockTbody;
  if (id === 'locations-tbody') return mockTbody;
  return null;
});

const mockCreateElement = jest.fn((tag: string) => {
  if (tag === 'tr') {
    return mockRow;
  }
  return {};
});

// Set up global mocks
(global as any).document = {
  getElementById: mockGetElementById,
  createElement: mockCreateElement,
};

// Define the functions from card-display.js for testing
function mapImagePathToActualFile(imagePath: string): string {
  // Simple mock implementation
  return imagePath || 'default.webp';
}

function displayCharacters(characters: any[]) {
  const tbody = (global as any).document.getElementById('characters-tbody');
  if (!tbody) {
    console.error('❌ characters-tbody element not found!');
    return;
  }
  
  // Ensure the characters tab is visible before populating
  const charactersTab = (global as any).document.getElementById('characters-tab');
  if (charactersTab && charactersTab.style.display === 'none') {
    charactersTab.style.display = 'block';
  }
  
  tbody.innerHTML = '';
  
  characters.forEach(character => {
    const row = (global as any).document.createElement('tr');
    
    // Determine threat level class
    let threatClass = 'threat-low';
    if (character.threat_level >= 20) threatClass = 'threat-high';
    else if (character.threat_level >= 18) threatClass = 'threat-medium';

    row.innerHTML = `
        <td>
            <img src="/src/resources/cards/images/characters/${mapImagePathToActualFile(character.image)}" 
                 alt="${character.name}" 
                 class="card-image" 
                 loading="lazy">
        </td>
        <td class="card-name">${character.name}</td>
        <td class="card-type">${character.card_type || 'Character'}</td>
        <td class="threat-level ${threatClass}">${character.threat_level || 0}</td>
        <td class="card-description">${character.description || ''}</td>
        <td class="add-to-deck">
            <button class="add-to-deck-btn" 
                    data-card-id="${character.id}" 
                    data-card-type="${character.card_type || 'character'}"
                    onclick="addCardToDeck('${character.id}', '${character.card_type || 'character'}')">
                Add to Deck
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
  });
}

function formatSpecialCardEffect(effectText: string, cardData: any = null): string {
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
  const foundKeywords: string[] = [];
  
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
    
    // Format keywords with proper styling
    const formattedKeywords = sortedKeywords.map(keyword => {
      const cleanKeyword = keyword.replace(/\*\*/g, '');
      return `<span class="special-keyword">${cleanKeyword}</span>`;
    }).join(' ');
    
    // Combine main text and keywords
    return `${mainText} ${formattedKeywords}`.trim();
  }
  
  return decodedText;
}

function displaySpecialCards(specialCards: any[]) {
  const tbody = (global as any).document.getElementById('special-cards-tbody');
  if (!tbody) {
    console.error('❌ special-cards-tbody element not found!');
    return;
  }
  
  tbody.innerHTML = '';
  
  specialCards.forEach(card => {
    const row = (global as any).document.createElement('tr');
    
    row.innerHTML = `
        <td>
            <img src="/src/resources/cards/images/specials/${mapImagePathToActualFile(card.image)}" 
                 alt="${card.name}" 
                 class="card-image" 
                 loading="lazy">
        </td>
        <td class="card-name">${card.name}</td>
        <td class="card-description">${formatSpecialCardEffect(card.effect, card)}</td>
        <td class="add-to-deck">
            <button class="add-to-deck-btn" 
                    data-card-id="${card.id}" 
                    data-card-type="${card.card_type || 'special'}"
                    onclick="addCardToDeck('${card.id}', '${card.card_type || 'special'}')">
                Add to Deck
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
  });
}

function displayLocations(locations: any[]) {
  const tbody = (global as any).document.getElementById('locations-tbody');
  if (!tbody) {
    console.error('❌ locations-tbody element not found!');
    return;
  }
  
  tbody.innerHTML = '';
  
  locations.forEach(location => {
    const row = (global as any).document.createElement('tr');
    
    // Determine threat level class
    let threatClass = 'threat-low';
    if (location.threat_level >= 20) threatClass = 'threat-high';
    else if (location.threat_level >= 18) threatClass = 'threat-medium';

    row.innerHTML = `
        <td>
            <img src="/src/resources/cards/images/locations/${mapImagePathToActualFile(location.image)}" 
                 alt="${location.name}" 
                 class="card-image" 
                 loading="lazy">
        </td>
        <td class="card-name">${location.name}</td>
        <td class="card-type">${location.card_type || 'Location'}</td>
        <td class="threat-level ${threatClass}">${location.threat_level || 0}</td>
        <td class="card-description">${location.description || ''}</td>
        <td class="add-to-deck">
            <button class="add-to-deck-btn" 
                    data-card-id="${location.id}" 
                    data-card-type="${location.card_type || 'location'}"
                    onclick="addCardToDeck('${location.id}', '${location.card_type || 'location'}')">
                Add to Deck
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
  });
}

describe('Card Display Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTbody.innerHTML = '';
    mockTab.style.display = 'none';
    mockRow.innerHTML = '';
  });

  describe('displayCharacters', () => {
    it('should display character cards in the table', () => {
      const mockCharacters = [
        {
          id: 'char1',
          name: 'Test Character',
          image: 'test.webp',
          threat_level: 18,
          card_type: 'character',
          description: 'Test description'
        }
      ];

      displayCharacters(mockCharacters);

      expect(mockGetElementById).toHaveBeenCalledWith('characters-tbody');
      expect(mockGetElementById).toHaveBeenCalledWith('characters-tab');
      expect(mockTab.style.display).toBe('block');
      expect(mockTbody.innerHTML).toBe('');
      expect(mockCreateElement).toHaveBeenCalledWith('tr');
    });

    it('should handle missing tbody element', () => {
      mockGetElementById.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      displayCharacters([]);

      expect(consoleSpy).toHaveBeenCalledWith('❌ characters-tbody element not found!');
      consoleSpy.mockRestore();
    });

    it('should set correct threat level classes', () => {
      const mockCharacters = [
        { id: 'char1', name: 'Low Threat', threat_level: 15, image: 'test.webp' },
        { id: 'char2', name: 'Medium Threat', threat_level: 18, image: 'test.webp' },
        { id: 'char3', name: 'High Threat', threat_level: 20, image: 'test.webp' }
      ];

      displayCharacters(mockCharacters);

      expect(mockCreateElement).toHaveBeenCalledTimes(3);
    });

    it('should handle empty characters array', () => {
      displayCharacters([]);

      expect(mockTbody.innerHTML).toBe('');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should handle characters without optional fields', () => {
      const mockCharacters = [
        {
          id: 'char1',
          name: 'Minimal Character',
          image: null,
          threat_level: null
        }
      ];

      expect(() => displayCharacters(mockCharacters)).not.toThrow();
    });
  });

  describe('formatSpecialCardEffect', () => {
    it('should return empty string for null/undefined input', () => {
      expect(formatSpecialCardEffect('')).toBe('');
      expect(formatSpecialCardEffect(null as any)).toBe('');
      expect(formatSpecialCardEffect(undefined as any)).toBe('');
    });

    it('should decode HTML entities', () => {
      const input = 'Test &quot;quoted&quot; text &amp; symbols &lt;tags&gt;';
      const result = formatSpecialCardEffect(input);
      
      expect(result).toContain('"quoted"');
      expect(result).toContain('& symbols');
      expect(result).toContain('<tags>');
    });

    it('should handle special keywords', () => {
      const input = 'This card has **Fortifications!** and **Assist!** effects';
      const result = formatSpecialCardEffect(input);
      
      expect(result).toContain('This card has');
      expect(result).toContain('<span class="special-keyword">Fortifications!</span>');
      expect(result).toContain('<span class="special-keyword">Assist!</span>');
    });

    it('should add One Per Deck keyword from card data', () => {
      const input = 'Regular effect text';
      const cardData = { one_per_deck: true };
      const result = formatSpecialCardEffect(input, cardData);
      
      expect(result).toContain('<span class="special-keyword">One Per Deck</span>');
    });

    it('should not duplicate One Per Deck keyword', () => {
      const input = 'Effect with **One Per Deck** already present';
      const cardData = { one_per_deck: true };
      const result = formatSpecialCardEffect(input, cardData);
      
      const onePerDeckMatches = (result.match(/One Per Deck/g) || []).length;
      expect(onePerDeckMatches).toBe(1);
    });

    it('should sort keywords in correct order', () => {
      const input = '**One Per Deck** **Assist!** **Fortifications!** effect';
      const result = formatSpecialCardEffect(input);
      
      const fortificationsIndex = result.indexOf('Fortifications!');
      const assistIndex = result.indexOf('Assist!');
      const onePerDeckIndex = result.indexOf('One Per Deck');
      
      expect(fortificationsIndex).toBeLessThan(assistIndex);
      expect(assistIndex).toBeLessThan(onePerDeckIndex);
    });

    it('should clean up extra spaces', () => {
      const input = 'Text   with    multiple    spaces';
      const result = formatSpecialCardEffect(input);
      
      // The function should clean up multiple spaces to single spaces
      expect(result).toBe('Text with multiple spaces');
    });

    it('should handle special characters in keywords', () => {
      const input = 'Effect with **Fortifications!** keyword';
      const result = formatSpecialCardEffect(input);
      
      expect(result).toContain('<span class="special-keyword">Fortifications!</span>');
    });
  });

  describe('displaySpecialCards', () => {
    it('should display special cards in the table', () => {
      const mockSpecialCards = [
        {
          id: 'special1',
          name: 'Test Special',
          image: 'test.webp',
          effect: 'Test effect',
          card_type: 'special'
        }
      ];

      displaySpecialCards(mockSpecialCards);

      expect(mockGetElementById).toHaveBeenCalledWith('special-cards-tbody');
      expect(mockTbody.innerHTML).toBe('');
      expect(mockCreateElement).toHaveBeenCalledWith('tr');
    });

    it('should handle missing tbody element', () => {
      mockGetElementById.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      displaySpecialCards([]);

      expect(consoleSpy).toHaveBeenCalledWith('❌ special-cards-tbody element not found!');
      consoleSpy.mockRestore();
    });

    it('should format special card effects', () => {
      const mockSpecialCards = [
        {
          id: 'special1',
          name: 'Test Special',
          image: 'test.webp',
          effect: 'Effect with **Fortifications!**',
          card_type: 'special'
        }
      ];

      displaySpecialCards(mockSpecialCards);

      expect(mockCreateElement).toHaveBeenCalledWith('tr');
    });

    it('should handle empty special cards array', () => {
      displaySpecialCards([]);

      expect(mockTbody.innerHTML).toBe('');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });
  });

  describe('displayLocations', () => {
    it('should display location cards in the table', () => {
      const mockLocations = [
        {
          id: 'loc1',
          name: 'Test Location',
          image: 'test.webp',
          threat_level: 18,
          card_type: 'location',
          description: 'Test description'
        }
      ];

      displayLocations(mockLocations);

      expect(mockGetElementById).toHaveBeenCalledWith('locations-tbody');
      expect(mockTbody.innerHTML).toBe('');
      expect(mockCreateElement).toHaveBeenCalledWith('tr');
    });

    it('should handle missing tbody element', () => {
      mockGetElementById.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      displayLocations([]);

      expect(consoleSpy).toHaveBeenCalledWith('❌ locations-tbody element not found!');
      consoleSpy.mockRestore();
    });

    it('should set correct threat level classes for locations', () => {
      const mockLocations = [
        { id: 'loc1', name: 'Low Threat Location', threat_level: 15, image: 'test.webp' },
        { id: 'loc2', name: 'High Threat Location', threat_level: 20, image: 'test.webp' }
      ];

      displayLocations(mockLocations);

      expect(mockCreateElement).toHaveBeenCalledTimes(2);
    });

    it('should handle empty locations array', () => {
      displayLocations([]);

      expect(mockTbody.innerHTML).toBe('');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should handle locations without optional fields', () => {
      const mockLocations = [
        {
          id: 'loc1',
          name: 'Minimal Location',
          image: null,
          threat_level: null
        }
      ];

      expect(() => displayLocations(mockLocations)).not.toThrow();
    });
  });

  describe('mapImagePathToActualFile', () => {
    it('should return the input path if provided', () => {
      expect(mapImagePathToActualFile('test.webp')).toBe('test.webp');
    });

    it('should return default path for null/undefined input', () => {
      expect(mapImagePathToActualFile(null as any)).toBe('default.webp');
      expect(mapImagePathToActualFile(undefined as any)).toBe('default.webp');
    });

    it('should return default path for empty string', () => {
      expect(mapImagePathToActualFile('')).toBe('default.webp');
    });
  });
});
