const { Client } = require('pg');

async function fixProductionAuth() {
    // Try to get database connection details from environment or use defaults
    const dbConfig = {
        host: process.env.DB_HOST || process.env.RDS_ENDPOINT || 'localhost',
        port: process.env.DB_PORT || process.env.RDS_PORT || 5432,
        user: process.env.DB_USER || process.env.RDS_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || process.env.RDS_PASSWORD || 'password',
        database: process.env.DB_NAME || process.env.RDS_DATABASE_NAME || 'overpower'
    };

    console.log('🔍 Attempting to connect to database with config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database
    });

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('✅ Connected to database successfully');

        // Check database version and basic info
        const versionResult = await client.query('SELECT version()');
        console.log('📊 Database version:', versionResult.rows[0].version.split(' ')[0]);

        // Check if users table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        console.log('📋 Users table exists:', tableCheck.rows[0].exists);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Users table does not exist! Database may not be properly initialized.');
            return;
        }

        // Check current users
        const usersResult = await client.query('SELECT id, username, role, created_at FROM users ORDER BY created_at');
        console.log('👥 Current users in database:', usersResult.rows);

        // Check if guest user exists
        const guestCheck = await client.query('SELECT id, username, role FROM users WHERE username = $1', ['guest']);
        
        if (guestCheck.rows.length > 0) {
            console.log('✅ Guest user already exists:', guestCheck.rows[0]);
        } else {
            console.log('❌ Guest user not found, creating...');
            
            // Create guest user with the same ID used in migrations
            const createGuestQuery = `
                INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    role = EXCLUDED.role,
                    updated_at = NOW()
                RETURNING id, username, role
            `;
            
            const createResult = await client.query(createGuestQuery, [
                '00000000-0000-0000-0000-000000000001',
                'guest',
                'guest@example.com',
                '$2b$10$rQZ8K9L2mN3oP4qR5sT6uO7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU',
                'GUEST'
            ]);
            
            console.log('✅ Guest user created/updated:', createResult.rows[0]);
        }

        // Test authentication query
        const authTest = await client.query(`
            SELECT id, username, role 
            FROM users 
            WHERE username = $1 AND role = $2
        `, ['guest', 'GUEST']);
        
        console.log('🔐 Guest authentication test:', authTest.rows.length > 0 ? 'PASS' : 'FAIL');
        
        if (authTest.rows.length > 0) {
            console.log('✅ Guest user can be authenticated:', authTest.rows[0]);
        }

        // Check if there are any regular users
        const regularUsers = await client.query(`
            SELECT id, username, role 
            FROM users 
            WHERE role IN ('USER', 'ADMIN')
            ORDER BY created_at
        `);
        
        console.log('👤 Regular users found:', regularUsers.rows.length);
        if (regularUsers.rows.length > 0) {
            console.log('📋 Regular users:', regularUsers.rows);
        }

        // Check flyway schema history to see what migrations have been applied
        const flywayCheck = await client.query(`
            SELECT version, description, installed_rank, success
            FROM flyway_schema_history 
            ORDER BY installed_rank DESC 
            LIMIT 10
        `);
        
        console.log('🔄 Recent Flyway migrations:', flywayCheck.rows);

    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('🔍 Error details:', error);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Connection refused - check if database is running and accessible');
        } else if (error.code === 'ENOTFOUND') {
            console.log('💡 Host not found - check database host configuration');
        } else if (error.code === '28P01') {
            console.log('💡 Authentication failed - check username/password');
        } else if (error.code === '3D000') {
            console.log('💡 Database does not exist - check database name');
        }
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run the script
console.log('🚀 Starting production authentication fix...');
fixProductionAuth().catch(console.error);
