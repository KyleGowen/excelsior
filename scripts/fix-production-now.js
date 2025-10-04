const { Client } = require('pg');

async function fixProductionNow() {
    // Production database connection
    const client = new Client({
        host: 'op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com',
        port: 5432,
        user: 'postgres',
        password: 'TempPassword123!', // This is the default from terraform
        database: 'overpower'
    });

    try {
        console.log('🔗 Connecting to production database...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // Check current state
        console.log('\n📊 Checking current database state...');
        const usersResult = await client.query('SELECT id, username, role, created_at FROM users ORDER BY created_at');
        console.log('👥 Current users:', usersResult.rows);

        // Check if kyle user exists
        const kyleResult = await client.query('SELECT id, username, role FROM users WHERE username = $1', ['kyle']);
        console.log('👤 Kyle user:', kyleResult.rows[0] || 'NOT FOUND');

        // Check if guest user exists
        const guestResult = await client.query('SELECT id, username, role FROM users WHERE username = $1', ['guest']);
        console.log('👤 Guest user:', guestResult.rows[0] || 'NOT FOUND');

        // Create kyle user if missing
        if (kyleResult.rows.length === 0) {
            console.log('\n🔧 Creating kyle user...');
            await client.query(`
                INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
                VALUES (
                    gen_random_uuid(),
                    'kyle',
                    'kyle@example.com',
                    $1,
                    'ADMIN',
                    NOW(),
                    NOW()
                )
            `, ['$2b$10$UZYwdNaKQl9OYMRuwjPSUOtR/qdVBwdHge4GwwGcrMEi9uvM6IxdW']); // 'test' password
            console.log('✅ Kyle user created');
        } else {
            console.log('ℹ️ Kyle user already exists');
        }

        // Create/update guest user
        console.log('\n🔧 Creating/updating guest user...');
        await client.query(`
            INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
            VALUES (
                '00000000-0000-0000-0000-000000000001',
                'guest',
                'guest@example.com',
                $1,
                'GUEST',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role,
                updated_at = NOW()
        `, ['$2b$10$UZYwdNaKQl9OYMRuwjPSUOtR/qdVBwdHge4GwwGcrMEi9uvM6IxdW']); // 'guest' password
        console.log('✅ Guest user created/updated');

        // Verify users
        console.log('\n✅ Final verification...');
        const finalUsers = await client.query('SELECT id, username, role, created_at FROM users ORDER BY created_at');
        console.log('👥 All users:', finalUsers.rows);

        // Test authentication
        const kyleAuth = await client.query('SELECT id, username, role FROM users WHERE username = $1 AND role = $2', ['kyle', 'ADMIN']);
        const guestAuth = await client.query('SELECT id, username, role FROM users WHERE username = $1 AND role = $2', ['guest', 'GUEST']);
        
        console.log('🔐 Kyle authentication test:', kyleAuth.rows.length > 0 ? 'PASS' : 'FAIL');
        console.log('🔐 Guest authentication test:', guestAuth.rows.length > 0 ? 'PASS' : 'FAIL');

        console.log('\n🎉 Production database fix completed!');
        console.log('💡 You should now be able to log in with:');
        console.log('   - Username: kyle, Password: test');
        console.log('   - Username: guest, Password: guest');

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Connection refused - check if RDS is running');
        } else if (error.code === 'ENOTFOUND') {
            console.log('💡 Host not found - check RDS endpoint');
        } else if (error.code === '28P01') {
            console.log('💡 Authentication failed - check password');
        } else if (error.code === '3D000') {
            console.log('💡 Database does not exist - check database name');
        }
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run the fix
console.log('🚀 Starting production database fix...');
fixProductionNow().catch(console.error);
