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

(async () => {
  const client = await pool.connect();
  try {
    const checks = [
      {name: 'Never Set Foot on Dry Land', char: 'Captain Nemo'},
      {name: 'Always There for a Friend', char: 'Dr. Watson'},
      {name: "Didn't See It Coming", char: 'Invisible Man'},
      {name: 'Not Without My Friends', char: 'Jane Porter'},
      {name: 'Lead From the Front', char: 'King Arthur'},
      {name: 'To the Death', char: 'Korak'},
      {name: 'Steal From the Rich', char: 'Robin Hood'},
      {name: 'Reinvigorated by Fresh Organs', char: 'The Mummy'},
      {name: 'Aquaphobic', char: 'Wicked Witch of the West'},
      {name: 'Feared by All Witches', char: 'Wicked Witch of the West'},
      {name: 'Harness the Wind', char: 'Wicked Witch of the West'},
      {name: 'I Will Have Those Silver Shoes!', char: 'Wicked Witch of the West'},
      {name: 'One Eye', char: 'Wicked Witch of the West'},
      {name: 'Wolves, Crows, & Black Bees', char: 'Wicked Witch of the West'},
      {name: 'Ancestral Rapier', char: 'Zorro'},
    ];
    
    console.log('Exact names in database:\n');
    for (const check of checks) {
      const firstWord = check.name.split(' ')[0];
      const result = await client.query(
        'SELECT name, character_name, set_number FROM special_cards WHERE character_name = $1 AND LOWER(name) LIKE LOWER($2)',
        [check.char, '%' + firstWord + '%']
      );
      if (result.rows.length > 0) {
        console.log(`Looking for: ${check.name} (${check.char})`);
        for (const row of result.rows) {
          console.log(`  Found: ${row.name} | set_number: ${row.set_number || 'NULL'}`);
        }
        console.log('');
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
})();

