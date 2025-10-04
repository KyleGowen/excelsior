-- Production Database Fix Script
-- This script fixes the authentication issues on the production server
-- Run this against the production RDS database

-- Database: overpower
-- Host: op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432
-- Username: postgres

-- Step 1: Check current state
SELECT 'Current users in database:' as status;
SELECT id, username, role, created_at FROM users ORDER BY created_at;

-- Step 2: Check if guest user exists
SELECT 'Checking for guest user:' as status;
SELECT id, username, role FROM users WHERE username = 'guest';

-- Step 3: Create guest user if it doesn't exist
-- This uses the same ID and password hash as the migrations
INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'guest',
    'guest@example.com',
    '$2b$10$rQZ8K9L2mN3oP4qR5sT6uO7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU',
    'GUEST',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Step 4: Verify guest user was created/updated
SELECT 'Guest user after fix:' as status;
SELECT id, username, role, created_at FROM users WHERE username = 'guest';

-- Step 5: Test authentication query (this is what the app uses)
SELECT 'Authentication test:' as status;
SELECT id, username, role FROM users WHERE username = 'guest' AND role = 'GUEST';

-- Step 6: Check if there are any regular users
SELECT 'Regular users:' as status;
SELECT id, username, role, created_at FROM users WHERE role IN ('USER', 'ADMIN') ORDER BY created_at;

-- Step 7: Check recent Flyway migrations
SELECT 'Recent migrations:' as status;
SELECT version, description, installed_rank, success, installed_on
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 10;

-- Step 8: Final verification
SELECT 'Final verification - all users:' as status;
SELECT id, username, role, created_at FROM users ORDER BY created_at;
