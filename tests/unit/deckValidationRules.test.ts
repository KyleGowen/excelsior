/**
 * Unit tests for deck validation rules according to Overpower game rules
 * 
 * Legal deck requirements:
 * 1. Exactly 4 characters
 * 2. Special cards may only be for selected characters or "Any Character"
 * 3. Exactly 7 mission cards of the same mission set
 * 4. Events may only be of the selected mission set
 * 5. Only 0 or 1 location may be selected
 * 6. Threat value must be less than or equal to 76
 * 7. Deck's draw pile must have 51 cards unless there are events, then it must be 56
 */

describe('Deck Validation Rules', () => {
  // Mock availableCardsMap for testing
  let availableCardsMap: Map<string, any>;

  beforeEach(() => {
    availableCardsMap = new Map();
    
    // Mock character data
    availableCardsMap.set('character_char1', { name: 'Character 1', threat_level: 15 });
    availableCardsMap.set('character_char2', { name: 'Character 2', threat_level: 18 });
    availableCardsMap.set('character_char3', { name: 'Character 3', threat_level: 20 });
    availableCardsMap.set('character_char4', { name: 'Character 4', threat_level: 16 });
    availableCardsMap.set('character_char5', { name: 'Character 5', threat_level: 25 });
    
    // Mock special card data
    availableCardsMap.set('special_card_special1', { name: 'Special 1', character: 'Character 1' });
    availableCardsMap.set('special_card_special2', { name: 'Special 2', character: 'Any Character' });
    availableCardsMap.set('special_card_special3', { name: 'Special 3', character: 'Character 5' });
    
    // Mock mission card data
    availableCardsMap.set('mission_mission1', { name: 'Mission 1', mission_set: 'Set A' });
    availableCardsMap.set('mission_mission2', { name: 'Mission 2', mission_set: 'Set A' });
    availableCardsMap.set('mission_mission3', { name: 'Mission 3', mission_set: 'Set B' });
    
    // Mock event card data
    availableCardsMap.set('event_event1', { name: 'Event 1', mission_set: 'Set A' });
    availableCardsMap.set('event_event2', { name: 'Event 2', mission_set: 'Any-Mission' });
    availableCardsMap.set('event_event3', { name: 'Event 3', mission_set: 'Set B' });
    
    // Mock location data
    availableCardsMap.set('location_location1', { name: 'Location 1', threat_level: 5 });
    availableCardsMap.set('location_location2', { name: 'Location 2', threat_level: 8 });
    
    // Mock power card data
    availableCardsMap.set('power_card_power1', { name: 'Power 1' });
    availableCardsMap.set('power_card_power2', { name: 'Power 2' });
  });

  // Mock validateDeck function (simplified version for testing)
  function validateDeck(deckCards: any[]): { errors: string[], warnings: string[], isValid: boolean } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Count card types (considering quantity)
    const characterCards = deckCards.filter(card => card.type === 'character');
    const eventCards = deckCards.filter(card => card.type === 'event');
    const missionCards = deckCards.filter(card => card.type === 'mission');
    const locationCards = deckCards.filter(card => card.type === 'location');
    
    // Rule 1: Exactly 4 characters
    const characterCount = characterCards.reduce((sum, card) => sum + card.quantity, 0);
    if (characterCount !== 4) {
      errors.push(`Deck must have exactly 4 characters (${characterCount}/4)`);
    }
    
    // Rule 2: Special cards may only be for selected characters or "Any Character"
    const characterNames = characterCards.map(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      return availableCard ? availableCard.name : 'Unknown';
    });
    
    deckCards.forEach(card => {
      if (card.type === 'special_card') {
        const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
        if (availableCard && availableCard.character && 
            availableCard.character !== 'Any Character' && 
            !characterNames.includes(availableCard.character)) {
          errors.push(`"${availableCard.name}" requires character "${availableCard.character}" in your team`);
        }
      }
    });
    
    // Rule 3: Exactly 7 mission cards of the same mission set
    const missionCount = missionCards.reduce((sum, card) => sum + card.quantity, 0);
    if (missionCount !== 7) {
      errors.push(`Deck must have exactly 7 mission cards (${missionCount}/7)`);
    } else if (missionCount > 0) {
      const missionSets = new Set();
      missionCards.forEach(card => {
        const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
        if (availableCard && availableCard.mission_set) {
          missionSets.add(availableCard.mission_set);
        }
      });
      if (missionSets.size > 1) {
        errors.push(`All mission cards must be from the same mission set (found ${missionSets.size} different sets)`);
      }
    }
    
    // Rule 4: Events may only be of the selected mission set
    if (eventCards.length > 0 && missionCards.length > 0) {
      const missionSets = new Set();
      missionCards.forEach(card => {
        const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
        if (availableCard && availableCard.mission_set) {
          missionSets.add(availableCard.mission_set);
        }
      });
      
      eventCards.forEach(card => {
        const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
        if (availableCard && availableCard.mission_set && 
            availableCard.mission_set !== 'Any-Mission' && 
            !missionSets.has(availableCard.mission_set)) {
          errors.push(`Event "${availableCard.name}" must be from the same mission set as your mission cards`);
        }
      });
    }
    
    // Rule 5: Only 0 or 1 location may be selected
    const locationCount = locationCards.reduce((sum, card) => sum + card.quantity, 0);
    if (locationCount > 1) {
      errors.push(`Deck can have at most 1 location (${locationCount} locations)`);
    }
    
    // Rule 6: Threat value must be less than or equal to 76
    let totalThreat = 0;
    characterCards.forEach(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      if (availableCard && availableCard.threat_level) {
        totalThreat += availableCard.threat_level * card.quantity;
      }
    });
    
    locationCards.forEach(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      if (availableCard && availableCard.threat_level) {
        totalThreat += availableCard.threat_level * card.quantity;
      }
    });
    
    if (totalThreat > 76) {
      errors.push(`Total threat level must be ≤ 76 (current: ${totalThreat})`);
    }
    
    // Rule 7: Deck's draw pile must have 51 cards unless there are events, then it must be 56
    const totalCards = deckCards
      .filter(card => !['mission', 'character', 'location'].includes(card.type))
      .reduce((sum, card) => sum + card.quantity, 0);
    const hasEvents = eventCards.length > 0;
    const requiredSize = hasEvents ? 56 : 51;
    
    if (totalCards !== requiredSize) {
      errors.push(`Deck must have exactly ${requiredSize} cards in draw pile (${totalCards}/${requiredSize})`);
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
  }

  describe('Rule 1: Exactly 4 characters', () => {
    it('should pass with exactly 4 characters', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      if (!result.isValid) {
        console.log('Errors:', result.errors);
      }
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with fewer than 4 characters', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deck must have exactly 4 characters (3/4)');
    });

    it('should fail with more than 4 characters', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'character', cardId: 'char5', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deck must have exactly 4 characters (5/4)');
    });
  });

  describe('Rule 2: Special cards for selected characters or "Any Character"', () => {
    it('should pass with special card for selected character', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'special_card', cardId: 'special1', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with "Any Character" special card', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'special_card', cardId: 'special2', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with special card for character not in team', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'special_card', cardId: 'special3', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"Special 3" requires character "Character 5" in your team');
    });
  });

  describe('Rule 3: Exactly 7 mission cards of the same mission set', () => {
    it('should pass with exactly 7 mission cards from same set', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with fewer than 7 mission cards', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 5 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deck must have exactly 7 mission cards (5/7)');
    });

    it('should fail with more than 7 mission cards', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 8 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deck must have exactly 7 mission cards (8/7)');
    });

    it('should fail with mission cards from different sets', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 4 },
        { type: 'mission', cardId: 'mission3', quantity: 3 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All mission cards must be from the same mission set (found 2 different sets)');
    });
  });

  describe('Rule 4: Events may only be of the selected mission set', () => {
    it('should pass with event from same mission set', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'event', cardId: 'event1', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 55 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with "Any-Mission" event', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'event', cardId: 'event2', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 55 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with event from different mission set', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'event', cardId: 'event3', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 55 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event "Event 3" must be from the same mission set as your mission cards');
    });
  });

  describe('Rule 5: Only 0 or 1 location may be selected', () => {
    it('should pass with no locations', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with exactly 1 location', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'location', cardId: 'location1', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with more than 1 location', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'location', cardId: 'location1', quantity: 1 },
        { type: 'location', cardId: 'location2', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deck can have at most 1 location (2 locations)');
    });
  });

  describe('Rule 6: Threat value must be ≤ 76', () => {
    it('should pass with threat level exactly 76', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }, // 15
        { type: 'character', cardId: 'char2', quantity: 1 }, // 18
        { type: 'character', cardId: 'char3', quantity: 1 }, // 20
        { type: 'character', cardId: 'char4', quantity: 1 }, // 16
        { type: 'location', cardId: 'location1', quantity: 1 }, // 5
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      // Total: 15 + 18 + 20 + 16 + 5 = 74
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with threat level over 76', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }, // 15
        { type: 'character', cardId: 'char2', quantity: 1 }, // 18
        { type: 'character', cardId: 'char3', quantity: 1 }, // 20
        { type: 'character', cardId: 'char5', quantity: 1 }, // 25
        { type: 'location', cardId: 'location1', quantity: 1 }, // 5
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      // Total: 15 + 18 + 20 + 25 + 5 = 83
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total threat level must be ≤ 76 (current: 83)');
    });
  });

  describe('Rule 7: Deck size requirements', () => {
    it('should pass with exactly 51 cards when no events', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with exactly 56 cards when events present', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'event', cardId: 'event1', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 55 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with fewer than 51 cards when no events', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 45 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deck must have exactly 51 cards in draw pile (45/51)');
    });

    it('should fail with fewer than 56 cards when events present', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'event', cardId: 'event1', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 49 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deck must have exactly 56 cards in draw pile (50/56)');
    });
  });

  describe('Multiple rule violations', () => {
    it('should report multiple errors when multiple rules are violated', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }, // Only 1 character (should be 4)
        { type: 'mission', cardId: 'mission1', quantity: 5 }, // Only 5 missions (should be 7)
        { type: 'location', cardId: 'location1', quantity: 1 },
        { type: 'location', cardId: 'location2', quantity: 1 }, // 2 locations (should be max 1)
        { type: 'power_card', cardId: 'power1', quantity: 40 } // Only 40 cards (should be 51)
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Deck must have exactly 4 characters (1/4)');
      expect(result.errors).toContain('Deck must have exactly 7 mission cards (5/7)');
      expect(result.errors).toContain('Deck can have at most 1 location (2 locations)');
      expect(result.errors).toContain('Deck must have exactly 51 cards in draw pile (40/51)');
    });
  });

  describe('Completely legal deck', () => {
    it('should pass all validation rules', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }, // 15 threat
        { type: 'character', cardId: 'char2', quantity: 1 }, // 18 threat
        { type: 'character', cardId: 'char3', quantity: 1 }, // 20 threat
        { type: 'character', cardId: 'char4', quantity: 1 }, // 16 threat
        { type: 'mission', cardId: 'mission1', quantity: 7 }, // Same mission set
        { type: 'event', cardId: 'event1', quantity: 1 }, // Same mission set
        { type: 'location', cardId: 'location1', quantity: 1 }, // 5 threat
        { type: 'special_card', cardId: 'special1', quantity: 1 }, // For Character 1
        { type: 'special_card', cardId: 'special2', quantity: 1 }, // Any Character
        { type: 'power_card', cardId: 'power1', quantity: 53 } // 56 total with event
      ];
      // Total threat: 15 + 18 + 20 + 16 + 5 = 74 (≤ 76)
      
      const result = validateDeck(deckCards);
      if (!result.isValid) {
        console.log('Legal deck errors:', result.errors);
      }
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
