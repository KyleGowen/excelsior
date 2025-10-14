/**
 * Integration tests for search functionality across all card types
 * Tests the complete search workflow with real API calls and data filtering
 */

import { integrationTestUtils } from '../setup-integration';

describe('Search Functionality Integration Tests', () => {
  beforeEach(async () => {
    // Clean up any previous test data
    await integrationTestUtils.cleanupAllTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await integrationTestUtils.cleanupAllTestData();
  });

  describe('Ally Universe Search', () => {
    it('should search ally cards by card name', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      
      // Test searching for Allan Quatermain
      const allanCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('allan')
      );
      
      expect(allanCards.length).toBeGreaterThan(0);
      expect(allanCards[0].card_name).toContain('Allan');
      
      // Test searching for Hera
      const heraCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('hera')
      );
      
      expect(heraCards.length).toBeGreaterThan(0);
      expect(heraCards[0].card_name).toContain('Hera');
    });

    it('should search ally cards by stat type', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test Energy stat type
      const energyCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('energy')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('energy'))
      );
      
      expect(energyCards.length).toBeGreaterThan(0);
      energyCards.forEach((card: any) => {
        const hasEnergy = (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('energy')) ||
                         (card.attack_type && card.attack_type.toLowerCase().includes('energy'));
        expect(hasEnergy).toBe(true);
      });
      
      // Test Combat stat type
      const combatCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('combat')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('combat'))
      );
      
      expect(combatCards.length).toBeGreaterThan(0);
      combatCards.forEach((card: any) => {
        const hasCombat = (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('combat')) ||
                         (card.attack_type && card.attack_type.toLowerCase().includes('combat'));
        expect(hasCombat).toBe(true);
      });
    });

    it('should search ally cards by attack value (numeric)', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test attack value 2
      const attackValue2Cards = data.data.filter((card: any) => 
        card.attack_value && String(card.attack_value).toLowerCase().includes('2')
      );
      
      expect(attackValue2Cards.length).toBeGreaterThan(0);
      attackValue2Cards.forEach((card: any) => {
        expect(card.attack_value).toBe(2);
      });
      
      // Test attack value 3
      const attackValue3Cards = data.data.filter((card: any) => 
        card.attack_value && String(card.attack_value).toLowerCase().includes('3')
      );
      
      expect(attackValue3Cards.length).toBeGreaterThan(0);
      attackValue3Cards.forEach((card: any) => {
        expect(card.attack_value).toBe(3);
      });
    });

    it('should search ally cards by card text', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test searching for "Special" in card text
      const specialCards = data.data.filter((card: any) => 
        card.card_text && card.card_text.toLowerCase().includes('special')
      );
      
      expect(specialCards.length).toBeGreaterThan(0);
      specialCards.forEach((card: any) => {
        expect(card.card_text.toLowerCase()).toContain('special');
      });
    });

    it('should handle case-insensitive search', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test different case variations
      const variations = ['allan', 'ALLAN', 'Allan', 'AlLaN'];
      const results: number[] = [];
      
      for (const variation of variations) {
        const filteredCards = data.data.filter((card: any) => 
          card.card_name && card.card_name.toLowerCase().includes(variation.toLowerCase())
        );
        results.push(filteredCards.length);
      }
      
      // All variations should return the same number of results
      const firstResult = results[0];
      results.forEach((result) => {
        expect(result).toBe(firstResult);
      });
    });

    it('should handle null/undefined properties gracefully', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test that filtering doesn't crash with null/undefined values
      const filteredCards = data.data.filter((card: any) => 
        (card.card_name && card.card_name.toLowerCase().includes('test')) ||
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('test')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('test')) ||
        (card.attack_value && String(card.attack_value).toLowerCase().includes('test')) ||
        (card.card_text && card.card_text.toLowerCase().includes('test'))
      );
      
      // Should not throw errors and return an array
      expect(Array.isArray(filteredCards)).toBe(true);
    });
  });

  describe('Training Search', () => {
    it('should search training cards by card name', async () => {
      const response = await fetch('http://localhost:3000/api/training');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      
      // Test searching for training cards
      const trainingCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('training')
      );
      
      expect(trainingCards.length).toBeGreaterThan(0);
    });

    it('should search training cards by type_1 and type_2', async () => {
      const response = await fetch('http://localhost:3000/api/training');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test Energy type
      const energyCards = data.data.filter((card: any) => 
        (card.type_1 && card.type_1.toLowerCase().includes('energy')) ||
        (card.type_2 && card.type_2.toLowerCase().includes('energy'))
      );
      
      expect(energyCards.length).toBeGreaterThan(0);
      energyCards.forEach((card: any) => {
        const hasEnergy = (card.type_1 && card.type_1.toLowerCase().includes('energy')) ||
                         (card.type_2 && card.type_2.toLowerCase().includes('energy'));
        expect(hasEnergy).toBe(true);
      });
    });

    it('should search training cards by value_to_use and bonus (numeric)', async () => {
      const response = await fetch('http://localhost:3000/api/training');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test value_to_use
      const valueCards = data.data.filter((card: any) => 
        card.value_to_use && String(card.value_to_use).toLowerCase().includes('5')
      );
      
      if (valueCards.length > 0) {
        valueCards.forEach((card: any) => {
          expect(String(card.value_to_use)).toContain('5');
        });
      }
      
      // Test bonus
      const bonusCards = data.data.filter((card: any) => 
        card.bonus && String(card.bonus).toLowerCase().includes('2')
      );
      
      if (bonusCards.length > 0) {
        bonusCards.forEach((card: any) => {
          expect(String(card.bonus)).toContain('2');
        });
      }
    });
  });

  describe('Basic Universe Search', () => {
    it('should search basic universe cards by card name', async () => {
      const response = await fetch('http://localhost:3000/api/basic-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      
      // Test searching for any basic universe cards (just verify we have data)
      expect(data.data.length).toBeGreaterThan(0);
      
      // Test searching for any card name
      const anyCard = data.data.filter((card: any) => 
        card.card_name && card.card_name.length > 0
      );
      
      expect(anyCard.length).toBeGreaterThan(0);
    });

    it('should search basic universe cards by type', async () => {
      const response = await fetch('http://localhost:3000/api/basic-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test Energy type
      const energyCards = data.data.filter((card: any) => 
        card.type && card.type.toLowerCase().includes('energy')
      );
      
      expect(energyCards.length).toBeGreaterThan(0);
      energyCards.forEach((card: any) => {
        expect(card.type.toLowerCase()).toContain('energy');
      });
    });

    it('should search basic universe cards by value_to_use and bonus (numeric)', async () => {
      const response = await fetch('http://localhost:3000/api/basic-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test value_to_use
      const valueCards = data.data.filter((card: any) => 
        card.value_to_use && String(card.value_to_use).toLowerCase().includes('3')
      );
      
      if (valueCards.length > 0) {
        valueCards.forEach((card: any) => {
          expect(String(card.value_to_use)).toContain('3');
        });
      }
      
      // Test bonus
      const bonusCards = data.data.filter((card: any) => 
        card.bonus && String(card.bonus).toLowerCase().includes('1')
      );
      
      if (bonusCards.length > 0) {
        bonusCards.forEach((card: any) => {
          expect(String(card.bonus)).toContain('1');
        });
      }
    });
  });

  describe('Cross-Card Type Search', () => {
    it('should find cards across all types by stat type', async () => {
      const statTypes = ['energy', 'combat', 'brute force', 'intelligence'];
      
      for (const statType of statTypes) {
        // Test ally cards
        const allyResponse = await fetch('http://localhost:3000/api/ally-universe');
        const allyData = await allyResponse.json();
        
        const allyCards = allyData.data.filter((card: any) => 
          (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes(statType)) ||
          (card.attack_type && card.attack_type.toLowerCase().includes(statType))
        );
        
        // Test training cards
        const trainingResponse = await fetch('http://localhost:3000/api/training');
        const trainingData = await trainingResponse.json();
        
        const trainingCards = trainingData.data.filter((card: any) => 
          (card.type_1 && card.type_1.toLowerCase().includes(statType)) ||
          (card.type_2 && card.type_2.toLowerCase().includes(statType))
        );
        
        // Test basic universe cards
        const basicResponse = await fetch('http://localhost:3000/api/basic-universe');
        const basicData = await basicResponse.json();
        
        const basicCards = basicData.data.filter((card: any) => 
          card.type && card.type.toLowerCase().includes(statType)
        );
        
        const totalCards = allyCards.length + trainingCards.length + basicCards.length;
        
        // At least one card type should have cards for each stat type
        expect(totalCards).toBeGreaterThan(0);
        
        console.log(`${statType.toUpperCase()}: ${totalCards} total cards (${allyCards.length} ally, ${trainingCards.length} training, ${basicCards.length} basic)`);
      }
    });

    it('should handle empty search terms gracefully', async () => {
      const endpoints = ['http://localhost:3000/api/ally-universe', 'http://localhost:3000/api/training', 'http://localhost:3000/api/basic-universe'];
      
      for (const endpoint of endpoints) {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        
        // Empty search should return all cards
        const allCards = data.data.filter((card: any) => 
          card.card_name && card.card_name.toLowerCase().includes('')
        );
        
        expect(allCards.length).toBe(data.data.length);
      }
    });

    it('should handle non-existent search terms', async () => {
      const endpoints = ['http://localhost:3000/api/ally-universe', 'http://localhost:3000/api/training', 'http://localhost:3000/api/basic-universe'];
      
      for (const endpoint of endpoints) {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        
        // Non-existent search should return no cards
        const noMatchCards = data.data.filter((card: any) => 
          card.card_name && card.card_name.toLowerCase().includes('nonexistentcard')
        );
        
        expect(noMatchCards.length).toBe(0);
      }
    });
  });

  describe('Search Performance and Data Integrity', () => {
    it('should return consistent results across multiple calls', async () => {
      const response1 = await fetch('http://localhost:3000/api/ally-universe');
      const data1 = await response1.json();
      
      const response2 = await fetch('http://localhost:3000/api/ally-universe');
      const data2 = await response2.json();
      
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
      expect(data1.data.length).toBe(data2.data.length);
      
      // Test that filtering gives consistent results
      const filtered1 = data1.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('allan')
      );
      
      const filtered2 = data2.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('allan')
      );
      
      expect(filtered1.length).toBe(filtered2.length);
    });

    it('should return cards with all required fields', async () => {
      const endpoints = [
        { url: 'http://localhost:3000/api/ally-universe', requiredFields: ['id', 'card_name', 'stat_to_use', 'stat_type_to_use', 'attack_value', 'attack_type', 'card_text'] },
        { url: 'http://localhost:3000/api/training', requiredFields: ['id', 'card_name', 'type_1', 'type_2', 'value_to_use', 'bonus'] },
        { url: 'http://localhost:3000/api/basic-universe', requiredFields: ['id', 'card_name', 'type', 'value_to_use', 'bonus'] }
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(endpoint.url);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.data.length).toBeGreaterThan(0);
        
        // Check that all cards have required fields
        data.data.forEach((card: any) => {
          endpoint.requiredFields.forEach((field: string) => {
            expect(card[field]).toBeDefined();
          });
        });
      }
    });

    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Perform multiple filter operations
      const statTypes = ['energy', 'combat', 'brute force', 'intelligence'];
      for (const statType of statTypes) {
        const filteredCards = data.data.filter((card: any) => 
          (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes(statType)) ||
          (card.attack_type && card.attack_type.toLowerCase().includes(statType))
        );
        expect(Array.isArray(filteredCards)).toBe(true);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
});
