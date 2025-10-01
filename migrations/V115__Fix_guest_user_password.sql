-- Migration to fix guest user password hash
-- The V113 migration created the guest user with an incorrect password hash
-- This migration updates it to use the correct hash for password 'guest'

DO $$
BEGIN
    -- Update the guest user's password hash to match 'guest' password
    UPDATE users 
    SET password_hash = '$2b$10$67fdsNqishRh2XtSnx5wtuiT35Pfv9XHtiG904X6TvD3nIumk.q0m'
    WHERE username = 'guest' AND id = '00000000-0000-0000-0000-000000000001';
    
    -- Verify the update
    IF FOUND THEN
        RAISE NOTICE 'Guest user password hash updated successfully';
    ELSE
        RAISE NOTICE 'Guest user not found - may need to be created first';
    END IF;
END $$;
