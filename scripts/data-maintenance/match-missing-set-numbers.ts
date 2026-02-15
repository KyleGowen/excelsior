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

// Mapping from the provided list
const expectedMappings: Array<{set_number: string, card_name: string, character_name?: string, card_type: string}> = [
  // Special Cards
  {set_number: '068', card_name: 'Always there for a Friend', character_name: 'Dr. Watson', card_type: 'special'},
  {set_number: '091', card_name: 'Didn\'t See it Coming', character_name: 'Invisible Man', card_type: 'special'},
  {set_number: '102', card_name: 'Not without my Friends', character_name: 'Jane Porter', card_type: 'special'},
  {set_number: '124', card_name: 'Lead from the Front', character_name: 'King Arthur', card_type: 'special'},
  {set_number: '131', card_name: 'To The Death', character_name: 'Korak', card_type: 'special'},
  {set_number: '151', card_name: 'Shapeshift', character_name: 'Merlin', card_type: 'special'},
  {set_number: '175', card_name: 'Reclaim the Water', character_name: 'Poseidon', card_type: 'special'},
  {set_number: '189', card_name: 'Cult of Mnevis Bull', character_name: 'Ra', card_type: 'special'},
  {set_number: '201', card_name: 'Steal from the Rich', character_name: 'Robin Hood', card_type: 'special'},
  {set_number: '234', card_name: 'My Feet Feel Like Hands', character_name: 'Tarzan', card_type: 'special'},
  {set_number: '241', card_name: 'Reinvigorated By Fresh Organs', character_name: 'The Mummy', card_type: 'special'},
  {set_number: '264', card_name: 'World Renowned Doctor', character_name: 'Van Helsing', card_type: 'special'},
  {set_number: '267', card_name: 'Archery, Knives & Jujitsu', character_name: 'Victory Harben', card_type: 'special'},
  {set_number: '272', card_name: 'Aquaphobic', character_name: 'Wicked Witch of the West', card_type: 'special'},
  {set_number: '273', card_name: 'Feared by All Witches', character_name: 'Wicked Witch of the West', card_type: 'special'},
  {set_number: '274', card_name: 'I Will Have Those Silver Shoes!', character_name: 'Wicked Witch of the West', card_type: 'special'},
  {set_number: '275', card_name: 'One Eye', character_name: 'Wicked Witch of the West', card_type: 'special'},
  {set_number: '276', card_name: 'Harness the Wind', character_name: 'Wicked Witch of the West', card_type: 'special'},
  {set_number: '277', card_name: 'Wolves, Crows, & Black Bees', character_name: 'Wicked Witch of the West', card_type: 'special'},
  {set_number: '289', card_name: 'Rapier', character_name: 'Zorro', card_type: 'special'},
  {set_number: '439', card_name: 'Heimdall', character_name: 'Any Character', card_type: 'special'},
  {set_number: '030', card_name: 'Never Set Foot On Dry Land', character_name: 'Captain Nemo', card_type: 'special'},
];

async function matchMissingSetNumbers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Matching missing set_numbers from list to database cards...\n');
    
    const matches: Array<{set_number: string, card_name: string, character_name?: string, found: boolean, current_set_number?: string}> = [];
    
    for (const mapping of expectedMappings) {
      if (mapping.card_type === 'special') {
        const query = `
          SELECT set_number, name, character_name
          FROM special_cards
          WHERE name = $1 AND character_name = $2
        `;
        const result = await client.query(query, [mapping.card_name, mapping.character_name]);
        
        if (result.rows.length > 0) {
          const row = result.rows[0];
          const match: {set_number: string, card_name: string, character_name?: string, found: boolean, current_set_number?: string} = {
            set_number: mapping.set_number,
            card_name: mapping.card_name,
            found: true
          };
          if (mapping.character_name) {
            match.character_name = mapping.character_name;
          }
          if (row.set_number) {
            match.current_set_number = row.set_number;
          }
          matches.push(match);
        } else {
          // Try fuzzy matching
          const fuzzyQuery = `
            SELECT set_number, name, character_name
            FROM special_cards
            WHERE LOWER(name) LIKE LOWER($1) AND character_name = $2
          `;
          const fuzzyResult = await client.query(fuzzyQuery, [`%${mapping.card_name}%`, mapping.character_name]);
          
          if (fuzzyResult.rows.length > 0) {
            const match: {set_number: string, card_name: string, character_name?: string, found: boolean, current_set_number?: string} = {
              set_number: mapping.set_number,
              card_name: mapping.card_name,
              found: true
            };
            if (mapping.character_name) {
              match.character_name = mapping.character_name;
            }
            if (fuzzyResult.rows[0].set_number) {
              match.current_set_number = fuzzyResult.rows[0].set_number;
            }
            matches.push(match);
          } else {
            const match: {set_number: string, card_name: string, character_name?: string, found: boolean, current_set_number?: string} = {
              set_number: mapping.set_number,
              card_name: mapping.card_name,
              found: false
            };
            if (mapping.character_name) {
              match.character_name = mapping.character_name;
            }
            matches.push(match);
          }
        }
      }
    }
    
    // Print results
    console.log('┌─────────┬──────────────────────────────────────┬──────────────────────────────┬─────────────┬──────────────────┐');
    console.log('│ Set #   │ Card Name                            │ Character                    │ Found       │ Current Set #    │');
    console.log('├─────────┼──────────────────────────────────────┼──────────────────────────────┼─────────────┼──────────────────┤');
    
    for (const match of matches) {
      const foundStr = match.found ? '✅ Yes' : '❌ No';
      const currentStr = match.current_set_number || 'NULL';
      const cardName = (match.card_name.length > 38 ? match.card_name.substring(0, 35) + '...' : match.card_name).padEnd(38);
      const charName = (match.character_name || '').padEnd(28);
      
      console.log(`│ ${match.set_number.padStart(7)} │ ${cardName} │ ${charName} │ ${foundStr.padEnd(11)} │ ${currentStr.padStart(16)} │`);
    }
    
    console.log('└─────────┴──────────────────────────────────────┴──────────────────────────────┴─────────────┴──────────────────┘\n');
    
    // Summary
    const found = matches.filter(m => m.found).length;
    const missing = matches.filter(m => !m.found).length;
    const needsUpdate = matches.filter(m => m.found && !m.current_set_number).length;
    
    console.log(`📊 Summary:`);
    console.log(`  Total cards to match: ${matches.length}`);
    console.log(`  Found in database: ${found}`);
    console.log(`  Not found: ${missing}`);
    console.log(`  Need set_number update: ${needsUpdate}\n`);
    
    if (needsUpdate > 0) {
      console.log('📋 Cards that need set_number updates:\n');
      for (const match of matches.filter(m => m.found && !m.current_set_number)) {
        console.log(`  ${match.set_number}: ${match.card_name} (${match.character_name})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

matchMissingSetNumbers();

