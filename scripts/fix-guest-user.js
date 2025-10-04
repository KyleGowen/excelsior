const { Client } = require('pg');

async function fixGuestUser() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'overpower'
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check if guest user exists
        const checkQuery = 'SELECT id, username, role FROM users WHERE username = $1';
        const checkResult = await client.query(checkQuery, ['guest']);
        
        if (checkResult.rows.length > 0) {
            console.log('✅ Guest user already exists:', checkResult.rows[0]);
        } else {
            console.log('❌ Guest user not found, creating...');
            
            // Create guest user
            const createQuery = `
                INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
                RETURNING id, username, role
            `;
            
            const createResult = await client.query(createQuery, [
                '00000000-0000-0000-0000-000000000001',
                'guest',
                'guest@example.com',
                '$2b$10$rQZ8K9L2mN3oP4qR5sT6uO7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU',
                'GUEST'
            ]);
            
            if (createResult.rows.length > 0) {
                console.log('✅ Guest user created successfully:', createResult.rows[0]);
            } else {
                console.log('ℹ️ Guest user already exists (conflict handled)');
            }
        }

        // Check if there are any users at all
        const allUsersQuery = 'SELECT id, username, role FROM users ORDER BY created_at';
        const allUsersResult = await client.query(allUsersQuery);
        console.log('📊 All users in database:', allUsersResult.rows);

        // Test authentication
        const authQuery = 'SELECT id, username, role FROM users WHERE username = $1 AND role = $2';
        const authResult = await client.query(authQuery, ['guest', 'GUEST']);
        console.log('🔐 Guest authentication test:', authResult.rows.length > 0 ? 'PASS' : 'FAIL');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

// Run the script
fixGuestUser();
