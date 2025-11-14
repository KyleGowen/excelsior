import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1337'),
  database: process.env.DB_NAME || 'overpower',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function getMissingDetails() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Detailed list of cards missing set_number:\n');
    
    // Characters
    console.log('CHARACTERS:');
    const charResult = await client.query(`
      SELECT id, name, image_path, set_number
      FROM characters
      WHERE set_number IS NULL
      ORDER BY name
    `);
    for (const row of charResult.rows) {
      const isAlternate = row.image_path?.includes('/alternate/') ? ' (ALTERNATE)' : '';
      console.log(`  - ${row.name}${isAlternate}`);
    }
    console.log(`  Total: ${charResult.rows.length}\n`);
    
    // Special Cards
    console.log('SPECIAL CARDS:');
    const specialResult = await client.query(`
      SELECT id, name, character_name, set_number
      FROM special_cards
      WHERE set_number IS NULL
      ORDER BY character_name, name
    `);
    for (const row of specialResult.rows) {
      console.log(`  - ${row.name} (${row.character_name})`);
    }
    console.log(`  Total: ${specialResult.rows.length}\n`);
    
    // Advanced Universe Cards
    console.log('ADVANCED UNIVERSE CARDS:');
    const advancedResult = await client.query(`
      SELECT id, name, set_number
      FROM advanced_universe_cards
      WHERE set_number IS NULL
      ORDER BY name
    `);
    for (const row of advancedResult.rows) {
      console.log(`  - ${row.name}`);
    }
    console.log(`  Total: ${advancedResult.rows.length}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

getMissingDetails();

