/**
 * Integration tests for teamwork card image path and description fixes
 * Verifies that teamwork cards have the correct image paths and descriptions
 */

import { Pool } from 'pg';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';

describe('Teamwork Card Fixes', () => {
  let pool: Pool;

  beforeAll(async () => {
    // Use the same database connection as other integration tests
    pool = DataSourceConfig.getInstance().getPool();
  });

  afterAll(async () => {
    // Don't close the pool as it's managed by DataSourceConfig
  });

  describe('Image Path Corrections', () => {
    const expectedImagePaths = [
      {
        name: '6 Combat',
        description: 'Teamwork card: 6 Combat acts as 4 Attack with Brute Force + Energy followup',
        expectedPath: 'teamwork-universe/6_combat_0e_1bf.webp'
      },
      {
        name: '6 Combat',
        description: 'Teamwork card: 6 Combat acts as 4 Attack with Energy + Intelligence followup',
        expectedPath: 'teamwork-universe/6_combat_0e_1i.webp'
      },
      {
        name: '6 Energy',
        description: 'Teamwork card: 6 Energy acts as 4 Attack with Combat + Intelligence followup',
        expectedPath: 'teamwork-universe/6_energy_0c_1i.webp'
      },
      {
        name: '6 Energy',
        description: 'Teamwork card: 6 Energy acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'teamwork-universe/6_energy_0c_1bf.webp'
      },
      {
        name: '6 Intelligence',
        description: 'Teamwork card: 6 Intelligence acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'teamwork-universe/6_intelligence_0c_1bf.webp'
      },
      {
        name: '6 Intelligence',
        description: 'Teamwork card: 6 Intelligence acts as 4 Attack with Combat + Energy followup',
        expectedPath: 'teamwork-universe/6_intelligence_0e_1c.webp'
      },
      {
        name: '7 Combat',
        description: 'Teamwork card: 7 Combat acts as 4 Attack with Energy + Intelligence followup',
        expectedPath: 'teamwork-universe/7_combat_1e_1i.webp'
      },
      {
        name: '7 Combat',
        description: 'Teamwork card: 7 Combat acts as 4 Attack with Brute Force + Energy followup',
        expectedPath: 'teamwork-universe/7_combat_1e_1bf.webp'
      },
      {
        name: '7 Energy',
        description: 'Teamwork card: 7 Energy acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'teamwork-universe/7_energy_1c_1bf.webp'
      },
      {
        name: '7 Energy',
        description: 'Teamwork card: 7 Energy acts as 4 Attack with Combat + Intelligence followup',
        expectedPath: 'teamwork-universe/7_energy_1c_1i.webp'
      },
      {
        name: '7 Intelligence',
        description: 'Teamwork card: 7 Intelligence acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'teamwork-universe/7_intelligence_1c_1bf.webp'
      },
      {
        name: '7 Intelligence',
        description: 'Teamwork card: 7 Intelligence acts as 4 Attack with Combat + Energy followup',
        expectedPath: 'teamwork-universe/7_intelligence_1e_1c.webp'
      },
      {
        name: '8 Brute Force',
        description: 'Teamwork card: 8 Brute Force acts as 4 Attack with Intelligence + Combat followup',
        expectedPath: 'teamwork-universe/8_brute_force_1c_2i.webp'
      },
      {
        name: '8 Combat',
        description: 'Teamwork card: 8 Combat acts as 4 Attack with Brute Force + Energy followup',
        expectedPath: 'teamwork-universe/8_combat_1e_2bf.webp'
      },
      {
        name: '8 Combat',
        description: 'Teamwork card: 8 Combat acts as 4 Attack with Energy + Intelligence followup',
        expectedPath: 'teamwork-universe/8_combat_1e_2i.webp'
      },
      {
        name: '8 Energy',
        description: 'Teamwork card: 8 Energy acts as 4 Attack with Intelligence + Brute Force followup',
        expectedPath: 'teamwork-universe/8_energy_1c_2bf.webp'
      },
      {
        name: '8 Energy',
        description: 'Teamwork card: 8 Energy acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'teamwork-universe/8_energy_1c_2i.webp'
      },
      {
        name: '8 Intelligence',
        description: 'Teamwork card: 8 Intelligence acts as 4 Attack with Combat + Energy followup',
        expectedPath: 'teamwork-universe/8_intelligence_1e_2c.webp'
      },
      {
        name: '8 Intelligence',
        description: 'Teamwork card: 8 Intelligence acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'teamwork-universe/8_intelligence_1c_2bf.webp'
      }
    ];

    expectedImagePaths.forEach(({ name, description, expectedPath }) => {
      it(`should have correct image path for ${name} - ${description}`, async () => {
        const result = await pool.query(`
          SELECT image_path 
          FROM teamwork_cards 
          WHERE name = $1 
          AND card_description = $2 
          AND universe = 'ERB'
        `, [name, description]);

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].image_path).toBe(expectedPath);
      });
    });
  });

  describe('Description Corrections', () => {
    it('should have correct description for 8 Energy with Intelligence + Brute Force followup', async () => {
      const result = await pool.query(`
        SELECT card_description 
        FROM teamwork_cards 
        WHERE name = '8 Energy' 
        AND image_path = 'teamwork-universe/8_energy_1c_2bf.webp'
        AND universe = 'ERB'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].card_description).toBe('Teamwork card: 8 Energy acts as 4 Attack with Intelligence + Brute Force followup');
    });

    it('should have correct description for 8 Energy with Brute Force + Combat followup', async () => {
      const result = await pool.query(`
        SELECT card_description 
        FROM teamwork_cards 
        WHERE name = '8 Energy' 
        AND image_path = 'teamwork-universe/8_energy_1c_2i.webp'
        AND universe = 'ERB'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].card_description).toBe('Teamwork card: 8 Energy acts as 4 Attack with Brute Force + Combat followup');
    });
  });

  describe('Overall Teamwork Card Count', () => {
    it('should have the expected number of teamwork cards', async () => {
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM teamwork_cards 
        WHERE universe = 'ERB'
      `);

      expect(parseInt(result.rows[0].count)).toBe(38);
    });
  });

  describe('All Image Paths Are Correct', () => {
    it('should have all teamwork cards with correct image paths', async () => {
      const result = await pool.query(`
        SELECT name, card_description, image_path 
        FROM teamwork_cards 
        WHERE universe = 'ERB'
        ORDER BY name, card_description
      `);

      // Verify we have the expected number of cards
      expect(result.rows).toHaveLength(38);
      
      // Verify all image paths start with 'teamwork-universe/' and end with '.webp'
      result.rows.forEach((row, index) => {
        expect(row.image_path).toMatch(/^teamwork-universe\/.*\.webp$/);
      });
      
      // Verify specific key cards have correct paths
      const anyPowerCards = result.rows.filter(row => row.name.includes('Any-Power'));
      expect(anyPowerCards).toHaveLength(2);
      expect(anyPowerCards[0].image_path).toBe('teamwork-universe/6_anypower.webp');
      expect(anyPowerCards[1].image_path).toBe('teamwork-universe/7_anypower.webp');
    });
  });
});
