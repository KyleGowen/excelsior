-- Migration to recreate guest deck
-- Deck: Ungodly Powers
-- Original ID: 8599f0c0-b8e9-46e5-824b-b27380978425
-- Created: Wed Oct 01 2025 04:41:28 GMT+0000 (Coordinated Universal Time)

DO $$
DECLARE
    guest_user_id UUID;
    new_deck_id UUID;
    card_id_var UUID;
BEGIN
    -- Get guest user ID
    SELECT id INTO guest_user_id FROM users WHERE username = 'guest';
    IF guest_user_id IS NULL THEN
        RAISE EXCEPTION 'Guest user not found';
    END IF;

    -- Create the deck
    INSERT INTO decks (id, user_id, name, description, created_at, updated_at, ui_preferences)
    VALUES (gen_random_uuid(), guest_user_id, 'Ungodly Powers', NULL, '2025-10-01T04:41:28.429Z', '2025-10-01T04:52:16.529Z', '{"viewMode":"tile","expansionState":{"event":true,"power":true,"aspect":true,"mission":true,"special":true,"location":true,"teamwork":true,"training":true,"character":true,"ally_universe":true,"basic_universe":true,"advanced_universe":true},"dividerPosition":79.41368078175896,"powerCardsSortMode":"value","characterGroupExpansionState":{"Zeus":false,"Combat":true,"Energy":true,"Angry Mob":false,"Brute Force":true,"Dejah Thoris":false,"Intelligence":true,"Wicked Witch":false}}')
    RETURNING id INTO new_deck_id;

    RAISE NOTICE 'Deck created with ID: %', new_deck_id;

    -- Add character cards
    SELECT id INTO card_id_var FROM characters WHERE name = 'Wicked Witch' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/wicked_witch.webp');
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Dejah Thoris' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/dejah_thoris.webp');
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Angry Mob (Middle Ages)' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/angry_mob_middle_ages.webp');
    END IF;
    
    SELECT id INTO card_id_var FROM characters WHERE name = 'Zeus' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'character', card_id_var::text, 1, 'characters/zeus.webp');
    END IF;

    -- Add special cards
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Thunderbolt' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'A Jealous God' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Swarm Them!' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Protector of Barsoom' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Aquaphobic' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Banishment' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Hera' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Mob Mentality' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Don''t Let it Get Away!' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'I Will Have Those Silver Shoes!' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Feared by All Witches' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM special_cards WHERE name = 'Pitchforks and Torches' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'special', card_id_var::text, 1, NULL);
    END IF;

    -- Add power cards
    SELECT id INTO card_id_var FROM power_cards WHERE name = '2 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '5 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '6 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '8 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, 'power-cards/8_energy.webp');
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '4 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '1 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '1 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '5 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '4 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '2 - Intelligence';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 2, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '6 - Brute Force';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '3 - Combat';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM power_cards WHERE name = '7 - Energy';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'power', card_id_var::text, 3, NULL);
    END IF;

    -- Add ally_universe cards
    SELECT id INTO card_id_var FROM ally_universe_cards WHERE name = 'Hera' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'ally_universe', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM ally_universe_cards WHERE name = 'Hucklebuck' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'ally_universe', card_id_var::text, 1, NULL);
    END IF;

    -- Add basic_universe cards
    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Ray Gun' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Lightning Bolt' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM basic_universe_cards WHERE name = 'Merlin''s Wand' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'basic_universe', card_id_var::text, 1, NULL);
    END IF;

    -- Add event cards
    SELECT id INTO card_id_var FROM events WHERE name = 'The Battle with Zad' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM events WHERE name = 'Eyes in the Dark' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'event', card_id_var::text, 1, NULL);
    END IF;

    -- Add mission cards
    SELECT id INTO card_id_var FROM missions WHERE name = 'A Fighting Man of Mars' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Swords of Mars' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Battle of Kings' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Face of Death' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Invisible Men' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'The Loyalty of Woola' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM missions WHERE name = 'Under the Moons of Mars' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'mission', card_id_var::text, 1, NULL);
    END IF;

    -- Add training cards
    SELECT id INTO card_id_var FROM training_cards WHERE name = 'Training (Lancelot)' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'training', card_id_var::text, 1, NULL);
    END IF;
    
    SELECT id INTO card_id_var FROM training_cards WHERE name = 'Training (Leonidas)' AND universe = 'ERB';
    IF card_id_var IS NOT NULL THEN
        INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image)
        VALUES (new_deck_id, 'training', card_id_var::text, 1, NULL);
    END IF;

    RAISE NOTICE 'Deck recreation completed successfully';
END $$;
