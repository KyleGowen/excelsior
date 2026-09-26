/**
 * Integration tests for teamwork card image path and description fixes
 * Verifies that teamwork cards have the correct image paths and descriptions
 */

import { Pool } from 'pg';

describe('Teamwork Card Fixes', () => {
  let pool: Pool;

  beforeAll(async () => {
    // Create database connection like other integration tests
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
  });

  afterAll(async () => {
    // Close the pool connection
    await pool.end();
  });

  describe('Image Path Corrections', () => {
    const expectedImagePaths = [
      {
        name: '6 Combat',
        description: 'Teamwork card: 6 Combat acts as 4 Attack with Brute Force + Energy followup',
        expectedPath: 'erb/teamwork/407_6_combat.png'
      },
      {
        name: '6 Combat',
        description: 'Teamwork card: 6 Combat acts as 4 Attack with Energy + Intelligence followup',
        expectedPath: 'erb/teamwork/409_6_combat.png'
      },
      {
        name: '6 Energy',
        description: 'Teamwork card: 6 Energy acts as 4 Attack with Combat + Intelligence followup',
        expectedPath: 'erb/teamwork/400_6_energy.png'
      },
      {
        name: '6 Energy',
        description: 'Teamwork card: 6 Energy acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'erb/teamwork/399_6_energy.png'
      },
      {
        name: '6 Intelligence',
        description: 'Teamwork card: 6 Intelligence acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'erb/teamwork/425_6_intelligence.png'
      },
      {
        name: '6 Intelligence',
        description: 'Teamwork card: 6 Intelligence acts as 4 Attack with Combat + Energy followup',
        expectedPath: 'erb/teamwork/427_6_intelligence.png'
      },
      {
        name: '7 Combat',
        description: 'Teamwork card: 7 Combat acts as 4 Attack with Energy + Intelligence followup',
        expectedPath: 'erb/teamwork/411_7_combat.png'
      },
      {
        name: '7 Combat',
        description: 'Teamwork card: 7 Combat acts as 4 Attack with Brute Force + Energy followup',
        expectedPath: 'erb/teamwork/412_7_combat.png'
      },
      {
        name: '7 Energy',
        description: 'Teamwork card: 7 Energy acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'erb/teamwork/402_7_energy.png'
      },
      {
        name: '7 Energy',
        description: 'Teamwork card: 7 Energy acts as 4 Attack with Combat + Intelligence followup',
        expectedPath: 'erb/teamwork/401_7_energy.png'
      },
      {
        name: '7 Intelligence',
        description: 'Teamwork card: 7 Intelligence acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'erb/teamwork/428_7_intelligence.png'
      },
      {
        name: '7 Intelligence',
        description: 'Teamwork card: 7 Intelligence acts as 4 Attack with Combat + Energy followup',
        expectedPath: 'erb/teamwork/430_7_intelligence.png'
      },
      {
        name: '8 Brute Force',
        description: 'Teamwork card: 8 Brute Force acts as 4 Attack with Intelligence + Combat followup',
        expectedPath: 'erb/teamwork/422_8_brute_force.png'
      },
      {
        name: '8 Combat',
        description: 'Teamwork card: 8 Combat acts as 4 Attack with Brute Force + Energy followup',
        expectedPath: 'erb/teamwork/415_8_combat.png'
      },
      {
        name: '8 Combat',
        description: 'Teamwork card: 8 Combat acts as 4 Attack with Energy + Intelligence followup',
        expectedPath: 'erb/teamwork/413_8_combat.png'
      },
      {
        name: '8 Energy',
        description: 'Teamwork card: 8 Energy acts as 4 Attack with Intelligence + Brute Force followup',
        expectedPath: 'erb/teamwork/404_8_energy.png'
      },
      {
        name: '8 Energy',
        description: 'Teamwork card: 8 Energy acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'erb/teamwork/406_8_energy.png'
      },
      {
        name: '8 Intelligence',
        description: 'Teamwork card: 8 Intelligence acts as 4 Attack with Combat + Energy followup',
        expectedPath: 'erb/teamwork/432_8_intelligence.png'
      },
      {
        name: '8 Intelligence',
        description: 'Teamwork card: 8 Intelligence acts as 4 Attack with Brute Force + Combat followup',
        expectedPath: 'erb/teamwork/431_8_intelligence.png'
      }
    ];

    expectedImagePaths.forEach(({ name, description, expectedPath }) => {
      it(`should have correct image path for ${name} - ${description}`, async () => {
        const result = await pool.query(`
          SELECT image_path 
          FROM teamwork_cards 
          WHERE name = $1 
          AND card_description = $2 
          AND "set" = 'ERB'
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
        AND image_path = 'erb/teamwork/404_8_energy.png'
        AND "set" = 'ERB'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].card_description).toBe('Teamwork card: 8 Energy acts as 4 Attack with Intelligence + Brute Force followup');
    });

    it('should have correct description for 8 Energy with Brute Force + Combat followup', async () => {
      const result = await pool.query(`
        SELECT card_description 
        FROM teamwork_cards 
        WHERE name = '8 Energy' 
        AND image_path = 'erb/teamwork/406_8_energy.png'
        AND "set" = 'ERB'
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
        WHERE "set" = 'ERB'
      `);

      expect(parseInt(result.rows[0].count)).toBe(38);
    });
  });

  describe('All Image Paths Are Correct', () => {
    it('should have all teamwork cards with correct image paths', async () => {
      const result = await pool.query(`
        SELECT name, card_description, image_path 
        FROM teamwork_cards 
        WHERE "set" = 'ERB'
        ORDER BY name, card_description
      `);

      // Verify we have the expected number of cards
      expect(result.rows).toHaveLength(38);
      
      // Verify all image paths start with 'teamwork-universe/' and end with '.webp'
      result.rows.forEach((row, index) => {
        expect(row.image_path).toMatch(/^erb\/teamwork\/.*\.png$/);
      });
      
      // Verify specific key cards have correct paths
      const anyPowerCards = result.rows.filter(row => row.name.includes('Any-Power'));
      expect(anyPowerCards).toHaveLength(2);
      expect(anyPowerCards[0].image_path).toBe('erb/teamwork/480_6_any_power.png');
      expect(anyPowerCards[1].image_path).toBe('erb/teamwork/481_7_any_power.png');
    });
  });
});
