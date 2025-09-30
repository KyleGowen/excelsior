const { Pool } = require('pg');

async function verifyMigration() {
  const pool = new Pool({
    host: 'localhost',
    port: 1337,
    database: 'overpower',
    user: 'postgres',
    password: 'password'
  });

  try {
    console.log('🔍 Checking Little John and Hucklebuck data...\n');
    
    const result = await pool.query(`
      SELECT name, image_path 
      FROM ally_universe_cards 
      WHERE name IN ('Little John', 'Hucklebuck', 'Huckleblock') 
      ORDER BY name
    `);
    
    console.log('Current data:');
    result.rows.forEach(row => {
      console.log(`- ${row.name}: ${row.image_path}`);
    });
    
    console.log('\n✅ Expected results:');
    console.log('- Little John: ally-universe/5_brute_force.webp');
    console.log('- Hucklebuck: ally-universe/5_combat.webp');
    console.log('- Huckleblock: (should not exist)');
    
    // Check if the migration worked correctly
    const littleJohn = result.rows.find(row => row.name === 'Little John');
    const hucklebuck = result.rows.find(row => row.name === 'Hucklebuck');
    const huckleblock = result.rows.find(row => row.name === 'Huckleblock');
    
    console.log('\n📊 Migration Results:');
    console.log(`Little John has correct image: ${littleJohn?.image_path === 'ally-universe/5_brute_force.webp' ? '✅' : '❌'}`);
    console.log(`Hucklebuck exists: ${hucklebuck ? '✅' : '❌'}`);
    console.log(`Hucklebuck has correct image: ${hucklebuck?.image_path === 'ally-universe/5_combat.webp' ? '✅' : '❌'}`);
    console.log(`Huckleblock renamed: ${!huckleblock ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyMigration();
