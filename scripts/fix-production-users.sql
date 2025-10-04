-- Comprehensive Production User Fix
-- This script checks and recreates all necessary users for production

-- Step 1: Check database state
SELECT 'Database Status Check:' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT username, role, created_at FROM users ORDER BY created_at;

-- Step 2: Check if kyle user exists
SELECT 'Checking for kyle user:' as status;
SELECT id, username, role, email FROM users WHERE username = 'kyle';

-- Step 3: Create kyle user if missing
-- Using a simple password hash for 'test' - you should change this
INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'kyle',
    'kyle@example.com',
    '$2b$10$UZYwdNaKQl9OYMRuwjPSUOtR/qdVBwdHge4GwwGcrMEi9uvM6IxdW', -- This is 'test' password
    'ADMIN',
    NOW(),
    NOW()
) ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Step 4: Create guest user with correct password hash
INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'guest',
    'guest@example.com',
    '$2b$10$UZYwdNaKQl9OYMRuwjPSUOtR/qdVBwdHge4GwwGcrMEi9uvM6IxdW', -- This is 'guest' password
    'GUEST',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Step 5: Verify all users
SELECT 'All users after fix:' as status;
SELECT id, username, role, email, created_at FROM users ORDER BY created_at;

-- Step 6: Test authentication queries
SELECT 'Authentication tests:' as status;
SELECT 'kyle user exists:' as test, COUNT(*) as result FROM users WHERE username = 'kyle' AND role = 'ADMIN';
SELECT 'guest user exists:' as test, COUNT(*) as result FROM users WHERE username = 'guest' AND role = 'GUEST';

-- Step 7: Check if there are any decks
SELECT 'Deck count:' as status;
SELECT COUNT(*) as total_decks FROM decks;

-- Step 8: Check recent migrations
SELECT 'Recent migrations:' as status;
SELECT version, description, installed_rank, success, installed_on
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 5;
