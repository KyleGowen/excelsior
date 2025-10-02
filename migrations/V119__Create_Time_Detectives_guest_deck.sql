-- Migration to create guest deck
-- Deck: Time Detectives
-- ID: c102339f-ea48-45eb-ad6c-3b844e36e585
-- Created: Wed Oct 02 2025 04:00:32 GMT+0000 (Coordinated Universal Time)

DO $$
DECLARE
    guest_user_id UUID;
    new_deck_id UUID;
    card_id_var UUID;
BEGIN
    -- Get or create guest user ID
    SELECT id INTO guest_user_id FROM users WHERE username = 'guest';
    IF guest_user_id IS NULL THEN
        -- Create guest user if they don't exist
        INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000001', 'guest', 'guest@example.com', '$2b$10$rQZ8K9L2mN3oP4qR5sT6uO7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU', 'GUEST', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO guest_user_id;
        RAISE NOTICE 'Guest user created with ID: %', guest_user_id;
    END IF;

    -- Check if deck already exists
    SELECT id INTO new_deck_id FROM decks WHERE id = 'c102339f-ea48-45eb-ad6c-3b844e36e585';
    
    IF new_deck_id IS NULL THEN
        -- Create the deck
        INSERT INTO decks (id, user_id, name, description, created_at, updated_at, ui_preferences)
        VALUES ('c102339f-ea48-45eb-ad6c-3b844e36e585', guest_user_id, 'Time Detectives', '', '2025-10-02T04:00:32.552Z', '2025-10-02T04:07:19.744Z', '{"viewMode":"tile","expansionState":{"event":true,"power":true,"aspect":true,"mission":true,"special":true,"location":true,"teamwork":true,"training":true,"character":true,"ally_universe":true,"basic_universe":true,"advanced_universe":true},"dividerPosition":66.21315192743764,"powerCardsSortMode":"type","characterGroupExpansionState":{"Combat":false,"Energy":false,"Brute Force":false,"Joan of Arc":true,"Intelligence":true,"Time Traveler":false,"Victory Harben":false,"Sherlock Holmes":false}}')
        RETURNING id INTO new_deck_id;
        
        RAISE NOTICE 'Deck created with ID: %', new_deck_id;
    ELSE
        RAISE NOTICE 'Deck already exists with ID: %', new_deck_id;
    END IF;

    -- Add character cards
    SELECT id INTO card_id_var FROM characters WHERE name = 'Time Traveler' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/time_traveler.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Victory Harben' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/victory_harben.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Joan of Arc' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/joan_of_arc.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Sherlock Holmes' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/sherlock_holmes.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add ally_universe cards
    SELECT id INTO card_id_var FROM ally_universe_cards WHERE name = 'Allan Quatermain' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'ally_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM ally_universe_cards WHERE name = 'Queen Guinevere' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'ally_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add basic_universe cards
    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Secret Identity' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Advanced Technology' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Magic Spell' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add event cards
    SELECT id INTO card_id_var FROM events WHERE name = 'The Giant Man of Mars' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM events WHERE name = 'The Battle with Zad' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM events WHERE name = 'Eyes in the Dark' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add mission cards
    SELECT id INTO card_id_var FROM missions WHERE name = 'A Fighting Man of Mars' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Swords of Mars' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Battle of Kings' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Face of Death' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Invisible Men' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Loyalty of Woola' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Under the Moons of Mars' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add power cards
    SELECT id INTO card_id_var FROM power_cards WHERE name = '1 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '2 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '4 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '5 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '1 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '2 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '3 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '3 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '4 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '6 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '7 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '8 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, 'power-cards/8_intelligence.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add special cards
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Inspirational Leadership' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Burned at the Stake' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Protection of Saint Michael' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Battle of Wits' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Brilliant Deduction' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Irene Adler' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Unpredictable Mind' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'From a Mile Away' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Futuristic Phaser' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'I''ll Already Be Gone' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'The Tomorrow Doctor' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Department of Theoretical Physics' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Abner Perry''s Lab Assistant' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add training cards
    SELECT id INTO card_id_var FROM training_cards WHERE name = 'Training (Joan of Arc)' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'training', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM training_cards WHERE name = 'Training (Robin Hood)' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'training', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'Deck creation completed successfully';
END $$;
