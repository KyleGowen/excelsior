import { Pool } from 'pg';

describe('Database View Integration Tests', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Card Type Tables Verification', () => {
    it('should verify characters table exists and has correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'characters' 
        ORDER BY ordinal_position
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('image_path');
      expect(columns).toContain('alternate_images');
      
      console.log('✅ Characters table structure verified:', columns);
    });

    it('should verify locations table exists and has correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'locations' 
        ORDER BY ordinal_position
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('image_path');
      
      console.log('✅ Locations table structure verified:', columns);
    });

    it('should verify power_cards table exists and has correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'power_cards' 
        ORDER BY ordinal_position
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('image_path');
      expect(columns).toContain('alternate_images');
      
      console.log('✅ Power cards table structure verified:', columns);
    });
  });

  describe('Card Data Verification', () => {
    it('should verify characters have valid data', async () => {
      const result = await pool.query(
        'SELECT id, name, image_path, alternate_images FROM characters ORDER BY name LIMIT 10'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(character => {
        expect(character.id).toBeDefined();
        expect(character.name).toBeDefined();
        expect(character.image_path).toBeDefined();
        expect(character.alternate_images).toBeDefined();
        // alternate_images can be null or an array
        expect(character.alternate_images === null || Array.isArray(character.alternate_images)).toBe(true);
        
        // Verify image path format (can be just filename or full path)
        expect(character.image_path).toMatch(/\.(webp|png|jpg|jpeg)$/);
      });
      
      console.log('✅ Characters data verified:', result.rows.length, 'characters');
    });

    it('should verify locations have valid data', async () => {
      const result = await pool.query(
        'SELECT id, name, image_path FROM locations ORDER BY name LIMIT 10'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(location => {
        expect(location.id).toBeDefined();
        expect(location.name).toBeDefined();
        expect(location.image_path).toBeDefined();
        
        // Verify image path format (can be just filename or full path)
        expect(location.image_path).toMatch(/\.(webp|png|jpg|jpeg)$/);
      });
      
      console.log('✅ Locations data verified:', result.rows.length, 'locations');
    });

    it('should verify power cards have valid data', async () => {
      const result = await pool.query(
        'SELECT id, name, image_path, alternate_images FROM power_cards ORDER BY name LIMIT 10'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(powerCard => {
        expect(powerCard.id).toBeDefined();
        expect(powerCard.name).toBeDefined();
        expect(powerCard.image_path).toBeDefined();
        expect(powerCard.alternate_images).toBeDefined();
        expect(Array.isArray(powerCard.alternate_images)).toBe(true);
        
        // Verify image path format (can be just filename or full path)
        expect(powerCard.image_path).toMatch(/\.(webp|png|jpg|jpeg)$/);
      });
      
      console.log('✅ Power cards data verified:', result.rows.length, 'power cards');
    });
  });

  describe('Card Count Verification', () => {
    it('should verify expected number of characters', async () => {
      const result = await pool.query('SELECT COUNT(*) as count FROM characters');
      
      expect(result.rows).toHaveLength(1);
      const count = parseInt(result.rows[0].count);
      expect(count).toBeGreaterThan(0);
      
      // Based on server logs showing "43 characters"
      expect(count).toBe(43);
      
      console.log('✅ Character count verified:', count);
    });

    it('should verify expected number of locations', async () => {
      const result = await pool.query('SELECT COUNT(*) as count FROM locations');
      
      expect(result.rows).toHaveLength(1);
      const count = parseInt(result.rows[0].count);
      expect(count).toBeGreaterThan(0);
      
      // Based on server logs showing "8 locations"
      expect(count).toBe(8);
      
      console.log('✅ Location count verified:', count);
    });

    it('should verify power cards count', async () => {
      const result = await pool.query('SELECT COUNT(*) as count FROM power_cards');
      
      expect(result.rows).toHaveLength(1);
      const count = parseInt(result.rows[0].count);
      expect(count).toBeGreaterThan(0);
      
      console.log('✅ Power cards count verified:', count);
    });
  });

  describe('Card Image Verification', () => {
    it('should verify all characters have valid image paths', async () => {
      const result = await pool.query(
        'SELECT id, name, image_path FROM characters WHERE image_path IS NULL OR image_path = \'\''
      );
      
      expect(result.rows).toHaveLength(0);
      
      console.log('✅ All characters have valid image paths');
    });

    it('should verify all locations have valid image paths', async () => {
      const result = await pool.query(
        'SELECT id, name, image_path FROM locations WHERE image_path IS NULL OR image_path = \'\''
      );
      
      expect(result.rows).toHaveLength(0);
      
      console.log('✅ All locations have valid image paths');
    });

    it('should verify all power cards have valid image paths', async () => {
      const result = await pool.query(
        'SELECT id, name, image_path FROM power_cards WHERE image_path IS NULL OR image_path = \'\''
      );
      
      expect(result.rows).toHaveLength(0);
      
      console.log('✅ All power cards have valid image paths');
    });
  });

  describe('Alternate Images Verification', () => {
    it('should verify characters with alternate images have correct format', async () => {
      const result = await pool.query(
        'SELECT id, name, alternate_images FROM characters WHERE array_length(alternate_images, 1) > 0'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(character => {
        expect(character.alternate_images).toBeDefined();
        expect(Array.isArray(character.alternate_images)).toBe(true);
        expect(character.alternate_images.length).toBeGreaterThan(0);
        
        character.alternate_images.forEach((altImage: string) => {
          expect(altImage).toMatch(/^characters\/alternate\//);
          expect(altImage).toMatch(/\.(webp|png|jpg|jpeg)$/);
        });
      });
      
      console.log('✅ Characters alternate images verified:', result.rows.length, 'characters');
    });

    it('should verify power cards with alternate images have correct format', async () => {
      const result = await pool.query(
        'SELECT id, name, alternate_images FROM power_cards WHERE array_length(alternate_images, 1) > 0'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(powerCard => {
        expect(powerCard.alternate_images).toBeDefined();
        expect(Array.isArray(powerCard.alternate_images)).toBe(true);
        expect(powerCard.alternate_images.length).toBeGreaterThan(0);
        
        powerCard.alternate_images.forEach((altImage: string) => {
          expect(altImage).toMatch(/^power-cards\/alternate\//);
          expect(altImage).toMatch(/\.(webp|png|jpg|jpeg)$/);
        });
      });
      
      console.log('✅ Power cards alternate images verified:', result.rows.length, 'power cards');
    });
  });

  describe('Card Data Integrity', () => {
    it('should verify all cards have unique IDs', async () => {
      const tables = ['characters', 'locations', 'power_cards'];
      
      for (const table of tables) {
        const result = await pool.query(`SELECT id FROM ${table}`);
        const ids = result.rows.map(row => row.id);
        const uniqueIds = new Set(ids);
        
        expect(uniqueIds.size).toBe(ids.length);
        console.log(`✅ ${table} unique IDs verified:`, ids.length, 'cards');
      }
    });

    it('should verify all cards have non-empty names', async () => {
      const tables = ['characters', 'locations', 'power_cards'];
      
      for (const table of tables) {
        const result = await pool.query(`SELECT id, name FROM ${table} WHERE name IS NULL OR name = ''`);
        
        expect(result.rows).toHaveLength(0);
        console.log(`✅ ${table} non-empty names verified`);
      }
    });

    it('should verify card data consistency', async () => {
      const tables = ['characters', 'locations', 'power_cards'];
      
      for (const table of tables) {
        const result = await pool.query(`SELECT * FROM ${table} LIMIT 5`);
        
        expect(result.rows.length).toBeGreaterThan(0);
        
        result.rows.forEach(card => {
          expect(card.id).toBeDefined();
          expect(card.name).toBeDefined();
          expect(card.image_path).toBeDefined();
          
          // Verify image path format (can be just filename or full path)
          expect(card.image_path).toMatch(/\.(webp|png|jpg|jpeg)$/);
        });
        
        console.log(`✅ ${table} data consistency verified`);
      }
    });
  });

  describe('Database Performance Verification', () => {
    it('should verify card queries perform within reasonable time', async () => {
      const startTime = Date.now();
      
      const tables = ['characters', 'locations', 'power_cards'];
      
      for (const table of tables) {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        expect(result.rows).toHaveLength(1);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within 1 second
      expect(totalTime).toBeLessThan(1000);
      
      console.log('✅ Card queries performance verified:', totalTime, 'ms');
    });

    it('should verify card filtering queries perform well', async () => {
      const startTime = Date.now();
      
      // Test filtering by name
      await pool.query("SELECT * FROM characters WHERE name ILIKE '%leonidas%'");
      await pool.query("SELECT * FROM locations WHERE name ILIKE '%round%'");
      await pool.query("SELECT * FROM power_cards WHERE name ILIKE '%combat%'");
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within 500ms
      expect(totalTime).toBeLessThan(500);
      
      console.log('✅ Card filtering queries performance verified:', totalTime, 'ms');
    });
  });
});
