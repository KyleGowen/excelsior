-- Migration to fix guest user ID
-- The guest user should have ID '00000000-0000-0000-0000-000000000001' to match migrations and tests
-- This migration updates the guest user ID if it exists with a different ID

DO $$
DECLARE
    guest_user_id UUID;
    old_guest_id UUID;
BEGIN
    -- Check if guest user exists with wrong ID
    SELECT id INTO old_guest_id FROM users WHERE username = 'guest' AND id != '00000000-0000-0000-0000-000000000001';
    
    IF old_guest_id IS NOT NULL THEN
        -- Update the guest user ID to the correct one
        UPDATE users 
        SET id = '00000000-0000-0000-0000-000000000001'
        WHERE username = 'guest' AND id = old_guest_id;
        
        -- Update any decks owned by the old guest user ID
        UPDATE decks 
        SET user_id = '00000000-0000-0000-0000-000000000001'
        WHERE user_id = old_guest_id;
        
        RAISE NOTICE 'Updated guest user ID from % to 00000000-0000-0000-0000-000000000001', old_guest_id;
    ELSE
        -- Check if guest user exists with correct ID
        SELECT id INTO guest_user_id FROM users WHERE username = 'guest' AND id = '00000000-0000-0000-0000-000000000001';
        
        IF guest_user_id IS NULL THEN
            -- Create guest user with correct ID if it doesn't exist
            INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
            VALUES ('00000000-0000-0000-0000-000000000001', 'guest', 'guest@example.com', '$2b$10$rQZ8K9L2mN3oP4qR5sT6uO7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU', 'GUEST', NOW(), NOW())
            RETURNING id INTO guest_user_id;
            RAISE NOTICE 'Created guest user with correct ID: %', guest_user_id;
        ELSE
            RAISE NOTICE 'Guest user already exists with correct ID: %', guest_user_id;
        END IF;
    END IF;
END $$;
