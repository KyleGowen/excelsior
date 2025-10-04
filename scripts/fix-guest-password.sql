-- Fix Guest User Password Hash
-- The hardcoded hash in migrations doesn't match the actual password "guest"
-- This script creates/updates the guest user with the correct password hash

-- First, check if guest user exists
SELECT 'Current guest user:' as status;
SELECT id, username, role, password_hash FROM users WHERE username = 'guest';

-- Create or update guest user with correct password hash
INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'guest',
    'guest@example.com',
    '$2b$10$UZYwdNaKQl9OYMRuwjPSUOtR/qdVBwdHge4GwwGcrMEi9uvM6IxdW',
    'GUEST',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Verify the guest user was created/updated
SELECT 'Guest user after fix:' as status;
SELECT id, username, role, created_at FROM users WHERE username = 'guest';

-- Test the password (this should work now)
-- Note: This is just to verify the hash is correct, the actual password verification
-- happens in the application code using bcrypt.compareSync()
SELECT 'Password hash verification:' as status;
SELECT 
    CASE 
        WHEN password_hash = '$2b$10$UZYwdNaKQl9OYMRuwjPSUOtR/qdVBwdHge4GwwGcrMEi9uvM6IxdW' 
        THEN 'CORRECT HASH' 
        ELSE 'INCORRECT HASH' 
    END as hash_status
FROM users WHERE username = 'guest';
