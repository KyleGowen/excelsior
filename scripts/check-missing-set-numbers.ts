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

async function checkMissingSetNumbers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Scanning database for missing set_number values...\n');
    
    const tables = [
      'characters',
      'special_cards',
      'power_cards',
      'missions',
      'events',
      'aspects',
      'advanced_universe_cards',
      'teamwork_cards',
      'ally_universe_cards',
      'training_cards',
      'basic_universe_cards',
      'locations'
    ];
    
    const results: Array<{table: string, total: number, with_set_number: number, missing: number, examples?: any[]}> = [];
    
    for (const table of tables) {
      const countQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(set_number) as with_set_number,
          COUNT(*) - COUNT(set_number) as missing
        FROM ${table}
      `;
      
      const countResult = await client.query(countQuery);
      const { total, with_set_number, missing } = countResult.rows[0];
      
      let examples: any[] | undefined = undefined;
      if (parseInt(missing) > 0) {
        // Get some examples of missing set_numbers
        const exampleQuery = `
          SELECT id, name, ${table === 'characters' ? 'name' : table === 'special_cards' ? 'name, character_name' : 'name'} as card_info
          FROM ${table}
          WHERE set_number IS NULL
          LIMIT 5
        `;
        const exampleResult = await client.query(exampleQuery);
        examples = exampleResult.rows.length > 0 ? exampleResult.rows : undefined;
      }
      
      const result: {table: string, total: number, with_set_number: number, missing: number, examples?: any[]} = {
        table,
        total: parseInt(total),
        with_set_number: parseInt(with_set_number),
        missing: parseInt(missing)
      };
      
      if (examples) {
        result.examples = examples;
      }
      
      results.push(result);
    }
    
    // Print summary table
    console.log('┌─────────────────────────────┬─────────┬─────────────────┬─────────┐');
    console.log('│ Table                       │ Total   │ With set_number │ Missing │');
    console.log('├─────────────────────────────┼─────────┼─────────────────┼─────────┤');
    
    let totalMissing = 0;
    for (const result of results) {
      const status = result.missing > 0 ? '❌' : '✅';
      console.log(`│ ${result.table.padEnd(27)} │ ${result.total.toString().padStart(7)} │ ${result.with_set_number.toString().padStart(15)} │ ${result.missing.toString().padStart(7)} │ ${status}`);
      totalMissing += result.missing;
    }
    
    console.log('└─────────────────────────────┴─────────┴─────────────────┴─────────┘');
    console.log(`\n📊 Total missing set_numbers: ${totalMissing}\n`);
    
    // Print examples for tables with missing set_numbers
    const tablesWithMissing = results.filter(r => r.missing > 0);
    if (tablesWithMissing.length > 0) {
      console.log('📋 Examples of cards missing set_number:\n');
      for (const result of tablesWithMissing) {
        console.log(`\n${result.table}:`);
        if (result.examples) {
          for (const example of result.examples) {
            if (result.table === 'special_cards') {
              console.log(`  - ${example.name} (${example.character_name})`);
            } else {
              console.log(`  - ${example.name || example.card_info}`);
            }
          }
          if (result.missing > result.examples.length) {
            console.log(`  ... and ${result.missing - result.examples.length} more`);
          }
        }
      }
    } else {
      console.log('✅ All cards have set_number values!');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMissingSetNumbers();

