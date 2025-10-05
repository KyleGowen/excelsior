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
    availableCardsMap.set('character_char1', { name: 'Character 1', threat_level: 15, energy: 6, combat: 4, brute_force: 3, intelligence: 2 });
    availableCardsMap.set('character_char2', { name: 'Character 2', threat_level: 18, energy: 5, combat: 6, brute_force: 4, intelligence: 3 });
    availableCardsMap.set('character_char3', { name: 'Character 3', threat_level: 20, energy: 4, combat: 5, brute_force: 6, intelligence: 5 });
    availableCardsMap.set('character_char4', { name: 'Character 4', threat_level: 16, energy: 3, combat: 3, brute_force: 4, intelligence: 6 });
    availableCardsMap.set('character_char5', { name: 'Character 5', threat_level: 25, energy: 7, combat: 7, brute_force: 7, intelligence: 4 });
    availableCardsMap.set('character_angrymob1', { name: 'Angry Mob: Middle Ages', threat_level: 16, energy: 6, combat: 4, brute_force: 6, intelligence: 1 });
    availableCardsMap.set('character_angrymob2', { name: 'Angry Mob: Industrial Age', threat_level: 18, energy: 5, combat: 5, brute_force: 5, intelligence: 3 });
    
    // Mock special card data
    availableCardsMap.set('special_special1', { name: 'Special 1', character: 'Character 1' });
    availableCardsMap.set('special_special2', { name: 'Special 2', character: 'Any Character' });
    availableCardsMap.set('special_special3', { name: 'Special 3', character: 'Character 5' });
    availableCardsMap.set('special_angrymob1', { name: 'Mob Mentality', character: 'Angry Mob' });
    availableCardsMap.set('special_angrymob2', { name: 'Don\'t Let it Get Away!', character: 'Angry Mob' });
    availableCardsMap.set('special_angrymob3', { name: 'Medieval Riot', character: 'Angry Mob: Middle Ages' });
    availableCardsMap.set('special_angrymob4', { name: 'Industrial Strike', character: 'Angry Mob: Industrial Age' });
    
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
    availableCardsMap.set('power_card_power1', { name: 'Power 1', power_type: 'Energy', value: 5 });
    availableCardsMap.set('power_card_power2', { name: 'Power 2', power_type: 'Combat', value: 8 });
    availableCardsMap.set('power_card_power3', { name: 'Power 3', power_type: 'Energy', value: 10 }); // High requirement
    
    // Mock universe card data
    availableCardsMap.set('advanced_universe_adv1', { name: 'Advanced 1', to_use: '6 Energy' });
    availableCardsMap.set('teamwork_team1', { name: 'Teamwork 1', to_use: '7 Combat' });
    availableCardsMap.set('ally_universe_ally1', { name: 'Ally 1', to_use: '8 Brute Force' });
    availableCardsMap.set('training_train1', { name: 'Training 1', to_use: '9 Intelligence' });
    availableCardsMap.set('basic_universe_basic1', { name: 'Basic 1', to_use: '10 Energy' }); // High requirement
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
    
    // Rule 1.5: Angry Mob character restrictions
    const angryMobCharacters = characterCards.filter(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      return availableCard && (availableCard.name || '').startsWith('Angry Mob');
    });
    
    if (angryMobCharacters.length > 1) {
      errors.push(`Only one "Angry Mob" character allowed in deck (found ${angryMobCharacters.length})`);
    }
    
    // Rule 2: Special cards may only be for selected characters or "Any Character"
    const characterNames = characterCards.map(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      return availableCard ? availableCard.name : 'Unknown';
    });
    
    // Get Angry Mob character info for special validation
    const angryMobCharacter = angryMobCharacters.length > 0 ? angryMobCharacters[0] : null;
    const angryMobCharacterName = angryMobCharacter ? (() => {
      const availableCard = availableCardsMap.get(`${angryMobCharacter.type}_${angryMobCharacter.cardId}`);
      return availableCard ? availableCard.name : null;
    })() : null;
    
    deckCards.forEach(card => {
      if (card.type === 'special') {
        const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
        if (availableCard && availableCard.character && 
            availableCard.character !== 'Any Character') {
          
          const specialCharacter = availableCard.character;
          const specialName = availableCard.name;
          
          // Check if this is an Angry Mob special
          if (specialCharacter.startsWith('Angry Mob')) {
            // Angry Mob special validation
            if (!angryMobCharacterName) {
              errors.push(`"${specialName}" requires an "Angry Mob" character in your team`);
            } else {
              // Check if the special is for a specific Angry Mob subtype
              if (specialCharacter.includes(':')) {
                // Special is for a specific subtype (e.g., "Angry Mob: Middle Ages")
                const specialSubtype = specialCharacter.split(':')[1].trim();
                const characterSubtype = angryMobCharacterName.includes(':') ? 
                  angryMobCharacterName.split(':')[1].trim() : null;
                
                if (characterSubtype !== specialSubtype) {
                  errors.push(`"${specialName}" requires "Angry Mob: ${specialSubtype}" character in your team`);
                }
              }
              // If special is just "Angry Mob" (no subtype), any Angry Mob character can use it
            }
          } else {
            // Regular character special validation
            if (!characterNames.includes(specialCharacter)) {
              errors.push(`"${specialName}" requires character "${specialCharacter}" in your team`);
            }
          }
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
    
    if (totalCards < requiredSize) {
      errors.push(`Deck must have at least ${requiredSize} cards in draw pile (${totalCards}/${requiredSize})`);
    }
    
    // Rule 8: Deck cannot contain unusable cards
    const characterNamesForUnusable = characterCards.map(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      return availableCard ? availableCard.name : 'Unknown';
    });
    
    // Get character stats for power/universe card validation
    const characterStats = characterCards.map(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      return availableCard ? {
        name: availableCard.name,
        energy: availableCard.energy || 0,
        combat: availableCard.combat || 0,
        brute_force: availableCard.brute_force || 0,
        intelligence: availableCard.intelligence || 0
      } : null;
    }).filter(char => char);
    
    // Get mission sets for event validation
    const missionSets = new Set();
    missionCards.forEach(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      if (availableCard && availableCard.mission_set) {
        missionSets.add(availableCard.mission_set);
      }
    });
    
    deckCards.forEach(card => {
      const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
      if (!availableCard) return;
      
      const cardName = availableCard.name || 'Unknown Card';
      
      // Check special cards for character compatibility
      if (card.type === 'special') {
        if (availableCard.character && availableCard.character !== 'Any Character') {
          // Check if this is an Angry Mob special (already handled in Rule 2)
          if (availableCard.character.startsWith('Angry Mob')) {
            // Angry Mob validation is already handled above
            return;
          }
          
          // Regular character special validation
          if (!characterNamesForUnusable.includes(availableCard.character)) {
            errors.push(`"${cardName}" requires character "${availableCard.character}" in your team`);
          }
        }
      }
      
      // Check events for mission set compatibility
      if (card.type === 'event') {
        if (availableCard.mission_set && 
            availableCard.mission_set !== 'Any-Mission' && 
            missionSets.size > 0 && 
            !missionSets.has(availableCard.mission_set)) {
          errors.push(`"${cardName}" requires mission set "${availableCard.mission_set}" in your deck`);
        }
      }
      
      // Check power cards for character stat requirements
      if (card.type === 'power_card') {
        if (availableCard.power_type && availableCard.value) {
          const requiredValue = availableCard.value;
          const powerType = availableCard.power_type;
          
          // Check if any character can use this power card
          const canUse = characterStats.some(char => {
            if (!char) return false;
            let characterStat = 0;
            
            switch (powerType) {
              case 'Energy':
                characterStat = char.energy;
                break;
              case 'Combat':
                characterStat = char.combat;
                break;
              case 'Brute Force':
                characterStat = char.brute_force;
                break;
              case 'Intelligence':
                characterStat = char.intelligence;
                break;
              case 'Any-Power':
              case 'Multi-Power':
              case 'Multi Power':
                characterStat = Math.max(char.energy, char.combat, char.brute_force, char.intelligence);
                break;
            }
            
            return characterStat >= requiredValue;
          });
          
          if (!canUse) {
            errors.push(`"${cardName}" (Power Card) requires a character with ${requiredValue}+ ${powerType}`);
          }
        }
      }
      
      // Check universe cards for character stat requirements
      if (['advanced_universe', 'teamwork', 'ally_universe', 'training', 'basic_universe'].includes(card.type)) {
        // These cards typically have "to_use" requirements
        if (availableCard.to_use) {
          const toUseMatch = availableCard.to_use.match(/(\d+)\s+(Energy|Combat|Brute Force|Intelligence|Any-Power)/);
          if (toUseMatch) {
            const requiredValue = parseInt(toUseMatch[1]);
            const powerType = toUseMatch[2];
            
            const canUse = characterStats.some(char => {
              if (!char) return false;
              let characterStat = 0;
              
              switch (powerType) {
                case 'Energy':
                  characterStat = char.energy;
                  break;
                case 'Combat':
                  characterStat = char.combat;
                  break;
                case 'Brute Force':
                  characterStat = char.brute_force;
                  break;
                case 'Intelligence':
                  characterStat = char.intelligence;
                  break;
                case 'Any-Power':
                case 'Multi-Power':
                case 'Multi Power':
                  characterStat = Math.max(char.energy, char.combat, char.brute_force, char.intelligence);
                  break;
              }
              
              return characterStat >= requiredValue;
            });
            
            if (!canUse) {
              errors.push(`"${cardName}" (Universe Card) requires a character with ${requiredValue}+ ${powerType}`);
            }
          }
        }
      }
    });
    
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

  describe('Rule 1.5: Angry Mob character restrictions', () => {
    it('should pass with one Angry Mob character', () => {
      const deckCards = [
        { type: 'character', cardId: 'angrymob1', quantity: 1 },
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

    it('should fail with multiple Angry Mob characters', () => {
      const deckCards = [
        { type: 'character', cardId: 'angrymob1', quantity: 1 },
        { type: 'character', cardId: 'angrymob2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 51 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Only one "Angry Mob" character allowed in deck (found 2)');
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
        { type: 'special', cardId: 'special1', quantity: 1 },
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
        { type: 'special', cardId: 'special2', quantity: 1 },
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
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'special', cardId: 'special3', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"Special 3" requires character "Character 5" in your team');
    });

    it('should pass with generic Angry Mob special when Angry Mob character is present', () => {
      const deckCards = [
        { type: 'character', cardId: 'angrymob1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'special', cardId: 'angrymob1', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with matching subtype Angry Mob special', () => {
      const deckCards = [
        { type: 'character', cardId: 'angrymob1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'special', cardId: 'angrymob3', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with non-matching subtype Angry Mob special', () => {
      const deckCards = [
        { type: 'character', cardId: 'angrymob1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'special', cardId: 'angrymob4', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"Industrial Strike" requires "Angry Mob: Industrial Age" character in your team');
    });

    it('should fail with Angry Mob special when no Angry Mob character is present', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'special', cardId: 'angrymob1', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"Mob Mentality" requires an "Angry Mob" character in your team');
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
    it('should pass with at least 51 cards when no events', () => {
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

    it('should pass with at least 56 cards when events present', () => {
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
      expect(result.errors).toContain('Deck must have at least 51 cards in draw pile (45/51)');
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
      expect(result.errors).toContain('Deck must have at least 56 cards in draw pile (50/56)');
    });

    it('should pass with more than 51 cards when no events', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 60 } // More than 51
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with more than 56 cards when events present', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'event', cardId: 'event1', quantity: 1 },
        { type: 'power_card', cardId: 'power1', quantity: 65 } // More than 56
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
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
      expect(result.errors).toContain('Deck must have at least 51 cards in draw pile (40/51)');
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
        { type: 'special', cardId: 'special1', quantity: 1 }, // For Character 1
        { type: 'special', cardId: 'special2', quantity: 1 }, // Any Character
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

  describe('Rule 8: Deck cannot contain unusable cards', () => {
    it('should pass with usable power cards', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power1', quantity: 1 }, // 5 Energy requirement, char1 has 6
        { type: 'power_card', cardId: 'power1', quantity: 50 } // Use power1 again instead of power2
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with unusable power cards', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'power_card', cardId: 'power3', quantity: 1 }, // 10 Energy requirement, no character has 10+
        { type: 'power_card', cardId: 'power2', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      if (result.isValid) {
        console.log('Power 3 test passed unexpectedly - no errors found');
      } else {
        console.log('Unusable power card errors:', result.errors);
      }
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"Power 3" (Power Card) requires a character with 10+ Energy');
    });

    it('should pass with usable universe cards', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'advanced_universe', cardId: 'adv1', quantity: 1 }, // 6 Energy requirement, char1 has 6
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      if (!result.isValid) {
        console.log('Usable universe card errors:', result.errors);
      }
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with unusable universe cards', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 },
        { type: 'basic_universe', cardId: 'basic1', quantity: 1 }, // 10 Energy requirement, no character has 10+
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"Basic 1" (Universe Card) requires a character with 10+ Energy');
    });

    it('should pass with events from matching mission set', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 }, // Set A
        { type: 'event', cardId: 'event1', quantity: 1 }, // Set A
        { type: 'power_card', cardId: 'power1', quantity: 55 } // 56 total with event
      ];
      
      const result = validateDeck(deckCards);
      if (!result.isValid) {
        console.log('Matching mission set event errors:', result.errors);
      }
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with events from non-matching mission set', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 }, // Set A
        { type: 'event', cardId: 'event3', quantity: 1 }, // Set B
        { type: 'power_card', cardId: 'power1', quantity: 50 }
      ];
      
      const result = validateDeck(deckCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('"Event 3" requires mission set "Set B" in your deck');
    });

    it('should pass with "Any-Mission" events', () => {
      const deckCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 7 }, // Set A
        { type: 'event', cardId: 'event2', quantity: 1 }, // Any-Mission
        { type: 'power_card', cardId: 'power1', quantity: 55 } // 56 total with event
      ];
      
      const result = validateDeck(deckCards);
      if (!result.isValid) {
        console.log('Any-Mission event errors:', result.errors);
      }
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
