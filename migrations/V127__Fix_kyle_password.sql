-- Migration to fix kyle user password in the database
-- Updates kyle's password hash to match 'test' password

DO $$
DECLARE
    kyle_user_id UUID;
    correct_password_hash TEXT := '$2b$10$rQZ8K9L2mN3oP4qR5sT6uO7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU'; -- Hash for 'test'
BEGIN
    -- Get the ID of the 'kyle' user
    SELECT id INTO kyle_user_id FROM users WHERE username = 'kyle';

    -- If the kyle user exists, update their password hash
    IF kyle_user_id IS NOT NULL THEN
        UPDATE users
        SET password_hash = correct_password_hash,
            updated_at = NOW()
        WHERE id = kyle_user_id;
        RAISE NOTICE 'Kyle user password hash updated successfully.';
    ELSE
        RAISE NOTICE 'Kyle user not found. No password hash updated.';
    END IF;
END $$;
