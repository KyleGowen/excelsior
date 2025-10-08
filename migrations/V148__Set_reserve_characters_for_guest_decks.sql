-- Set reserve characters for guest account decks
-- This migration sets specific characters as reserve for each guest deck by matching character names

DO $$
DECLARE
    guest_user_id UUID;
    deck_id_var UUID;
    character_id_var UUID;
BEGIN
    -- Get guest user ID
    SELECT id INTO guest_user_id FROM users WHERE username = 'guest';
    
    IF guest_user_id IS NULL THEN
        RAISE NOTICE 'Guest user not found, skipping reserve character setup';
        RETURN;
    END IF;

    -- Set Victory Harben as reserve for Time Detectives deck
    SELECT d.id INTO deck_id_var 
    FROM decks d 
    WHERE d.user_id = guest_user_id AND d.name = 'Time Detectives';
    
    IF deck_id_var IS NOT NULL THEN
        SELECT c.id INTO character_id_var 
        FROM characters c 
        WHERE c.name = 'Victory Harben';
        
        IF character_id_var IS NOT NULL THEN
            UPDATE decks 
            SET reserve_character = character_id_var 
            WHERE id = deck_id_var;
            RAISE NOTICE 'Set Victory Harben as reserve for Time Detectives deck';
        ELSE
            RAISE NOTICE 'Victory Harben character not found';
        END IF;
    ELSE
        RAISE NOTICE 'Time Detectives deck not found for guest user';
    END IF;

    -- Set Mina Harker as reserve for Horror Menagerie deck
    SELECT d.id INTO deck_id_var 
    FROM decks d 
    WHERE d.user_id = guest_user_id AND d.name = 'Horror Menagerie';
    
    IF deck_id_var IS NOT NULL THEN
        SELECT c.id INTO character_id_var 
        FROM characters c 
        WHERE c.name = 'Mina Harker';
        
        IF character_id_var IS NOT NULL THEN
            UPDATE decks 
            SET reserve_character = character_id_var 
            WHERE id = deck_id_var;
            RAISE NOTICE 'Set Mina Harker as reserve for Horror Menagerie deck';
        ELSE
            RAISE NOTICE 'Mina Harker character not found';
        END IF;
    ELSE
        RAISE NOTICE 'Horror Menagerie deck not found for guest user';
    END IF;

    -- Set Dr. Watson as reserve for The Resistance deck
    SELECT d.id INTO deck_id_var 
    FROM decks d 
    WHERE d.user_id = guest_user_id AND d.name = 'The Resistance';
    
    IF deck_id_var IS NOT NULL THEN
        SELECT c.id INTO character_id_var 
        FROM characters c 
        WHERE c.name = 'Dr. Watson';
        
        IF character_id_var IS NOT NULL THEN
            UPDATE decks 
            SET reserve_character = character_id_var 
            WHERE id = deck_id_var;
            RAISE NOTICE 'Set Dr. Watson as reserve for The Resistance deck';
        ELSE
            RAISE NOTICE 'Dr. Watson character not found';
        END IF;
    ELSE
        RAISE NOTICE 'The Resistance deck not found for guest user';
    END IF;

    -- Set Dejah Thoris as reserve for Ungodly Powers deck
    SELECT d.id INTO deck_id_var 
    FROM decks d 
    WHERE d.user_id = guest_user_id AND d.name = 'Ungodly Powers';
    
    IF deck_id_var IS NOT NULL THEN
        SELECT c.id INTO character_id_var 
        FROM characters c 
        WHERE c.name = 'Dejah Thoris';
        
        IF character_id_var IS NOT NULL THEN
            UPDATE decks 
            SET reserve_character = character_id_var 
            WHERE id = deck_id_var;
            RAISE NOTICE 'Set Dejah Thoris as reserve for Ungodly Powers deck';
        ELSE
            RAISE NOTICE 'Dejah Thoris character not found';
        END IF;
    ELSE
        RAISE NOTICE 'Ungodly Powers deck not found for guest user';
    END IF;

    RAISE NOTICE 'Reserve character setup completed for guest decks';
END $$;
