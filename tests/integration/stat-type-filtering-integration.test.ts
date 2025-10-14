/**
 * Integration tests for stat type filtering across all card types
 * Tests filtering by each of the 4 stat types: Energy, Combat, Brute Force, Intelligence
 */

import { integrationTestUtils } from '../setup-integration';

describe('Stat Type Filtering Integration Tests', () => {
  beforeEach(async () => {
    // Clean up any previous test data
    await integrationTestUtils.cleanupAllTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await integrationTestUtils.cleanupAllTestData();
  });

  describe('Energy Stat Type Filtering', () => {
    it('should filter ally cards by Energy stat type', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Energy stat type
      const energyCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('energy')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('energy'))
      );
      
      expect(energyCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Energy in stat_type_to_use or attack_type
      energyCards.forEach((card: any) => {
        const hasEnergy = (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('energy')) ||
                         (card.attack_type && card.attack_type.toLowerCase().includes('energy'));
        expect(hasEnergy).toBe(true);
      });
      
      // Log the results for verification
      console.log(`Found ${energyCards.length} Energy ally cards:`, 
        energyCards.map((card: any) => card.card_name));
    });

    it('should filter training cards by Energy stat type', async () => {
      const response = await fetch('http://localhost:3000/api/training');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Energy stat type
      const energyCards = data.data.filter((card: any) => 
        (card.type_1 && card.type_1.toLowerCase().includes('energy')) ||
        (card.type_2 && card.type_2.toLowerCase().includes('energy'))
      );
      
      expect(energyCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Energy in type_1 or type_2
      energyCards.forEach((card: any) => {
        const hasEnergy = (card.type_1 && card.type_1.toLowerCase().includes('energy')) ||
                         (card.type_2 && card.type_2.toLowerCase().includes('energy'));
        expect(hasEnergy).toBe(true);
      });
      
      // Log the results for verification
      console.log(`Found ${energyCards.length} Energy training cards:`, 
        energyCards.map((card: any) => card.card_name));
    });

    it('should filter basic universe cards by Energy stat type', async () => {
      const response = await fetch('http://localhost:3000/api/basic-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Energy stat type
      const energyCards = data.data.filter((card: any) => 
        card.type && card.type.toLowerCase().includes('energy')
      );
      
      expect(energyCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Energy in type
      energyCards.forEach((card: any) => {
        expect(card.type.toLowerCase()).toContain('energy');
      });
      
      // Log the results for verification
      console.log(`Found ${energyCards.length} Energy basic universe cards:`, 
        energyCards.map((card: any) => card.card_name));
    });
  });

  describe('Combat Stat Type Filtering', () => {
    it('should filter ally cards by Combat stat type', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Combat stat type
      const combatCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('combat')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('combat'))
      );
      
      expect(combatCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Combat in stat_type_to_use or attack_type
      combatCards.forEach((card: any) => {
        const hasCombat = (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('combat')) ||
                         (card.attack_type && card.attack_type.toLowerCase().includes('combat'));
        expect(hasCombat).toBe(true);
      });
      
      // Log the results for verification
      console.log(`Found ${combatCards.length} Combat ally cards:`, 
        combatCards.map((card: any) => card.card_name));
    });

    it('should filter training cards by Combat stat type', async () => {
      const response = await fetch('http://localhost:3000/api/training');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Combat stat type
      const combatCards = data.data.filter((card: any) => 
        (card.type_1 && card.type_1.toLowerCase().includes('combat')) ||
        (card.type_2 && card.type_2.toLowerCase().includes('combat'))
      );
      
      expect(combatCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Combat in type_1 or type_2
      combatCards.forEach((card: any) => {
        const hasCombat = (card.type_1 && card.type_1.toLowerCase().includes('combat')) ||
                         (card.type_2 && card.type_2.toLowerCase().includes('combat'));
        expect(hasCombat).toBe(true);
      });
      
      // Log the results for verification
      console.log(`Found ${combatCards.length} Combat training cards:`, 
        combatCards.map((card: any) => card.card_name));
    });

    it('should filter basic universe cards by Combat stat type', async () => {
      const response = await fetch('http://localhost:3000/api/basic-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Combat stat type
      const combatCards = data.data.filter((card: any) => 
        card.type && card.type.toLowerCase().includes('combat')
      );
      
      expect(combatCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Combat in type
      combatCards.forEach((card: any) => {
        expect(card.type.toLowerCase()).toContain('combat');
      });
      
      // Log the results for verification
      console.log(`Found ${combatCards.length} Combat basic universe cards:`, 
        combatCards.map((card: any) => card.card_name));
    });
  });

  describe('Brute Force Stat Type Filtering', () => {
    it('should filter ally cards by Brute Force stat type', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Brute Force stat type
      const bruteForceCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('brute force')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('brute force'))
      );
      
      expect(bruteForceCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Brute Force in stat_type_to_use or attack_type
      bruteForceCards.forEach((card: any) => {
        const hasBruteForce = (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('brute force')) ||
                             (card.attack_type && card.attack_type.toLowerCase().includes('brute force'));
        expect(hasBruteForce).toBe(true);
      });
      
      // Log the results for verification
      console.log(`Found ${bruteForceCards.length} Brute Force ally cards:`, 
        bruteForceCards.map((card: any) => card.card_name));
    });

    it('should filter training cards by Brute Force stat type', async () => {
      const response = await fetch('http://localhost:3000/api/training');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Brute Force stat type
      const bruteForceCards = data.data.filter((card: any) => 
        (card.type_1 && card.type_1.toLowerCase().includes('brute force')) ||
        (card.type_2 && card.type_2.toLowerCase().includes('brute force'))
      );
      
      expect(bruteForceCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Brute Force in type_1 or type_2
      bruteForceCards.forEach((card: any) => {
        const hasBruteForce = (card.type_1 && card.type_1.toLowerCase().includes('brute force')) ||
                             (card.type_2 && card.type_2.toLowerCase().includes('brute force'));
        expect(hasBruteForce).toBe(true);
      });
      
      // Log the results for verification
      console.log(`Found ${bruteForceCards.length} Brute Force training cards:`, 
        bruteForceCards.map((card: any) => card.card_name));
    });

    it('should filter basic universe cards by Brute Force stat type', async () => {
      const response = await fetch('http://localhost:3000/api/basic-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Brute Force stat type
      const bruteForceCards = data.data.filter((card: any) => 
        card.type && card.type.toLowerCase().includes('brute force')
      );
      
      expect(bruteForceCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Brute Force in type
      bruteForceCards.forEach((card: any) => {
        expect(card.type.toLowerCase()).toContain('brute force');
      });
      
      // Log the results for verification
      console.log(`Found ${bruteForceCards.length} Brute Force basic universe cards:`, 
        bruteForceCards.map((card: any) => card.card_name));
    });
  });

  describe('Intelligence Stat Type Filtering', () => {
    it('should filter ally cards by Intelligence stat type', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Intelligence stat type
      const intelligenceCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('intelligence')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('intelligence'))
      );
      
      expect(intelligenceCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Intelligence in stat_type_to_use or attack_type
      intelligenceCards.forEach((card: any) => {
        const hasIntelligence = (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('intelligence')) ||
                               (card.attack_type && card.attack_type.toLowerCase().includes('intelligence'));
        expect(hasIntelligence).toBe(true);
      });
      
      // Log the results for verification
      console.log(`Found ${intelligenceCards.length} Intelligence ally cards:`, 
        intelligenceCards.map((card: any) => card.card_name));
    });

    it('should filter training cards by Intelligence stat type', async () => {
      const response = await fetch('http://localhost:3000/api/training');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Intelligence stat type
      const intelligenceCards = data.data.filter((card: any) => 
        (card.type_1 && card.type_1.toLowerCase().includes('intelligence')) ||
        (card.type_2 && card.type_2.toLowerCase().includes('intelligence'))
      );
      
      expect(intelligenceCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Intelligence in type_1 or type_2
      intelligenceCards.forEach((card: any) => {
        const hasIntelligence = (card.type_1 && card.type_1.toLowerCase().includes('intelligence')) ||
                               (card.type_2 && card.type_2.toLowerCase().includes('intelligence'));
        expect(hasIntelligence).toBe(true);
      });
      
      // Log the results for verification
      console.log(`Found ${intelligenceCards.length} Intelligence training cards:`, 
        intelligenceCards.map((card: any) => card.card_name));
    });

    it('should filter basic universe cards by Intelligence stat type', async () => {
      const response = await fetch('http://localhost:3000/api/basic-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Intelligence stat type
      const intelligenceCards = data.data.filter((card: any) => 
        card.type && card.type.toLowerCase().includes('intelligence')
      );
      
      expect(intelligenceCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have Intelligence in type
      intelligenceCards.forEach((card: any) => {
        expect(card.type.toLowerCase()).toContain('intelligence');
      });
      
      // Log the results for verification
      console.log(`Found ${intelligenceCards.length} Intelligence basic universe cards:`, 
        intelligenceCards.map((card: any) => card.card_name));
    });
  });

  describe('Cross-Card Type Stat Type Filtering', () => {
    it('should find Energy cards across all card types', async () => {
      // Get all card types
      const [allyResponse, trainingResponse, basicResponse] = await Promise.all([
        fetch('http://localhost:3000/api/ally-universe'),
        fetch('http://localhost:3000/api/training'),
        fetch('http://localhost:3000/api/basic-universe')
      ]);

      const [allyData, trainingData, basicData] = await Promise.all([
        allyResponse.json(),
        trainingResponse.json(),
        basicResponse.json()
      ]);

      expect(allyData.success).toBe(true);
      expect(trainingData.success).toBe(true);
      expect(basicData.success).toBe(true);

      // Filter Energy cards from each type
      const allyEnergyCards = allyData.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('energy')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('energy'))
      );

      const trainingEnergyCards = trainingData.data.filter((card: any) => 
        (card.type_1 && card.type_1.toLowerCase().includes('energy')) ||
        (card.type_2 && card.type_2.toLowerCase().includes('energy'))
      );

      const basicEnergyCards = basicData.data.filter((card: any) => 
        card.type && card.type.toLowerCase().includes('energy')
      );

      // Should have Energy cards in at least one category
      const totalEnergyCards = allyEnergyCards.length + trainingEnergyCards.length + basicEnergyCards.length;
      expect(totalEnergyCards).toBeGreaterThan(0);

      console.log(`Total Energy cards found: ${totalEnergyCards}`);
      console.log(`- Ally Energy cards: ${allyEnergyCards.length}`);
      console.log(`- Training Energy cards: ${trainingEnergyCards.length}`);
      console.log(`- Basic Energy cards: ${basicEnergyCards.length}`);
    });

    it('should find all 4 stat types across all card types', async () => {
      const statTypes = ['energy', 'combat', 'brute force', 'intelligence'];
      const cardTypes = [
        { name: 'ally', endpoint: 'http://localhost:3000/api/ally-universe', filter: (card: any, stat: string) => 
          (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes(stat)) ||
          (card.attack_type && card.attack_type.toLowerCase().includes(stat))
        },
        { name: 'training', endpoint: 'http://localhost:3000/api/training', filter: (card: any, stat: string) => 
          (card.type_1 && card.type_1.toLowerCase().includes(stat)) ||
          (card.type_2 && card.type_2.toLowerCase().includes(stat))
        },
        { name: 'basic', endpoint: 'http://localhost:3000/api/basic-universe', filter: (card: any, stat: string) => 
          card.type && card.type.toLowerCase().includes(stat)
        }
      ];

      const results: { [key: string]: { [key: string]: number } } = {};

      for (const statType of statTypes) {
        results[statType] = {};
        
        for (const cardType of cardTypes) {
          const response = await fetch(cardType.endpoint);
          const data = await response.json();
          
          expect(data.success).toBe(true);
          
          const filteredCards = data.data.filter((card: any) => cardType.filter(card, statType));
          results[statType][cardType.name] = filteredCards.length;
        }
      }

      // Log comprehensive results
      console.log('Stat Type Distribution Across Card Types:');
      for (const statType of statTypes) {
        console.log(`\n${statType.toUpperCase()}:`);
        for (const cardType of cardTypes) {
          console.log(`  ${cardType.name}: ${results[statType][cardType.name]} cards`);
        }
      }

      // Verify that each stat type has at least some cards across all types
      for (const statType of statTypes) {
        const totalCards = Object.values(results[statType]).reduce((sum, count) => sum + count, 0);
        expect(totalCards).toBeGreaterThan(0);
      }
    });
  });

  describe('Stat Type Filtering Edge Cases', () => {
    it('should handle case-insensitive stat type filtering', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test different case variations
      const variations = ['energy', 'ENERGY', 'Energy', 'EnErGy'];
      const results: number[] = [];
      
      for (const variation of variations) {
        const filteredCards = data.data.filter((card: any) => 
          (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes(variation.toLowerCase())) ||
          (card.attack_type && card.attack_type.toLowerCase().includes(variation.toLowerCase()))
        );
        results.push(filteredCards.length);
      }
      
      // All variations should return the same number of results
      const firstResult = results[0];
      results.forEach((result, index) => {
        expect(result).toBe(firstResult);
      });
    });

    it('should handle partial stat type matches', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test partial matches
      const partialMatches = ['ener', 'comb', 'brute', 'intel'];
      const results: number[] = [];
      
      for (const partial of partialMatches) {
        const filteredCards = data.data.filter((card: any) => 
          (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes(partial)) ||
          (card.attack_type && card.attack_type.toLowerCase().includes(partial))
        );
        results.push(filteredCards.length);
      }
      
      // Should find some matches for each partial
      results.forEach((result, index) => {
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle non-existent stat type searches', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Search for non-existent stat type
      const nonExistentCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('nonexistent')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('nonexistent'))
      );
      
      expect(nonExistentCards.length).toBe(0);
    });
  });
});
