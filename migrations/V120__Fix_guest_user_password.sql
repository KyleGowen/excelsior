-- Migration to fix guest user password hash
-- This updates the guest user's password hash to the correct bcrypt hash for 'guest'

DO $$
DECLARE
    guest_user_id UUID;
    correct_password_hash TEXT := '$2b$10$ioMj79hxy/3SltPaAV3SK.4ScRSjeHq06nPqGCOoAx8EAHIqyRkj6'; -- Correct hash for 'guest'
BEGIN
    -- Get the ID of the guest user
    SELECT id INTO guest_user_id FROM users WHERE username = 'guest';

    IF guest_user_id IS NOT NULL THEN
        -- Update the password hash
        UPDATE users
        SET password_hash = correct_password_hash,
            updated_at = NOW()
        WHERE id = guest_user_id;
        
        RAISE NOTICE 'Guest user password hash updated successfully for ID: %', guest_user_id;
    ELSE
        RAISE NOTICE 'Guest user not found. No update performed.';
    END IF;
END $$;
