-- Migration to create guest deck
-- Deck: Horror Menagerie
-- ID: 125b470f-c9dd-4980-9aff-5a4b33d54d75
-- Created: Wed Oct 02 2025 03:42:31 GMT+0000 (Coordinated Universal Time)

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
    SELECT id INTO new_deck_id FROM decks WHERE id = '125b470f-c9dd-4980-9aff-5a4b33d54d75';
    
    IF new_deck_id IS NULL THEN
        -- Create the deck
        INSERT INTO decks (id, user_id, name, description, created_at, updated_at, ui_preferences)
        VALUES ('125b470f-c9dd-4980-9aff-5a4b33d54d75', guest_user_id, 'Horror Menagerie', '', '2025-10-02T03:42:31.140Z', '2025-10-02T03:51:30.560Z', '{"viewMode":"tile","expansionState":{"event":true,"power":true,"aspect":true,"mission":false,"special":true,"location":true,"teamwork":true,"training":true,"character":true,"ally_universe":true,"basic_universe":true,"advanced_universe":true},"dividerPosition":51.83673469387755,"powerCardsSortMode":"value","characterGroupExpansionState":{"Combat":true,"Energy":true,"Cthulhu":false,"Leonidas":false,"The Mummy":false,"Dr. Watson":false,"Brute Force":true,"Mina Harker":false,"Intelligence":true,"power_Combat":true,"Billy the Kid":false,"Headless Horseman":false,"The Three Musketeers":false}}')
        RETURNING id INTO new_deck_id;
        
        RAISE NOTICE 'Deck created with ID: %', new_deck_id;
    ELSE
        RAISE NOTICE 'Deck already exists with ID: %', new_deck_id;
    END IF;

    -- Add character cards
    SELECT id INTO card_id_var FROM characters WHERE name = 'Headless Horseman' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/headless_horseman.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Mina Harker' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/mina_harker.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'The Mummy' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/the_mummy.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Cthulhu' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/cthulhu.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add special cards
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Human Spine Whip' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Mark of the Headless' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Pumpkin Head' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Relentless Hessian' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'The Hunger' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Ancient Wisdom' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Pharaoh of the Fourth Dynasty' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Relentless Pursuit' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'The Eternal Journey' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Distracting Intervention' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Network of Fanatics' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'The Call of Cthulhu' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Dracula''s Telepathic Connection' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add power cards
    SELECT id INTO card_id_var FROM power_cards WHERE name = '8 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, 'power-cards/8_brute_force.webp')
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '3 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '4 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '5 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '6 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '1 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '2 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '6 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '7 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '1 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '2 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add ally_universe cards
    SELECT id INTO card_id_var FROM ally_universe_cards WHERE name = 'Professor Porter' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'ally_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    SELECT id INTO card_id_var FROM ally_universe_cards WHERE name = 'Sir Galahad' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'ally_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add basic_universe cards
    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Hyde''s Serum' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Trident' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Tribuchet' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add event cards
    SELECT id INTO card_id_var FROM events WHERE name = 'Desperate Gamble' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM events WHERE name = 'The Cost of Knowledge is Sanity' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM events WHERE name = 'Stars Align' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add mission cards
    SELECT id INTO card_id_var FROM missions WHERE name = 'Gone Too Far' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Johansen''s Widow' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'New Orleans, 1908' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Professor Angell''s Investigation' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Alert' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Dreams of Men' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Worshipping the Great Old One' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    -- Add training cards
    SELECT id INTO card_id_var FROM training_cards WHERE name = 'Training (Merlin)' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'training', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    SELECT id INTO card_id_var FROM training_cards WHERE name = 'Training (Cultists)' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'training', card_id_var::text, 1, NULL)
        ON CONFLICT (deck_id, card_type, card_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'Deck creation completed successfully';
END $$;
