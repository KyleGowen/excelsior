const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function testGuestLogin() {
    const client = new Client({
        host: 'localhost',
        port: 1337,
        user: 'postgres',
        password: 'password',
        database: 'overpower'
    });

    try {
        await client.connect();
        console.log('✅ Connected to local database');

        // Check current guest user
        const guestResult = await client.query('SELECT id, username, role, password_hash FROM users WHERE username = $1', ['guest']);
        console.log('👤 Current guest user:', guestResult.rows[0] || 'NOT FOUND');

        if (guestResult.rows.length > 0) {
            const user = guestResult.rows[0];
            console.log('🔐 Testing password verification...');
            
            // Test the current hash
            const currentHashValid = await bcrypt.compare('guest', user.password_hash);
            console.log('Current hash valid for "guest":', currentHashValid);
            
            // Test the correct hash
            const correctHash = '$2b$10$UZYwdNaKQl9OYMRuwjPSUOtR/qdVBwdHge4GwwGcrMEi9uvM6IxdW';
            const correctHashValid = await bcrypt.compare('guest', correctHash);
            console.log('Correct hash valid for "guest":', correctHashValid);
            
            if (!currentHashValid && correctHashValid) {
                console.log('🔧 Updating guest user with correct password hash...');
                
                await client.query(`
                    UPDATE users 
                    SET password_hash = $1, updated_at = NOW()
                    WHERE username = 'guest'
                `, [correctHash]);
                
                console.log('✅ Guest user password hash updated');
                
                // Verify the update
                const updatedResult = await client.query('SELECT id, username, role FROM users WHERE username = $1', ['guest']);
                console.log('👤 Updated guest user:', updatedResult.rows[0]);
            }
        } else {
            console.log('❌ Guest user not found in local database');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

// Run the test
testGuestLogin();
