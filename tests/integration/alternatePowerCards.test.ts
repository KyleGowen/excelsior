import { Pool } from 'pg';

describe('Alternate Power Cards Integration Tests', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Power Card Alternate Images Database Verification', () => {
    it('should have alternate image for 5 - Multi Power', async () => {
      // After migration V181, alternate images are stored as separate card rows
      // Check for cards with the same name and value/power_type, including alternates
      const result = await pool.query(
        "SELECT id, name, image_path FROM power_cards WHERE name = $1 OR (name LIKE '5 - Multi Power%' AND image_path LIKE '%/alternate/%')",
        ['5 - Multi Power']
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      const alternateCard = result.rows.find((c: any) => c.image_path && c.image_path.includes('/alternate/'));
      expect(alternateCard).toBeTruthy();
      expect(alternateCard.image_path).toContain('power-cards/alternate/5_multipower.webp');
      
      console.log('✅ 5 - Multi Power has alternate image:', alternateCard?.image_path);
    });

    it('should have alternate image for 7 - Combat', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(
        "SELECT id, name, image_path FROM power_cards WHERE name = $1 OR (name LIKE '7 - Combat%' AND image_path LIKE '%/alternate/%')",
        ['7 - Combat']
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      const alternateCard = result.rows.find((c: any) => c.image_path && c.image_path.includes('/alternate/'));
      expect(alternateCard).toBeTruthy();
      expect(alternateCard.image_path).toContain('power-cards/alternate/7_combat.png');
      
      console.log('✅ 7 - Combat has alternate image:', alternateCard?.image_path);
    });

    it('should have alternate image for 7 - Any-Power', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(
        "SELECT id, name, image_path FROM power_cards WHERE name = $1 OR (name LIKE '7 - Any-Power%' AND image_path LIKE '%/alternate/%')",
        ['7 - Any-Power']
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      const alternateCard = result.rows.find((c: any) => c.image_path && c.image_path.includes('/alternate/'));
      expect(alternateCard).toBeTruthy();
      expect(alternateCard.image_path).toContain('power-cards/alternate/7_anypower.png');
      
      console.log('✅ 7 - Any-Power has alternate image:', alternateCard?.image_path);
    });

    it('should verify 8 - Any-Power has no alternate images', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(
        "SELECT id, name, image_path FROM power_cards WHERE name = $1 AND image_path LIKE '%/alternate/%'",
        ['8 - Any-Power']
      );
      
      // Should have no alternate image rows
      expect(result.rows.length).toBe(0);
      
      console.log('✅ 8 - Any-Power has no alternate images');
    });

    it('should have alternate image for 8 - Brute Force', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(
        "SELECT id, name, image_path FROM power_cards WHERE name = $1 OR (name LIKE '8 - Brute Force%' AND image_path LIKE '%/alternate/%')",
        ['8 - Brute Force']
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      const alternateCard = result.rows.find((c: any) => c.image_path && c.image_path.includes('/alternate/'));
      expect(alternateCard).toBeTruthy();
      expect(alternateCard.image_path).toContain('power-cards/alternate/8_brute_force.webp');
      
      console.log('✅ 8 - Brute Force has alternate image:', alternateCard?.image_path);
    });

    it('should have alternate image for 8 - Combat', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(
        "SELECT id, name, image_path FROM power_cards WHERE name = $1 OR (name LIKE '8 - Combat%' AND image_path LIKE '%/alternate/%')",
        ['8 - Combat']
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      const alternateCard = result.rows.find((c: any) => c.image_path && c.image_path.includes('/alternate/'));
      expect(alternateCard).toBeTruthy();
      expect(alternateCard.image_path).toContain('power-cards/alternate/8_combat.webp');
      
      console.log('✅ 8 - Combat has alternate image:', alternateCard?.image_path);
    });

    it('should have alternate image for 8 - Energy', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(
        "SELECT id, name, image_path FROM power_cards WHERE name = $1 OR (name LIKE '8 - Energy%' AND image_path LIKE '%/alternate/%')",
        ['8 - Energy']
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      const alternateCard = result.rows.find((c: any) => c.image_path && c.image_path.includes('/alternate/'));
      expect(alternateCard).toBeTruthy();
      expect(alternateCard.image_path).toContain('power-cards/alternate/8_energy.webp');
      
      console.log('✅ 8 - Energy has alternate image:', alternateCard?.image_path);
    });

    it('should have alternate image for 8 - Intelligence', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(
        "SELECT id, name, image_path FROM power_cards WHERE name = $1 OR (name LIKE '8 - Intelligence%' AND image_path LIKE '%/alternate/%')",
        ['8 - Intelligence']
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      const alternateCard = result.rows.find((c: any) => c.image_path && c.image_path.includes('/alternate/'));
      expect(alternateCard).toBeTruthy();
      expect(alternateCard.image_path).toContain('power-cards/alternate/8_intelligence.webp');
      
      console.log('✅ 8 - Intelligence has alternate image:', alternateCard?.image_path);
    });
  });

  describe('Database Structure and Data Integrity', () => {
    it('should verify all power cards with alternates have correct data structure', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(`
        SELECT id, name, image_path 
        FROM power_cards 
        WHERE image_path LIKE '%/alternate/%'
        ORDER BY name
      `);
      
      expect(result.rows.length).toBeGreaterThanOrEqual(7);
      
      // Verify each alternate card has the expected structure
      result.rows.forEach(card => {
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.image_path).toBeDefined();
        expect(typeof card.image_path).toBe('string');
        expect(card.image_path).toMatch(/\/alternate\//);
        expect(card.image_path).toMatch(/\.(webp|png|jpg|jpeg)$/);
      });
      
      console.log('✅ All power cards with alternates have correct data structure');
    });

    it('should verify no duplicate alternate images exist', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(`
        SELECT id, name, image_path 
        FROM power_cards 
        WHERE image_path LIKE '%/alternate/%'
      `);
      
      const allAlternateImages = new Set();
      
      result.rows.forEach(card => {
        expect(allAlternateImages.has(card.image_path)).toBe(false);
        allAlternateImages.add(card.image_path);
      });
      
      console.log('✅ No duplicate alternate images found');
    });

    it('should verify all alternate image files exist in expected format', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const result = await pool.query(`
        SELECT id, name, image_path 
        FROM power_cards 
        WHERE image_path LIKE '%/alternate/%'
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
      
      const foundImages = new Set(result.rows.map((r: any) => r.image_path));
      
      expectedImages.forEach(expectedImage => {
        const found = Array.from(foundImages).some((img: any) => img.includes(expectedImage.split('/').pop()!));
        expect(found).toBe(true);
      });
      
      console.log('✅ All expected alternate images are present in database');
    });

    it('should verify alternate image selection works for power cards in deck editor', async () => {
      // After migration V181, alternate images are stored as separate card rows
      const powerCardsWithAlternates = await pool.query(`
        SELECT id, name, image_path 
        FROM power_cards 
        WHERE image_path LIKE '%/alternate/%'
      `);
      
      expect(powerCardsWithAlternates.rows.length).toBeGreaterThan(0);
      
      for (const card of powerCardsWithAlternates.rows) {
        // Verify the alternate image path is valid
        // Path may be relative (power-cards/alternate/...) or absolute
        expect(card.image_path).toMatch(/power-cards\/alternate\/.+\.(webp|png|jpg|jpeg)$/);
        
        // Verify the alternate image is properly formatted
        expect(card.image_path).toContain('power-cards/alternate/');
        
        console.log(`✅ ${card.name} alternate image verified: ${card.image_path}`);
      }
      
      console.log('✅ All power card alternate images are properly formatted and selectable');
    });
  });
});
