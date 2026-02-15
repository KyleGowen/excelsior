const { Client } = require('pg');

async function testDatabaseConnection() {
    // Try different connection configurations
    const configs = [
        // Local development
        {
            host: 'localhost',
            port: 1337,
            user: 'postgres',
            password: 'password',
            database: 'overpower'
        },
        // Production-like (you'll need to update these with actual values)
        {
            host: process.env.DB_HOST || 'your-rds-endpoint.amazonaws.com',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'your-password',
            database: process.env.DB_NAME || 'overpower'
        }
    ];

    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        console.log(`\n🔍 Testing connection ${i + 1}:`, {
            host: config.host,
            port: config.port,
            user: config.user,
            database: config.database
        });

        const client = new Client(config);

        try {
            await client.connect();
            console.log('✅ Connected successfully!');

            // Test basic queries
            const versionResult = await client.query('SELECT version()');
            console.log('📊 Database version:', versionResult.rows[0].version.split(' ')[0]);

            // Check users table
            const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
            console.log('👥 Total users:', usersResult.rows[0].count);

            // Check guest user
            const guestResult = await client.query('SELECT id, username, role FROM users WHERE username = $1', ['guest']);
            console.log('👤 Guest user:', guestResult.rows.length > 0 ? guestResult.rows[0] : 'NOT FOUND');

            // If guest user not found, create it
            if (guestResult.rows.length === 0) {
                console.log('🔧 Creating guest user...');
                const createResult = await client.query(`
                    INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                    ON CONFLICT (id) DO NOTHING
                    RETURNING id, username, role
                `, [
                    '00000000-0000-0000-0000-000000000001',
                    'guest',
                    'guest@example.com',
                    '$2b$10$rQZ8K9L2mN3oP4qR5sT6uO7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU',
                    'GUEST'
                ]);
                
                if (createResult.rows.length > 0) {
                    console.log('✅ Guest user created:', createResult.rows[0]);
                } else {
                    console.log('ℹ️ Guest user already exists');
                }
            }

            await client.end();
            console.log('✅ Connection test completed successfully!');
            return; // Exit on first successful connection

        } catch (error) {
            console.log('❌ Connection failed:', error.message);
            await client.end().catch(() => {}); // Ignore errors when closing
        }
    }

    console.log('\n❌ All connection attempts failed');
    console.log('💡 Make sure the database is running and accessible');
}

// Run the test
testDatabaseConnection().catch(console.error);
