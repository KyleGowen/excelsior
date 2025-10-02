-- Migration to create guest deck
-- Deck: The Resistance
-- ID: 29ae24cb-2f4e-4e36-9ccc-4ba6c3fff5c8
-- Created: Wed Oct 02 2025 03:14:09 GMT+0000 (Coordinated Universal Time)

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
        RETURNING id INTO guest_user_id;
        RAISE NOTICE 'Guest user created with ID: %', guest_user_id;
    END IF;

    -- Check if deck already exists
    SELECT id INTO new_deck_id FROM decks WHERE id = '29ae24cb-2f4e-4e36-9ccc-4ba6c3fff5c8';
    
    IF new_deck_id IS NULL THEN
        -- Create the deck
        INSERT INTO decks (id, user_id, name, description, created_at, updated_at, ui_preferences)
        VALUES ('29ae24cb-2f4e-4e36-9ccc-4ba6c3fff5c8', guest_user_id, 'The Resistance', '', '2025-10-02T03:14:09.169Z', '2025-10-02T03:26:50.249Z', '{"viewMode":"tile","expansionState":{"event":false,"power":false,"aspect":true,"mission":false,"special":true,"location":true,"teamwork":true,"training":false,"character":true,"ally_universe":false,"basic_universe":false,"advanced_universe":true},"dividerPosition":76.05442176870748,"powerCardsSortMode":"value","characterGroupExpansionState":{"Combat":true,"Energy":true,"Leonidas":false,"Dr. Watson":false,"Brute Force":true,"Intelligence":true,"power_Combat":true,"Billy the Kid":false,"The Three Musketeers":false}}')
        RETURNING id INTO new_deck_id;
        
        RAISE NOTICE 'Deck created with ID: %', new_deck_id;
    ELSE
        RAISE NOTICE 'Deck already exists with ID: %', new_deck_id;
    END IF;

    -- Add character cards
    SELECT id INTO card_id_var FROM characters WHERE name = 'The Three Musketeers' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Dr. Watson' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/dr_watson.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Billy the Kid' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/billy_the_kid.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Leonidas' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/leonidas.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add special cards
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Head for Mexico' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Quick Draw' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Reap the Whirlwind' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Not a Bad Detective' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = '300' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Give Them Nothing' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Shield Phalanx' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Athos' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Porthos' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Valiant Charge' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add power cards
    SELECT id INTO card_id_var FROM power_cards WHERE name = '5 - Brute Force';
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
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '7 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, 'power-cards/7_combat.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '8 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, 'power-cards/8_combat.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '5 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '6 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '3 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '4 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add ally_universe cards
    SELECT id INTO card_id_var FROM ally_universe_cards WHERE name = 'Allan Quatermain' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'ally_universe', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add basic_universe cards
    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Longbow' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add event cards
    SELECT id INTO card_id_var FROM events WHERE name = 'The Lost City of Opar' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM events WHERE name = 'Tarzan the Terrible' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add mission cards
    SELECT id INTO card_id_var FROM missions WHERE name = 'Beasts of Tarzan' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Tarzan and the Castaways' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Tarzan and the City of Gold' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Tarzan and the Golden Lion' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Tarzan at the Earth''s Core' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Tarzan of the Apes' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Tarzan''s Quest' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add training cards
    SELECT id INTO card_id_var FROM training_cards WHERE name = 'Training (Lancelot)' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'training', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'Deck creation completed successfully';
END $$;