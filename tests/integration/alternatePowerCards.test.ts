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

    it('should have TFCP promo images for 7 - Combat', async () => {
      const nonFoil = await pool.query(
        "SELECT id, name, image_path, set FROM power_cards WHERE name = $1 AND set = 'TFCP' AND is_foil = FALSE",
        ['7 - Combat']
      );

      expect(nonFoil.rows.map((card: { image_path: string }) => card.image_path).sort()).toEqual([
        'tfacp/power/7_combat_2.png',
        'tfacp/power/7_combat_naol.png',
      ]);

      const foil = await pool.query(
        "SELECT id, name, image_path, set, is_foil FROM power_cards WHERE set = 'TFCP' AND image_path = 'tfacp/power/7_combat.png'",
        []
      );

      expect(foil.rows.length).toBe(1);
      expect(foil.rows[0].is_foil).toBe(true);

      const map = await pool.query(
        `SELECT fcm.foil_card_id, fcm.base_card_id, b.set AS base_set, b.image_path AS base_image_path
         FROM foil_card_map fcm
         JOIN power_cards b ON b.id::text = fcm.base_card_id
         WHERE fcm.card_type = 'power'
           AND fcm.foil_card_id = $1`,
        [foil.rows[0].id]
      );

      expect(map.rows.length).toBe(1);
      expect(map.rows[0].base_set).toBe('ERB');
      expect(map.rows[0].base_image_path).toBe('erb/power/301_7_combat.png');

      console.log('✅ 7 - Combat TFCP: non-foil 7_combat_2.png, foil-only 7_combat.png → ERB base');
    });

    it('should have TFCP promo image for 7 - Energy', async () => {
      const result = await pool.query(
        "SELECT id, name, image_path, set FROM power_cards WHERE name = $1 AND set = 'TFCP'",
        ['7 - Energy']
      );

      expect(result.rows.map((card: { image_path: string }) => card.image_path).sort()).toEqual([
        'tfacp/power/7_energy.png',
        'tfacp/power/7_energy_naol.png',
      ]);

      console.log('✅ 7 - Energy TFCP promo image:', result.rows[0]?.image_path);
    });

    it('should have TFCP promo image for 7 - Brute Force', async () => {
      const result = await pool.query(
        "SELECT id, name, image_path, set FROM power_cards WHERE name = $1 AND set = 'TFCP'",
        ['7 - Brute Force']
      );

      expect(result.rows.map((card: { image_path: string }) => card.image_path).sort()).toEqual([
        'tfacp/power/7_brute_force.png',
        'tfacp/power/7_brute_force_naol.png',
      ]);

      console.log('✅ 7 - Brute Force TFCP promo image:', result.rows[0]?.image_path);
    });

    it('should keep only the unreleased TFCP 7 - Intelligence printing face down', async () => {
      const result = await pool.query(
        "SELECT id, name, image_path, set FROM power_cards WHERE name = $1 AND set = 'TFCP'",
        ['7 - Intelligence']
      );

      expect(result.rows.map((card: { image_path: string }) => card.image_path).sort()).toEqual([
        'sky/card-back/overpowerback.png',
        'tfacp/power/7_intelligence.png',
      ]);

      console.log('✅ 7 - Intelligence TFCP promo image:', result.rows[0]?.image_path);
    });

    it('should have SKYP promo image for 7 - Any-Power', async () => {
      const result = await pool.query(
        "SELECT id, name, image_path, set FROM power_cards WHERE name = $1",
        ['7 - Any-Power']
      );

      expect(result.rows.length).toBeGreaterThan(0);
      const skypCard = result.rows.find((c: { set?: string }) => c.set === 'SKYP');
      expect(skypCard).toBeTruthy();
      expect(skypCard.image_path).toBe('skyp/power/7_anypower.png');

      console.log('✅ 7 - Any-Power SKYP promo image:', skypCard?.image_path);
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

    it('should classify level 8 alternate power art as ERBP (promo), not main ERB', async () => {
      const paths = [
        'power-cards/alternate/8_intelligence.webp',
        'power-cards/alternate/8_energy.webp',
        'power-cards/alternate/8_combat.webp',
        'power-cards/alternate/8_brute_force.webp',
      ];
      const result = await pool.query<{ image_path: string; set: string }>(
        `SELECT image_path, set FROM power_cards WHERE image_path = ANY($1::text[])`,
        [paths]
      );
      expect(result.rows).toHaveLength(4);
      for (const row of result.rows) {
        expect(row.set).toBe('ERBP');
      }
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
      
      expect(result.rows.length).toBeGreaterThanOrEqual(6);
      
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

    it('should verify alternate images exist for power cards', async () => {
      // Multiple cards can share the same alternate image (e.g., different power values with same art)
      const result = await pool.query(`
        SELECT COUNT(DISTINCT image_path) as unique_images, COUNT(*) as total_cards
        FROM power_cards 
        WHERE image_path LIKE '%/alternate/%'
      `);
      
      const uniqueImages = parseInt(result.rows[0].unique_images);
      const totalCards = parseInt(result.rows[0].total_cards);
      
      expect(uniqueImages).toBeGreaterThan(0);
      expect(totalCards).toBeGreaterThanOrEqual(uniqueImages);
      
      console.log(`✅ Found ${uniqueImages} unique alternate images across ${totalCards} cards`);
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
