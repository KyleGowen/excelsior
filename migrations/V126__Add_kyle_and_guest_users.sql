-- Migration to add kyle and guest users to the database
-- This ensures both users exist with correct passwords for production

DO $$
DECLARE
    kyle_user_id UUID;
    guest_user_id UUID;
    kyle_password_hash TEXT := '$2b$10$rQZ8K9L2mN3oP4qR5sT6uO7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU'; -- Hash for 'test'
    guest_password_hash TEXT := '$2b$10$ioMj79hxy/3SltPaAV3SK.4ScRSjeHq06nPqGCOoAx8EAHIqyRkj6'; -- Hash for 'guest'
BEGIN
    -- Check if kyle user exists
    SELECT id INTO kyle_user_id FROM users WHERE username = 'kyle';
    
    IF kyle_user_id IS NULL THEN
        -- Create kyle user
        INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
        VALUES ('c567175f-a07b-41b7-b274-e82901d1b4f1', 'kyle', 'kyle@example.com', kyle_password_hash, 'ADMIN', NOW(), NOW())
        RETURNING id INTO kyle_user_id;
        RAISE NOTICE 'Kyle user created with ID: %', kyle_user_id;
    ELSE
        -- Update kyle user password
        UPDATE users 
        SET password_hash = kyle_password_hash, updated_at = NOW()
        WHERE id = kyle_user_id;
        RAISE NOTICE 'Kyle user password updated for ID: %', kyle_user_id;
    END IF;

    -- Check if guest user exists
    SELECT id INTO guest_user_id FROM users WHERE username = 'guest';
    
    IF guest_user_id IS NULL THEN
        -- Create guest user
        INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000001', 'guest', 'guest@example.com', guest_password_hash, 'GUEST', NOW(), NOW())
        RETURNING id INTO guest_user_id;
        RAISE NOTICE 'Guest user created with ID: %', guest_user_id;
    ELSE
        -- Update guest user password
        UPDATE users 
        SET password_hash = guest_password_hash, updated_at = NOW()
        WHERE id = guest_user_id;
        RAISE NOTICE 'Guest user password updated for ID: %', guest_user_id;
    END IF;
END $$;
