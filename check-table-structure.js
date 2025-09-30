const { Pool } = require('pg');

async function checkTableStructure() {
  const pool = new Pool({
    host: 'localhost',
    port: 1337,
    database: 'overpower',
    user: 'postgres',
    password: 'password'
  });

  try {
    console.log('🔍 Checking ally_universe_cards table structure...\n');
    
    // Get table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ally_universe_cards' 
      ORDER BY ordinal_position
    `);
    
    console.log('Table columns:');
    structureResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Get sample data for Little John and Hucklebuck
    const dataResult = await pool.query(`
      SELECT * 
      FROM ally_universe_cards 
      WHERE name IN ('Little John', 'Hucklebuck') 
      ORDER BY name
    `);
    
    console.log('\nSample data:');
    dataResult.rows.forEach(row => {
      console.log(`\n${row.name}:`);
      Object.keys(row).forEach(key => {
        if (row[key] !== null) {
          console.log(`  ${key}: ${row[key]}`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
