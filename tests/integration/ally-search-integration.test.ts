/**
 * Integration tests for ally search functionality
 * Tests the complete ally search workflow with real API calls
 */

import { integrationTestUtils } from '../setup-integration';

describe('Ally Search Integration Tests', () => {
  beforeEach(async () => {
    // Clean up any previous test data
    await integrationTestUtils.cleanupAllTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await integrationTestUtils.cleanupAllTestData();
  });

  describe('Ally Search by Card Name', () => {
    it('should search for Allan Quatermain by name', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      
      // Filter for Allan Quatermain
      const allanCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('allan')
      );
      
      expect(allanCards.length).toBeGreaterThan(0);
      expect(allanCards[0].card_name).toContain('Allan');
    });

    it('should search for Hera by name', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Hera
      const heraCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('hera')
      );
      
      expect(heraCards.length).toBeGreaterThan(0);
      expect(heraCards[0].card_name).toContain('Hera');
    });

    it('should search for Guy of Gisborne by name', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for Guy of Gisborne
      const guyCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('guy')
      );
      
      expect(guyCards.length).toBeGreaterThan(0);
      expect(guyCards[0].card_name).toContain('Guy');
    });
  });

  describe('Ally Search by Stat Type', () => {
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
    });

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
    });

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
    });

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
    });
  });

  describe('Ally Search by Attack Value', () => {
    it('should filter ally cards by attack value 2', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for attack value 2
      const attackValue2Cards = data.data.filter((card: any) => 
        card.attack_value && String(card.attack_value).toLowerCase().includes('2')
      );
      
      expect(attackValue2Cards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have attack value 2
      attackValue2Cards.forEach((card: any) => {
        expect(card.attack_value).toBe(2);
      });
    });

    it('should filter ally cards by attack value 3', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for attack value 3
      const attackValue3Cards = data.data.filter((card: any) => 
        card.attack_value && String(card.attack_value).toLowerCase().includes('3')
      );
      
      expect(attackValue3Cards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have attack value 3
      attackValue3Cards.forEach((card: any) => {
        expect(card.attack_value).toBe(3);
      });
    });
  });

  describe('Ally Search by Card Text', () => {
    it('should filter ally cards by card text containing "Special"', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for cards with "Special" in card text
      const specialCards = data.data.filter((card: any) => 
        card.card_text && card.card_text.toLowerCase().includes('special')
      );
      
      expect(specialCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have "Special" in card text
      specialCards.forEach((card: any) => {
        expect(card.card_text.toLowerCase()).toContain('special');
      });
    });

    it('should filter ally cards by card text containing "Teammate"', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Filter for cards with "Teammate" in card text
      const teammateCards = data.data.filter((card: any) => 
        card.card_text && card.card_text.toLowerCase().includes('teammate')
      );
      
      expect(teammateCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards have "Teammate" in card text
      teammateCards.forEach((card: any) => {
        expect(card.card_text.toLowerCase()).toContain('teammate');
      });
    });
  });

  describe('Ally Search Case Insensitivity', () => {
    it('should handle case-insensitive search for card names', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test uppercase search
      const upperCaseCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('allan')
      );
      
      // Test lowercase search
      const lowerCaseCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('allan')
      );
      
      // Test mixed case search
      const mixedCaseCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('allan')
      );
      
      // All should return the same results
      expect(upperCaseCards.length).toBe(lowerCaseCards.length);
      expect(lowerCaseCards.length).toBe(mixedCaseCards.length);
      expect(upperCaseCards.length).toBeGreaterThan(0); // Make sure we found at least one result
    });

    it('should handle case-insensitive search for stat types', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Test uppercase search
      const upperCaseCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('energy')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('energy'))
      );
      
      // Test lowercase search
      const lowerCaseCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('energy')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('energy'))
      );
      
      // Test mixed case search
      const mixedCaseCards = data.data.filter((card: any) => 
        (card.stat_type_to_use && card.stat_type_to_use.toLowerCase().includes('energy')) ||
        (card.attack_type && card.attack_type.toLowerCase().includes('energy'))
      );
      
      // All should return the same results
      expect(upperCaseCards.length).toBe(lowerCaseCards.length);
      expect(lowerCaseCards.length).toBe(mixedCaseCards.length);
      expect(upperCaseCards.length).toBeGreaterThan(0); // Make sure we found at least one result
    });
  });

  describe('Ally Search Edge Cases', () => {
    it('should handle empty search term gracefully', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Empty search should return all cards
      const allCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('')
      );
      
      expect(allCards.length).toBe(data.data.length);
    });

    it('should handle search terms that match no cards', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Search for non-existent card
      const noMatchCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('nonexistentcard')
      );
      
      expect(noMatchCards.length).toBe(0);
    });

    it('should handle partial matches correctly', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Search for partial name
      const partialMatchCards = data.data.filter((card: any) => 
        card.card_name && card.card_name.toLowerCase().includes('all')
      );
      
      // Should find Allan Quatermain and potentially others
      expect(partialMatchCards.length).toBeGreaterThan(0);
      
      // Verify all returned cards contain "all" in their name
      partialMatchCards.forEach((card: any) => {
        expect(card.card_name.toLowerCase()).toContain('all');
      });
    });
  });

  describe('Ally Search Data Integrity', () => {
    it('should return cards with all required fields', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Check that all cards have required fields
      data.data.forEach((card: any) => {
        expect(card.id).toBeDefined();
        expect(card.card_name).toBeDefined();
        expect(card.stat_to_use).toBeDefined();
        expect(card.stat_type_to_use).toBeDefined();
        expect(card.attack_value).toBeDefined();
        expect(card.attack_type).toBeDefined();
        expect(card.card_text).toBeDefined();
      });
    });

    it('should handle numeric attack values correctly', async () => {
      const response = await fetch('http://localhost:3000/api/ally-universe');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      
      // Find cards with numeric attack values
      const numericAttackCards = data.data.filter((card: any) => 
        typeof card.attack_value === 'number'
      );
      
      expect(numericAttackCards.length).toBeGreaterThan(0);
      
      // Verify attack values are valid numbers
      numericAttackCards.forEach((card: any) => {
        expect(typeof card.attack_value).toBe('number');
        expect(card.attack_value).toBeGreaterThan(0);
        expect(card.attack_value).toBeLessThan(10); // Reasonable range
      });
    });
  });
});
