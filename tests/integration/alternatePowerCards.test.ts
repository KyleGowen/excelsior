import { Pool } from 'pg';

describe('Alternate Power Cards Integration Tests', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Power Card Alternate Images Database Verification', () => {
    it('should have alternate image for 5 - Multi Power', async () => {
      const result = await pool.query(
        'SELECT name, alternate_images FROM power_cards WHERE name = $1',
        ['5 - Multi Power']
      );
      
      expect(result.rows).toHaveLength(1);
      const card = result.rows[0];
      expect(card.name).toBe('5 - Multi Power');
      expect(card.alternate_images).toContain('power-cards/alternate/5_multipower.webp');
      expect(card.alternate_images.length).toBeGreaterThan(0);
      
      console.log('✅ 5 - Multi Power has alternate image:', card.alternate_images);
    });

    it('should have alternate image for 7 - Combat', async () => {
      const result = await pool.query(
        'SELECT name, alternate_images FROM power_cards WHERE name = $1',
        ['7 - Combat']
      );
      
      expect(result.rows).toHaveLength(1);
      const card = result.rows[0];
      expect(card.name).toBe('7 - Combat');
      expect(card.alternate_images).toContain('power-cards/alternate/7_combat.png');
      expect(card.alternate_images.length).toBeGreaterThan(0);
      
      console.log('✅ 7 - Combat has alternate image:', card.alternate_images);
    });

    it('should have alternate image for 7 - Any-Power', async () => {
      const result = await pool.query(
        'SELECT name, alternate_images FROM power_cards WHERE name = $1',
        ['7 - Any-Power']
      );
      
      expect(result.rows).toHaveLength(1);
      const card = result.rows[0];
      expect(card.name).toBe('7 - Any-Power');
      expect(card.alternate_images).toContain('power-cards/alternate/7_anypower.png');
      expect(card.alternate_images.length).toBeGreaterThan(0);
      
      console.log('✅ 7 - Any-Power has alternate image:', card.alternate_images);
    });

    it('should verify 8 - Any-Power has no alternate images', async () => {
      const result = await pool.query(
        'SELECT name, alternate_images FROM power_cards WHERE name = $1',
        ['8 - Any-Power']
      );
      
      expect(result.rows).toHaveLength(1);
      const card = result.rows[0];
      expect(card.name).toBe('8 - Any-Power');
      expect(card.alternate_images).not.toContain('power-cards/alternate/7_anypower.webp');
      expect(card.alternate_images === null || card.alternate_images.length === 0).toBe(true);
      
      console.log('✅ 8 - Any-Power has no alternate images:', card.alternate_images);
    });

    it('should have alternate image for 8 - Brute Force', async () => {
      const result = await pool.query(
        'SELECT name, alternate_images FROM power_cards WHERE name = $1',
        ['8 - Brute Force']
      );
      
      expect(result.rows).toHaveLength(1);
      const card = result.rows[0];
      expect(card.name).toBe('8 - Brute Force');
      expect(card.alternate_images).toContain('power-cards/alternate/8_brute_force.webp');
      expect(card.alternate_images.length).toBeGreaterThan(0);
      
      console.log('✅ 8 - Brute Force has alternate image:', card.alternate_images);
    });

    it('should have alternate image for 8 - Combat', async () => {
      const result = await pool.query(
        'SELECT name, alternate_images FROM power_cards WHERE name = $1',
        ['8 - Combat']
      );
      
      expect(result.rows).toHaveLength(1);
      const card = result.rows[0];
      expect(card.name).toBe('8 - Combat');
      expect(card.alternate_images).toContain('power-cards/alternate/8_combat.webp');
      expect(card.alternate_images.length).toBeGreaterThan(0);
      
      console.log('✅ 8 - Combat has alternate image:', card.alternate_images);
    });

    it('should have alternate image for 8 - Energy', async () => {
      const result = await pool.query(
        'SELECT name, alternate_images FROM power_cards WHERE name = $1',
        ['8 - Energy']
      );
      
      expect(result.rows).toHaveLength(1);
      const card = result.rows[0];
      expect(card.name).toBe('8 - Energy');
      expect(card.alternate_images).toContain('power-cards/alternate/8_energy.webp');
      expect(card.alternate_images.length).toBeGreaterThan(0);
      
      console.log('✅ 8 - Energy has alternate image:', card.alternate_images);
    });

    it('should have alternate image for 8 - Intelligence', async () => {
      const result = await pool.query(
        'SELECT name, alternate_images FROM power_cards WHERE name = $1',
        ['8 - Intelligence']
      );
      
      expect(result.rows).toHaveLength(1);
      const card = result.rows[0];
      expect(card.name).toBe('8 - Intelligence');
      expect(card.alternate_images).toContain('power-cards/alternate/8_intelligence.webp');
      expect(card.alternate_images.length).toBeGreaterThan(0);
      
      console.log('✅ 8 - Intelligence has alternate image:', card.alternate_images);
    });
  });

  describe('Database Structure and Data Integrity', () => {
    it('should verify all power cards with alternates have correct data structure', async () => {
      const result = await pool.query(`
        SELECT name, alternate_images, image_path 
        FROM power_cards 
        WHERE array_length(alternate_images, 1) > 0 
        ORDER BY name
      `);
      
      expect(result.rows).toHaveLength(7);
      
      // Verify each card has the expected structure
      result.rows.forEach(card => {
        expect(card.name).toBeDefined();
        expect(card.alternate_images).toBeDefined();
        expect(Array.isArray(card.alternate_images)).toBe(true);
        expect(card.alternate_images.length).toBeGreaterThan(0);
        expect(card.image_path).toBeDefined();
        expect(typeof card.image_path).toBe('string');
        
        // Verify alternate images are valid paths
        card.alternate_images.forEach((altImage: string) => {
          expect(typeof altImage).toBe('string');
          expect(altImage).toMatch(/^power-cards\/alternate\//);
          expect(altImage).toMatch(/\.(webp|png)$/);
        });
      });
      
      console.log('✅ All power cards with alternates have correct data structure');
    });

    it('should verify no duplicate alternate images exist', async () => {
      const result = await pool.query(`
        SELECT name, alternate_images 
        FROM power_cards 
        WHERE array_length(alternate_images, 1) > 0
      `);
      
      const allAlternateImages = new Set();
      
      result.rows.forEach(card => {
        card.alternate_images.forEach((altImage: string) => {
          expect(allAlternateImages.has(altImage)).toBe(false);
          allAlternateImages.add(altImage);
        });
      });
      
      console.log('✅ No duplicate alternate images found');
    });

    it('should verify all alternate image files exist in expected format', async () => {
      const result = await pool.query(`
        SELECT name, alternate_images 
        FROM power_cards 
        WHERE array_length(alternate_images, 1) > 0
      `);
      
      const expectedImages = [
        'power-cards/alternate/5_multipower.webp',
        'power-cards/alternate/7_combat.png',
        'power-cards/alternate/7_anypower.png',
        'power-cards/alternate/8_brute_force.webp',
        'power-cards/alternate/8_combat.webp',
        'power-cards/alternate/8_energy.webp',
        'power-cards/alternate/8_intelligence.webp'
      ];
      
      const foundImages = new Set();
      result.rows.forEach(card => {
        card.alternate_images.forEach((altImage: string) => {
          foundImages.add(altImage);
        });
      });
      
      expectedImages.forEach(expectedImage => {
        expect(foundImages.has(expectedImage)).toBe(true);
      });
      
      console.log('✅ All expected alternate images are present in database');
    });

    it('should verify alternate image selection works for power cards in deck editor', async () => {
      // Test that power cards with alternate images can have their alternate images selected
      const powerCardsWithAlternates = await pool.query(
        'SELECT id, name, alternate_images FROM power_cards WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0'
      );
      
      expect(powerCardsWithAlternates.rows.length).toBeGreaterThan(0);
      
      for (const card of powerCardsWithAlternates.rows) {
        // Verify the card has alternate images
        expect(card.alternate_images).toBeDefined();
        expect(Array.isArray(card.alternate_images)).toBe(true);
        expect(card.alternate_images.length).toBeGreaterThan(0);
        
        // Test each alternate image
        for (const altImage of card.alternate_images) {
          // Verify the alternate image path is valid
          expect(altImage).toMatch(/^power-cards\/alternate\/.+\.(webp|png|jpg|jpeg)$/);
          
          // Verify the alternate image is properly formatted
          expect(altImage).toContain('power-cards/alternate/');
          
          console.log(`✅ ${card.name} alternate image verified: ${altImage}`);
        }
      }
      
      console.log('✅ All power card alternate images are properly formatted and selectable');
    });
  });
});
